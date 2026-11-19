import { Client } from 'ssh2';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tarPath = path.resolve(__dirname, '../../deploy.tar.gz');
if (!fs.existsSync(tarPath)) {
  console.error('ERROR: deploy.tar.gz not found at', tarPath);
  process.exit(1);
}

const NGINX_CONF = `server {
    listen 80;
    listen [::]:80;
    server_name global.nkbmanufacturing.com;

    client_max_body_size 25M;

    # Static React SPA frontend
    location / {
        root /var/www/nkb-global-hunter/client/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Node.js API backend proxy
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
`;

const ENV_FILE = `NODE_ENV=production
PORT=5000
JWT_SECRET=nkb_hunter_production_secure_jwt_secret_2026_x89a42b9e
CORS_ORIGIN=https://global.nkbmanufacturing.com
DB_PROVIDER=sqlite
DB_PATH=/var/www/nkb-global-hunter/storage/nkb_hunter_production.db
`;

console.log('[Deploy] Connecting to 187.77.143.211...');
const conn = new Client();

function executeCommand(command, description) {
  return new Promise((resolve, reject) => {
    console.log(`\n---> [EXEC] ${description || command}`);
    conn.exec(command, (err, stream) => {
      if (err) return reject(err);
      let out = '';
      let errOut = '';
      stream.on('close', (code) => {
        if (code !== 0 && !description?.includes('allow-fail')) {
          console.error(`Command failed with exit code ${code}`);
          console.error(`STDERR:\n${errOut}`);
          console.log(`STDOUT:\n${out}`);
          return reject(new Error(`Exit code ${code}`));
        }
        console.log(`STDOUT:\n${out.trim()}`);
        if (errOut.trim()) console.log(`STDERR:\n${errOut.trim()}`);
        resolve({ code, out, errOut });
      }).on('data', (d) => out += d).stderr.on('data', (d) => errOut += d);
    });
  });
}

function sftpUpload(localFile, remoteFile) {
  return new Promise((resolve, reject) => {
    conn.sftp((err, sftp) => {
      if (err) return reject(err);
      console.log(`[SFTP] Uploading ${localFile} -> ${remoteFile}...`);
      const readStream = fs.createReadStream(localFile);
      const writeStream = sftp.createWriteStream(remoteFile);

      writeStream.on('close', () => {
        console.log(`[SFTP] Upload completed: ${remoteFile}`);
        resolve();
      });
      writeStream.on('error', (e) => reject(e));
      readStream.pipe(writeStream);
    });
  });
}

conn.on('ready', async () => {
  try {
    console.log('[Deploy] SSH Ready.');

    // 1. Create directory structure
    await executeCommand('mkdir -p /var/www/nkb-global-hunter/storage', 'Create /var/www/nkb-global-hunter structure');

    // 2. SFTP upload tar.gz
    await sftpUpload(tarPath, '/var/www/nkb-global-hunter/deploy.tar.gz');

    // 3. Extract tar.gz
    await executeCommand('cd /var/www/nkb-global-hunter && tar -xzf deploy.tar.gz', 'Extract deployment bundle');

    // 4. Write server .env
    const writeEnvCmd = `cat << 'EOF' > /var/www/nkb-global-hunter/server/.env\n${ENV_FILE}\nEOF`;
    await executeCommand(writeEnvCmd, 'Write production .env');

    // 5. Run npm install
    await executeCommand('cd /var/www/nkb-global-hunter/server && npm install --omit=dev', 'Install server production dependencies');

    // 6. Run database migrations
    await executeCommand('cd /var/www/nkb-global-hunter/server && node src/db/migrate.js', 'Execute database schema migration and seed');

    // 7. Configure PM2
    await executeCommand('pm2 delete nkb-global-hunter-api 2>/dev/null || true', 'Cleanup old PM2 instance (allow-fail)');
    await executeCommand('cd /var/www/nkb-global-hunter/server && pm2 start src/server.js --name nkb-global-hunter-api --time', 'Start PM2 service');
    await executeCommand('pm2 save', 'Persist PM2 configuration');

    // 8. Test local server health check
    await executeCommand('sleep 2 && curl -s http://127.0.0.1:5000/api/health', 'Verify local API health on port 5000');

    // 9. Write Nginx configuration
    const writeNginxCmd = `cat << 'EOF' > /etc/nginx/conf.d/global.nkbmanufacturing.com.conf\n${NGINX_CONF}\nEOF`;
    await executeCommand(writeNginxCmd, 'Write /etc/nginx/conf.d/global.nkbmanufacturing.com.conf');

    // 10. Test Nginx syntax
    await executeCommand('nginx -t', 'Test Nginx configuration');

    // 11. Reload Nginx
    await executeCommand('systemctl reload nginx', 'Reload Nginx');

    // 12. Run Certbot for HTTPS
    console.log('[Deploy] Obtaining Let\'s Encrypt SSL certificate...');
    await executeCommand(
      'certbot --nginx -d global.nkbmanufacturing.com --non-interactive --agree-tos -m it@nkb-manufacturing.com --redirect',
      'Certbot SSL certificate issue'
    );

    // 13. Verify Nginx after Certbot
    await executeCommand('nginx -t', 'Verify Nginx after Certbot changes');
    await executeCommand('systemctl reload nginx', 'Reload Nginx with SSL');

    // 14. Verification Checks
    console.log('\n================ VERIFICATION ================');
    await executeCommand('curl -ILs https://global.nkbmanufacturing.com/api/health | head -n 10', 'Check HTTPS API Health Header');
    await executeCommand('curl -s https://global.nkbmanufacturing.com/api/health', 'Check HTTPS API Health Body');
    await executeCommand('curl -s https://global.nkbmanufacturing.com/ | head -n 12', 'Check Frontend HTML delivery');

    // 15. Check existing apps to verify zero disturbance
    console.log('\n================ ZERO DISTURBANCE CHECK ================');
    await executeCommand('pm2 list', 'Check all PM2 processes');
    await executeCommand('curl -Is https://sop.nkbmanufacturing.com | head -n 3', 'Verify sop.nkbmanufacturing.com is unaffected');
    await executeCommand('curl -Is https://dcc.nkbmanufacturing.com | head -n 3', 'Verify dcc.nkbmanufacturing.com is unaffected');
    await executeCommand('curl -Is https://pr.nkbmanufacturing.com | head -n 3', 'Verify pr.nkbmanufacturing.com is unaffected');

    console.log('\n>>> DEPLOYMENT AND VERIFICATION COMPLETED SUCCESSFULLY! <<<');
    conn.end();
  } catch (err) {
    console.error('\n[DEPLOY ERROR]', err);
    conn.end();
    process.exit(1);
  }
}).on('error', (err) => {
  console.error('[SSH ERROR]', err.message);
  process.exit(1);
}).connect({
  host: '187.77.143.211',
  port: 22,
  username: 'root',
  password: process.env.VPS_SSH_PASSWORD
});

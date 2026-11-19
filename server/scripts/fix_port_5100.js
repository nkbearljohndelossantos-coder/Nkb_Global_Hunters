import { Client } from 'ssh2';

const conn = new Client();

conn.on('ready', () => {
  const cmd = `
    echo "=== 1. UPDATING .ENV TO PORT 5100 ==="
    sed -i 's/PORT=5000/PORT=5100/g' /var/www/nkb-global-hunter/server/.env
    cat /var/www/nkb-global-hunter/server/.env

    echo "=== 2. RESTARTING PM2 PROCESS ==="
    pm2 delete nkb-global-hunter-api 2>/dev/null || true
    cd /var/www/nkb-global-hunter/server
    pm2 start src/server.js --name nkb-global-hunter-api --time
    pm2 save

    echo "=== 3. WAITING FOR PROCESS TO START ==="
    sleep 3
    pm2 status nkb-global-hunter-api

    echo "=== 4. TESTING DIRECT LOCAL HEALTH ON PORT 5100 ==="
    curl -s http://127.0.0.1:5100/api/health

    echo "=== 5. UPDATING NGINX CONFIG ==="
    sed -i 's/127.0.0.1:5000/127.0.0.1:5100/g' /etc/nginx/conf.d/global.nkbmanufacturing.com.conf
    nginx -t
    systemctl reload nginx

    echo "=== 6. TESTING HTTPS ENDPOINT ==="
    curl -ILs https://global.nkbmanufacturing.com/api/health | head -n 12
    curl -s https://global.nkbmanufacturing.com/api/health
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('close', (code) => {
      console.log(out);
      conn.end();
    }).on('data', (d) => out += d).stderr.on('data', (d) => out += d);
  });
}).connect({
  host: '187.77.143.211',
  port: 22,
  username: 'root',
  password: process.env.VPS_SSH_PASSWORD
});

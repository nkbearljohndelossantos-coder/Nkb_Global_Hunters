import { Client } from 'ssh2';

const conn = new Client();

conn.on('ready', () => {
  const cmd = `
    echo "=== PM2 PROCESSES ==="
    pm2 list
    echo "=== LISTENING PORTS ==="
    ss -tulpn | grep LISTEN
    echo "=== NGINX SITES / CONF.D ==="
    ls -la /etc/nginx/conf.d/
    echo "=== VAR WWW DIRECTORY ==="
    ls -la /var/www/
    echo "=== CERTBOT / SSL CERTIFICATES ==="
    which certbot 2>/dev/null || echo "certbot not found"
    certbot certificates 2>/dev/null || echo "no certbot certs listed"
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

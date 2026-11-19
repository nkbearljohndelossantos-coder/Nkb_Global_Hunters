import { Client } from 'ssh2';

const conn = new Client();

conn.on('ready', () => {
  const cmd = `
    echo "=== PM2 LOGS FOR nkb-global-hunter-api ==="
    pm2 logs nkb-global-hunter-api --lines 30 --nostream
    echo "=== CHECKING PORT 5000 ==="
    ss -tulpn | grep 5000 || echo "Port 5000 not listening"
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('close', () => {
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

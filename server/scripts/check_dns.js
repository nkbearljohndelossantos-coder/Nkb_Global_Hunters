import { Client } from 'ssh2';

const conn = new Client();

conn.on('ready', () => {
  const cmd = `
    echo "=== CHECKING DNS FOR global.nkbmanufacturing.com ==="
    dig +short global.nkbmanufacturing.com || getent hosts global.nkbmanufacturing.com || ping -c 1 global.nkbmanufacturing.com
    echo "=== EXISTING CONF FILES ==="
    cat /etc/nginx/conf.d/sop.conf
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

import { Client } from 'ssh2';

const conn = new Client();

conn.on('ready', () => {
  const cmd = `
    echo "=== 1. CURL LOCALHOST PORT 80 WITH HOST HEADER ==="
    curl -v -H "Host: global.nkbmanufacturing.com" http://127.0.0.1/api/health 2>&1 | head -n 25

    echo "=== 2. CURL LOCALHOST PORT 443 WITH -k AND HOST HEADER ==="
    curl -v -k -H "Host: global.nkbmanufacturing.com" https://127.0.0.1/api/health 2>&1 | head -n 30

    echo "=== 3. CHECK NGINX ACCESS LOG ==="
    tail -n 10 /var/log/nginx/access.log
    tail -n 10 /var/log/nginx/error.log
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('close', () => {
      console.log(out);
      conn.end();
    }).on('data', d => out += d);
  });
}).connect({
  host: '187.77.143.211',
  port: 22,
  username: 'root',
  password: process.env.VPS_SSH_PASSWORD,
  readyTimeout: 30000
});

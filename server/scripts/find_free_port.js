import { Client } from 'ssh2';

const conn = new Client();

conn.on('ready', () => {
  const cmd = `
    echo "=== CHECKING PORTS 5050 to 5200 ==="
    ss -tulpn | grep -E ":(5050|5100|5200|5500|6000|7000)" || echo "None of these are in use"
    ss -tulpn | grep LISTEN
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('close', () => {
      console.log(out);
      conn.end();
    }).on('data', (d) => out += d);
  });
}).connect({
  host: '187.77.143.211',
  port: 22,
  username: 'root',
  password: process.env.VPS_SSH_PASSWORD
});

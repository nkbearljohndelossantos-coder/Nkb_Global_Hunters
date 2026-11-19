import { Client } from 'ssh2';

const conn = new Client();

console.log('Connecting to VPS: 187.77.143.211 as root...');

conn.on('ready', () => {
  console.log('SSH Connection Established successfully!');
  conn.exec('uname -a; whoami; nginx -v; node -v; pm2 -v; psql --version; systemctl status nginx --no-pager | head -n 5', (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('close', (code, signal) => {
      console.log('Command output:\n' + out);
      console.log(`Exited with code: ${code}`);
      conn.end();
    }).on('data', (data) => {
      out += data;
    }).stderr.on('data', (data) => {
      out += '[STDERR] ' + data;
    });
  });
}).on('error', (err) => {
  console.error('SSH Connection Failed:', err.message);
}).connect({
  host: '187.77.143.211',
  port: 22,
  username: 'root',
  password: process.env.VPS_SSH_PASSWORD,
  readyTimeout: 20000
});

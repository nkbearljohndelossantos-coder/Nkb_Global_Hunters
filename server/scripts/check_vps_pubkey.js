import { Client } from 'ssh2';

const conn = new Client();

conn.on('ready', () => {
  conn.exec('cat /root/.ssh/id_ed25519.pub', (err, stream) => {
    let out = '';
    stream.on('close', () => {
      console.log('VPS PUB KEY:', out);
      conn.end();
    }).on('data', d => out += d);
  });
}).connect({
  host: '187.77.143.211',
  port: 22,
  username: 'root',
  password: process.env.VPS_SSH_PASSWORD || 'NkbManufacturing@2025',
  readyTimeout: 30000
});

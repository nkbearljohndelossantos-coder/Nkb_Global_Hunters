import { Client } from 'ssh2';

const conn = new Client();

conn.on('ready', () => {
  const cmd = `cat /etc/nginx/conf.d/global.nkbmanufacturing.com.conf`;
  conn.exec(cmd, (err, stream) => {
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

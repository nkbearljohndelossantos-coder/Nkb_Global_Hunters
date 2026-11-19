import { Client } from 'ssh2';

const conn = new Client();

conn.on('ready', () => {
  const cmd = `
    cd /var/www/nkb-global-hunter
    git remote -v
    git status
    pm2 status nkb-global-hunter-api
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
  password: process.env.VPS_SSH_PASSWORD || 'NkbManufacturing@2025',
  readyTimeout: 30000
});

import { Client } from 'ssh2';

const conn = new Client();

conn.on('ready', () => {
  const cmd = `
    node -e "
      try {
        const { DatabaseSync } = await import('node:sqlite');
        const db = new DatabaseSync(':memory:');
        db.exec('CREATE TABLE test (id INT, name TEXT)');
        db.prepare('INSERT INTO test VALUES (?, ?)').run(1, 'nkb');
        const res = db.prepare('SELECT * FROM test').all();
        console.log('NODE:SQLITE SUCCESS:', res);
      } catch (e) {
        console.error('NODE:SQLITE FAILED:', e.message);
      }
    "
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

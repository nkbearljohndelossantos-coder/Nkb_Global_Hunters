import { Client } from 'ssh2';

const conn = new Client();

conn.on('ready', () => {
  const cmd = `
    echo "=== CHECKING VPS SSH KEYS ==="
    ls -la /root/.ssh/
    echo "=== CHECKING VPS GITHUB AUTH ==="
    ssh -o StrictHostKeyChecking=accept-new -T git@github.com 2>&1 || true
    echo "=== CHECKING OTHER REPOS REMOTES ==="
    cd /var/www/dcc && git remote -v 2>/dev/null || echo "dcc no git"
    cd /var/www/NKB-Client-System && git remote -v 2>/dev/null || echo "NKB-Client-System no git"
    cd /var/www/sop-management-system && git remote -v 2>/dev/null || echo "sop no git"
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

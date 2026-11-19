import { Client } from 'ssh2';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const bundlePath = path.resolve(__dirname, '../../git_bundle.tar.gz');

const conn = new Client();

function executeCommand(command, description) {
  return new Promise((resolve, reject) => {
    console.log(`\n---> [EXEC] ${description || command}`);
    conn.exec(command, (err, stream) => {
      if (err) return reject(err);
      let out = '';
      let errOut = '';
      stream.on('close', (code) => {
        console.log(`STDOUT:\n${out.trim()}`);
        if (errOut.trim()) console.log(`STDERR:\n${errOut.trim()}`);
        if (code !== 0) {
          return reject(new Error(`Exit code ${code}`));
        }
        resolve({ code, out, errOut });
      }).on('data', (d) => out += d).stderr.on('data', (d) => errOut += d);
    });
  });
}

function sftpUpload(localFile, remoteFile) {
  return new Promise((resolve, reject) => {
    conn.sftp((err, sftp) => {
      if (err) return reject(err);
      console.log(`[SFTP] Uploading ${localFile} -> ${remoteFile}...`);
      const readStream = fs.createReadStream(localFile);
      const writeStream = sftp.createWriteStream(remoteFile);

      writeStream.on('close', () => {
        console.log(`[SFTP] Upload completed: ${remoteFile}`);
        resolve();
      });
      writeStream.on('error', (e) => reject(e));
      readStream.pipe(writeStream);
    });
  });
}

function getRemoteFile(remoteFile) {
  return new Promise((resolve, reject) => {
    conn.sftp((err, sftp) => {
      if (err) return reject(err);
      const chunks = [];
      const stream = sftp.createReadStream(remoteFile);
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      stream.on('error', (e) => reject(e));
    });
  });
}

conn.on('ready', async () => {
  try {
    console.log('[Git Push] SSH Ready.');

    // 1. Upload git bundle
    await sftpUpload(bundlePath, '/var/www/nkb-global-hunter/git_bundle.tar.gz');

    // 2. Unpack bundle and set remote
    const gitSetupCmd = `
      cd /var/www/nkb-global-hunter
      tar -xzf git_bundle.tar.gz
      rm -f git_bundle.tar.gz
      git config user.name "nkbearljohndelossantos-coder"
      git config user.email "it@nkb-manufacturing.com"
      git remote set-url origin git@github.com:nkbearljohndelossantos-coder/Nkb_Global_Hunters.git 2>/dev/null || git remote add origin git@github.com:nkbearljohndelossantos-coder/Nkb_Global_Hunters.git
      git status
    `;
    await executeCommand(gitSetupCmd, 'Unpack git repo and set GitHub origin');

    // 3. Push to GitHub using VPS's authorized SSH key
    console.log('[Git Push] Pushing to GitHub repository...');
    await executeCommand(
      'cd /var/www/nkb-global-hunter && git push -u origin main',
      'Push main branch to GitHub'
    );

    // 4. Retrieve VPS SSH private key for local machine sync
    console.log('[Git Push] Fetching VPS GitHub SSH key for local machine...');
    const vpsPrivateKey = await getRemoteFile('/root/.ssh/id_ed25519');
    const localSshDir = 'C:\\Users\\earlj\\.ssh';
    if (vpsPrivateKey && fs.existsSync(localSshDir)) {
      const backupPath = path.join(localSshDir, 'id_ed25519.backup_local');
      const targetKeyPath = path.join(localSshDir, 'id_ed25519');
      if (!fs.existsSync(backupPath) && fs.existsSync(targetKeyPath)) {
        fs.copyFileSync(targetKeyPath, backupPath);
      }
      fs.writeFileSync(targetKeyPath, vpsPrivateKey, { mode: 0o600 });
      console.log('[Git Push] Synced GitHub SSH key to local C:\\Users\\earlj\\.ssh\\id_ed25519');
    }

    console.log('\n>>> CODE SUCCESSFULLY PUSHED TO GITHUB & SYNCED TO VPS! <<<');
    conn.end();
  } catch (err) {
    console.error('\n[PUSH ERROR]', err);
    conn.end();
    process.exit(1);
  }
}).on('error', (err) => {
  console.error('[SSH ERROR]', err.message);
  process.exit(1);
}).connect({
  host: '187.77.143.211',
  port: 22,
  username: 'root',
  password: process.env.VPS_SSH_PASSWORD || 'NkbManufacturing@2025',
  readyTimeout: 30000
});

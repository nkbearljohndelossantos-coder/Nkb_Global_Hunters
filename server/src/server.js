import 'dotenv/config';
import { createApp } from './app.js';
import { initDatabase } from './db/index.js';
import { runMigrations } from './db/migrate.js';

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    console.log('[NKB Global Hunter] Initializing server...');
    await initDatabase();
    await runMigrations();

    const app = createApp();
    const server = app.listen(PORT, () => {
      console.log(`[NKB Global Hunter Server] Running in ${process.env.NODE_ENV || 'staging'} mode on http://localhost:${PORT}`);
    });

    const gracefulShutdown = () => {
      console.log('\n[NKB Global Hunter] Gracefully shutting down server...');
      server.close(() => {
        console.log('[NKB Global Hunter] HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
  } catch (err) {
    console.error('[NKB Global Hunter Fatal Error]', err);
    process.exit(1);
  }
}

startServer();

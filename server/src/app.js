import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import discoveryRoutes from './routes/discovery.js';
import companiesRoutes from './routes/companies.js';
import qualificationRoutes from './routes/qualification.js';
import contactsRoutes from './routes/contacts.js';
import agentsRoutes from './routes/agents.js';
import proposalsRoutes from './routes/proposals.js';
import crmRoutes from './routes/crm.js';
import outreachRoutes from './routes/outreach.js';
import marketRoutes from './routes/market.js';
import reportsRoutes from './routes/reports.js';
import sourcesRoutes from './routes/sources.js';
import usersRoutes from './routes/users.js';
import auditRoutes from './routes/audit.js';
import settingsRoutes from './routes/settings.js';

export function createApp() {
  const app = express();

  // Security Headers
  app.use(helmet({
    contentSecurityPolicy: false, // Handled separately for API/client
    crossOriginEmbedderPolicy: false
  }));

  // CORS Policy
  app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
  }));

  // Rate Limiting (120 requests per minute per IP for general API endpoints)
  const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please throttle your client calls.' }
  });
  app.use('/api/', limiter);

  // Body Parsing
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));

  // Request Logging
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('combined'));
  }

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'UP',
      service: 'NKB GLOBAL HUNTER API',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      nodeVersion: process.version
    });
  });

  // Mount API modules
  app.use('/api/auth', authRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/discovery', discoveryRoutes);
  app.use('/api/companies', companiesRoutes);
  app.use('/api/qualification', qualificationRoutes);
  app.use('/api/contacts', contactsRoutes);
  app.use('/api/agents', agentsRoutes);
  app.use('/api/proposals', proposalsRoutes);
  app.use('/api/crm', crmRoutes);
  app.use('/api/outreach', outreachRoutes);
  app.use('/api/market', marketRoutes);
  app.use('/api/reports', reportsRoutes);
  app.use('/api/sources', sourcesRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/audit', auditRoutes);
  app.use('/api/settings', settingsRoutes);

  // 404 Handler
  app.use((req, res) => {
    res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
  });

  // Global Error Handler
  app.use((err, req, res, next) => {
    console.error('[Global Error Handler]', err);
    res.status(err.status || 500).json({
      error: err.message || 'An unexpected internal server error occurred.'
    });
  });

  return app;
}

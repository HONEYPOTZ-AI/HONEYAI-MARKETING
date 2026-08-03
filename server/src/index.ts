import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';
import dotenv from 'dotenv';
import { createServer } from 'http';
import next from 'next';
import path from 'path';

import { authRouter } from './routes/auth';
import { userRouter } from './routes/users';
import { campaignRouter } from './routes/campaigns';
import { postRouter } from './routes/posts';
import { emailRouter } from './routes/email';
import { smsRouter } from './routes/sms';
import { crmRouter } from './routes/crm';
import { contentRouter } from './routes/content';
import { publishingRouter } from './routes/publishing';
import { analyticsRouter } from './routes/analytics';
import { billingRouter } from './routes/billing';
import { healthRouter } from './routes/health';
import { webhookRouter } from './routes/webhooks';
import { linkedinRouter } from './routes/linkedin';

import { errorHandler } from './middleware/errorHandler';
import { authenticate } from './middleware/auth';

dotenv.config();

const dev = process.env.NODE_ENV !== 'production';
const PORT = parseInt(process.env.PORT || '3001', 10);

// ── Next.js App ────────────────────────────────────────────────────────────
const clientDir = path.resolve(__dirname, '../../client');
const nextApp = next({ dev, dir: clientDir });
const nextHandler = nextApp.getRequestHandler();

const app = express();

// ── Global Middleware ─────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(morgan('short'));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// ── Rate Limiting ─────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Please slow down.' },
});
app.use('/api', globalLimiter);

// ── Raw body parser needed for Stripe webhook signature verification
app.use('/api/webhooks', express.raw({ type: 'application/json' }), (req, _res, next) => {
  (req as any).rawBody = req.body;
  if (Buffer.isBuffer(req.body)) {
    try { req.body = JSON.parse(req.body.toString()); } catch { req.body = {}; }
  }
  next();
});

// ── Public Routes (no auth required) ─────────────────────────────────────
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/webhooks', webhookRouter);
app.use('/api/linkedin', linkedinRouter);

// ── Protected Routes (auth required) ──────────────────────────────────────
app.use('/api/users', authenticate, userRouter);
app.use('/api/campaigns', authenticate, campaignRouter);
app.use('/api/posts', authenticate, postRouter);
app.use('/api/email', authenticate, emailRouter);
app.use('/api/sms', authenticate, smsRouter);
app.use('/api/crm', authenticate, crmRouter);
app.use('/api/content', authenticate, contentRouter);
app.use('/api/publishing', authenticate, publishingRouter);
app.use('/api/analytics', authenticate, analyticsRouter);
app.use('/api/billing', authenticate, billingRouter);

// ── Next.js handler for all non-API routes ───────────────────────────────
app.all('*', (req, res) => {
  return nextHandler(req, res);
});

// ── Error Handler ─────────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────────────────
nextApp.prepare().then(() => {
  const server = createServer(app);
  server.listen(PORT, () => {
    console.log(`🜁 Honey AI Marketing running on port ${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Next.js client dir: ${clientDir}`);
  });
});

export default app;

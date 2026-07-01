// MUST be the first import in this file. ES module imports execute before
// the importing file's own code runs, so if this were below the route
// imports (as it was before), modules like lib/supabaseClient.js and
// lib/cryptoUtils.js would read process.env.SUPABASE_URL /
// process.env.ENCRYPTION_KEY while they're still undefined.
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import passwordRoutes from './routes/passwords.js';
import documentsRoutes from './routes/documents.js';
import devicesRoutes from './routes/devices.js';
import qrcodesRoutes from './routes/qrcodes.js';
import alertsRoutes from './routes/alerts.js';
import syncRoutes from './routes/sync.js';
import backupsRoutes from './routes/backups.js';
import storageRoutes from './routes/storage.js';
import historyRoutes from './routes/history.js';
import monitoringRoutes from './routes/monitoring.js';
import transactionsRoutes from './routes/transactions.js';
import sharingRoutes from './routes/sharing.js';
import terminalQrRoutes from './routes/terminalQr.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';
import { supabaseAdmin } from './lib/supabaseClient.js';

// Environment variables are loaded by the `import 'dotenv/config'` at the
// very top of this file — that has to come before any other import (see the
// comment there) so .env values are available when route/lib modules
// evaluate their own top-level code, e.g. ENCRYPTION_KEY in cryptoUtils.js
// and SUPABASE_URL in lib/supabaseClient.js.

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token']
}));

// Rate limiting - More lenient for development
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // limit each IP to 1000 requests per windowMs (increased for multiple API calls)
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting in development mode
    return process.env.NODE_ENV === 'development';
  }
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/passwords', passwordRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/devices', devicesRoutes);
app.use('/api/qrcodes', qrcodesRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/backups', backupsRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/sharing', sharingRoutes);
app.use('/api/terminal-qr', terminalQrRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use(errorHandler);

// Database connection(s)
//
// TRANSITION STATE — both databases are wired up right now because not
// every route has been migrated off Mongoose yet. As of this file:
//   migrated to Supabase:     auth.js, documents.js, passwords.js
//   still on Mongoose/Mongo:  user.js, devices.js, qrcodes.js, alerts.js,
//                              sync.js, backups.js, storage.js, history.js,
//                              monitoring.js, transactions.js, sharing.js,
//                              terminalQr.js
// Once that list is empty, delete connectMongo() and the mongoose import
// above — Supabase doesn't need a persistent connection the way Mongoose
// does, so connectSupabase() alone (or nothing at all) is sufficient.
const connectMongo = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/passvault';
    await mongoose.connect(mongoURI);
    logger.info(`MongoDB connected successfully to ${mongoURI}`);
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    logger.warn('Starting server without a MongoDB connection — routes not yet migrated to Supabase will fail.');
  }
};

const connectSupabase = async () => {
  try {
    const { error } = await supabaseAdmin.from('profiles').select('id').limit(1);
    if (error) throw error;
    logger.info(`Supabase reachable at ${process.env.SUPABASE_URL}`);
  } catch (error) {
    logger.error('Supabase connection check failed:', error);
    logger.warn('Starting server anyway — check SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in server/.env');
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

// Start server
const startServer = async () => {
  // Listen immediately so Railway/Vercel health checks pass right away
  // rather than waiting up to 30 s for Mongoose to time out.
  app.listen(PORT, () => {
    logger.info(`🚀 PassVault Server running on port ${PORT}`);
    logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`📊 Health check: http://localhost:${PORT}/health`);
    logger.info(`🔗 Frontend URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
  });

  // DB connections run after listen — failures are logged as warnings, not
  // crashes, so the process stays up for the routes that are already working.
  try {
    await connectMongo();
  } catch (err) {
    logger.warn('MongoDB unavailable — unmigrated routes will fail until Mongo is reachable.');
  }
  try {
    await connectSupabase();
  } catch (err) {
    logger.warn('Supabase unavailable — migrated routes will fail until Supabase is reachable.');
  }
};

startServer();

export default app;
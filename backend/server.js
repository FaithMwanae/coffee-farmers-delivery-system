import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import farmerRoutes from './routes/farmerRoutes.js';
import staffRoutes from './routes/staffRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
import ceoRoutes from './routes/ceoRoutes.js';
import formsRoutes from './routes/formsRoutes.js';
import verifyRoutes from './routes/verifyRoutes.js';

import { initEmailService } from './config/email.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// MIDDLEWARE
// ============================================
// CORS — allow local dev + any Vercel + any Render URL
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:10000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman, mobile apps)
      if (!origin) return callback(null, true);

      // Allow explicit local origins
      if (allowedOrigins.includes(origin)) return callback(null, true);

      // Allow any Vercel preview/production URL
      if (/\.vercel\.app$/.test(origin)) return callback(null, true);

      // Allow any Render URL (backend calling itself, etc.)
      if (/\.onrender\.com$/.test(origin)) return callback(null, true);

      // Reject everything else
      callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Serve uploaded files (forms, avatars, etc.)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================
// HEALTH CHECK
// ============================================
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Kaliluni Coffee Farmers Delivery System API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      farmer: '/api/farmer',
      staff: '/api/staff',
      admin: '/api/admin',
      ceo: '/api/ceo',
      announcements: '/api/announcements',
      forms: '/api/forms',
      verify: '/api/verify',
      uploads: '/uploads',
    },
  });
});

// ============================================
// ROUTES
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api', authRoutes); // Fallback alias for /api/forgot-password etc.
app.use('/api/farmer', farmerRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ceo', ceoRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/forms', formsRoutes);
app.use('/api/verify', verifyRoutes);

// ============================================
// ERROR HANDLING
// ============================================
app.use(notFound);
app.use(errorHandler);

// ============================================
// START SERVER
// ============================================
const startServer = async () => {
  try {
    await initEmailService();
  } catch (err) {
    console.warn('Email service init failed:', err.message);
  }

  app.listen(PORT, () => {
    console.log('');
    console.log('═══════════════════════════════════════════');
    console.log(' KALILUNI COFFEE API SERVER');
    console.log('═══════════════════════════════════════════');
    console.log(` Server running on: http://localhost:${PORT}`);
    console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('═══════════════════════════════════════════');
    console.log('');
  });
};

startServer();
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
import inputRoutes from './routes/inputRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';

import { initEmailService, isEmailEnabled } from './config/email.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// MIDDLEWARE
// ============================================
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:10000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      if (/\.vercel\.app$/.test(origin)) return callback(null, true);
      if (/\.onrender\.com$/.test(origin)) return callback(null, true);
      callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Serve uploaded files at /api/uploads (to match the frontend)
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

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
      payments: '/api/payments',
      uploads: '/api/uploads',
    },
  });
});

// ============================================
// ROUTES
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api', authRoutes);
app.use('/api/farmer', farmerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ceo', ceoRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/forms', formsRoutes);
app.use('/api/verify', verifyRoutes);

app.use('/api/staff/inputs', inputRoutes);
app.use('/api/staff', staffRoutes);

app.use('/api/payments', paymentRoutes);

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
    console.error('Email service init failed:', err.message);
  }

  if (process.env.NODE_ENV === 'production' && !isEmailEnabled()) {
    console.error('');
    console.error('--------------------------------------------------');
    console.error('PRODUCTION RUNNING WITHOUT EMAIL');
    console.error('   Password reset flows will silently fail.');
    console.error('   Set RESEND_API_KEY in Render env vars:');
    console.error('   -> dashboard.render.com -> kaliluni-backend -> Environment');
    console.error('--------------------------------------------------');
    console.error('');
  }

  app.listen(PORT, () => {
    console.log('');
    console.log('===========================================');
    console.log(' KALILUNI COFFEE API SERVER');
    console.log('===========================================');
    console.log(` Server running on: http://localhost:${PORT}`);
    console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(` Email service: ${isEmailEnabled() ? 'enabled (Resend)' : 'disabled'}`);
    console.log('===========================================');
    console.log('');
  });
};

startServer();
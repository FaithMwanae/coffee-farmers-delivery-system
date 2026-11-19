import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { allowRoles } from '../middleware/roleCheck.js';
import { 
  releasePayment, 
  mpesaB2CCallback, 
  mpesaTimeout,
  collectViaStk,
  mpesaStkCallback,
  getPaymentSchedule,     // ⭐ Added
  getReleasedPayments,    // ⭐ Added
  bulkReleasePayments,    // ⭐ Added
  getPendingApprovals,    // ⭐ Added
  approvePayment          // ⭐ Added
} from '../controllers/paymentController.js';

const router = express.Router();

// ============================================================
// PUBLIC ROUTES (Safaricom webhooks)
// ============================================================
router.post('/mpesa/b2c-callback', mpesaB2CCallback);
router.post('/mpesa/timeout', mpesaTimeout);
router.post('/mpesa/stk-callback', mpesaStkCallback);

// ============================================================
// PROTECTED ROUTES (Staff / Admin)
// ============================================================
router.use(authenticate);
router.use(allowRoles('staff', 'admin'));

// Reads (Schedule & History)
router.get('/schedule', getPaymentSchedule);
router.get('/released', getReleasedPayments);

// Bulk release
router.post('/bulk', bulkReleasePayments);

// Single release (B2C)
router.post('/release/:farmerId', releasePayment);

// STK Push (Collect money from farmer)
router.post('/collect/stk', collectViaStk);

// Admin approvals (optional, if you want to restrict later)
router.get('/pending-approvals', getPendingApprovals);
router.post('/:id/approve', approvePayment);

export default router;
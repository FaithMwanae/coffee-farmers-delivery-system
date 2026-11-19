import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { allowRoles } from '../middleware/roleCheck.js';
import { 
  releasePayment, 
  mpesaB2CCallback, 
  mpesaTimeout,
  collectViaStk,       // ⭐ NEW
  mpesaStkCallback     // ⭐ NEW
} from '../controllers/paymentController.js';

const router = express.Router();

// ============================================================
// PUBLIC ROUTES (Safaricom webhooks)
// ============================================================
router.post('/mpesa/b2c-callback', mpesaB2CCallback);
router.post('/mpesa/timeout', mpesaTimeout);
router.post('/mpesa/stk-callback', mpesaStkCallback); // ⭐ NEW

// ============================================================
// PROTECTED ROUTES (Staff / Admin)
// ============================================================
router.use(authenticate);
router.use(allowRoles('staff', 'admin'));

// Trigger a payment release to a farmer (B2C)
router.post('/release/:farmerId', releasePayment);

// Trigger an STK push to collect money from a farmer
router.post('/collect/stk', collectViaStk); // ⭐ NEW

export default router;
import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { allowRoles } from '../middleware/roleCheck.js';
import { 
  releasePayment, 
  mpesaB2CCallback, 
  mpesaTimeout 
} from '../controllers/paymentController.js';

const router = express.Router();

// ============================================================
// PUBLIC ROUTES (Safaricom webhooks)
// These must NOT have the 'authenticate' middleware, because
// Safaricom's servers do not send a JWT token.
// ============================================================
router.post('/mpesa/b2c-callback', mpesaB2CCallback);
router.post('/mpesa/timeout', mpesaTimeout);

// ============================================================
// PROTECTED ROUTES (Staff / Admin)
// Everything below this line requires a valid user login
// ============================================================
router.use(authenticate);
router.use(allowRoles('staff', 'admin'));

// Trigger a payment release to a farmer
router.post('/release/:farmerId', releasePayment);

export default router;
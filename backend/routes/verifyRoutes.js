import express from 'express';
import { verifyReceipt } from '../controllers/verifyController.js';

const router = express.Router();

// Public — no authentication required
router.get('/:receipt', verifyReceipt);

export default router;
import express from 'express';
import {
  getDashboard, getAllDeliveries, recordDelivery,
  getAllFarmers, registerFarmer, getAllTransactions,
  recordTransaction, getReportSummary, getChartData,
  getFarmerAdvanceInfo, getPaymentsGrouped,
} from '../controllers/staffController.js';

import { authenticate } from '../middleware/auth.js';
import { allowRoles } from '../middleware/roleCheck.js';
import { auditLogger } from '../middleware/auditLogger.js';

const router = express.Router();

// AUTHENTICATED ROUTES
router.use(authenticate);
router.use(allowRoles('staff', 'admin', 'ceo'));

// Dashboard
router.get('/dashboard', getDashboard);
router.get('/charts', getChartData);

// Deliveries
router.get('/deliveries', getAllDeliveries);
router.post('/deliveries', auditLogger('RECORD_DELIVERY', (req) => `${req.body.weight} kg`), recordDelivery);

// Farmers
router.get('/farmers', getAllFarmers);
router.get('/farmers/:id/advance-info', getFarmerAdvanceInfo);
router.post('/farmers', auditLogger('REGISTER_FARMER', (req) => req.body.name), registerFarmer);

// Transactions
router.get('/transactions', getAllTransactions);
router.post('/transactions', auditLogger('RECORD_TRANSACTION', (req) => `${req.body.type} KES ${req.body.amount}`), recordTransaction);

// Grouped Payments (still used in staffController for some views)
router.get('/payments/grouped', getPaymentsGrouped);

// ⭐ NOTE: Payment Schedule, Release, and STK Push logic have been moved to paymentRoutes.js
// which is mounted at /api/payments in server.js

// Reports
router.get('/reports/summary', getReportSummary);

export default router;
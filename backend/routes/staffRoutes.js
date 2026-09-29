import express from 'express';
import {
  getDashboard, getAllDeliveries, recordDelivery,
  getAllFarmers, registerFarmer, getAllTransactions,
  recordTransaction, getPaymentSchedule, getReportSummary,
  getChartData,
  getFarmerAdvanceInfo,
  releasePayment,
} from '../controllers/staffController.js';
import { authenticate } from '../middleware/auth.js';
import { allowRoles } from '../middleware/roleCheck.js';
import { auditLogger } from '../middleware/auditLogger.js';

const router = express.Router();

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

// Payments
router.get('/payments', getPaymentSchedule);
router.post(
  '/payments/release/:farmerId',
  auditLogger('RELEASE_PAYMENT', (req) => `Farmer #${req.params.farmerId} — KES ${req.body.amount} via ${req.body.method}`),
  releasePayment
);

// Reports
router.get('/reports/summary', getReportSummary);

export default router;
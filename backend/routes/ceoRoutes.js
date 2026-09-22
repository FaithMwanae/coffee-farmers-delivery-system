import express from 'express';
import {
  getDashboard,
  getPendingAdvances,
  approveAdvance,
  rejectAdvance,
  getChartData,
} from '../controllers/ceoController.js';
import { authenticate } from '../middleware/auth.js';
import { allowRoles } from '../middleware/roleCheck.js';

const router = express.Router();

router.use(authenticate);
router.use(allowRoles('ceo', 'admin'));

router.get('/dashboard', getDashboard);
router.get('/pending-advances', getPendingAdvances);
router.post('/advances/:id/approve', approveAdvance);
router.post('/advances/:id/reject', rejectAdvance);
router.get('/charts', getChartData);

export default router;
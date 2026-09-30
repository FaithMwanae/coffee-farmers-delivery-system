import express from 'express';
import {
  getDashboard, getMyDeliveries, getMyTransactions,
  getAnnouncements, getForms, getProfile, updateProfile,
  enableFarmerProfile,
  getAdvanceEligibility,
  requestAdvance,
  getMyAdvances,
} from '../controllers/farmerController.js';
import { authenticate } from '../middleware/auth.js';
import { allowRoles } from '../middleware/roleCheck.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Allow ANY authenticated user to enable a farmer profile
router.post('/enable', enableFarmerProfile);

// Farmer-only routes
router.use(allowRoles('farmer', 'staff', 'admin'));

router.get('/dashboard', getDashboard);
router.get('/deliveries', getMyDeliveries);
router.get('/transactions', getMyTransactions);
router.get('/announcements', getAnnouncements);
router.get('/forms', getForms);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// ============================================
// Advance routes
// ============================================
// ⚠️ Order matters — put /advances/request BEFORE /advances/:id (if it existed)
router.get('/advances/eligibility', getAdvanceEligibility);
router.get('/advances', getMyAdvances);
router.post('/advances/request', requestAdvance);

export default router;
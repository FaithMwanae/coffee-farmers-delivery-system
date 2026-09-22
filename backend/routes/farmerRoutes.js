import express from 'express';
import {
  getDashboard, getMyDeliveries, getMyTransactions,
  getAnnouncements, getForms, getProfile, updateProfile,
  enableFarmerProfile,
} from '../controllers/farmerController.js';
import { authenticate } from '../middleware/auth.js';
import { allowRoles } from '../middleware/roleCheck.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Allow ANY authenticated user to enable a farmer profile
router.post('/enable', enableFarmerProfile);

// Farmer-only routes (a user with staff/admin role + farmer profile
// will still be blocked here unless we bypass; see note below)
router.use(allowRoles('farmer', 'staff', 'admin'));

router.get('/dashboard', getDashboard);
router.get('/deliveries', getMyDeliveries);
router.get('/transactions', getMyTransactions);
router.get('/announcements', getAnnouncements);
router.get('/forms', getForms);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

export default router;
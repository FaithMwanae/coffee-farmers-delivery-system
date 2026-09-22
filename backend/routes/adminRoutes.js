import express from 'express';
import { getChartData, getDashboard, getRecentActivity, getRoleDistribution,
  getAllUsers, createUser, updateUser, toggleUserStatus,
  getSettings, updateSettings, getAuditLogs,
} from '../controllers/adminController.js';
import { authenticate } from '../middleware/auth.js';
import { allowRoles } from '../middleware/roleCheck.js';
import { auditLogger } from '../middleware/auditLogger.js';

const router = express.Router();

// All routes require authentication + admin role
router.use(authenticate);
router.use(allowRoles('admin' ,'ceo'));
router.get('/charts', getChartData);
// Dashboard
router.get('/dashboard', getDashboard);
router.get('/activity', getRecentActivity);
router.get('/roles', getRoleDistribution);

// User Management
router.get('/users', getAllUsers);
router.post('/users', auditLogger('CREATE_USER', (req) => `Created user: ${req.body.email}`), createUser);
router.put('/users/:id', auditLogger('UPDATE_USER', (req) => `Updated user #${req.params.id}`), updateUser);
router.patch('/users/:id/toggle-status', auditLogger('TOGGLE_USER_STATUS', (req) => `Toggled status for user #${req.params.id}`), toggleUserStatus);

// Settings
router.get('/settings', getSettings);
router.put('/settings', auditLogger('UPDATE_SETTINGS', 'Updated system settings'), updateSettings);

// Audit Logs
router.get('/audit-logs', getAuditLogs);

export default router;
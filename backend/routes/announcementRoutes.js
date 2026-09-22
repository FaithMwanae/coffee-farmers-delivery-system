import express from 'express';
import {
  getAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from '../controllers/announcementController.js';
import { authenticate } from '../middleware/auth.js';
import { allowRoles } from '../middleware/roleCheck.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Read — any authenticated user
router.get('/', getAllAnnouncements);

// Write — staff or admin only
router.post('/', allowRoles('staff', 'admin'), createAnnouncement);
router.put('/:id', allowRoles('staff', 'admin'), updateAnnouncement);
router.delete('/:id', allowRoles('staff', 'admin'), deleteAnnouncement);

export default router;
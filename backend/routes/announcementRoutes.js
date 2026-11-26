import express from 'express';
import {
  getAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  upload // Import upload middleware from the controller
} from '../controllers/announcementController.js';
import { authenticate } from '../middleware/auth.js';
import { allowRoles } from '../middleware/roleCheck.js';

const router = express.Router();

// All routes require the user to be logged in
router.use(authenticate);

// Read — any authenticated user
router.get('/', getAllAnnouncements);

// Write — staff or admin only
// Add upload.single('attachment') to handle the file from the frontend
router.post(
  '/', 
  allowRoles('staff', 'admin'), 
  upload.single('attachment'), 
  createAnnouncement
);

router.put(
  '/:id', 
  allowRoles('staff', 'admin'), 
  upload.single('attachment'), 
  updateAnnouncement
);

router.delete('/:id', allowRoles('staff', 'admin'), deleteAnnouncement);

export default router;
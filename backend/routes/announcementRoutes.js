import express from 'express';
import multer from 'multer';
import path from 'path';
import {
  getAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from '../controllers/announcementController.js';
import { authenticate } from '../middleware/auth.js';
import { allowRoles } from '../middleware/roleCheck.js';

// 1. Configure Multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Files will be saved to the 'uploads' directory in your backend root
    cb(null, 'uploads/'); 
  },
  filename: (req, file, cb) => {
    // Create a unique filename to prevent overwriting
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit to 5MB
});

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Read — any authenticated user
router.get('/', getAllAnnouncements);

// Write — staff or admin only
// Note: We add upload.single('attachment') here so it processes the file
router.post(
  '/', 
  allowRoles('staff', 'admin'), 
  upload.single('attachment'), 
  createAnnouncement
);

// If you want to allow updating the attachment, add upload.single('attachment') here too
router.put(
  '/:id', 
  allowRoles('staff', 'admin'), 
  upload.single('attachment'), 
  updateAnnouncement
);

router.delete('/:id', allowRoles('staff', 'admin'), deleteAnnouncement);

export default router;
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

// 1. Configure Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Make sure this folder exists
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

const router = express.Router();

router.use(authenticate);

router.get('/', getAllAnnouncements);

// 2. Add upload.single('attachment') to the POST route
router.post(
  '/', 
  allowRoles('staff', 'admin'), 
  upload.single('attachment'), 
  createAnnouncement
);

// 3. Add upload.single('attachment') to the PUT route
router.put(
  '/:id', 
  allowRoles('staff', 'admin'), 
  upload.single('attachment'), 
  updateAnnouncement
);

router.delete('/:id', allowRoles('staff', 'admin'), deleteAnnouncement);

export default router;
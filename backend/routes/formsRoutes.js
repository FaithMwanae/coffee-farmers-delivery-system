import express from 'express';
import {
  getAllForms,
  downloadForm,
  createForm,
  deleteForm,
} from '../controllers/formsController.js';
import { uploadForm } from '../config/upload.js';
import { authenticate } from '../middleware/auth.js';
import { allowRoles } from '../middleware/roleCheck.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Read — any authenticated user (farmer, staff, admin, ceo)
router.get('/', getAllForms);
router.get('/:id/download', downloadForm);

// Upload — staff / admin / ceo
router.post(
  '/',
  allowRoles('staff', 'admin', 'ceo'),
  uploadForm.single('file'),
  createForm
);

// Delete — admin / ceo
router.delete('/:id', allowRoles('admin', 'ceo'), deleteForm);

export default router;

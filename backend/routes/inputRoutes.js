import express from 'express';
import {
  getAllInputs,
  getPendingInputsCount,
  recordInput,
  updateInputStatus,
  issueInput,
} from '../controllers/inputsController.js';
import { authenticate } from '../middleware/auth.js';
import { allowRoles } from '../middleware/roleCheck.js';

const router = express.Router();

// All input routes require authentication
router.use(authenticate);
router.use(allowRoles('staff', 'admin', 'ceo'));

// Badge count for sidebar
router.get('/count', getPendingInputsCount);

// Inputs CRUD
router.get('/', getAllInputs);
router.post('/', recordInput);

// Workflow actions
router.put('/:id/status', updateInputStatus);
router.post('/:id/issue', issueInput);

export default router;
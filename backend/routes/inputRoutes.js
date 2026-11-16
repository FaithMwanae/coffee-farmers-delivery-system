import express from 'express';
import { getAllInputs, recordInput } from '../controllers/inputsController.js';
import { authenticate } from '../middleware/auth.js';
import { allowRoles } from '../middleware/roleCheck.js';

const router = express.Router();

router.use(authenticate);
router.use(allowRoles('staff', 'admin', 'ceo'));

router.get('/', getAllInputs);
router.post('/', recordInput);

export default router;
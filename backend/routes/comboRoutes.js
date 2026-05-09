import express from 'express';
import { getCombos, createCombo, updateCombo, deleteCombo } from '../controllers/comboController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getCombos);
router.post('/', protect, admin, createCombo);
router.put('/:id', protect, admin, updateCombo);
router.delete('/:id', protect, admin, deleteCombo);

export default router;

import express from 'express';
import { openRegister, closeRegister, getCurrentSession, getAllSessions } from '../controllers/cashierController.js';
import { protect, admin, staff } from '../middleware/authMiddleware.js';

const router = express.Router();
router.post('/open', protect, staff, openRegister);
router.put('/close', protect, staff, closeRegister);
router.get('/current', protect, staff, getCurrentSession);
router.get('/', protect, admin, getAllSessions);
export default router;

import express from 'express';
import { getActivityLogs, getEntityLogs } from '../controllers/activityController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();
router.get('/', protect, admin, getActivityLogs);
router.get('/:entity/:id', protect, admin, getEntityLogs);
export default router;

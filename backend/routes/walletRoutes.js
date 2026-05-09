import express from 'express';
import {
  createRequest,
  getMyRequests,
  getRequests,
  approveRequest,
  rejectRequest,
  createCardIntent,
  confirmCardTopup,
} from '../controllers/walletRequestController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Card payment routes (before /:id routes to avoid param collision)
router.post('/card-intent', protect, createCardIntent);
router.post('/card-confirm', protect, confirmCardTopup);

// Manual request routes
router.post('/', protect, createRequest);
router.get('/mine', protect, getMyRequests);
router.get('/', protect, admin, getRequests);
router.put('/:id/approve', protect, admin, approveRequest);
router.put('/:id/reject', protect, admin, rejectRequest);

export default router;

import express from 'express';
import {
  getVouchers,
  createVoucher,
  deleteVoucher,
  validateVoucher,
  applyVoucher,
} from '../controllers/voucherController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(protect, admin, getVouchers).post(protect, admin, createVoucher);
router.route('/:id').delete(protect, admin, deleteVoucher);
router.route('/validate').post(protect, validateVoucher);
router.route('/apply').post(protect, applyVoucher);

export default router;

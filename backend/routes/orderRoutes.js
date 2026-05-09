import express from 'express';
import {
  addOrderItems,
  getMyOrders,
  getOrders,
  getOrderById,
  updateOrderToDelivered,
  markOrderPaidAdmin,
  cancelOrder,
  createPOSOrder,
  getRevenueStats,
  updateOrderStatus,
} from '../controllers/orderController.js';
import { updateOrderToPaid } from '../controllers/stripeController.js';
import { protect, admin, optionalProtect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').post(optionalProtect, addOrderItems).get(protect, admin, getOrders);
router.route('/myorders').get(protect, getMyOrders);
router.route('/stats/revenue').get(protect, admin, getRevenueStats);
router.route('/pos').post(protect, admin, createPOSOrder);
router.route('/:id').get(protect, getOrderById);
router.route('/:id/pay').put(protect, updateOrderToPaid);
router.route('/:id/pay-admin').put(protect, admin, markOrderPaidAdmin);
router.route('/:id/deliver').put(protect, admin, updateOrderToDelivered);
router.route('/:id/cancel').put(protect, cancelOrder);
router.route('/:id/status').put(protect, admin, updateOrderStatus);

export default router;

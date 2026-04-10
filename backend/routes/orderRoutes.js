// backend/routes/orderRoutes.js
import express from 'express';
import { addOrderItems, getMyOrders, getOrders } from '../controllers/orderController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// The root route now handles placing an order (POST) AND getting all orders (GET)
router.route('/')
  .post(protect, addOrderItems)
  .get(protect, admin, getOrders); // <-- Admin ONLY!

router.route('/myorders').get(protect, getMyOrders);

export default router;
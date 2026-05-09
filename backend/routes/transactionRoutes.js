import express from 'express';
import {
  createPosSale, getPosSales, getPosStats,
  createPurchase, getPurchases, deletePurchase,
  createReturn,
} from '../controllers/transactionController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// POS Sales
router.route('/pos').get(protect, admin, getPosSales).post(protect, admin, createPosSale);
router.route('/pos/stats').get(protect, admin, getPosStats);

// Purchases
router.route('/purchases').get(protect, admin, getPurchases).post(protect, admin, createPurchase);
router.route('/purchases/:id').delete(protect, admin, deletePurchase);

// Returns
router.route('/return').post(protect, admin, createReturn);

export default router;

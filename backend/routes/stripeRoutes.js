import express from 'express';
import { createPaymentIntent } from '../controllers/stripeController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/create-payment-intent', protect, createPaymentIntent);
// Webhook route is mounted directly in server.js (needs raw body before express.json)

export default router;

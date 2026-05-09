import asyncHandler from 'express-async-handler';
import Stripe from 'stripe';
import WalletRequest from '../models/walletRequestModel.js';
import User from '../models/userModel.js';
import Order from '../models/orderModel.js';
import Product from '../models/productModel.js';
import { PosSale } from '../models/transactionModel.js';
import { sendEmail, orderRefundApprovedEmail, orderStatusEmail } from '../utils/sendEmail.js';

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY);

// POST /api/wallet  — user submits a top-up request
export const createRequest = asyncHandler(async (req, res) => {
  const { amount, transactionRef, bankName } = req.body;
  if (!amount || !transactionRef) {
    res.status(400);
    throw new Error('Amount and transaction reference are required');
  }
  const request = await WalletRequest.create({
    user: req.user._id,
    amount: Number(amount),
    transactionRef: transactionRef.trim(),
    bankName: bankName || '',
  });
  res.status(201).json(request);
});

// GET /api/wallet/mine  — user gets their own requests
export const getMyRequests = asyncHandler(async (req, res) => {
  const requests = await WalletRequest.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(20);
  res.json(requests);
});

// GET /api/wallet  — admin: all requests, optional ?status=pending
export const getRequests = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status } : {};
  const requests = await WalletRequest.find(filter)
    .populate('user', 'name email walletBalance')
    .sort({ createdAt: -1 });
  res.json(requests);
});

// PUT /api/wallet/:id/approve  — admin approves, credits wallet
export const approveRequest = asyncHandler(async (req, res) => {
  const request = await WalletRequest.findById(req.params.id);
  if (!request) { res.status(404); throw new Error('Request not found'); }
  if (request.status !== 'pending') { res.status(400); throw new Error('Request already processed'); }

  const user = await User.findById(request.user);
  if (!user) { res.status(404); throw new Error('User not found'); }
  user.walletBalance = (user.walletBalance || 0) + request.amount;
  await user.save();

  request.status = 'approved';
  request.adminNote = req.body.adminNote || '';
  await request.save();

  // Refund flow: also cancel the order, restock, and email user
  if (request.type === 'refund' && request.orderId) {
    const order = await Order.findById(request.orderId);
    if (order && !order.isCancelled) {
      if (order.stockDecremented) {
        for (const item of order.orderItems) {
          const product = await Product.findById(item.product);
          if (product) {
            product.countInStock += item.qty;
            product.unitsSold = Math.max(0, (product.unitsSold || 0) - item.qty);
            await product.save();
          }
        }
      }
      order.isCancelled = true;
      order.cancelledAt = Date.now();
      order.orderStatus = 'cancelled';
      order.refundStatus = 'approved';
      order.refundedAt = Date.now();
      await order.save();

      try {
        const populated = await Order.findById(order._id).populate('user', 'email');
        const to = populated?.user?.email;
        if (to) {
          const refundEmail = orderRefundApprovedEmail(order, request.amount);
          sendEmail({ to, ...refundEmail }).catch(err => console.error('Refund email failed:', err.message));
          const statusEmail = orderStatusEmail(order, 'cancelled');
          sendEmail({ to, ...statusEmail }).catch(err => console.error('Cancel email failed:', err.message));
        }
      } catch { /* silent */ }
    }
    return res.json({ message: 'Refund approved and credited to wallet', newBalance: user.walletBalance, request });
  }

  // Top-up: financial transaction record so wallet top-ups appear in reports
  await PosSale.create({
    products: [],
    userId: user._id,
    totalAmount: request.amount,
    paymentMethod: 'Online',
    saleType: 'wallet_topup',
    type: 'Wallet_TopUp',
    servedBy: req.user?._id || null,
    note: `Wallet top-up for ${user.name} (${user.email}) via ${request.bankName || 'bank transfer'}. Ref: ${request.transactionRef}`,
  });

  res.json({ message: 'Request approved', newBalance: user.walletBalance, request });
});

// PUT /api/wallet/:id/reject  — admin rejects with note
export const rejectRequest = asyncHandler(async (req, res) => {
  const request = await WalletRequest.findById(req.params.id);
  if (!request) { res.status(404); throw new Error('Request not found'); }
  if (request.status !== 'pending') { res.status(400); throw new Error('Request already processed'); }

  request.status = 'rejected';
  request.adminNote = req.body.adminNote || '';
  await request.save();

  // If a refund request is rejected, mark the order's refund status accordingly
  if (request.type === 'refund' && request.orderId) {
    const order = await Order.findById(request.orderId);
    if (order) {
      order.refundStatus = 'rejected';
      await order.save();
    }
  }

  res.json({ message: 'Request rejected', request });
});

// POST /api/wallet/card-intent  — create Stripe PaymentIntent for wallet top-up
export const createCardIntent = asyncHandler(async (req, res) => {
  const { amount } = req.body;
  if (!amount || Number(amount) < 1) { res.status(400); throw new Error('Invalid amount'); }

  const stripe = getStripe();
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(Number(amount) * 100), // smallest unit (cents for USD)
    currency: 'usd',
    metadata: {
      userId: req.user._id.toString(),
      type: 'wallet_topup',
      amount: String(amount),
    },
  });

  res.json({ clientSecret: paymentIntent.client_secret });
});

// POST /api/wallet/card-confirm  — verify Stripe success and credit wallet
export const confirmCardTopup = asyncHandler(async (req, res) => {
  const { paymentIntentId, amount } = req.body;
  if (!paymentIntentId || !amount) { res.status(400); throw new Error('Missing paymentIntentId or amount'); }

  const stripe = getStripe();
  const pi = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (pi.status !== 'succeeded') {
    res.status(400);
    throw new Error('Payment not confirmed by Stripe');
  }

  if (pi.metadata?.userId !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Payment intent does not belong to this user');
  }

  // Prevent double-credit
  const already = await WalletRequest.findOne({ transactionRef: paymentIntentId });
  if (already) { res.status(400); throw new Error('Payment already credited'); }

  const user = await User.findById(req.user._id);
  user.walletBalance = (user.walletBalance || 0) + Number(amount);
  await user.save();

  // Record as auto-approved so it shows in history and prevents double-credit
  await WalletRequest.create({
    user: req.user._id,
    amount: Number(amount),
    transactionRef: paymentIntentId,
    bankName: 'Credit/Debit Card (Stripe)',
    status: 'approved',
    adminNote: 'Auto-approved via card payment',
  });

  // Create financial transaction record for reports
  await PosSale.create({
    products: [],
    userId: req.user._id,
    totalAmount: Number(amount),
    paymentMethod: 'Card',
    saleType: 'wallet_topup',
    type: 'Wallet_TopUp',
    note: `Wallet top-up via Stripe card. PI: ${paymentIntentId}`,
  });

  res.json({ newBalance: user.walletBalance, message: 'Wallet topped up successfully' });
});

import Stripe from 'stripe';
import asyncHandler from 'express-async-handler';
import Order from '../models/orderModel.js';
import { sendEmail, paymentConfirmationEmail } from '../utils/sendEmail.js';

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY);

// @route   POST /api/stripe/create-payment-intent
export const createPaymentIntent = asyncHandler(async (req, res) => {
  const stripe = getStripe();
  const { orderId } = req.body;

  const order = await Order.findById(orderId);
  if (!order) { res.status(404); throw new Error('Order not found'); }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(order.totalPrice * 100),
    currency: 'usd',
    metadata: { orderId: order._id.toString() },
  });

  // Save intent ID so the webhook can match it
  order.paymentIntentId = paymentIntent.id;
  await order.save();

  res.json({ clientSecret: paymentIntent.client_secret });
});

// @route   PUT /api/orders/:id/pay
export const updateOrderToPaid = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) { res.status(404); throw new Error('Order not found'); }

  order.isPaid = true;
  order.paidAt = Date.now();
  order.paymentMethod = 'Stripe';
  const updated = await order.save();

  const populated = await Order.findById(updated._id).populate('user', 'email');
  if (populated?.user?.email) {
    const { subject, html } = paymentConfirmationEmail(updated);
    sendEmail({ to: populated.user.email, subject, html }).catch(err =>
      console.error('Payment email failed:', err.message)
    );
  }

  res.json(updated);
});

// @route   POST /api/stripe/webhook  (raw body, no JWT)
export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    // Webhook secret not configured — skip signature check in dev
    return res.json({ received: true });
  }

  let event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object;
    try {
      // Match by saved paymentIntentId or by metadata.orderId
      const orderId = pi.metadata?.orderId;
      const order = orderId
        ? await Order.findById(orderId)
        : await Order.findOne({ paymentIntentId: pi.id });

      if (order && !order.isPaid) {
        order.isPaid = true;
        order.paidAt = Date.now();
        order.paymentMethod = 'Stripe';
        await order.save();
      }
    } catch (err) {
      console.error('Webhook order update error:', err.message);
    }
  }

  res.json({ received: true });
};

import asyncHandler from 'express-async-handler';
import Order from '../models/orderModel.js';
import Product from '../models/productModel.js';
import WalletRequest from '../models/walletRequestModel.js';
import { PosSale } from '../models/transactionModel.js';
import { sendEmail, orderConfirmationEmail, orderStatusEmail, orderRefundRequestEmail } from '../utils/sendEmail.js';

const CARD_METHODS = ['Credit Card', 'Debit Card', 'Stripe', 'Card'];

const sendStatusEmailNonBlocking = async (order, status) => {
  try {
    const populated = order.user
      ? await Order.findById(order._id).populate('user', 'email name')
      : order;
    const to = populated?.user?.email || populated?.guestEmail || order.guestEmail;
    if (!to) {
      console.warn(`[ORDER EMAIL] No recipient for order ${order._id} (status=${status})`);
      return;
    }
    const { subject, html } = orderStatusEmail(order, status);
    console.log(`[ORDER EMAIL] Sending '${status}' notification to ${to} for order ${order._id}`);
    sendEmail({ to, subject, html })
      .then(() => console.log(`[ORDER EMAIL] Sent '${status}' to ${to}`))
      .catch(err => console.error('[ORDER EMAIL] Failed:', err.message));
  } catch (err) {
    console.error('[ORDER EMAIL] Lookup failed:', err.message);
  }
};

// @route   POST /api/orders
export const addOrderItems = asyncHandler(async (req, res) => {
  const { orderItems, shippingAddress, paymentMethod, itemsPrice, shippingPrice, totalPrice, guestEmail } = req.body;

  if (!orderItems || orderItems.length === 0) {
    res.status(400);
    throw new Error('No order items found');
  }

  // Validate stock and decrement atomically — same pool as POS
  for (const item of orderItems) {
    const product = await Product.findById(item.id);
    if (!product) {
      res.status(404);
      throw new Error(`Product not found: ${item.name}`);
    }
    if (product.countInStock < item.qty) {
      res.status(400);
      throw new Error(`Insufficient stock for ${product.name} (${product.countInStock} left)`);
    }
    await Product.findByIdAndUpdate(item.id, {
      $inc: { countInStock: -item.qty, unitsSold: item.qty },
    });
  }

  const newOrderItems = orderItems.map((item) => ({
    name: item.name,
    qty: item.qty,
    image: item.image || '',
    price: item.price,
    product: item.id,
  }));

  const order = await Order.create({
    orderItems: newOrderItems,
    user: req.user?._id || null,
    guestEmail: guestEmail || '',
    shippingAddress,
    paymentMethod,
    itemsPrice,
    shippingPrice,
    totalPrice,
    stockDecremented: true,
  });

  const emailTo = req.user?.email || guestEmail;
  if (emailTo) {
    const { subject, html } = orderConfirmationEmail(order);
    sendEmail({ to: emailTo, subject, html }).catch(err =>
      console.error('Order email failed:', err.message)
    );
  }

  res.status(201).json(order);
});

// @route   GET /api/orders/myorders
export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
});

// @route   GET /api/orders  (admin, paginated)
export const getOrders = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 20;
  const { search, status, from, to } = req.query;

  const filter = {};

  // Filter by specific user (customer view)
  if (req.query.userId) filter.user = req.query.userId;

  // Date range
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = toDate;
    }
  }

  // Status filter
  if (status === 'paid')       { filter.isPaid = true; }
  else if (status === 'unpaid')     { filter.isPaid = false; filter.isCancelled = { $ne: true }; }
  else if (status === 'delivered')  { filter.isDelivered = true; }
  else if (status === 'cancelled')  { filter.isCancelled = true; }

  // User-name search: must fetch all, filter in memory, then paginate
  if (search) {
    const all = await Order.find(filter).populate('user', 'id name').sort({ createdAt: -1 });
    const q = search.toLowerCase();
    const filtered = all.filter(o =>
      (o.user?.name || '').toLowerCase().includes(q) ||
      o._id.toString().includes(q)
    );
    const total = filtered.length;
    const orders = filtered.slice((page - 1) * pageSize, page * pageSize);
    return res.json({ orders, page, pages: Math.ceil(total / pageSize), total });
  }

  const total = await Order.countDocuments(filter);
  const orders = await Order.find(filter)
    .populate('user', 'id name')
    .sort({ createdAt: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize);

  res.json({ orders, page, pages: Math.ceil(total / pageSize), total });
});

// @route   PUT /api/orders/:id/pay  (admin manual mark-as-paid)
export const markOrderPaidAdmin = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) { res.status(404); throw new Error('Order not found'); }
  order.isPaid = true;
  order.paidAt = Date.now();
  const updated = await order.save();
  sendStatusEmailNonBlocking(updated, updated.orderStatus || 'pending');
  res.json(updated);
});

// @route   PUT /api/orders/:id/deliver
export const updateOrderToDelivered = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) { res.status(404); throw new Error('Order not found'); }

  order.isDelivered = true;
  order.deliveredAt = Date.now();
  order.orderStatus = 'delivered';
  const updated = await order.save();
  sendStatusEmailNonBlocking(updated, 'delivered');
  res.json(updated);
});

// @route   PUT /api/orders/:id/cancel
export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) { res.status(404); throw new Error('Order not found'); }

  const isAdmin = req.user.role === 'admin';

  // Only the order owner or an admin can cancel
  if (order.user?.toString() !== req.user._id.toString() && !isAdmin) {
    res.status(403);
    throw new Error('Not authorised to cancel this order');
  }
  if (order.isCancelled) { res.status(400); throw new Error('Order is already cancelled'); }

  // Users cannot cancel once order moves past pending; admins can override
  const blockedStatuses = ['processing', 'shipped', 'delivered'];
  if (!isAdmin && blockedStatuses.includes(order.orderStatus)) {
    res.status(400);
    throw new Error(`Order cannot be cancelled — it is already in '${order.orderStatus}' status`);
  }

  const isCardPayment = order.isPaid && (CARD_METHODS.includes(order.paymentMethod) || !!order.paymentIntentId);

  // CARD-PAID orders → create refund request, do NOT cancel until admin approves
  if (isCardPayment) {
    if (order.refundStatus === 'pending') {
      res.status(400);
      throw new Error('Refund request already submitted, awaiting admin approval');
    }
    if (!order.user) {
      res.status(400);
      throw new Error('Card refunds require a registered account');
    }
    order.refundStatus = 'pending';
    order.refundAmount = order.totalPrice;
    await order.save();

    await WalletRequest.create({
      user: order.user,
      amount: order.totalPrice,
      transactionRef: `REFUND-${order._id}`,
      bankName: 'Card Refund (pending admin approval)',
      type: 'refund',
      orderId: order._id,
    });

    // Email user about refund request
    try {
      const populated = await Order.findById(order._id).populate('user', 'email');
      const to = populated?.user?.email;
      if (to) {
        const { subject, html } = orderRefundRequestEmail(order);
        sendEmail({ to, subject, html }).catch(err => console.error('Refund email failed:', err.message));
      }
    } catch { /* silent */ }

    return res.json({ ...order.toObject(), refundPending: true, message: 'Refund request submitted. Awaiting admin approval.' });
  }

  // Non-card path: restock + cancel immediately
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
  const updated = await order.save();
  sendStatusEmailNonBlocking(updated, 'cancelled');
  res.json(updated);
});

// @route   GET /api/orders/:id
export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) { res.status(404); throw new Error('Order not found'); }

  if (order.user?._id?.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorised to view this order');
  }
  res.json(order);
});

// @route   GET /api/orders/stats/revenue  (admin) — unified: online paid + POS
export const getRevenueStats = asyncHandler(async (req, res) => {
  const days = Math.min(Number(req.query.days) || 7, 90);
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const start = new Date();
    start.setDate(start.getDate() - i);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const [dayOrders, dayPosSales] = await Promise.all([
      Order.find({ createdAt: { $gte: start, $lt: end }, isPaid: true, isCancelled: { $ne: true } }),
      PosSale.find({ createdAt: { $gte: start, $lt: end } }),
    ]);

    const onlineRev = dayOrders.reduce((s, o) => s + o.totalPrice, 0);
    const posRev = dayPosSales.reduce((s, o) => s + o.totalAmount, 0);

    result.push({
      date: start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue: onlineRev + posRev,
      online: onlineRev,
      pos: posRev,
      orders: dayOrders.length + dayPosSales.length,
    });
  }
  res.json(result);
});

// @route   POST /api/orders/pos
export const createPOSOrder = asyncHandler(async (req, res) => {
  const { orderItems, itemsPrice, totalPrice, paymentMethod } = req.body;

  if (!orderItems || orderItems.length === 0) {
    res.status(400);
    throw new Error('No order items');
  }

  const order = await Order.create({
    orderItems,
    user: req.user._id,
    paymentMethod,
    itemsPrice,
    totalPrice,
    isPaid: true,
    paidAt: Date.now(),
    isDelivered: true,
    deliveredAt: Date.now(),
    shippingAddress: { address: 'In-Store', city: 'POS', postalCode: '00000', country: 'Store' },
  });

  res.status(201).json(order);
});

// @route   PUT /api/orders/:id/status  (admin)
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const allowed = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!allowed.includes(status)) { res.status(400); throw new Error('Invalid status'); }
  const order = await Order.findById(req.params.id);
  if (!order) { res.status(404); throw new Error('Order not found'); }
  order.orderStatus = status;
  if (status === 'delivered') { order.isDelivered = true; order.deliveredAt = Date.now(); }
  if (status === 'cancelled') { order.isCancelled = true; order.cancelledAt = Date.now(); }
  const updated = await order.save();
  sendStatusEmailNonBlocking(updated, status);
  res.json(updated);
});

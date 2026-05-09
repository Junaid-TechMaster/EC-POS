import asyncHandler from 'express-async-handler';
import { PosSale, Purchase, Return } from '../models/transactionModel.js';
import Product from '../models/productModel.js';
import { Customer } from '../models/peopleModel.js';
import { sendLowStockAlert } from '../utils/sendEmail.js';
import { logActivity } from '../utils/activityLogger.js';

// ─────────────────────────────────────────────
// POS SALES
// ─────────────────────────────────────────────

// @desc    Create a POS sale + decrement stock
// @route   POST /api/transactions/pos
// @access  Private/Admin
export const createPosSale = asyncHandler(async (req, res) => {
  const { products, customerId, totalAmount, paymentMethod, discount = 0, saleType = 'onsite', deliveryAddress = '' } = req.body;

  if (!products || products.length === 0) {
    res.status(400);
    throw new Error('No products in sale');
  }

  // Decrement countInStock + increment unitsSold for each product (atomic)
  for (const item of products) {
    const product = await Product.findById(item.product);
    if (!product) { res.status(404); throw new Error(`Product ${item.product} not found`); }
    if (product.countInStock < item.qty) { res.status(400); throw new Error(`Insufficient stock for ${product.name}`); }
    await Product.findByIdAndUpdate(item.product, {
      $inc: { countInStock: -item.qty, unitsSold: item.qty },
    });
    // Low stock email notification
    const newStock = product.countInStock - item.qty;
    if (newStock <= (product.lowStockThreshold ?? 5) && newStock >= 0) {
      sendLowStockAlert(product.name, newStock).catch(() => {});
    }
  }

  // Update customer totalSpent if provided
  if (customerId) {
    const customer = await Customer.findById(customerId);
    if (customer) {
      customer.totalSpent = (customer.totalSpent || 0) + totalAmount;
      await customer.save();
    }
  }

  const sale = await PosSale.create({
    products,
    customer: customerId || null,
    totalAmount,
    paymentMethod,
    discount,
    saleType,
    deliveryAddress: saleType === 'online' ? deliveryAddress : '',
    servedBy: req.user._id,
  });

  const populated = await PosSale.findById(sale._id)
    .populate('products.product', 'name price image')
    .populate('customer', 'name phone');

  res.status(201).json(populated);

  logActivity({ userId: req.user._id, userName: req.user.name, action: 'POS_SALE', entity: 'pos_sale', entityId: sale._id.toString(), details: { totalAmount, paymentMethod, itemCount: products.length }, ip: req.ip });
});

// @desc    Get all POS sales (with optional date filter)
// @route   GET /api/transactions/pos
// @access  Private/Admin
export const getPosSales = asyncHandler(async (req, res) => {
  const { from, to, limit = 50 } = req.query;
  const filter = {};
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }

  if (req.query.customerId) filter.customer = req.query.customerId;
  if (req.query.servedBy) filter.servedBy = req.query.servedBy;

  const sales = await PosSale.find(filter)
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .populate('products.product', 'name price image')
    .populate('customer', 'name phone');

  res.json(sales);
});

// @desc    Get POS dashboard stats
// @route   GET /api/transactions/pos/stats
// @access  Private/Admin
export const getPosStats = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [allSales, todaySales] = await Promise.all([
    PosSale.find({}),
    PosSale.find({ createdAt: { $gte: today, $lt: tomorrow } }),
  ]);

  const totalRevenue = allSales.reduce((s, sale) => s + sale.totalAmount, 0);
  const todayRevenue = todaySales.reduce((s, sale) => s + sale.totalAmount, 0);

  const paymentBreakdown = allSales.reduce((acc, sale) => {
    acc[sale.paymentMethod] = (acc[sale.paymentMethod] || 0) + sale.totalAmount;
    return acc;
  }, {});

  res.json({
    totalSales: allSales.length,
    todaySales: todaySales.length,
    totalRevenue,
    todayRevenue,
    paymentBreakdown,
  });
});

// ─────────────────────────────────────────────
// PURCHASES (Vendor → Store)
// ─────────────────────────────────────────────

// @desc    Create a purchase from vendor
// @route   POST /api/transactions/purchase
// @access  Private/Admin
export const createPurchase = asyncHandler(async (req, res) => {
  const { vendor, items, totalCost } = req.body;

  // Increment countInStock + update costPrice for each purchased item (atomic)
  for (const item of items) {
    const product = await Product.findById(item.product);
    if (product) {
      await Product.findByIdAndUpdate(item.product, { $inc: { countInStock: Number(item.qty) } });
      if (Number(item.costPrice) > 0) {
        await Product.findByIdAndUpdate(item.product, { costPrice: Number(item.costPrice) });
      }
    }
  }

  const purchase = await Purchase.create({ vendor, items, totalCost });
  res.status(201).json(purchase);
});

// @desc    Get all purchases
// @route   GET /api/transactions/purchases
// @access  Private/Admin
export const getPurchases = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.vendorId) filter.vendor = req.query.vendorId;
  const purchases = await Purchase.find(filter)
    .sort({ createdAt: -1 })
    .limit(100)
    .populate('vendor', 'name company')
    .populate('items.product', 'name price');
  res.json(purchases);
});

// @desc    Delete a purchase and reverse stock
// @route   DELETE /api/transactions/purchases/:id
// @access  Private/Admin
export const deletePurchase = asyncHandler(async (req, res) => {
  const purchase = await Purchase.findById(req.params.id);
  if (!purchase) { res.status(404); throw new Error('Purchase not found'); }

  // Reverse stock increments
  for (const item of purchase.items) {
    await Product.findByIdAndUpdate(item.product, { $inc: { countInStock: -Number(item.qty) } });
  }

  await Purchase.deleteOne({ _id: purchase._id });
  res.json({ message: 'Purchase deleted and stock reversed' });
});

// ─────────────────────────────────────────────
// RETURNS
// ─────────────────────────────────────────────

// @desc    Create a return
// @route   POST /api/transactions/return
// @access  Private/Admin
export const createReturn = asyncHandler(async (req, res) => {
  const { type, referenceId, items } = req.body;

  // Restock items for sale returns (atomic)
  if (type === 'sale_return') {
    for (const item of items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { countInStock: item.qty } });
    }
  }

  const ret = await Return.create({ type, referenceId, items });
  res.status(201).json(ret);
});

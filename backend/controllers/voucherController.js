import asyncHandler from 'express-async-handler';
import Voucher from '../models/voucherModel.js';

// @desc    Validate a voucher code
// @route   POST /api/vouchers/validate
// @access  Private
export const validateVoucher = asyncHandler(async (req, res) => {
  const { code, orderTotal } = req.body;

  const voucher = await Voucher.findOne({ code: code.toUpperCase(), isActive: true });

  if (!voucher) {
    res.status(404);
    throw new Error('Invalid or expired voucher code');
  }

  if (voucher.expiresAt && new Date() > voucher.expiresAt) {
    res.status(400);
    throw new Error('Voucher has expired');
  }

  if (voucher.maxUses > 0 && voucher.usedCount >= voucher.maxUses) {
    res.status(400);
    throw new Error('Voucher usage limit reached');
  }

  if (voucher.usedBy.includes(req.user._id)) {
    res.status(400);
    throw new Error('You have already used this voucher');
  }

  if (orderTotal < voucher.minOrderValue) {
    res.status(400);
    throw new Error(`Minimum order value for this voucher is ${voucher.minOrderValue}`);
  }

  let discount = 0;
  if (voucher.discountType === 'percentage') {
    discount = (orderTotal * voucher.discountValue) / 100;
    if (voucher.maxDiscountAmount > 0) {
      discount = Math.min(discount, voucher.maxDiscountAmount);
    }
  } else {
    discount = voucher.discountValue;
  }

  res.json({
    valid: true,
    discount: discount.toFixed(2),
    discountType: voucher.discountType,
    discountValue: voucher.discountValue,
    code: voucher.code,
    description: voucher.description,
  });
});

// @desc    Apply a voucher (mark as used after order placed)
// @route   POST /api/vouchers/apply
// @access  Private
export const applyVoucher = asyncHandler(async (req, res) => {
  const { code } = req.body;
  const voucher = await Voucher.findOne({ code: code.toUpperCase() });

  if (!voucher) {
    res.status(404);
    throw new Error('Voucher not found');
  }

  voucher.usedBy.push(req.user._id);
  voucher.usedCount += 1;
  await voucher.save();

  res.json({ message: 'Voucher applied successfully' });
});

// @desc    Get all vouchers
// @route   GET /api/vouchers
// @access  Private/Admin
export const getVouchers = asyncHandler(async (req, res) => {
  const vouchers = await Voucher.find({}).sort({ createdAt: -1 });
  res.json(vouchers);
});

// @desc    Create a voucher
// @route   POST /api/vouchers
// @access  Private/Admin
export const createVoucher = asyncHandler(async (req, res) => {
  const { code, description, discountType, discountValue, minOrderValue, maxDiscountAmount, maxUses, expiresAt } = req.body;

  const exists = await Voucher.findOne({ code: code.toUpperCase() });
  if (exists) {
    res.status(400);
    throw new Error('Voucher code already exists');
  }

  const voucher = await Voucher.create({
    code,
    description,
    discountType,
    discountValue,
    minOrderValue: minOrderValue || 0,
    maxDiscountAmount: maxDiscountAmount || 0,
    maxUses: maxUses || 0,
    expiresAt: expiresAt || null,
    createdBy: req.user._id,
  });

  res.status(201).json(voucher);
});

// @desc    Delete a voucher
// @route   DELETE /api/vouchers/:id
// @access  Private/Admin
export const deleteVoucher = asyncHandler(async (req, res) => {
  const voucher = await Voucher.findById(req.params.id);
  if (!voucher) {
    res.status(404);
    throw new Error('Voucher not found');
  }
  await Voucher.deleteOne({ _id: voucher._id });
  res.json({ message: 'Voucher removed' });
});

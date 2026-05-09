import asyncHandler from 'express-async-handler';
import CashierSession from '../models/cashierSessionModel.js';
import { PosSale } from '../models/transactionModel.js';

export const openRegister = asyncHandler(async (req, res) => {
  const existing = await CashierSession.findOne({ status: 'open', openedBy: req.user._id });
  if (existing) { res.status(400); throw new Error('You already have an open register session'); }
  const { openingCash = 0 } = req.body;
  const session = await CashierSession.create({
    openedBy: req.user._id,
    openedByName: req.user.name,
    openingCash,
  });
  res.status(201).json(session);
});

export const closeRegister = asyncHandler(async (req, res) => {
  const session = await CashierSession.findOne({ status: 'open', openedBy: req.user._id });
  if (!session) { res.status(404); throw new Error('No open session found'); }
  const { closingCash = 0, notes = '' } = req.body;

  // Tally sales since session opened
  const sales = await PosSale.find({ createdAt: { $gte: session.openedAt }, servedBy: req.user._id });
  let totalCash = 0, totalCard = 0, totalOnline = 0, totalRevenue = 0;
  sales.forEach((s) => {
    totalRevenue += s.totalAmount;
    if (s.paymentMethod === 'Cash') totalCash += s.totalAmount;
    else if (s.paymentMethod === 'Card') totalCard += s.totalAmount;
    else totalOnline += s.totalAmount;
  });

  session.closedAt = new Date();
  session.closingCash = closingCash;
  session.totalCashSales = totalCash;
  session.totalCardSales = totalCard;
  session.totalOnlineSales = totalOnline;
  session.totalSalesCount = sales.length;
  session.totalRevenue = totalRevenue;
  session.notes = notes;
  session.status = 'closed';
  await session.save();
  res.json(session);
});

export const getCurrentSession = asyncHandler(async (req, res) => {
  const session = await CashierSession.findOne({ status: 'open', openedBy: req.user._id });
  res.json(session || null);
});

export const getAllSessions = asyncHandler(async (req, res) => {
  const sessions = await CashierSession.find({}).sort({ createdAt: -1 }).limit(50).populate('openedBy', 'name');
  res.json(sessions);
});

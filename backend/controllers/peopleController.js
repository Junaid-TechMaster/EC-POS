import asyncHandler from 'express-async-handler';
import { Customer, Vendor } from '../models/peopleModel.js';
import User from '../models/userModel.js';
import Order from '../models/orderModel.js';

// ──────────── CUSTOMERS ────────────

export const getCustomers = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const filter = search
    ? { $or: [{ name: { $regex: search, $options: 'i' } }, { phone: { $regex: search, $options: 'i' } }] }
    : {};
  const customers = await Customer.find(filter).sort({ createdAt: -1 });

  const userFilter = { role: 'user', isDeleted: { $ne: true } };
  if (search) {
    userFilter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }
  const onlineUsers = await User.find(userFilter)
    .select('name email walletBalance profilePicture createdAt phone savedAddress')
    .sort({ createdAt: -1 });

  // Aggregate paid order totals per user
  const userIds = onlineUsers.map(u => u._id);
  const orderAgg = await Order.aggregate([
    { $match: { isPaid: true, isCancelled: { $ne: true }, user: { $in: userIds } } },
    { $group: { _id: '$user', total: { $sum: '$totalPrice' } } },
  ]);
  const orderTotalMap = {};
  orderAgg.forEach(o => { orderTotalMap[o._id.toString()] = o.total; });

  const onlineAsCustomers = onlineUsers.map(u => ({
    _id: u._id,
    name: u.name,
    email: u.email,
    phone: u.phone || '',
    address: u.savedAddress?.addressLine1 || '',
    totalSpent: orderTotalMap[u._id.toString()] || 0,
    source: 'online',
    walletBalance: u.walletBalance || 0,
    profilePicture: u.profilePicture || '',
    createdAt: u.createdAt,
  }));

  res.json([...customers, ...onlineAsCustomers]);
});

// @route GET /api/people/customers/:id
export const getCustomerById = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) { res.status(404); throw new Error('Customer not found'); }
  res.json(customer);
});

export const createCustomer = asyncHandler(async (req, res) => {
  const { name, phone, email, address } = req.body;
  if (!name) { res.status(400); throw new Error('Name required'); }
  const customer = await Customer.create({ name, phone, email, address });
  res.status(201).json(customer);
});

export const updateCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) { res.status(404); throw new Error('Customer not found'); }
  const { name, phone, email, address } = req.body;
  customer.name = name ?? customer.name;
  customer.phone = phone ?? customer.phone;
  customer.email = email ?? customer.email;
  customer.address = address ?? customer.address;
  const updated = await customer.save();
  res.json(updated);
});

export const deleteCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) { res.status(404); throw new Error('Customer not found'); }
  await Customer.deleteOne({ _id: customer._id });
  res.json({ message: 'Customer removed' });
});

// @route POST /api/people/customers/:id/notes
export const addCustomerNote = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) { res.status(404); throw new Error('Customer not found'); }
  const { text } = req.body;
  if (!text?.trim()) { res.status(400); throw new Error('Note text required'); }
  customer.notes.push({ text: text.trim(), addedBy: req.user.name });
  await customer.save();
  res.status(201).json(customer.notes);
});

// @route DELETE /api/people/customers/:id/notes/:noteId
export const deleteCustomerNote = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) { res.status(404); throw new Error('Customer not found'); }
  customer.notes = customer.notes.filter(n => n._id.toString() !== req.params.noteId);
  await customer.save();
  res.json(customer.notes);
});

// ──────────── VENDORS ────────────

export const getVendors = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const filter = search
    ? { $or: [{ name: { $regex: search, $options: 'i' } }, { company: { $regex: search, $options: 'i' } }] }
    : {};
  const vendors = await Vendor.find(filter).sort({ createdAt: -1 });
  res.json(vendors);
});

// @route GET /api/people/vendors/:id
export const getVendorById = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findById(req.params.id);
  if (!vendor) { res.status(404); throw new Error('Vendor not found'); }
  res.json(vendor);
});

export const createVendor = asyncHandler(async (req, res) => {
  const { name, company, phone, email, address } = req.body;
  if (!name || !company) { res.status(400); throw new Error('Name and company required'); }
  const vendor = await Vendor.create({ name, company, phone, email, address });
  res.status(201).json(vendor);
});

export const updateVendor = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findById(req.params.id);
  if (!vendor) { res.status(404); throw new Error('Vendor not found'); }
  const { name, company, phone, email, address } = req.body;
  vendor.name = name ?? vendor.name;
  vendor.company = company ?? vendor.company;
  vendor.phone = phone ?? vendor.phone;
  vendor.email = email ?? vendor.email;
  vendor.address = address ?? vendor.address;
  const updated = await vendor.save();
  res.json(updated);
});

export const deleteVendor = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findById(req.params.id);
  if (!vendor) { res.status(404); throw new Error('Vendor not found'); }
  await Vendor.deleteOne({ _id: vendor._id });
  res.json({ message: 'Vendor removed' });
});

// @route POST /api/people/vendors/:id/notes
export const addVendorNote = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findById(req.params.id);
  if (!vendor) { res.status(404); throw new Error('Vendor not found'); }
  const { text } = req.body;
  if (!text?.trim()) { res.status(400); throw new Error('Note text required'); }
  vendor.notes.push({ text: text.trim(), addedBy: req.user.name });
  await vendor.save();
  res.status(201).json(vendor.notes);
});

// @route DELETE /api/people/vendors/:id/notes/:noteId
export const deleteVendorNote = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findById(req.params.id);
  if (!vendor) { res.status(404); throw new Error('Vendor not found'); }
  vendor.notes = vendor.notes.filter(n => n._id.toString() !== req.params.noteId);
  await vendor.save();
  res.json(vendor.notes);
});

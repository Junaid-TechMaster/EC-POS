// backend/models/peopleModel.js
import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
  text: { type: String, required: true },
  addedBy: { type: String, default: 'Admin' },
}, { timestamps: true });

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String },
  email: { type: String },
  address: { type: String },
  totalSpent: { type: Number, default: 0 },
  notes: [noteSchema],
}, { timestamps: true });

const vendorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  company: { type: String, required: true },
  phone: { type: String },
  email: { type: String },
  address: { type: String },
  notes: [noteSchema],
}, { timestamps: true });

export const Customer = mongoose.model('Customer', customerSchema);
export const Vendor = mongoose.model('Vendor', vendorSchema);
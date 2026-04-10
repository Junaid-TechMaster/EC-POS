// backend/models/peopleModel.js
import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String },
  email: { type: String },
  address: { type: String },
  totalSpent: { type: Number, default: 0 }
}, { timestamps: true });

const vendorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  company: { type: String, required: true },
  phone: { type: String },
  email: { type: String },
  address: { type: String }
}, { timestamps: true });

export const Customer = mongoose.model('Customer', customerSchema);
export const Vendor = mongoose.model('Vendor', vendorSchema);
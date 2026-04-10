// backend/models/transactionModel.js
import mongoose from 'mongoose';

const posSaleSchema = new mongoose.Schema({
  products: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    qty: { type: Number, required: true },
    price: { type: Number, required: true }
  }],
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' }, // Optional (Guest checkout)
  totalAmount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['Cash', 'Card', 'Online'], required: true },
  type: { type: String, default: 'POS_Sale' }
}, { timestamps: true });

const purchaseSchema = new mongoose.Schema({
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    qty: { type: Number, required: true },
    costPrice: { type: Number, required: true }
  }],
  totalCost: { type: Number, required: true }
}, { timestamps: true });

const returnSchema = new mongoose.Schema({
  type: { type: String, enum: ['sale_return', 'purchase_return'], required: true },
  referenceId: { type: mongoose.Schema.Types.ObjectId, required: true }, // Links to POS Sale or Purchase ID
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    qty: { type: Number, required: true },
    reason: { type: String }
  }]
}, { timestamps: true });

export const PosSale = mongoose.model('PosSale', posSaleSchema);
export const Purchase = mongoose.model('Purchase', purchaseSchema);
export const Return = mongoose.model('Return', returnSchema);
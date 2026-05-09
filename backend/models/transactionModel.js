import mongoose from 'mongoose';

const posSaleSchema = new mongoose.Schema({
  products: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    qty: { type: Number },
    price: { type: Number },
    name: { type: String },
  }],
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  totalAmount: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  paymentMethod: { type: String, enum: ['Cash', 'Card', 'Online', 'JazzCash', 'Easypaisa', 'NayaPay', 'SadaPay', 'Wallet'], required: true },
  saleType: { type: String, enum: ['onsite', 'online', 'wallet_topup'], default: 'onsite' },
  deliveryAddress: { type: String, default: '' },
  servedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { type: String, default: 'POS_Sale' },
  note: { type: String, default: '' },
}, { timestamps: true });

const purchaseSchema = new mongoose.Schema({
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    qty: { type: Number, required: true },
    costPrice: { type: Number, required: true },
  }],
  totalCost: { type: Number, required: true },
}, { timestamps: true });

const returnSchema = new mongoose.Schema({
  type: { type: String, enum: ['sale_return', 'purchase_return'], required: true },
  referenceId: { type: mongoose.Schema.Types.ObjectId, required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    qty: { type: Number, required: true },
    reason: { type: String },
  }],
}, { timestamps: true });

export const PosSale = mongoose.model('PosSale', posSaleSchema);
export const Purchase = mongoose.model('Purchase', purchaseSchema);
export const Return = mongoose.model('Return', returnSchema);

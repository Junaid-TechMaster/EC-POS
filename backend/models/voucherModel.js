import mongoose from 'mongoose';

const voucherSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, default: '' },
    discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
    discountValue: { type: Number, required: true }, // % or fixed PKR/USD amount
    minOrderValue: { type: Number, default: 0 },
    maxDiscountAmount: { type: Number, default: 0 }, // 0 = no cap
    maxUses: { type: Number, default: 0 },           // 0 = unlimited
    usedCount: { type: Number, default: 0 },
    usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    expiresAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const Voucher = mongoose.model('Voucher', voucherSchema);
export default Voucher;

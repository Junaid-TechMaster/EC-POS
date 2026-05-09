import mongoose from 'mongoose';

const walletRequestSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 1 },
    transactionRef: { type: String, required: true },
    bankName: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    adminNote: { type: String, default: '' },
    type: { type: String, enum: ['topup', 'refund'], default: 'topup' },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  },
  { timestamps: true }
);

const WalletRequest = mongoose.model('WalletRequest', walletRequestSchema);
export default WalletRequest;

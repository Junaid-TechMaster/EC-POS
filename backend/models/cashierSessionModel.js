import mongoose from 'mongoose';

const cashierSessionSchema = new mongoose.Schema({
  openedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  openedByName: { type: String, required: true },
  openedAt: { type: Date, default: Date.now },
  closedAt: { type: Date, default: null },
  openingCash: { type: Number, default: 0 },
  closingCash: { type: Number, default: 0 },
  totalCashSales: { type: Number, default: 0 },
  totalCardSales: { type: Number, default: 0 },
  totalOnlineSales: { type: Number, default: 0 },
  totalSalesCount: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },
  notes: { type: String, default: '' },
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
}, { timestamps: true });

const CashierSession = mongoose.model('CashierSession', cashierSessionSchema);
export default CashierSession;

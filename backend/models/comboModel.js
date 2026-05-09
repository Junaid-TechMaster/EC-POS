import mongoose from 'mongoose';

const comboSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  image: String,
  products: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    qty: { type: Number, default: 1 },
  }],
  combinedPrice: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const Combo = mongoose.model('Combo', comboSchema);
export default Combo;

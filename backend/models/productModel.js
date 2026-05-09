import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    rating: { type: Number, required: true },
    comment: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    helpful: { type: Number, default: 0 },
    images: [{ type: String }],
  },
  { timestamps: true }
);

const variationSchema = new mongoose.Schema({
  name: { type: String, required: true },  // e.g. "500g", "1kg", "Family Pack"
  price: { type: Number, required: true },
  stock: { type: Number, default: 0 },
});

const productSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    name: { type: String, required: true },
    // Multiple images — first image is the primary display image
    images: [{ type: String }],
    image: { type: String, required: true }, // kept for backward compatibility
    brand: { type: String, required: true },
    category: { type: String, required: true },
    subcategory: { type: String, default: '' },
    subSubcategory: { type: String, default: '' },
    description: { type: String, required: true },
    detailedDescription: { type: String, default: '' },

    // Pricing
    price: { type: Number, required: true, default: 0 },       // piece price
    oldPrice: { type: Number, default: 0 },                    // original price before discount
    boxPrice: { type: Number, default: 0 },                    // price per box
    boxContents: { type: String, default: '' },                // e.g. "12 pieces per box"
    unitType: { type: String, enum: ['piece', 'box', 'both'], default: 'piece' },

    // GST / Tax
    gstApplicable: { type: Boolean, default: false },
    gstRate: { type: Number, default: 0 },                     // percentage e.g. 17

    // Variations (e.g. size, weight, colour)
    variations: [variationSchema],

    // Tags & labels
    featureTags: [{ type: String }],  // e.g. ["organic", "bestseller", "new", "hot deal"]

    // Deal / Discount timer
    dealEndsAt: { type: Date, default: null },

    // Inventory & metrics
    countInStock: { type: Number, required: true, default: 0 },
    unitsSold: { type: Number, default: 0 },
    savedByCount: { type: Number, default: 0 },

    // Reviews
    reviews: [reviewSchema],
    rating: { type: Number, required: true, default: 0 },
    numReviews: { type: Number, required: true, default: 0 },

    // Delivery
    deliveryCharge: { type: Number, default: 0 },
    freeDeliveryThreshold: { type: Number, default: 0 }, // 0 = no free delivery offer

    // SEO-friendly URL slug (auto-generated from name)
    slug: { type: String, index: true, sparse: true },

    // Cost / purchase price (updated automatically when purchase is recorded)
    costPrice: { type: Number, default: 0 },

    // Publishing & visibility
    status: { type: String, enum: ['draft', 'published', 'out_of_stock'], default: 'draft' },
    isVisible: { type: Boolean, default: true },
    discountPercent: { type: Number, default: 0 },

    // Soft delete
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },

    // Low stock management
    lowStockThreshold: { type: Number, default: 5 },

    // SKU
    sku: { type: String, default: '', index: true },

    // Admin-curated related products
    relatedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  },
  { timestamps: true }
);

const Product = mongoose.model('Product', productSchema);
export default Product;

import asyncHandler from 'express-async-handler';
import Product from '../models/productModel.js';
import User from '../models/userModel.js';
import { logActivity } from '../utils/activityLogger.js';

const slugify = (str) =>
  str.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

// @desc    Fetch all products with optional search, category, brand, price filter
// @route   GET /api/products?search=&category=&subcategory=&brand=&minPrice=&maxPrice=&tag=&sort=
export const getProducts = asyncHandler(async (req, res) => {
  const { search, category, subcategory, subSubcategory, brand, minPrice, maxPrice, tag, sort, status } = req.query;

  const filter = {};

  // Always exclude soft-deleted products
  filter.isDeleted = { $ne: true };

  // Public queries hide drafts and invisible products; admin passes ?showAll=1 to bypass
  if (!req.query.showAll) {
    filter.status = { $ne: 'draft' };
    filter.isVisible = { $ne: false };
  } else if (status) {
    filter.status = status;
  }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { brand: { $regex: search, $options: 'i' } },
    ];
  }
  if (category) filter.category = { $regex: category, $options: 'i' };
  if (subcategory) filter.subcategory = { $regex: subcategory, $options: 'i' };
  if (subSubcategory) filter.subSubcategory = { $regex: subSubcategory, $options: 'i' };
  if (brand) filter.brand = { $regex: brand, $options: 'i' };
  if (tag) filter.featureTags = { $in: [tag] };

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  let sortOption = { createdAt: -1 };
  if (sort === 'price_asc') sortOption = { price: 1 };
  else if (sort === 'price_desc') sortOption = { price: -1 };
  else if (sort === 'rating') sortOption = { rating: -1 };
  else if (sort === 'popular') sortOption = { unitsSold: -1 };

  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 12;

  const [total, products, allPrices] = await Promise.all([
    Product.countDocuments(filter),
    Product.find(filter).sort(sortOption).skip((page - 1) * pageSize).limit(pageSize),
    Product.find({}).select('price -_id'),
  ]);

  const prices = allPrices.map((p) => p.price);
  const priceRange = {
    min: prices.length ? Math.floor(Math.min(...prices)) : 0,
    max: prices.length ? Math.ceil(Math.max(...prices)) : 1000,
  };

  res.json({ products, priceRange, page, pages: Math.ceil(total / pageSize), total });
});

// @desc    Fetch distinct brand names from published products
// @route   GET /api/products/brands
export const getBrands = asyncHandler(async (req, res) => {
  const brands = await Product.distinct('brand', {
    status: { $ne: 'draft' },
    isVisible: { $ne: false },
    brand: { $ne: '' },
  });
  res.json(brands.filter(Boolean).sort());
});

// @desc    Fetch single product
// @route   GET /api/products/:id
export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
    res.json(product);
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// @desc    Fetch single product by slug
// @route   GET /api/products/slug/:slug
export const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug });
  if (product) {
    res.json(product);
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// @desc    Get related products (same category, excluding current)
// @route   GET /api/products/:id/related
export const getRelatedProducts = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  const related = await Product.find({
    category: product.category,
    _id: { $ne: product._id },
  }).limit(6);
  res.json(related);
});

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = asyncHandler(async (req, res) => {
  const product = new Product({
    name: 'Sample name',
    price: 0,
    user: req.user._id,
    image: '/images/sample.jpg',
    images: [],
    brand: 'Sample brand',
    category: 'Sample category',
    countInStock: 0,
    numReviews: 0,
    description: 'Sample description',
    gstApplicable: false,
    gstRate: 0,
    unitType: 'piece',
    deliveryCharge: 0,
    status: 'draft',
    isVisible: true,
    discountPercent: 0,
    costPrice: 0,
    relatedProducts: [],
  });

  const createdProduct = await product.save();
  createdProduct.slug = `${slugify(createdProduct.name)}-${createdProduct._id.toString().slice(-8)}`;
  await createdProduct.save();
  logActivity({ userId: req.user._id, userName: req.user.name, action: 'CREATE_PRODUCT', entity: 'product', entityId: createdProduct._id.toString(), details: { name: createdProduct.name }, ip: req.ip });
  res.status(201).json(createdProduct);
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = asyncHandler(async (req, res) => {
  const {
    name, price, oldPrice, boxPrice, boxContents, unitType,
    description, detailedDescription, image, images, brand, category,
    subcategory, subSubcategory, countInStock, costPrice,
    gstApplicable, gstRate, variations, featureTags,
    dealEndsAt, deliveryCharge, freeDeliveryThreshold,
    status, isVisible, discountPercent, relatedProducts,
  } = req.body;

  const product = await Product.findById(req.params.id);

  if (product) {
    if (name !== undefined) {
      product.name = name;
      product.slug = `${slugify(name)}-${product._id.toString().slice(-8)}`;
    } else if (!product.slug) {
      product.slug = `${slugify(product.name)}-${product._id.toString().slice(-8)}`;
    }
    product.price = price ?? product.price;
    product.oldPrice = oldPrice ?? product.oldPrice;
    product.boxPrice = boxPrice ?? product.boxPrice;
    product.boxContents = boxContents ?? product.boxContents;
    product.unitType = unitType ?? product.unitType;
    product.description = description ?? product.description;
    product.detailedDescription = detailedDescription ?? product.detailedDescription;
    product.image = image ?? product.image;
    product.images = images ?? product.images;
    product.brand = brand ?? product.brand;
    product.category = category ?? product.category;
    product.subcategory = subcategory ?? product.subcategory;
    product.subSubcategory = subSubcategory ?? product.subSubcategory;
    product.countInStock = countInStock ?? product.countInStock;
    product.gstApplicable = gstApplicable ?? product.gstApplicable;
    product.gstRate = gstRate ?? product.gstRate;
    product.variations = variations ?? product.variations;
    product.featureTags = featureTags ?? product.featureTags;
    product.dealEndsAt = dealEndsAt ?? product.dealEndsAt;
    product.deliveryCharge = deliveryCharge ?? product.deliveryCharge;
    product.freeDeliveryThreshold = freeDeliveryThreshold ?? product.freeDeliveryThreshold;
    if (status !== undefined) product.status = status;
    if (isVisible !== undefined) product.isVisible = isVisible;
    if (discountPercent !== undefined) product.discountPercent = discountPercent;
    if (relatedProducts !== undefined) product.relatedProducts = relatedProducts;
    if (costPrice !== undefined) product.costPrice = Number(costPrice);

    const updatedProduct = await product.save();
    logActivity({ userId: req.user._id, userName: req.user.name, action: 'UPDATE_PRODUCT', entity: 'product', entityId: req.params.id, details: { name: req.body.name }, ip: req.ip });
    res.json(updatedProduct);
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// @desc    Delete a product (soft delete)
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) { res.status(404); throw new Error('Product not found'); }
  await Product.findByIdAndUpdate(req.params.id, { isDeleted: true, deletedAt: new Date() });
  logActivity({ userId: req.user._id, userName: req.user.name, action: 'DELETE_PRODUCT', entity: 'product', entityId: req.params.id, details: { name: product.name }, ip: req.ip });
  res.json({ message: 'Product removed' });
});

// @desc    Get low stock products
// @route   GET /api/products/low-stock
// @access  Private/Admin
export const getLowStockProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({
    isDeleted: { $ne: true },
    $expr: { $lte: ['$countInStock', '$lowStockThreshold'] },
    status: { $ne: 'draft' },
  }).select('name countInStock lowStockThreshold sku image images price').sort({ countInStock: 1 }).limit(50);
  res.json(products);
});

// @desc    Get product by SKU
// @route   GET /api/products/sku/:sku
// @access  Public
export const getProductBySku = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ sku: req.params.sku, isDeleted: { $ne: true } });
  if (!product) { res.status(404); throw new Error('Product not found'); }
  res.json(product);
});

// @desc    Create a product review
// @route   POST /api/products/:id/reviews
// @access  Private
export const createProductReview = asyncHandler(async (req, res) => {
  const { rating, comment, images } = req.body;
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const alreadyReviewed = product.reviews.find(
    (r) => r.user.toString() === req.user._id.toString()
  );

  if (alreadyReviewed) {
    res.status(400);
    throw new Error('Product already reviewed');
  }

  const review = {
    name: req.user.name,
    rating: Number(rating),
    comment,
    user: req.user._id,
    images: Array.isArray(images) ? images : [],
  };

  product.reviews.push(review);
  product.numReviews = product.reviews.length;
  product.rating =
    product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length;

  await product.save();
  res.status(201).json({ message: 'Review added' });
});

// @desc    Get all reviews across all products
// @route   GET /api/products/reviews
// @access  Private/Admin
export const getAllReviews = asyncHandler(async (req, res) => {
  const products = await Product.find({ isDeleted: { $ne: true } })
    .select('name slug images image reviews')
    .lean();

  const reviews = [];
  products.forEach(p => {
    (p.reviews || []).forEach(r => {
      reviews.push({
        ...r,
        productId: p._id,
        productName: p.name,
        productSlug: p.slug || '',
        productImage: p.images?.[0] || p.image || '',
      });
    });
  });

  reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(reviews);
});

// @desc    Delete a review (admin)
// @route   DELETE /api/products/:id/reviews/:reviewId
// @access  Private/Admin
export const deleteReview = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) { res.status(404); throw new Error('Product not found'); }

  const idx = product.reviews.findIndex(r => r._id.toString() === req.params.reviewId);
  if (idx === -1) { res.status(404); throw new Error('Review not found'); }

  product.reviews.splice(idx, 1);
  product.numReviews = product.reviews.length;
  product.rating = product.reviews.length > 0
    ? product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length
    : 0;

  await product.save();
  res.json({ message: 'Review deleted' });
});

// @desc    Toggle save / favourite a product
// @route   PUT /api/products/:id/favorite
// @access  Private
export const toggleFavorite = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const isFav = user.favorites.includes(req.params.id);

  if (isFav) {
    user.favorites = user.favorites.filter((id) => id.toString() !== req.params.id);
    product.savedByCount = Math.max(0, product.savedByCount - 1);
  } else {
    user.favorites.push(req.params.id);
    product.savedByCount += 1;
  }

  await user.save();
  await product.save();

  res.json({ isFavorite: !isFav, savedByCount: product.savedByCount });
});

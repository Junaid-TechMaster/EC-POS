import express from 'express';
import {
  getProducts,
  getProductById,
  getProductBySlug,
  getRelatedProducts,
  getBrands,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductReview,
  toggleFavorite,
  getLowStockProducts,
  getProductBySku,
  getAllReviews,
  deleteReview,
} from '../controllers/productController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getProducts)
  .post(protect, admin, createProduct);

// Named routes MUST be before /:id to avoid param collision
router.get('/brands', getBrands);
router.get('/reviews', protect, admin, getAllReviews);
router.get('/slug/:slug', getProductBySlug);
router.get('/low-stock', protect, admin, getLowStockProducts);
router.get('/sku/:sku', getProductBySku);

router.route('/:id')
  .get(getProductById)
  .put(protect, admin, updateProduct)
  .delete(protect, admin, deleteProduct);

router.route('/:id/related').get(getRelatedProducts);
router.route('/:id/reviews').post(protect, createProductReview);
router.route('/:id/reviews/:reviewId').delete(protect, admin, deleteReview);
router.route('/:id/favorite').put(protect, toggleFavorite);

export default router;

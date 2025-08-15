import express from 'express';
import {
  getCollections,
  getCollection,
  getProductsByCollection,
  createCollection,
  updateCollection,
  deleteCollection,
  getCollectionStats
} from '../controllers/collectionController.js';
import {
  getProducts,
  getProductById,
  getSearchSuggestions,
  getFilterOptions,
  createProduct,
  updateProduct,
  deleteProduct,
  getFeaturedProducts
} from '../controllers/productController.js';
import { authenticateToken } from '../middleware/auth.js';
import { checkRole } from '../middleware/roleCheck.js';

const router = express.Router();

// Public collection routes
router.get('/collections', getCollections);
router.get('/collections/:identifier', getCollection);
router.get('/collections/:name/products', getProductsByCollection);

// Public product routes
router.get('/products', getProducts);
router.get('/products/featured', getFeaturedProducts);
router.get('/products/:id', getProductById);
router.get('/search/suggestions', getSearchSuggestions);
router.get('/filter-options', getFilterOptions);

// Admin collection routes
router.post('/admin/collections', authenticateToken, checkRole(['ADMIN', 'SUPER_ADMIN']), createCollection);
router.put('/admin/collections/:id', authenticateToken, checkRole(['ADMIN', 'SUPER_ADMIN']), updateCollection);
router.delete('/admin/collections/:id', authenticateToken, checkRole(['ADMIN', 'SUPER_ADMIN']), deleteCollection);
router.get('/admin/collections/:id/stats', authenticateToken, checkRole(['ADMIN', 'SUPER_ADMIN']), getCollectionStats);

// Admin product routes
router.post('/admin/products', authenticateToken, checkRole(['ADMIN', 'SUPER_ADMIN']), createProduct);
router.put('/admin/products/:id', authenticateToken, checkRole(['ADMIN', 'SUPER_ADMIN']), updateProduct);
router.delete('/admin/products/:id', authenticateToken, checkRole(['ADMIN', 'SUPER_ADMIN']), deleteProduct);

export default router;

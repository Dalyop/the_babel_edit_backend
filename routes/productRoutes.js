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
import { uploadSingle, uploadMultiple, handleUploadError } from '../config/cloudinary.js';

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

// Image upload routes (Admin only)
router.post('/admin/products/upload-image', 
  authenticateToken, 
  checkRole(['ADMIN', 'SUPER_ADMIN']), 
  uploadSingle, 
  handleUploadError, 
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    res.json({ 
      message: 'Image uploaded successfully',
      imageUrl: req.file.path,
      publicId: req.file.filename
    });
  }
);

router.post('/admin/products/upload-images', 
  authenticateToken, 
  checkRole(['ADMIN', 'SUPER_ADMIN']), 
  uploadMultiple, 
  handleUploadError, 
  (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }
    const images = req.files.map(file => ({
      url: file.path,
      publicId: file.filename
    }));
    res.json({ 
      message: 'Images uploaded successfully',
      images
    });
  }
);

// Admin collection routes
router.post('/admin/collections', authenticateToken, checkRole(['ADMIN', 'SUPER_ADMIN']), createCollection);
router.put('/admin/collections/:id', authenticateToken, checkRole(['ADMIN', 'SUPER_ADMIN']), updateCollection);
router.delete('/admin/collections/:id', authenticateToken, checkRole(['ADMIN', 'SUPER_ADMIN']), deleteCollection);
router.get('/admin/collections/:id/stats', authenticateToken, checkRole(['ADMIN', 'SUPER_ADMIN']), getCollectionStats);

// Admin product routes
router.get('/admin/products', authenticateToken, checkRole(['ADMIN', 'SUPER_ADMIN']), getProducts);
router.post('/admin/products', authenticateToken, checkRole(['ADMIN', 'SUPER_ADMIN']), createProduct);
router.put('/admin/products/:id', authenticateToken, checkRole(['ADMIN', 'SUPER_ADMIN']), updateProduct);
router.delete('/admin/products/:id', authenticateToken, checkRole(['ADMIN', 'SUPER_ADMIN']), deleteProduct);

export default router;
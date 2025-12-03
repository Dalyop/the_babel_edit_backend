import express from 'express';
import { createReview, getReviews, deleteReview } from '../controllers/reviewController.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/', authenticateToken, createReview);

// Admin routes
router.get('/', authenticateToken, isAdmin, getReviews);
router.delete('/:reviewId', authenticateToken, isAdmin, deleteReview);

export default router;

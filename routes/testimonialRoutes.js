import express from 'express';
import { getFeaturedTestimonials, addTestimonial, removeTestimonial, getPublicTestimonials } from '../controllers/testimonialController.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public route to get full testimonial data
router.get('/public', getPublicTestimonials);

// Admin routes for managing testimonials
router.get('/', authenticateToken, isAdmin, getFeaturedTestimonials);
router.post('/', authenticateToken, isAdmin, addTestimonial);
router.delete('/:reviewId', authenticateToken, isAdmin, removeTestimonial);

export default router;

import express from "express";
import { createFeedback, getAllFeedbacks, updateFeedback, deleteFeedback, getFeaturedFeedbacks } from '../controllers/feedbackController.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/featured', getFeaturedFeedbacks);
router.post('/', authenticateToken, createFeedback);
router.get('/', authenticateToken, isAdmin, getAllFeedbacks);
router.put('/:id', authenticateToken, isAdmin, updateFeedback);
router.delete('/:id', authenticateToken, isAdmin, deleteFeedback);

export default router;
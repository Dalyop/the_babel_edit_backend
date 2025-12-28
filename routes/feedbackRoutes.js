const express = require('express');
const router = express.Router();
const { createFeedback, getAllFeedbacks, updateFeedback, deleteFeedback, getFeaturedFeedbacks } = require('../controllers/feedbackController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

router.get('/featured', getFeaturedFeedbacks);
router.post('/', authenticateToken, createFeedback);
router.get('/', authenticateToken, isAdmin, getAllFeedbacks);
router.put('/:id', authenticateToken, isAdmin, updateFeedback);
router.delete('/:id', authenticateToken, isAdmin, deleteFeedback);

module.exports = router;


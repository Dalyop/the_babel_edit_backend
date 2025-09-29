import express from 'express';
import {
  createOrder,
  createOrderFromCheckout, 
  getUserOrders,
  getOrder,
  cancelOrder,
  getAllOrders,
  updateOrderStatus
} from '../controllers/orderController.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// User routes (require authentication)
router.post('/', authenticateToken, createOrderFromCheckout); 
router.post('/from-cart', authenticateToken, createOrder); 
router.get('/', authenticateToken, getUserOrders);
router.get('/:orderId', authenticateToken, getOrder);
router.patch('/:orderId/cancel', authenticateToken, cancelOrder);

// Admin routes (require admin role)
router.get('/admin/all', authenticateToken, isAdmin, getAllOrders);
router.patch('/admin/:orderId/status', authenticateToken, isAdmin, updateOrderStatus);

export default router;
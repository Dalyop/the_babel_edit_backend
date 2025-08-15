import express from 'express';
import { 
  createOrder, 
  getUserOrders, 
  getOrder, 
  cancelOrder, 
  getAllOrders, 
  updateOrderStatus 
} from '../controllers/orderController.js';
import { authenticateToken } from '../middleware/auth.js';
import { checkRole } from '../middleware/roleCheck.js';

const router = express.Router();

// User routes (require authentication)
router.use(authenticateToken);

// Customer order routes
router.post('/', createOrder);
router.get('/my-orders', getUserOrders);
router.get('/:orderId', getOrder);
router.put('/:orderId/cancel', cancelOrder);

// Admin routes (require admin role)
router.get('/admin/all', checkRole(['ADMIN', 'SUPER_ADMIN']), getAllOrders);
router.put('/admin/:orderId/status', checkRole(['ADMIN', 'SUPER_ADMIN']), updateOrderStatus);

export default router;

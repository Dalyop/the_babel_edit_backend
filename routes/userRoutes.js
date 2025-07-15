import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { register, login, getProfile, updateProfile } from '../controllers/userController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Local authentication routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, updateProfile);

// Google OAuth routes
router.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/auth/google/callback',
  passport.authenticate('google', { session: false }),
  (req, res) => {
    try {
      // Generate JWT token
      const token = jwt.sign(
        { id: req.user.id, email: req.user.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Remove password from user object
      const { password, ...userWithoutPassword } = req.user;

      // Redirect to frontend with token and user data
      const userData = encodeURIComponent(JSON.stringify({
        user: userWithoutPassword,
        token
      }));

      // You can customize this redirect URL based on your frontend
      res.redirect(`${process.env.FRONTEND_URL}/auth/callback?data=${userData}`);
    } catch (error) {
      console.error('Google callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/auth/error`);
    }
  }
);

export default router;

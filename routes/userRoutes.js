import express from 'express';
import passport from 'passport';
import { 
  register, 
  login, 
  refreshToken, 
  verify, 
  logout, 
  getProfile, 
  updateProfile,
  getAllUsers,
  updateUserRole,
  deleteUser,
  getUserStats
} from '../controllers/userController.js';
import { authenticateToken } from '../middleware/auth.js';
import { checkRole } from '../middleware/roleCheck.js';
import { generateAccessToken, generateRefreshToken, setRefreshTokenCookie } from '../utils/authUtils.js';

const router = express.Router();

// Local authentication routes
router.post('/register', register);
router.post('/login', login);

// Token management routes
router.post('/refresh', refreshToken);
router.post('/logout', logout);

// Protected routes
router.get('/verify', authenticateToken, verify);
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);

// Google OAuth routes
router.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/auth/google/callback',
  passport.authenticate('google', { session: false }),
  async (req, res) => {
    try {
      // req.user now contains { user, accessToken, refreshToken }
      const { user, accessToken, refreshToken } = req.user;

      // Set refresh token as httpOnly cookie
      setRefreshTokenCookie(res, refreshToken);

      // Remove sensitive data from user object
      const { password, refreshToken: _, ...userWithoutSensitiveData } = user;

      // Create the response data
      const authData = {
        user: userWithoutSensitiveData,
        accessToken // Send access token to frontend
      };

      const userData = encodeURIComponent(JSON.stringify(authData));

      // Redirect to frontend with auth data
      res.redirect(`${process.env.FRONTEND_URL}/auth/callback?data=${userData}`);
      
    } catch (error) {
      console.error('Google callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/auth/error`);
    }
  }
);

// Optional: Add a route to handle the Google auth success on frontend
router.get('/auth/google/success', (req, res) => {
  // This could be used if you want to handle the redirect differently
  res.json({ message: 'Google authentication successful' });
});

// Admin user management routes
router.get('/admin/users', authenticateToken, checkRole(['ADMIN', 'SUPER_ADMIN']), getAllUsers);
router.put('/admin/users/:userId/role', authenticateToken, checkRole(['ADMIN', 'SUPER_ADMIN']), updateUserRole);
router.delete('/admin/users/:userId', authenticateToken, checkRole(['ADMIN', 'SUPER_ADMIN']), deleteUser);
router.get('/admin/users/stats', authenticateToken, checkRole(['ADMIN', 'SUPER_ADMIN']), getUserStats);

export default router;

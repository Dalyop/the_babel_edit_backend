import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../prismaClient.js';

import { generateAccessToken, generateRefreshToken, setRefreshTokenCookie } from '../utils/authUtils.js';

// Register new user
export const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, isAgree } = req.body;

    // Validate input
    if (!firstName || !lastName || !email || !password || isAgree === false) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        isVerified: false,
        isAgree: false
      }
    });

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token in database
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: refreshToken },
    });

    // Set refresh token as httpOnly cookie
    setRefreshTokenCookie(res, refreshToken);

    // Remove password from response
    const { password: _, refreshToken: __, ...userWithoutSensitiveData } = user;

    res.status(201).json({
      message: 'User registered successfully',
      accessToken, // Frontend expects this
      user: userWithoutSensitiveData
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user has password (Google OAuth users don't have passwords)
    if (!user.password) {
      return res.status(401).json({
        message: 'This account was created with Google. Please use Google login.'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store the refresh token in database
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: refreshToken },
    });

    // Set the refresh token as httpOnly cookie
    setRefreshTokenCookie(res, refreshToken);

    // Remove sensitive data from response
    const { password: _, refreshToken: __, ...userWithoutSensitiveData } = user;

    res.json({
      message: 'Login successful',
      accessToken,
      user: userWithoutSensitiveData
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Refresh token endpoint
export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token not found' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    
    // Find user and verify stored refresh token
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // Update stored refresh token
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken },
    });

    // Set new refresh token cookie
    setRefreshTokenCookie(res, newRefreshToken);

    res.json({
      accessToken: newAccessToken
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
    
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Verify token endpoint
export const verify = async (req, res) => {
  try {
    // User data is attached by the authenticateToken middleware
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        googleId: true,
        avatar: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
        role: true
      }
    });
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Logout endpoint
export const logout = async (req, res) => {
  try {
    // Clear refresh token from database if user is authenticated
    if (req.user?.userId) {
      await prisma.user.update({
        where: { id: req.user.userId },
        data: { refreshToken: null },
      });
    }

    // Clear refresh token cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get current user profile
export const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        googleId: true,
        avatar: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        firstName,
        lastName
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        googleId: true,
        avatar: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update user avatar
export const updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided.' });
    }

    const avatarUrl = req.file.path;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        avatar: avatarUrl,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        googleId: true,
        avatar: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
        role: true
      },
    });

    res.json({
      message: 'Avatar updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update avatar error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Admin: Get all users
export const getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      role,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build where clause
    const where = {};

    // Search functionality
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Role filter
    if (role && ['USER', 'ADMIN', 'SUPER_ADMIN'].includes(role.toUpperCase())) {
      where.role = role.toUpperCase();
    }

    // Build orderBy clause
    const validSortFields = ['email', 'firstName', 'lastName', 'createdAt', 'role'];
    const orderBy = {};

    if (validSortFields.includes(sortBy)) {
      orderBy[sortBy] = sortOrder === 'asc' ? 'asc' : 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    // Execute query
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isVerified: true,
          createdAt: true,
          updatedAt: true,
          avatar: true
        },
        orderBy,
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      filters: {
        search,
        role
      },
      sorting: {
        sortBy,
        sortOrder
      }
    });

  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

// Admin: Update user role
export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    // Validate role
    if (!['USER', 'ADMIN', 'SUPER_ADMIN'].includes(role.toUpperCase())) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Prevent self-demotion for super admin
    if (req.user.userId === userId && req.userRole === 'SUPER_ADMIN' && role.toUpperCase() !== 'SUPER_ADMIN') {
      return res.status(400).json({ message: 'Cannot demote yourself from SUPER_ADMIN role' });
    }

    // Only super admin can promote to super admin
    if (role.toUpperCase() === 'SUPER_ADMIN' && req.userRole !== 'SUPER_ADMIN') {
      return res.status(403).json({ message: 'Only SUPER_ADMIN can promote users to SUPER_ADMIN' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: role.toUpperCase() },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      message: 'User role updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Update user role error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(500).json({ message: 'Failed to update user role' });
  }
};

// Admin: Delete user
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Prevent self-deletion
    if (req.user.userId === userId) {
      return res.status(400).json({ message: 'Cannot delete yourself' });
    }

    // Get user to check role
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!userToDelete) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only super admin can delete admin/super admin users
    if (['ADMIN', 'SUPER_ADMIN'].includes(userToDelete.role) && req.userRole !== 'SUPER_ADMIN') {
      return res.status(403).json({ message: 'Only SUPER_ADMIN can delete admin users' });
    }

    // Delete user (this will cascade delete related records)
    await prisma.user.delete({
      where: { id: userId }
    });

    res.json({ message: 'User deleted successfully' });

  } catch (error) {
    console.error('Delete user error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(500).json({ message: 'Failed to delete user' });
  }
};

// Admin: Get user statistics
export const getUserStats = async (req, res) => {
  try {
    const [totalUsers, usersByRole, recentUsers] = await Promise.all([
      // Total users count
      prisma.user.count(),
      
      // Users by role
      prisma.user.groupBy({
        by: ['role'],
        _count: {
          id: true
        }
      }),
      
      // Recent users (last 30 days)
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    res.json({
      totalUsers,
      usersByRole: usersByRole.map(group => ({
        role: group.role,
        count: group._count.id
      })),
      recentUsers
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ message: 'Failed to fetch user statistics' });
  }
};

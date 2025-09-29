import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import passport from 'passport';
import session from 'express-session';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import prisma from './prismaClient.js';

// Only load .env in development
// if (process.env.NODE_ENV !== 'production') {
// }
dotenv.config();

// Import routes
import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';
import cartRoutes from './routes/cartRoute.js';
import orderRoutes from './routes/orderRoutes.js';
import addressRoutes from './routes/addressRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import passwordResetRoutes from './routes/passwordResetRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';

// Import passport config
import './config/passport.js';

dotenv.config();

const app = express();


// Security middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL.replace('http:', 'https:'),
  process.env.FRONTEND_URL_PRODUCTION
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Session configuration (updated for production)
app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  store: process.env.NODE_ENV === 'production'
    ? new PrismaSessionStore(prisma, {
      checkPeriod: 2 * 60 * 1000, // 2 minutes
      dbRecordIdIsSessionId: true,
    })
    : undefined, // Use memory store in development
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Replace your current health check with this enhanced version
app.get('/api/health', async (req, res) => {
  try {
    // Import prisma at the top of app.js
    const { default: prisma } = await import('./prismaClient.js');

    // Test database connection
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: 'OK',
      database: 'connected',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0'
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
// Test Stripe endpoint
app.get('/api/test-stripe', async (req, res) => {
  try {
    console.log('Testing Stripe connection...');
    console.log('Secret key exists:', !!process.env.STRIPE_SECRET_KEY);
    console.log('Secret key starts with:', process.env.STRIPE_SECRET_KEY?.substring(0, 7));

    // Import stripe dynamically
    const { default: stripe } = await import('./config/stripe.js');

    const balance = await stripe.balance.retrieve();

    res.json({
      status: 'success',
      message: 'Stripe is configured correctly',
      keyPrefix: process.env.STRIPE_SECRET_KEY.substring(0, 12) + '...',
      available: balance.available,
      pending: balance.pending
    });
  } catch (error) {
    console.error('Stripe test failed:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      type: error.type,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// API routes
app.use('/api/auth', userRoutes);
app.use('/api', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/password', passwordResetRoutes);
app.use('/api/payments', paymentRoutes);

// 404 handler
app.use('/*splat', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handlerg
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';

  res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

export default app;

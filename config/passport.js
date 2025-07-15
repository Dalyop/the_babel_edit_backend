import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

// Generate JWT token
const generateToken = (userId, email) => {
  return jwt.sign(
    { id: userId, email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.NODE_ENV === 'production' 
    ? `${process.env.SERVER_URL}/api/users/auth/google/callback`
    : "/api/users/auth/google/callback",
    scope: [ 'profile', 'email']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user exists by Google ID
    let user = await prisma.user.findUnique({
      where: { googleId: profile.id }
    });

    if (!user) {
      // Check if user exists by email
      const email = profile.emails?.[0]?.value;
      if (!email) {
        return done(new Error('No email found in Google profile'), null);
      }

      user = await prisma.user.findUnique({
        where: { email }
      });

      if (user) {
        // Update existing user with Google ID
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: profile.id,
            isVerified: true,
            avatar: profile.photos?.[0]?.value || null
          }
        });
      } else {
        // Create new user
        user = await prisma.user.create({
          data: {
            email,
            firstName: profile.name?.givenName || '',
            lastName: profile.name?.familyName || '',
            googleId: profile.id,
            avatar: profile.photos?.[0]?.value || null,
            isVerified: true
          }
        });
      }
    }

    return done(null, user);
  } catch (error) {
    console.error('Google OAuth error:', error);
    return done(error, null);
  }
}));

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id }
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export { generateToken };
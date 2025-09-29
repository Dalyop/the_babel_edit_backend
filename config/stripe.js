import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();

if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
});

console.log('✅ Stripe initialized with key:', stripeSecretKey.substring(0, 12) + '...');

export default stripe;
import stripe from '../config/stripe.js';
import prisma from '../prismaClient.js';

export const createPaymentIntent = async (req, res) => {
  try {
    console.log('=== CREATE PAYMENT INTENT ===');
    console.log('User:', req.user);
    console.log('Body:', req.body);

    const userId = req.user?.userId;
    const { orderId } = req.body;

    if (!userId) {
      console.error('❌ No user ID');
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!orderId) {
      console.error('❌ No order ID');
      return res.status(400).json({ message: 'Order ID is required' });
    }

    // Fetch order
    console.log('🔍 Fetching order:', orderId);
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!order) {
      console.error('❌ Order not found');
      return res.status(404).json({ message: 'Order not found' });
    }

    console.log('✅ Order found:', {
      id: order.id,
      total: order.total,
      status: order.status
    });

    // Validate amount
    if (!order.total || order.total <= 0) {
      console.error('❌ Invalid amount:', order.total);
      return res.status(400).json({ message: 'Invalid order amount' });
    }

    // Check if already paid
    if (order.paymentStatus === 'PAID') {
      console.log('⚠️ Already paid');
      return res.status(400).json({ message: 'Order already paid' });
    }

    // Create payment intent
    const amountInCents = Math.round(order.total * 100);
    console.log('💳 Creating payment intent for $' + order.total + ' (' + amountInCents + ' cents)');

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        userId: userId
      },
      description: `Order ${order.orderNumber}`,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    console.log('✅ Payment intent created:', paymentIntent.id);

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });

  } catch (error) {
    console.error('=== PAYMENT INTENT ERROR ===');
    console.error('Type:', error.constructor.name);
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);

    if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({ 
        message: 'Invalid payment request',
        error: error.message 
      });
    }

    if (error.type === 'StripeAuthenticationError') {
      return res.status(500).json({ 
        message: 'Stripe authentication failed',
        error: error.message 
      });
    }

    res.status(500).json({ 
      message: 'Error creating payment intent',
      error: error.message
    });
  }
};

export const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  console.log('=== WEBHOOK RECEIVED ===');

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    console.log('✅ Webhook verified:', event.type);
  } catch (err) {
    console.error('❌ Webhook verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        await handleSuccessfulPayment(paymentIntent);
        break;
      
      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        await handleFailedPayment(failedPayment);
        break;
      
      default:
        console.log(`ℹ️ Unhandled event: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({ message: 'Webhook handling error' });
  }
};

const handleSuccessfulPayment = async (paymentIntent) => {
  const { orderId } = paymentIntent.metadata;
  
  console.log('✅ Payment succeeded for order:', orderId);

  try {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        paymentMethod: 'STRIPE'
      }
    });
    console.log('✅ Order updated');
  } catch (error) {
    console.error('❌ Failed to update order:', error);
    throw error;
  }
};

const handleFailedPayment = async (paymentIntent) => {
  const { orderId } = paymentIntent.metadata;
  
  console.log('❌ Payment failed for order:', orderId);

  try {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'PENDING',
        paymentStatus: 'FAILED'
      }
    });
    console.log('✅ Order marked as failed');
  } catch (error) {
    console.error('❌ Failed to update order:', error);
    throw error;
  }
};
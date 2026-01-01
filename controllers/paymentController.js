import stripe from '../config/stripe.js';
import prisma from '../prismaClient.js';
import { sendEmail } from '../utils/emailService.js';
import fs from 'fs/promises';
import path from 'path';

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
    const MIN_AMOUNT = 50; // For USD, the minimum is $0.50

    if (isNaN(amountInCents) || amountInCents < MIN_AMOUNT) {
      console.error('❌ Invalid amount for payment intent:', amountInCents);
      return res.status(400).json({ message: `Invalid calculated amount for payment: $${(amountInCents/100).toFixed(2)}. Must be at least $0.50.` });
    }

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

    // Link payment intent to order
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentIntentId: paymentIntent.id },
    });

    console.log('✅ Order updated with payment intent ID');

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
      error: error
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
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        paymentMethod: 'STRIPE'
      },
      include: {
        user: true,
        items: {
          include: {
            product: true,
          },
        },
        shippingAddress: true,
      },
    });
    console.log('✅ Order updated in DB');

    // Send confirmation emails
    await sendConfirmationEmails(updatedOrder);

  } catch (error) {
    console.error('❌ Failed to update order or send emails:', error);
    // Even if emails fail, the payment was successful. Don't throw error back to Stripe.
    // Log it for manual intervention.
  }
};

const sendConfirmationEmails = async (order) => {
  try {
    console.log(`📧 Sending confirmation emails for order ${order.orderNumber}`);
    const customerTemplatePath = path.resolve(process.cwd(), 'templates', 'customerConfirmation.html');
    const companyTemplatePath = path.resolve(process.cwd(), 'templates', 'companyNotification.html');

    const [customerHtml, companyHtml] = await Promise.all([
      fs.readFile(customerTemplatePath, 'utf-8'),
      fs.readFile(companyTemplatePath, 'utf-8')
    ]);
    
    // --- Common data ---
    const formatCurrency = (amount) => `$${amount.toFixed(2)}`;
    const customerName = `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() || order.user.email;
    const orderDetailsUrl = `${process.env.FRONTEND_URL}/orders/${order.id}`;
    const adminOrderUrl = `${process.env.FRONTEND_URL}/admin/orders/${order.id}`;

    // --- Customer Email ---
    const customerOrderItems = order.items.map(item => `
      <tr>
        <td>${item.product.name}</td>
        <td>${item.quantity}</td>
        <td>${formatCurrency(item.price * item.quantity)}</td>
      </tr>
    `).join('');

    let finalCustomerHtml = customerHtml
      .replace('{{customerName}}', customerName)
      .replace('{{orderNumber}}', order.orderNumber)
      .replace('{{orderItems}}', customerOrderItems)
      .replace('{{subtotal}}', formatCurrency(order.subtotal))
      .replace('{{shipping}}', formatCurrency(order.shipping))
      .replace('{{tax}}', formatCurrency(order.tax))
      .replace('{{total}}', formatCurrency(order.total))
      .replace('{{orderDetailsUrl}}', orderDetailsUrl);

    await sendEmail({
      to: order.user.email,
      subject: `Your The Babel Edit Order Confirmation (#${order.orderNumber})`,
      html: finalCustomerHtml
    });
    console.log(`✅ Customer email sent to ${order.user.email}`);

    // --- Company Email ---
    const companyOrderItems = order.items.map(item => `
      <tr>
        <td>${item.product.sku || 'N/A'}</td>
        <td>${item.product.name}</td>
        <td>${item.quantity}</td>
        <td>${formatCurrency(item.price)}</td>
      </tr>
    `).join('');
    
    const shippingAddressHtml = order.shippingAddress
      ? `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}<br>
         ${order.shippingAddress.address1}<br>
         ${order.shippingAddress.address2 || ''}<br>
         ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}<br>
         ${order.shippingAddress.country}`
      : 'N/A';

    let finalCompanyHtml = companyHtml
      .replace('{{orderNumber}}', order.orderNumber)
      .replace('{{customerName}}', customerName)
      .replace('{{customerEmail}}', order.user.email)
      .replace('{{total}}', formatCurrency(order.total))
      .replace('{{orderItems}}', companyOrderItems)
      .replace('{{shippingAddress}}', shippingAddressHtml)
      .replace('{{adminOrderUrl}}', adminOrderUrl);

    await sendEmail({
      to: process.env.COMPANY_EMAIL || 'support@thebabeledit.com',
      subject: `New Order Received: #${order.orderNumber}`,
      html: finalCompanyHtml
    });
    console.log(`✅ Company notification email sent.`);

  } catch (error) {
    console.error(`❌ Error sending confirmation emails for order ${order.orderNumber}:`, error);
    // Log this error, but don't let it crash the webhook response
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
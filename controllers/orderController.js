import prisma from '../prismaClient.js';

// Generate unique order number
const generateOrderNumber = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${timestamp}-${random}`;
};

// Create order from cart
export const createOrder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { 
      shippingAddressId, 
      paymentMethod, 
      notes,
      promoCode 
    } = req.body;

    // Get user's cart with items
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Validate shipping address
    const shippingAddress = await prisma.address.findFirst({
      where: { 
        id: shippingAddressId,
        userId 
      }
    });

    if (!shippingAddress) {
      return res.status(400).json({ message: 'Invalid shipping address' });
    }

    // Check stock availability for all items
    for (const item of cart.items) {
      if (item.product.stock < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${item.product.name}` 
        });
      }
    }

    // Calculate totals
    const subtotal = cart.items.reduce((sum, item) => 
      sum + (item.product.price * item.quantity), 0
    );

    const tax = subtotal * 0.08; // 8% tax rate
    const shipping = subtotal > 100 ? 0 : 10; // Free shipping over $100
    let discount = 0;

    // Apply promo code if provided
    if (promoCode) {
      // Simple promo code logic - you can expand this
      if (promoCode === 'SAVE10') {
        discount = subtotal * 0.10;
      } else if (promoCode === 'FREESHIP') {
        discount = shipping;
      }
    }

    const total = subtotal + tax + shipping - discount;

    // Create order in transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Create order
      const order = await prisma.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId,
          status: 'PENDING',
          paymentStatus: 'PENDING',
          paymentMethod,
          subtotal,
          tax,
          shipping,
          discount,
          total,
          shippingAddressId,
          notes
        }
      });

      // Create order items and update product stock
      for (const item of cart.items) {
        await prisma.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price,
            size: item.size,
            color: item.color
          }
        });

        // Reduce product stock
        await prisma.product.update({
          where: { id: item.productId },
          data: { 
            stock: { 
              decrement: item.quantity 
            } 
          }
        });
      }

      // Clear cart
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id }
      });

      return order;
    });

    res.status(201).json({
      message: 'Order created successfully',
      order: {
        id: result.id,
        orderNumber: result.orderNumber,
        total: result.total,
        status: result.status
      }
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Failed to create order' });
  }
};

// Get user's orders
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10, status } = req.query;

    const where = { userId };
    if (status) {
      where.status = status.toUpperCase();
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                imageUrl: true
              }
            }
          }
        },
        shippingAddress: true
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * parseInt(limit),
      take: parseInt(limit)
    });

    const total = await prisma.order.count({ where });

    res.json({
      orders: orders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        total: order.total,
        itemCount: order.items.length,
        createdAt: order.createdAt,
        items: order.items.map(item => ({
          id: item.id,
          productId: item.productId,
          name: item.product.name,
          imageUrl: item.product.imageUrl,
          quantity: item.quantity,
          price: item.price,
          size: item.size,
          color: item.color
        }))
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
};

// Get specific order
export const getOrder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { orderId } = req.params;

    const order = await prisma.order.findFirst({
      where: { 
        id: orderId,
        userId 
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                description: true
              }
            }
          }
        },
        shippingAddress: true
      }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      subtotal: order.subtotal,
      tax: order.tax,
      shipping: order.shipping,
      discount: order.discount,
      total: order.total,
      trackingNumber: order.trackingNumber,
      estimatedDelivery: order.estimatedDelivery,
      notes: order.notes,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      shippingAddress: order.shippingAddress,
      items: order.items.map(item => ({
        id: item.id,
        productId: item.productId,
        name: item.product.name,
        description: item.product.description,
        imageUrl: item.product.imageUrl,
        quantity: item.quantity,
        price: item.price,
        size: item.size,
        color: item.color,
        subtotal: item.price * item.quantity
      }))
    });

  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Failed to fetch order' });
  }
};

// Cancel order (only if pending)
export const cancelOrder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { orderId } = req.params;

    const order = await prisma.order.findFirst({
      where: { 
        id: orderId,
        userId 
      },
      include: {
        items: true
      }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
      return res.status(400).json({ 
        message: 'Order cannot be cancelled at this stage' 
      });
    }

    await prisma.$transaction(async (prisma) => {
      // Update order status
      await prisma.order.update({
        where: { id: orderId },
        data: { 
          status: 'CANCELLED',
          paymentStatus: 'REFUNDED'
        }
      });

      // Restore product stock
      for (const item of order.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { 
            stock: { 
              increment: item.quantity 
            } 
          }
        });
      }
    });

    res.json({ message: 'Order cancelled successfully' });

  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ message: 'Failed to cancel order' });
  }
};

// Admin: Get all orders
export const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;

    let where = {};
    if (status) {
      where.status = status.toUpperCase();
    }
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
                imageUrl: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * parseInt(limit),
      take: parseInt(limit)
    });

    const total = await prisma.order.count({ where });

    res.json({
      orders: orders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        user: order.user,
        status: order.status,
        paymentStatus: order.paymentStatus,
        total: order.total,
        itemCount: order.items.length,
        createdAt: order.createdAt,
        items: order.items.map(item => ({
          name: item.product.name,
          imageUrl: item.product.imageUrl,
          quantity: item.quantity,
          price: item.price
        }))
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
};

// Admin: Update order status
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, trackingNumber, estimatedDelivery } = req.body;

    const validStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const updateData = { status };
    
    if (trackingNumber) updateData.trackingNumber = trackingNumber;
    if (estimatedDelivery) updateData.estimatedDelivery = new Date(estimatedDelivery);
    if (status === 'SHIPPED') updateData.paymentStatus = 'PAID';

    const order = await prisma.order.update({
      where: { id: orderId },
      data: updateData
    });

    res.json({ 
      message: 'Order status updated successfully',
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        trackingNumber: order.trackingNumber
      }
    });

  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Failed to update order status' });
  }
};

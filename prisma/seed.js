// Supabase db password
// DKc8DkRY3vulPuaT

import pkg from '@prisma/client';
import bcrypt from 'bcrypt';

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data (optional - uncomment if you want to reset)
  // console.log('🧹 Clearing existing data...');
  // await prisma.cartItem.deleteMany();
  // await prisma.cart.deleteMany();
  // await prisma.orderItem.deleteMany();
  // await prisma.order.deleteMany();
  // await prisma.review.deleteMany();
  // await prisma.wishlistItem.deleteMany();
  // await prisma.address.deleteMany();
  // await prisma.product.deleteMany();
  // await prisma.collection.deleteMany();
  // await prisma.user.deleteMany();

  // Create Users
  console.log('👥 Seeding users...');
  const hashedPassword = await bcrypt.hash('password123', 12);
  
  const users = [
    {
      email: 'admin@babeledit.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'SUPER_ADMIN',
      isVerified: true,
      isAgree: true
    },
    {
      email: 'john.doe@example.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1234567890',
      role: 'USER',
      isVerified: true,
      isAgree: true
    },
    {
      email: 'jane.smith@example.com',
      password: hashedPassword,
      firstName: 'Jane',
      lastName: 'Smith',
      phone: '+1987654321',
      role: 'USER',
      isVerified: true,
      isAgree: true
    },
    {
      email: 'mike.wilson@example.com',
      password: hashedPassword,
      firstName: 'Mike',
      lastName: 'Wilson',
      role: 'ADMIN',
      isVerified: true,
      isAgree: true
    }
  ];

  for (const userData of users) {
    await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: userData
    });
  }

  // Create Collections
  console.log('📦 Seeding collections...');
  const collections = [
    {
      name: 'Women\'s Clothing',
      description: 'Stylish and comfortable clothing for women',
      imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500&h=300&fit=crop&crop=center',
      isActive: true
    },
    {
      name: 'Men\'s Clothing',
      description: 'Modern and classic clothing for men',
      imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=300&fit=crop&crop=center',
      isActive: true
    },
    {
      name: 'Shoes',
      description: 'Comfortable and stylish footwear for everyone',
      imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&h=300&fit=crop&crop=center',
      isActive: true
    },
    {
      name: 'Bags & Accessories',
      description: 'Premium bags and accessories to complete your look',
      imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=300&fit=crop&crop=center',
      isActive: true
    },
    {
      name: 'New Arrivals',
      description: 'Latest fashion trends and newest products',
      imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500&h=300&fit=crop&crop=center',
      isActive: true
    }
  ];

  const createdCollections = {};
  for (const collectionData of collections) {
    const collection = await prisma.collection.upsert({
      where: { name: collectionData.name },
      update: collectionData,
      create: collectionData
    });
    createdCollections[collection.name] = collection.id;
  }

  // Create Products
  console.log('🛍️ Seeding products...');
  const products = [
    // Women's Clothing
    {
      name: 'Elegant Summer Dress',
      description: 'A beautiful flowing summer dress perfect for any occasion. Made with lightweight, breathable fabric.',
      price: 89.99,
      comparePrice: 119.99,
      imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&h=600&fit=crop&crop=center',
      images: [
        'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&h=600&fit=crop&crop=center',
        'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500&h=600&fit=crop&crop=center'
      ],
      stock: 25,
      sku: 'WD001',
      collectionId: createdCollections['Women\'s Clothing'],
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      colors: ['Blue', 'Red', 'White', 'Black'],
      tags: ['summer', 'elegant', 'dress', 'casual'],
      weight: 0.3,
      dimensions: 'One Size',
      isActive: true,
      isFeatured: true
    },
    {
      name: 'Casual Denim Jacket',
      description: 'Classic denim jacket that never goes out of style. Perfect for layering.',
      price: 79.99,
      imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&h=600&fit=crop&crop=center',
      images: [
        'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&h=600&fit=crop&crop=center'
      ],
      stock: 30,
      sku: 'WJ001',
      collectionId: createdCollections['Women\'s Clothing'],
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      colors: ['Light Blue', 'Dark Blue', 'Black'],
      tags: ['denim', 'jacket', 'casual', 'classic'],
      weight: 0.8,
      isActive: true,
      isFeatured: false
    },
    {
      name: 'Silk Blouse',
      description: 'Luxurious silk blouse perfect for professional or formal occasions.',
      price: 129.99,
      comparePrice: 159.99,
      imageUrl: 'https://images.unsplash.com/photo-1564257631407-99ab8bfaa434?w=500&h=600&fit=crop&crop=center',
      images: [
        'https://images.unsplash.com/photo-1564257631407-99ab8bfaa434?w=500&h=600&fit=crop&crop=center'
      ],
      stock: 15,
      sku: 'WB001',
      collectionId: createdCollections['Women\'s Clothing'],
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      colors: ['White', 'Black', 'Navy', 'Cream'],
      tags: ['silk', 'blouse', 'formal', 'luxury'],
      weight: 0.2,
      isActive: true,
      isFeatured: true
    },

    // Men's Clothing
    {
      name: 'Classic White Shirt',
      description: 'Crisp white cotton shirt, essential for any wardrobe. Perfect for business or casual wear.',
      price: 59.99,
      imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=600&fit=crop&crop=center',
      images: [
        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=600&fit=crop&crop=center'
      ],
      stock: 40,
      sku: 'MS001',
      collectionId: createdCollections['Men\'s Clothing'],
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['White', 'Light Blue', 'Navy'],
      tags: ['shirt', 'cotton', 'business', 'classic'],
      weight: 0.4,
      isActive: true,
      isFeatured: false
    },
    {
      name: 'Casual Polo Shirt',
      description: 'Comfortable cotton polo shirt perfect for weekend activities and casual outings.',
      price: 39.99,
      comparePrice: 49.99,
      imageUrl: 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=500&h=600&fit=crop&crop=center',
      images: [
        'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=500&h=600&fit=crop&crop=center'
      ],
      stock: 35,
      sku: 'MP001',
      collectionId: createdCollections['Men\'s Clothing'],
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['Navy', 'White', 'Green', 'Black', 'Red'],
      tags: ['polo', 'casual', 'cotton', 'weekend'],
      weight: 0.3,
      isActive: true,
      isFeatured: true
    },
    {
      name: 'Premium Hoodie',
      description: 'Ultra-soft premium hoodie made from organic cotton. Perfect for comfort and style.',
      price: 89.99,
      imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&h=600&fit=crop&crop=center',
      images: [
        'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&h=600&fit=crop&crop=center'
      ],
      stock: 20,
      sku: 'MH001',
      collectionId: createdCollections['Men\'s Clothing'],
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['Gray', 'Black', 'Navy', 'Burgundy'],
      tags: ['hoodie', 'comfort', 'organic', 'casual'],
      weight: 0.7,
      isActive: true,
      isFeatured: false
    },

    // Shoes
    {
      name: 'Running Sneakers',
      description: 'High-performance running shoes with advanced cushioning technology for maximum comfort.',
      price: 149.99,
      comparePrice: 179.99,
      imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=400&fit=crop&crop=center',
      images: [
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=400&fit=crop&crop=center',
        'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&h=400&fit=crop&crop=center'
      ],
      stock: 25,
      sku: 'SH001',
      collectionId: createdCollections['Shoes'],
      sizes: ['6', '7', '8', '9', '10', '11', '12'],
      colors: ['White', 'Black', 'Blue', 'Red'],
      tags: ['running', 'athletic', 'comfortable', 'sport'],
      weight: 1.2,
      dimensions: 'Various Sizes',
      isActive: true,
      isFeatured: true
    },
    {
      name: 'Leather Dress Shoes',
      description: 'Elegant leather dress shoes crafted from premium Italian leather. Perfect for formal occasions.',
      price: 199.99,
      imageUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=500&h=400&fit=crop&crop=center',
      images: [
        'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=500&h=400&fit=crop&crop=center'
      ],
      stock: 18,
      sku: 'SH002',
      collectionId: createdCollections['Shoes'],
      sizes: ['6', '7', '8', '9', '10', '11', '12'],
      colors: ['Black', 'Brown'],
      tags: ['leather', 'formal', 'dress', 'italian'],
      weight: 1.5,
      isActive: true,
      isFeatured: false
    },
    {
      name: 'Casual Canvas Sneakers',
      description: 'Comfortable canvas sneakers perfect for everyday wear. Classic design with modern comfort.',
      price: 69.99,
      comparePrice: 89.99,
      imageUrl: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=500&h=400&fit=crop&crop=center',
      images: [
        'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=500&h=400&fit=crop&crop=center'
      ],
      stock: 45,
      sku: 'SH003',
      collectionId: createdCollections['Shoes'],
      sizes: ['5', '6', '7', '8', '9', '10', '11'],
      colors: ['White', 'Black', 'Red', 'Navy', 'Gray'],
      tags: ['canvas', 'casual', 'sneakers', 'classic'],
      weight: 0.8,
      isActive: true,
      isFeatured: true
    },

    // Bags & Accessories
    {
      name: 'Leather Handbag',
      description: 'Luxurious genuine leather handbag with multiple compartments. Perfect for work or everyday use.',
      price: 249.99,
      comparePrice: 299.99,
      imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop&crop=center',
      images: [
        'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop&crop=center'
      ],
      stock: 12,
      sku: 'BA001',
      collectionId: createdCollections['Bags & Accessories'],
      sizes: ['One Size'],
      colors: ['Black', 'Brown', 'Tan', 'Navy'],
      tags: ['leather', 'handbag', 'luxury', 'work'],
      weight: 1.0,
      dimensions: '35cm x 25cm x 12cm',
      isActive: true,
      isFeatured: true
    },
    {
      name: 'Minimalist Backpack',
      description: 'Sleek and functional backpack perfect for work, travel, or daily use. Water-resistant material.',
      price: 129.99,
      imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop&crop=center',
      images: [
        'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop&crop=center'
      ],
      stock: 20,
      sku: 'BA002',
      collectionId: createdCollections['Bags & Accessories'],
      sizes: ['One Size'],
      colors: ['Black', 'Gray', 'Navy', 'Green'],
      tags: ['backpack', 'minimalist', 'travel', 'work'],
      weight: 0.9,
      dimensions: '45cm x 30cm x 15cm',
      isActive: true,
      isFeatured: false
    },

    // New Arrivals (Mix of products)
    {
      name: 'Trendy Graphic T-Shirt',
      description: 'Modern graphic t-shirt with unique artistic design. Made from soft organic cotton.',
      price: 34.99,
      imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=600&fit=crop&crop=center',
      images: [
        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=600&fit=crop&crop=center'
      ],
      stock: 50,
      sku: 'NA001',
      collectionId: createdCollections['New Arrivals'],
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      colors: ['Black', 'White', 'Gray', 'Navy'],
      tags: ['graphic', 'trendy', 'cotton', 'art'],
      weight: 0.2,
      isActive: true,
      isFeatured: true
    },
    {
      name: 'Smart Watch Band',
      description: 'Premium silicone watch band compatible with most smart watches. Available in multiple colors.',
      price: 24.99,
      comparePrice: 34.99,
      imageUrl: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=500&h=400&fit=crop&crop=center',
      images: [
        'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=500&h=400&fit=crop&crop=center'
      ],
      stock: 100,
      sku: 'NA002',
      collectionId: createdCollections['New Arrivals'],
      sizes: ['S/M', 'M/L'],
      colors: ['Black', 'White', 'Blue', 'Pink', 'Green', 'Red'],
      tags: ['smartwatch', 'accessory', 'silicone', 'tech'],
      weight: 0.05,
      dimensions: 'Universal Fit',
      isActive: true,
      isFeatured: false
    }
  ];

  const createdProducts = [];
  for (const productData of products) {
    const product = await prisma.product.upsert({
      where: { sku: productData.sku },
      update: productData,
      create: productData
    });
    createdProducts.push(product);
  }

  // Create some sample addresses for users
  console.log('🏠 Seeding addresses...');
  const johnUser = await prisma.user.findUnique({ where: { email: 'john.doe@example.com' } });
  const janeUser = await prisma.user.findUnique({ where: { email: 'jane.smith@example.com' } });

  if (johnUser) {
    await prisma.address.upsert({
      where: { id: 'john-address-1' },
      update: {},
      create: {
        id: 'john-address-1',
        userId: johnUser.id,
        firstName: 'John',
        lastName: 'Doe',
        company: 'Tech Corp',
        address1: '123 Main Street',
        address2: 'Apt 4B',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'United States',
        phone: '+1234567890',
        isDefault: true
      }
    });
  }

  if (janeUser) {
    await prisma.address.upsert({
      where: { id: 'jane-address-1' },
      update: {},
      create: {
        id: 'jane-address-1',
        userId: janeUser.id,
        firstName: 'Jane',
        lastName: 'Smith',
        address1: '456 Oak Avenue',
        city: 'Los Angeles',
        state: 'CA',
        postalCode: '90210',
        country: 'United States',
        phone: '+1987654321',
        isDefault: true
      }
    });
  }

  // Create some sample reviews
  console.log('⭐ Seeding reviews...');
  if (johnUser && createdProducts.length > 0) {
    const reviewsData = [
      {
        userId: johnUser.id,
        productId: createdProducts[0].id,
        rating: 5,
        title: 'Amazing quality!',
        comment: 'This dress is absolutely beautiful and fits perfectly. The fabric quality is excellent.',
        isVerified: true
      },
      {
        userId: johnUser.id,
        productId: createdProducts[3].id,
        rating: 4,
        title: 'Great shirt',
        comment: 'Classic white shirt that fits well. Good value for money.',
        isVerified: false
      }
    ];

    for (const reviewData of reviewsData) {
      await prisma.review.upsert({
        where: {
          userId_productId: {
            userId: reviewData.userId,
            productId: reviewData.productId
          }
        },
        update: {},
        create: reviewData
      });
    }
  }

  // Create sample wishlist items
  console.log('❤️ Seeding wishlist...');
  if (janeUser && createdProducts.length > 2) {
    const wishlistItems = [
      { userId: janeUser.id, productId: createdProducts[0].id },
      { userId: janeUser.id, productId: createdProducts[2].id },
      { userId: janeUser.id, productId: createdProducts[7].id }
    ];

    for (const item of wishlistItems) {
      await prisma.wishlistItem.upsert({
        where: {
          userId_productId: {
            userId: item.userId,
            productId: item.productId
          }
        },
        update: {},
        create: item
      });
    }
  }

  console.log('✅ Database seeding completed!');
  console.log(`📊 Seeded:`);
  console.log(`   - ${users.length} users`);
  console.log(`   - ${collections.length} collections`);
  console.log(`   - ${products.length} products`);
  console.log(`   - Sample addresses, reviews, and wishlist items`);
  console.log('');
  console.log('🔐 Test Credentials:');
  console.log('   Admin: admin@babeledit.com / password123');
  console.log('   User: john.doe@example.com / password123');
  console.log('   User: jane.smith@example.com / password123');
}

main()
  .catch(e => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

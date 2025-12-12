import pkg from '@prisma/client';
import bcrypt from 'bcrypt';

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data (optional - uncomment if you want to reset)
  console.log('🧹 Clearing existing data...');
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.review.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.address.deleteMany();
  await prisma.product.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.user.deleteMany();
  await prisma.testimonial.deleteMany();

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
      email: 'isiquedan@gmail.com',
      password: hashedPassword,
      firstName: 'Isaac',
      lastName: 'Dalyop',
      phone: '+2347060737799',
      role: 'ADMIN',
      isVerified: true,
      isAgree: true
    }
  ];

  const createdUsers = {};
  for (const userData of users) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: userData
    });
    createdUsers[userData.email] = user;
  }

  // Create Collections - Updated for your specific needs
  console.log('📦 Seeding collections...');
  const collections = [
    {
      name: 'Clothes',
      description: 'Stylish and comfortable clothing for men and women',
      imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500&h=300&fit=crop&crop=center',
      isActive: true
    },
    {
      name: 'Shoes',
      description: 'Comfortable and stylish footwear for every occasion',
      imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&h=300&fit=crop&crop=center',
      isActive: true
    },
    {
      name: 'Bags',
      description: 'Premium bags for work, travel, and everyday use',
      imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=300&fit=crop&crop=center',
      isActive: true
    },
    {
      name: 'Accessories',
      description: 'Fashion accessories to complete your perfect look',
      imageUrl: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=500&h=300&fit=crop&crop=center',
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

  // Create Products - Updated to match your collections
  console.log('🛍️ Seeding products...');
  const products = [
    // Clothes Collection
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
      sku: 'CL001',
      collectionId: createdCollections['Clothes'],
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      colors: ['Blue', 'Red', 'White', 'Black'],
      tags: ['summer', 'elegant', 'dress', 'casual', 'women'],
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
      sku: 'CL002',
      collectionId: createdCollections['Clothes'],
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      colors: ['Light Blue', 'Dark Blue', 'Black'],
      tags: ['denim', 'jacket', 'casual', 'classic', 'unisex'],
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
      sku: 'CL003',
      collectionId: createdCollections['Clothes'],
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      colors: ['White', 'Black', 'Navy', 'Cream'],
      tags: ['silk', 'blouse', 'formal', 'luxury', 'women'],
      weight: 0.2,
      isActive: true,
      isFeatured: true
    },
    {
      name: 'Classic White Shirt',
      description: 'Crisp white cotton shirt, essential for any wardrobe. Perfect for business or casual wear.',
      price: 59.99,
      imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=600&fit=crop&crop=center',
      images: [
        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=600&fit=crop&crop=center'
      ],
      stock: 40,
      sku: 'CL004',
      collectionId: createdCollections['Clothes'],
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['White', 'Light Blue', 'Navy'],
      tags: ['shirt', 'cotton', 'business', 'classic', 'men'],
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
      sku: 'CL005',
      collectionId: createdCollections['Clothes'],
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['Navy', 'White', 'Green', 'Black', 'Red'],
      tags: ['polo', 'casual', 'cotton', 'weekend', 'men'],
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
      sku: 'CL006',
      collectionId: createdCollections['Clothes'],
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['Gray', 'Black', 'Navy', 'Burgundy'],
      tags: ['hoodie', 'comfort', 'organic', 'casual', 'unisex'],
      weight: 0.7,
      isActive: true,
      isFeatured: false
    },

    // Shoes Collection
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
      tags: ['leather', 'formal', 'dress', 'italian', 'men'],
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
      tags: ['canvas', 'casual', 'sneakers', 'classic', 'unisex'],
      weight: 0.8,
      isActive: true,
      isFeatured: true
    },
    {
      name: 'High Heel Pumps',
      description: 'Elegant high heel pumps perfect for professional and formal occasions. Comfortable fit with style.',
      price: 119.99,
      comparePrice: 149.99,
      imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500&h=400&fit=crop&crop=center',
      images: [
        'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500&h=400&fit=crop&crop=center'
      ],
      stock: 22,
      sku: 'SH004',
      collectionId: createdCollections['Shoes'],
      sizes: ['5', '6', '7', '8', '9', '10'],
      colors: ['Black', 'Nude', 'Red', 'Navy'],
      tags: ['heels', 'formal', 'elegant', 'professional', 'women'],
      weight: 0.9,
      isActive: true,
      isFeatured: false
    },

    // Bags Collection
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
      sku: 'BG001',
      collectionId: createdCollections['Bags'],
      sizes: ['One Size'],
      colors: ['Black', 'Brown', 'Tan', 'Navy'],
      tags: ['leather', 'handbag', 'luxury', 'work', 'women'],
      weight: 1.0,
      dimensions: '35cm x 25cm x 12cm',
      isActive: true,
      isFeatured: true
    },
    {
      name: 'Minimalist Backpack',
      description: 'Sleek and functional backpack perfect for work, travel, or daily use. Water-resistant material.',
      price: 129.99,
      imageUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&h=500&fit=crop&crop=center',
      images: [
        'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&h=500&fit=crop&crop=center'
      ],
      stock: 20,
      sku: 'BG002',
      collectionId: createdCollections['Bags'],
      sizes: ['One Size'],
      colors: ['Black', 'Gray', 'Navy', 'Green'],
      tags: ['backpack', 'minimalist', 'travel', 'work', 'unisex'],
      weight: 0.9,
      dimensions: '45cm x 30cm x 15cm',
      isActive: true,
      isFeatured: false
    },
    {
      name: 'Canvas Tote Bag',
      description: 'Eco-friendly canvas tote bag perfect for shopping, beach trips, or everyday use.',
      price: 29.99,
      comparePrice: 39.99,
      imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&h=500&fit=crop&crop=center',
      images: [
        'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&h=500&fit=crop&crop=center'
      ],
      stock: 50,
      sku: 'BG003',
      collectionId: createdCollections['Bags'],
      sizes: ['One Size'],
      colors: ['Natural', 'Black', 'Navy', 'Red', 'Green'],
      tags: ['canvas', 'tote', 'eco-friendly', 'casual', 'unisex'],
      weight: 0.3,
      dimensions: '40cm x 35cm x 10cm',
      isActive: true,
      isFeatured: true
    },

    // Accessories Collection
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
      sku: 'AC001',
      collectionId: createdCollections['Accessories'],
      sizes: ['S/M', 'M/L'],
      colors: ['Black', 'White', 'Blue', 'Pink', 'Green', 'Red'],
      tags: ['smartwatch', 'accessory', 'silicone', 'tech', 'unisex'],
      weight: 0.05,
      dimensions: 'Universal Fit',
      isActive: true,
      isFeatured: false
    },
    {
      name: 'Sunglasses Classic',
      description: 'Classic style sunglasses with UV protection. Perfect for any outdoor activity.',
      price: 79.99,
      comparePrice: 99.99,
      imageUrl: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500&h=400&fit=crop&crop=center',
      images: [
        'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500&h=400&fit=crop&crop=center'
      ],
      stock: 35,
      sku: 'AC002',
      collectionId: createdCollections['Accessories'],
      sizes: ['One Size'],
      colors: ['Black', 'Brown', 'Gold', 'Silver'],
      tags: ['sunglasses', 'uv-protection', 'classic', 'outdoor', 'unisex'],
      weight: 0.1,
      dimensions: 'Standard Fit',
      isActive: true,
      isFeatured: true
    },
    {
      name: 'Leather Belt',
      description: 'Premium genuine leather belt with classic buckle design. Perfect for both casual and formal wear.',
      price: 49.99,
      imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=300&fit=crop&crop=center',
      images: [
        'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=300&fit=crop&crop=center'
      ],
      stock: 40,
      sku: 'AC003',
      collectionId: createdCollections['Accessories'],
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Black', 'Brown', 'Tan'],
      tags: ['belt', 'leather', 'classic', 'formal', 'unisex'],
      weight: 0.3,
      dimensions: 'Various Sizes',
      isActive: true,
      isFeatured: false
    },

    // New Arrivals Collection (Latest products from different categories)
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
      tags: ['graphic', 'trendy', 'cotton', 'art', 'unisex', 'new'],
      weight: 0.2,
      isActive: true,
      isFeatured: true
    },
    {
      name: 'Wireless Earbuds Case',
      description: 'Protective silicone case for wireless earbuds with carabiner clip for easy carrying.',
      price: 19.99,
      imageUrl: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=500&h=400&fit=crop&crop=center',
      images: [
        'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=500&h=400&fit=crop&crop=center'
      ],
      stock: 75,
      sku: 'NA002',
      collectionId: createdCollections['New Arrivals'],
      sizes: ['One Size'],
      colors: ['Black', 'White', 'Blue', 'Pink', 'Green'],
      tags: ['earbuds', 'case', 'tech', 'protection', 'new'],
      weight: 0.05,
      dimensions: 'Compact',
      isActive: true,
      isFeatured: false
    },
    {
      name: 'Eco-Friendly Water Bottle',
      description: 'Sustainable stainless steel water bottle with temperature control. Perfect for active lifestyle.',
      price: 39.99,
      comparePrice: 49.99,
      imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&h=600&fit=crop&crop=center',
      images: [
        'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&h=600&fit=crop&crop=center'
      ],
      stock: 60,
      sku: 'NA003',
      collectionId: createdCollections['New Arrivals'],
      sizes: ['500ml', '750ml', '1000ml'],
      colors: ['Black', 'White', 'Blue', 'Green', 'Pink'],
      tags: ['water-bottle', 'eco-friendly', 'stainless-steel', 'active', 'new'],
      weight: 0.4,
      dimensions: 'Various Sizes',
      isActive: true,
      isFeatured: true
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
  const johnUser = createdUsers['john.doe@example.com'];
  const janeUser = createdUsers['jane.smith@example.com'];

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
        productId: createdProducts[0].id, // Elegant Summer Dress
        rating: 5,
        title: 'Amazing quality!',
        comment: 'This dress is absolutely beautiful and fits perfectly. The fabric quality is excellent.',
        isVerified: true
      },
      {
        userId: johnUser.id,
        productId: createdProducts[3].id, // Classic White Shirt
        rating: 4,
        title: 'Great shirt',
        comment: 'Classic white shirt that fits well. Good value for money.',
        isVerified: false
      },
      {
        userId: johnUser.id,
        productId: createdProducts[6].id, // Running Sneakers
        rating: 5,
        title: 'Perfect for running!',
        comment: 'These sneakers are incredibly comfortable. Great for my daily runs.',
        isVerified: true
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
  if (janeUser && createdProducts.length > 5) {
    const wishlistItems = [
      { userId: janeUser.id, productId: createdProducts[0].id }, // Elegant Summer Dress
      { userId: janeUser.id, productId: createdProducts[2].id }, // Silk Blouse
      { userId: janeUser.id, productId: createdProducts[10].id }, // Leather Handbag
      { userId: janeUser.id, productId: createdProducts[14].id } // Sunglasses Classic
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

  // Create some sample testimonials
  console.log('💬 Seeding testimonials...');
  const testimonials = [
    {
      author: 'Sarah J.',
      text: 'Absolutely in love with the vintage dress I bought! The quality is amazing and it arrived so quickly. Will definitely be shopping here again.',
      avatar: 'https://i.pravatar.cc/150?u=sarah'
    },
    {
      author: 'Michael B.',
      text: "Found a rare pair of sneakers I've been looking for everywhere. The condition was exactly as described. Great service and communication.",
      avatar: 'https://i.pravatar.cc/150?u=michael'
    },
    {
      author: 'Emily K.',
      text: "The Babel Edit is my go-to for unique finds. The curation is top-notch and I always get compliments on the pieces I buy.",
      avatar: 'https://i.pravatar.cc/150?u=emily'
    },
    {
      author: 'David L.',
      text: "A fantastic shopping experience from start to finish. The website is easy to use and my order was handled with care. Highly recommend!",
      avatar: 'https://i.pravatar.cc/150?u=david'
    }
  ];

  await prisma.testimonial.createMany({
    data: testimonials,
    skipDuplicates: true,
  });

  console.log('✅ Database seeding completed!');
  console.log(`📊 Seeded:`);
  console.log(`   - ${users.length} users`);
  console.log(`   - ${collections.length} collections`);
  console.log(`   - ${products.length} products`);
  console.log(`   - ${testimonials.length} testimonials`);
  console.log(`   - Sample addresses, reviews, and wishlist items`);
  console.log('');
  console.log('🔐 Test Credentials:');
  console.log('   Admin: admin@babeledit.com / password123');
  console.log('   Admin: isiquedan@gmail.com / password123');
  console.log('   User: john.doe@example.com / password123');
  console.log('   User: jane.smith@example.com / password123');
  console.log('');
  console.log('📦 Collections Created:');
  console.log('   - Clothes (General clothing items)');
  console.log('   - Shoes (All types of footwear)');
  console.log('   - Bags (Handbags, backpacks, totes)');
  console.log('   - Accessories (Watches, sunglasses, belts, etc.)');
  console.log('   - New Arrivals (Latest products)');
}

main()
  .catch(e => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
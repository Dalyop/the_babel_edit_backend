import prisma from '../prismaClient.js';

// Get all products with advanced filtering and search
export const getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      category,
      collection,
      minPrice,
      maxPrice,
      sizes,
      colors,
      tags,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      featured,
      inStock,
      onSale
    } = req.query;

    // Build where clause
    const where = {
      isActive: true
    };

    // Search functionality
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { hasSome: [search] } }
      ];
    }

    // Collection filter
    if (collection) {
      where.collection = {
        name: { equals: collection, mode: 'insensitive' }
      };
    }

    // Category filter (using collection for category-based filtering)
    if (category) {
      where.collection = {
        name: { equals: category, mode: 'insensitive' }
      };
    }

    // Price range filter
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    // Size filter
    if (sizes) {
      const sizeArray = sizes.split(',').map(s => s.trim());
      where.sizes = { hasSome: sizeArray };
    }

    // Color filter
    if (colors) {
      const colorArray = colors.split(',').map(c => c.trim());
      where.colors = { hasSome: colorArray };
    }

    // Tags filter
    if (tags) {
      const tagArray = tags.split(',').map(t => t.trim());
      where.tags = { hasSome: tagArray };
    }

    // Featured filter
    if (featured === 'true') {
      where.isFeatured = true;
    }

    // In stock filter
    if (inStock === 'true') {
      where.stock = { gt: 0 };
    }

    // On sale filter (has comparePrice)
    if (onSale === 'true') {
      where.comparePrice = { not: null };
    }

    // Build orderBy clause
    const validSortFields = ['name', 'price', 'createdAt', 'updatedAt', 'stock'];
    const orderBy = {};

    if (validSortFields.includes(sortBy)) {
      orderBy[sortBy] = sortOrder === 'asc' ? 'asc' : 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    // Execute query
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          collection: {
            select: {
              id: true,
              name: true
            }
          },
          reviews: {
            select: {
              rating: true
            }
          }
        },
        orderBy,
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      prisma.product.count({ where })
    ]);

    // Calculate average ratings and add computed fields
    const productsWithRatings = products.map(product => {
      const avgRating = product.reviews.length > 0
        ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
        : 0;

      const discountPercentage = product.comparePrice
        ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
        : 0;

      const { reviews, ...productData } = product;

      return {
        ...productData,
        avgRating: Math.round(avgRating * 10) / 10, // Round to 1 decimal
        reviewCount: reviews.length,
        discountPercentage,
        isInStock: product.stock > 0,
        isOnSale: !!product.comparePrice
      };
    });

    res.json({
      products: productsWithRatings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      filters: {
        search,
        collection,
        priceRange: { min: minPrice, max: maxPrice },
        sizes: sizes?.split(','),
        colors: colors?.split(','),
        tags: tags?.split(','),
        featured: featured === 'true',
        inStock: inStock === 'true',
        onSale: onSale === 'true'
      },
      sorting: {
        sortBy,
        sortOrder
      }
    });

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
};

// Get product by ID with related data
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id, isActive: true },
      include: {
        collection: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        reviews: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10 // Latest 10 reviews
        }
      }
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Calculate average rating
    const avgRating = product.reviews.length > 0
      ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
      : 0;

    // Get related products from same collection
    const relatedProducts = await prisma.product.findMany({
      where: {
        collectionId: product.collectionId,
        id: { not: product.id },
        isActive: true
      },
      select: {
        id: true,
        name: true,
        price: true,
        comparePrice: true,
        imageUrl: true,
        stock: true
      },
      take: 4
    });

    const discountPercentage = product.comparePrice
      ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
      : 0;

    res.json({
      ...product,
      avgRating: Math.round(avgRating * 10) / 10,
      reviewCount: product.reviews.length,
      discountPercentage,
      isInStock: product.stock > 0,
      isOnSale: !!product.comparePrice,
      relatedProducts: relatedProducts.map(p => ({
        ...p,
        discountPercentage: p.comparePrice
          ? Math.round(((p.comparePrice - p.price) / p.comparePrice) * 100)
          : 0,
        isInStock: p.stock > 0
      }))
    });

  } catch (error) {
    console.error('Get product by ID error:', error);
    res.status(500).json({ message: 'Failed to fetch product' });
  }
};

// Search suggestions (for autocomplete)
export const getSearchSuggestions = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.json({ suggestions: [] });
    }

    // Get product name suggestions
    const productSuggestions = await prisma.product.findMany({
      where: {
        isActive: true,
        name: {
          contains: q,
          mode: 'insensitive'
        }
      },
      select: {
        name: true,
        imageUrl: true,
        price: true
      },
      take: 5
    });

    // Get collection suggestions
    const collectionSuggestions = await prisma.collection.findMany({
      where: {
        isActive: true,
        name: {
          contains: q,
          mode: 'insensitive'
        }
      },
      select: {
        name: true
      },
      take: 3
    });

    // Get tag suggestions
    const tagResults = await prisma.product.findMany({
      where: {
        isActive: true,
        tags: {
          hasSome: [q]
        }
      },
      select: {
        tags: true
      },
      take: 10
    });

    // Extract unique matching tags
    const allTags = tagResults.flatMap(p => p.tags);
    const matchingTags = [...new Set(allTags.filter(tag =>
      tag.toLowerCase().includes(q.toLowerCase())
    ))].slice(0, 3);

    res.json({
      suggestions: {
        products: productSuggestions.map(p => ({
          type: 'product',
          name: p.name,
          imageUrl: p.imageUrl,
          price: p.price
        })),
        collections: collectionSuggestions.map(c => ({
          type: 'collection',
          name: c.name
        })),
        tags: matchingTags.map(tag => ({
          type: 'tag',
          name: tag
        }))
      }
    });

  } catch (error) {
    console.error('Get search suggestions error:', error);
    res.status(500).json({ message: 'Failed to fetch suggestions' });
  }
};

// Get filter options (for filter UI)
export const getFilterOptions = async (req, res) => {
  try {
    const { collection } = req.query;

    const where = { isActive: true };
    if (collection) {
      where.collection = {
        name: { equals: collection, mode: 'insensitive' }
      };
    }

    // Get all products matching the base criteria
    const products = await prisma.product.findMany({
      where,
      select: {
        price: true,
        comparePrice: true,
        sizes: true,
        colors: true,
        tags: true
      }
    });

    // Extract unique values
    const allSizes = [...new Set(products.flatMap(p => p.sizes))].sort();
    const allColors = [...new Set(products.flatMap(p => p.colors))].sort();
    const allTags = [...new Set(products.flatMap(p => p.tags))].sort();

    // Calculate price range
    const prices = products.map(p => p.price);
    const priceRange = {
      min: Math.min(...prices),
      max: Math.max(...prices)
    };

    // Get collections
    const collections = await prisma.collection.findMany({
      where: { isActive: true },
      select: {
        name: true,
        _count: {
          select: {
            products: {
              where: { isActive: true }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      priceRange,
      sizes: allSizes,
      colors: allColors,
      tags: allTags,
      collections: collections.map(c => ({
        name: c.name,
        productCount: c._count.products
      }))
    });

  } catch (error) {
    console.error('Get filter options error:', error);
    res.status(500).json({ message: 'Failed to fetch filter options' });
  }
};

// Create a product (Admin only)
export const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      comparePrice,
      imageUrl,
      images,
      stock,
      sku,
      collectionId,
      sizes,
      colors,
      tags,
      weight,
      dimensions,
      isFeatured
    } = req.body;

    // Validate required fields
    if (!name || !price || !imageUrl || !collectionId) {
      return res.status(400).json({
        message: 'Required fields: name, price, imageUrl, collectionId'
      });
    }

    // Validate collection exists
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId }
    });

    if (!collection) {
      return res.status(400).json({ message: 'Collection not found' });
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        comparePrice: comparePrice ? parseFloat(comparePrice) : null,
        imageUrl,
        images: images || [],
        stock: parseInt(stock) || 0,
        sku,
        collectionId,
        sizes: sizes || [],
        colors: colors || [],
        tags: tags || [],
        weight: weight ? parseFloat(weight) : null,
        dimensions,
        isFeatured: !!isFeatured,
        isActive: true
      },
      include: {
        collection: {
          select: {
            name: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Product created successfully',
      product
    });

  } catch (error) {
    console.error('Create product error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Product with this SKU already exists' });
    }
    res.status(500).json({ message: 'Failed to create product' });
  }
};

// Update product (Admin only)
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Convert numeric fields
    if (updateData.price) updateData.price = parseFloat(updateData.price);
    if (updateData.comparePrice) updateData.comparePrice = parseFloat(updateData.comparePrice);
    if (updateData.stock) updateData.stock = parseInt(updateData.stock);
    if (updateData.weight) updateData.weight = parseFloat(updateData.weight);

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        collection: {
          select: {
            name: true
          }
        }
      }
    });

    res.json({
      message: 'Product updated successfully',
      product
    });

  } catch (error) {
    console.error('Update product error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(500).json({ message: 'Failed to update product' });
  }
};

// Get featured products
export const getFeaturedProducts = async (req, res) => {
  try {
    const {
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      collection,
      inStock
    } = req.query;

    // Build where clause
    const where = {
      isActive: true,
      isFeatured: true
    };

    // Optional collection filter
    if (collection) {
      where.collection = {
        name: { equals: collection, mode: 'insensitive' }
      };
    }

    // Optional stock filter
    if (inStock === 'true') {
      where.stock = { gt: 0 };
    }

    // Build orderBy clause
    const validSortFields = ['name', 'price', 'createdAt', 'updatedAt', 'stock'];
    const orderBy = {};

    if (validSortFields.includes(sortBy)) {
      orderBy[sortBy] = sortOrder === 'asc' ? 'asc' : 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    // Fetch featured products
    const featuredProducts = await prisma.product.findMany({
      where,
      include: {
        collection: {
          select: {
            id: true,
            name: true
          }
        },
        reviews: {
          select: {
            rating: true
          }
        }
      },
      orderBy,
      take: parseInt(limit)
    });

    // If no featured products found, return popular products as fallback
    if (featuredProducts.length === 0) {
      const fallbackProducts = await prisma.product.findMany({
        where: {
          isActive: true,
          ...(collection && {
            collection: {
              name: { equals: collection, mode: 'insensitive' }
            }
          }),
          ...(inStock === 'true' && { stock: { gt: 0 } })
        },
        include: {
          collection: {
            select: {
              id: true,
              name: true
            }
          },
          reviews: {
            select: {
              rating: true
            }
          }
        },
        orderBy: [
          { reviews: { _count: 'desc' } }, // Most reviewed first
          { createdAt: 'desc' }
        ],
        take: parseInt(limit)
      });

      const fallbackProductsWithRatings = fallbackProducts.map(product => {
        const avgRating = product.reviews.length > 0
          ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
          : 0;

        const discountPercentage = product.comparePrice
          ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
          : 0;

        const { reviews, ...productData } = product;

        return {
          ...productData,
          avgRating: Math.round(avgRating * 10) / 10,
          reviewCount: reviews.length,
          discountPercentage,
          isInStock: product.stock > 0,
          isOnSale: !!product.comparePrice
        };
      });

      return res.json({
        products: fallbackProductsWithRatings,
        meta: {
          total: fallbackProductsWithRatings.length,
          limit: parseInt(limit),
          isFallback: true,
          message: 'No featured products found, showing popular products instead'
        },
        filters: {
          collection,
          inStock: inStock === 'true'
        }
      });
    }

    // Calculate average ratings and add computed fields
    const productsWithRatings = featuredProducts.map(product => {
      const avgRating = product.reviews.length > 0
        ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
        : 0;

      const discountPercentage = product.comparePrice
        ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
        : 0;

      const { reviews, ...productData } = product;

      return {
        ...productData,
        avgRating: Math.round(avgRating * 10) / 10,
        reviewCount: reviews.length,
        discountPercentage,
        isInStock: product.stock > 0,
        isOnSale: !!product.comparePrice
      };
    });

    res.json({
      products: productsWithRatings,
      meta: {
        total: productsWithRatings.length,
        limit: parseInt(limit),
        isFeatured: true
      },
      filters: {
        collection,
        inStock: inStock === 'true'
      },
      sorting: {
        sortBy,
        sortOrder
      }
    });

  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({ message: 'Failed to fetch featured products' });
  }
};

// Delete product (Admin only)
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Soft delete - mark as inactive
    await prisma.product.update({
      where: { id },
      data: { isActive: false }
    });

    res.json({ message: 'Product deleted successfully' });

  } catch (error) {
    console.error('Delete product error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(500).json({ message: 'Failed to delete product' });
  }
};

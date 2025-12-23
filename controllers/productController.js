import prisma from '../prismaClient.js';
import pluralize from 'pluralize';
import prisma from '../prismaClient.js';

// Get all products with advanced filtering and search
export const getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 22,
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
    const where = {};
    if (req.query.includeInactive !== 'true') {
      where.isActive = true;
    }

    // Size filter - loose matching
    if (sizes) {
      const sizeArray = Array.isArray(sizes) ? sizes : sizes.split(',').map(s => s.trim());
      if (sizeArray.length > 0) {
        where.OR = where.OR || [];
        where.OR.push(
          { sizes: { hasSome: sizeArray } },
          // Also search in name/description for size
          ...sizeArray.map(size => ({
            OR: [
              { name: { contains: size, mode: 'insensitive' } },
              { description: { contains: size, mode: 'insensitive' } }
            ]
          }))
        );
      }
    }

    // Color filter - loose matching
    if (colors) {
      const colorArray = Array.isArray(colors) ? colors : colors.split(',').map(c => c.trim());
      if (colorArray.length > 0) {
        where.OR = where.OR || [];
        where.OR.push(
          { colors: { hasSome: colorArray } },
          // Also search in name/description for color
          ...colorArray.map(color => ({
            OR: [
              { name: { contains: color, mode: 'insensitive' } },
              { description: { contains: color, mode: 'insensitive' } }
            ]
          }))
        );
      }
    }

    // Tags filter - LOOSE MATCHING (this is the key change!)
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());
      if (tagArray.length > 0) {
        // Create OR conditions for loose matching
        const tagConditions = tagArray.flatMap(tag => [
          { tags: { hasSome: [tag] } }, // Exact tag match
          { name: { contains: tag, mode: 'insensitive' } }, // Name contains tag
          { description: { contains: tag, mode: 'insensitive' } }, // Description contains tag
        ]);

        if (where.OR) {
          // If OR already exists (from sizes/colors), combine them
          where.OR.push(...tagConditions);
        } else {
          where.OR = tagConditions;
        }
      }
    }

    // Search functionality
    if (search) {
      const searchConditions = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { hasSome: [search] } }
      ];

      if (where.OR) {
        // Combine with existing OR conditions using AND
        where.AND = where.AND || [];
        where.AND.push({ OR: searchConditions });
      } else {
        where.OR = searchConditions;
      }
    }

    // Category and Collection filter
    const filterTerm = category || collection;
    if (filterTerm) {
      const categoryConditions = [
        { collection: { name: { equals: filterTerm, mode: 'insensitive' } } },
        { name: { contains: filterTerm, mode: 'insensitive' } }
      ];

      if (where.OR || where.AND) {
        // If we already have OR/AND conditions, wrap them
        const existingConditions = where.OR ? { OR: where.OR } : {};
        const existingAnd = where.AND || [];
        
        where.AND = [
          ...existingAnd,
          existingConditions,
          { OR: categoryConditions }
        ].filter(c => Object.keys(c).length > 0);
        
        delete where.OR;
      } else {
        where.OR = categoryConditions;
      }
    }

    // Price range filter
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
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

    console.log('🔍 WHERE clause:', JSON.stringify(where, null, 2));

    // Execute query
    const total = await prisma.product.count({ where });
    const products = await prisma.product.findMany({
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
        },
        _count: {
          select: {
            reviews: true
          }
        }
      },
      orderBy,
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    });

    // Calculate average ratings and add computed fields
    const productsWithRatings = products.map(product => {
      const discountPercentage = product.comparePrice
        ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
        : 0;

      const { reviews, _count, ...productData } = product;
      const avgRating = reviews.length > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
        : 0;

      return {
        ...productData,
        avgRating: Math.round(avgRating * 10) / 10,
        reviewCount: _count.reviews,
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

    // Efficiently get price range
    const priceAggregation = await prisma.product.aggregate({
      where,
      _min: { price: true },
      _max: { price: true },
    });

    const priceRange = {
      min: priceAggregation._min.price || 0,
      max: priceAggregation._max.price || 0,
    };

    // Base query for distinct values
    const baseQuery = `
      SELECT DISTINCT unnest(column) AS item
      FROM "Product"
      WHERE "isActive" = true
      ${collection ? `AND "collectionId" = (SELECT id FROM "Collection" WHERE name = '${collection}')` : ''}
    `;

    // Get distinct sizes, colors, and tags
    const [sizes, colors, tags] = await Promise.all([
      prisma.$queryRawUnsafe(baseQuery.replace('column', 'sizes')).then(res => res.map(r => r.item).sort()),
      prisma.$queryRawUnsafe(baseQuery.replace('column', 'colors')).then(res => res.map(r => r.item).sort()),
      prisma.$queryRawUnsafe(baseQuery.replace('column', 'tags')).then(res => res.map(r => r.item).sort()),
    ]);
    
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
      sizes,
      colors,
      tags,
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
      isFeatured,
      isActive,
    } = req.body;

    const updateData = {
      name,
      description,
      price: price ? parseFloat(price) : undefined,
      comparePrice: comparePrice ? parseFloat(comparePrice) : undefined,
      imageUrl,
      images,
      stock: stock ? parseInt(stock) : undefined,
      sku,
      collectionId,
      sizes,
      colors,
      tags,
      weight: weight ? parseFloat(weight) : undefined,
      dimensions,
      isFeatured,
      isActive,
    };

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        collection: {
          select: {
            name: true,
          },
        },
      },
    });

    res.json({
      message: 'Product updated successfully',
      product,
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

// Soft delete product (Admin only)
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Soft delete - mark as inactive
    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({ message: 'Product soft-deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(500).json({ message: 'Failed to delete product' });
  }
};

// Hard delete product (Admin only)
export const hardDeleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.product.delete({
      where: { id },
    });

    res.json({ message: 'Product permanently deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(500).json({ message: 'Failed to delete product' });
  }
};

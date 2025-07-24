import prisma from '../prismaClient.js';

// Get all products
export const getProducts = async (req, res) => {
    try {
        const products = await prisma.product.findMany();
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch products' });
    }
};

// Get product by ID
export const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await prisma.product.findUnique({ where: { id } });
        if (!product) return res.status(404).json({ error: 'Product not found' });
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch product' });
    }
};

// Create a product
export const createProduct = async (req, res) => {
    try {
        const { name, description, price, imageUrl, collectionId } = req.body;
        const product = await prisma.product.create({
            data: { name, description, price, imageUrl, collectionId },
        });
        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create product' });
    }
}
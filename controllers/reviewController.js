import prisma from '../prismaClient.js';

export const createReview = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { productId, rating, title, comment } = req.body;

        // Validate input
        if (!productId || !rating) {
            return res.status(400).json({ message: 'Product ID and rating are required.' });
        }

        const newReview = await prisma.review.create({
            data: {
                userId,
                productId,
                rating: parseInt(rating, 10),
                title,
                comment,
            },
        });

        res.status(201).json(newReview);
    } catch (error) {
        console.error('Create review error:', error);
        if (error.code === 'P2002') {
            return res.status(409).json({ message: 'You have already reviewed this product.' });
        }
        res.status(500).json({ message: 'Failed to create review.' });
    }
};

export const getReviews = async (req, res) => {
    try {
        const reviews = await prisma.review.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                product: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        res.json(reviews);
    } catch (error) {
        console.error('Get reviews error:', error);
        res.status(500).json({ message: 'Failed to fetch reviews.' });
    }
};

export const deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;

        await prisma.review.delete({
            where: { id: reviewId },
        });

        res.status(200).json({ message: 'Review deleted successfully.' });
    } catch (error) {
        console.error('Delete review error:', error);
        res.status(500).json({ message: 'Failed to delete review.' });
    }
};

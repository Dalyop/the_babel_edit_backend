import prisma from "../prismaClient.js";

export const getCollections = async (req, res) => {
    const collections = await prisma.collection.findMany();
    res.json(collections);   
};

export const getProductsByCollection = async (req, res) => {
    const { name } = req.params;
    const collection = await prisma.collection.findUnique({
        where: { name },
        include: { products: true },
    });
    if (!collection) return res.status(404).json({error: "Collection not found"});
    res.json(collection.products);
};
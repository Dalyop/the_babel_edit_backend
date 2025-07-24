import express from "express";
import { getCollections, getProductsByCollection } from "../controllers/collectionController.js";
import { getProducts, getProductById, createProduct } from "../controllers/productController.js";

const router = express.Router();

router.get('/collections', getCollections);
router.get('/collections/:name/products', getProductsByCollection);

router.get('/products', getProducts);
router.get('/products/:id', getProductById);
router.post('/products', createProduct);

export default router;
import express from "express";
import { protectRoute, admin } from "../middlewares/auth.middleware.js";
import {
  createProduct,
  deleteProduct,
  getBestSellingProducts,
  getNewArrivals,
  getProductById,
  getProducts,
  getSimilarProducts,
  updateProduct,
} from "../controllers/product.controller.js";
const router = express.Router();
// Public routes - no authentication required
router.get("/", getProducts); // Product list accessible to all
router.get("/best-seller", getBestSellingProducts);
router.get("/new-arrivals", getNewArrivals);
router.get("/:id", getProductById);
router.get("/similar/:id", getSimilarProducts);

// Protected routes - only admins can create, update, delete
router.post("/", protectRoute, admin, createProduct);
router.put("/:id", protectRoute, admin, updateProduct);
router.delete("/:id", protectRoute, admin, deleteProduct);

export default router;

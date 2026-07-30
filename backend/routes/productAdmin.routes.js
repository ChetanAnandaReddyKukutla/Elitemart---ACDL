import express from "express";
import Product from "../models/product.model.js";
import { admin, protectRoute } from "../middlewares/auth.middleware.js";

const router = express.Router();

// @GET /api/admin/products
// @desc Gell all products (Admin only)
// @access Private/Admin
router.get("/", protectRoute, admin, async (req, res) => {
  try {
    const products = await Product.find({});
    res.json(products);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
});

export default router;

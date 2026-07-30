import express from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import {
  addCart,
  deleteProduct,
  getUserCart,
  guestToUserCart,
  updateProductQuantity,
} from "../controllers/cart.controller.js";
const router = express.Router();

router.post("/", addCart);
router.put("/", updateProductQuantity);
router.delete("/", deleteProduct);
router.get("/", getUserCart);
router.post("/merge", protectRoute,guestToUserCart);
export default router;
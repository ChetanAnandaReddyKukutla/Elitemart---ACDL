import express from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import { getOrderDetails, myOrders } from "../controllers/order.controller.js";
const router = express.Router();
router.get("/my-orders", protectRoute, myOrders);
router.get("/:id", protectRoute, getOrderDetails);
export default router;
 
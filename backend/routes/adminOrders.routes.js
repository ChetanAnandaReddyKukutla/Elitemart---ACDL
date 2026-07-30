import express from "express";
import Order from "../models/order.model.js";
import { admin, protectRoute } from "../middlewares/auth.middleware.js";

const router = express.Router();

// @route GET /api/admin/orders
// @desc Get all orders (Admin Only)
// @access Private/Admin

router.get("/", protectRoute, admin, async (req, res) => {
  try {
    const orders = await Order.find({}).populate("user", "name email");
    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// @route PUT /api/admin/orders/:id
// @desc Update order status (Admin Only)
// @access Private/Admin

router.put("/:id", protectRoute, admin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("user","name");
    if (order) {
      order.status = req.body.status || order.status;
      order.isDelivered =
        req.body.status === "Delivered" ? true : order.isDelivered;
      order.deliveredAt =
        req.body.status === "Delivered" ? Date.now() : order.deliveredAt;

      const updatedOrder = await order.save();
      res.json(updatedOrder);
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// @route DELETE /api/admin/orders
// @desc Delete all orders (Admin Only)
// @access Private/Admin

router.delete("/:id", protectRoute, admin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (order) {
      await order.deleteOne();
      res.json({ message: "Order removed" });
    } else {
      res.status(400).json({ message: "Order not found" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
});

export default router;

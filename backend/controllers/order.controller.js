import mongoose from "mongoose";
import Order from "../models/order.model.js";
import {
  findLocalOrderById,
  listLocalOrdersForUser,
} from "../lib/localCheckoutStore.js";

const isDatabaseReady = () => mongoose.connection.readyState === 1;

export const myOrders = async (req, res) => {
  try {
    if (!isDatabaseReady()) {
      const localOrders = await listLocalOrdersForUser(req.user._id);
      return res.json(localOrders.sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt)));
    }

    const orders = await Order.find({ user: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(orders);
  } catch (error) {
    console.log("Error in myOrders Controller ", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getOrderDetails = async (req, res) => {
  try {
    if (!isDatabaseReady()) {
      const order = await findLocalOrderById(req.params.id);

      if (!order) {
        return res.status(404).json({ message: "Order is not found" });
      }

      return res.json(order);
    }

    const order = await Order.findById(req.params.id).populate(
      "user",
      "name email"
    );
    if (!order) {
      return res.status(404).json({ message: "Order is not found" });
    }
    res.json(order);
  } catch (error) {
    console.log("Error in getOrderDetails Controller ", error);
    res.status(500).json({ message: "Server Error" });
  }
};

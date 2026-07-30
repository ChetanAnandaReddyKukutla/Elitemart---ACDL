import mongoose from "mongoose";
import Cart from "../models/cart.model.js";
import Checkout from "../models/checkout.model.js";
import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import {
  createLocalCheckout,
  finalizeLocalCheckout,
  updateLocalCheckoutPayment,
} from "../lib/localCheckoutStore.js";

const isDatabaseReady = () => mongoose.connection.readyState === 1;

const enrichCheckoutItems = async (checkoutItems) =>
  Promise.all(
    checkoutItems.map(async (item) => {
      const product = await Product.findById(item.productId);
      if (!product) {
        return {
          ...item,
          sku: item.sku || String(item.productId || ""),
          category: item.category || "unknown",
          brand: item.brand || "unknown",
          currencyCode: item.currencyCode || "USD",
        };
      }

      return {
        ...item,
        name: item.name || product.name,
        image: item.image || product.images?.[0]?.url || "",
        price: item.price || product.price,
        sku: item.sku || product.sku,
        category: item.category || product.category,
        brand: item.brand || product.brand,
        currencyCode: item.currencyCode || "USD",
      };
    })
  );

export const createCheckOut = async (req, res) => {
  const { checkoutItems, shippingAddress, paymentMethod, totalPrice } =
    req.body;
  if (!checkoutItems || checkoutItems.length === 0) {
    return res.status(400).json({ message: "no items in checkout" });
  }
  try {
    if (!isDatabaseReady()) {
      const checkout = await createLocalCheckout({
        user: req.user._id,
        checkoutItems,
        shippingAddress,
        paymentMethod,
        totalPrice,
      });
      return res.status(201).json(checkout);
    }

    const enrichedCheckoutItems = await enrichCheckoutItems(checkoutItems);
    const newCheckout = await Checkout.create({
      user: req.user._id,
      checkoutItems: enrichedCheckoutItems,
      shippingAddress,
      paymentMethod,
      totalPrice,
      paymentStatus: "Pending",
      isPaid: false,
    });
    console.log(`Checkout created for user: ${req.user._id}`);
    res.status(201).json(newCheckout);
  } catch (error) {
    console.log("Error in createCheckOut Controller ", error);
    res.status(500).send("Server Error");
  }
};
export const updateCheckout = async (req, res) => {
  const { paymentStatus, paymentDetails } = req.body;
  try {
    if (!isDatabaseReady()) {
      const checkout = await updateLocalCheckoutPayment(req.params.id, {
        paymentStatus,
        paymentDetails,
      });

      if (!checkout) {
        return res.status(404).json({ message: "Checkout not found" });
      }

      return res.status(200).json(checkout);
    }

    const checkout = await Checkout.findById(req.params.id);
    if (!checkout)
      return res.status(404).json({ message: "Checkout not found" });
    if (paymentStatus === "paid") {
      checkout.isPaid = true;
      checkout.paymentStatus = paymentStatus;
      checkout.paymentDetails = paymentDetails;
      checkout.paidAt = Date.now();
      await checkout.save();
      res.status(200).json(checkout);
    } else {
      res.status(400).json({ message: "Invalid Payment Status" });
    }
  } catch (error) {
    console.log("Error in updateCheckout Controller ", error);
    res.status(500).send("Server Error");
  }
};
export const finalizeCheckout = async (req, res) => {
  try {
    if (!isDatabaseReady()) {
      const finalOrder = await finalizeLocalCheckout(req.params.id);

      if (!finalOrder) {
        return res.status(404).json({ message: "Checkout not found" });
      }

      return res.status(201).json(finalOrder);
    }

    const checkout = await Checkout.findById(req.params.id);
    if (!checkout)
      return res.status(404).json({ message: "Checkout not found" });
    if (checkout.isPaid && !checkout.isFinalized) {
      const finalOrder = await Order.create({
        user: checkout.user,
        orderItems: checkout.checkoutItems,
        shippingAddress: checkout.shippingAddress,
        paymentMethod: checkout.paymentMethod,
        totalPrice: checkout.totalPrice,
        isPaid: true,
        paidAt: checkout.paidAt,
        isDelivered: false,
        paymentStatus: "paid",
        paymentDetails: checkout.paymentDetails,
      });

      checkout.isFinalized = true;
      checkout.finalizedAt = Date.now();
      await checkout.save();
      await Cart.findOneAndDelete({ user: checkout.user });
      res.status(201).json(finalOrder);
    } else if (checkout.isFinalized) {
      res.status(400).json({ message: "Checkout already finalized" });
    } else {
      res.status(400).json({ message: "Checkout is not paid" });
    }
  } catch (error) {
    console.log("Error in finalizedCheckout Controller ", error);
    res.status(500).send("Server Error");
  }
};

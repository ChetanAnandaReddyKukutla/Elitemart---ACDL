import mongoose from "mongoose";
import CartItemSchema from "./cartItem.model.js";
const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    guestId: {
      type: String,
    },
    products: [CartItemSchema],
    totalPrice: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true }
);
const Cart = mongoose.model("Cart", cartSchema);
export default Cart;
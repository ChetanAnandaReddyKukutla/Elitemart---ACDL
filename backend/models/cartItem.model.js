import mongoose from "mongoose";
const cartItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: String,
    image: String,
    price: String,
    sku: String,
    category: String,
    brand: String,
    currencyCode: {
      type: String,
      default: "USD",
    },
    size: String,
    color: String,
    quantity: {
      type: Number,
      default: 1,
    },
  },
  { _id: false }
);
export default cartItemSchema

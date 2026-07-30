import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./models/product.model.js";
import User from "./models/user.model.js";
import products from "./data/products.js";
import CartItem from "./models/cartItem.model.js";
import Cart from "./models/cart.model.js";
dotenv.config();
mongoose.connect(process.env.MONGO_URI);
const seedData = async () => {
  try {
    // Clear existing data
    await Product.deleteMany();
    await User.deleteMany();
    await Cart.deleteMany();

    // Create a default admin user
    const createdUser = await User.create({
      name: "Admin User",
      email: "admin@elitekart.com",
      password: "123456",
      role: "admin",
    });

    //Assign the default user ID to each product
    const userID = createdUser._id;
    const sampleProducts = products.map((product) => {
      return { ...product, user: userID };
    });

    //Insert the products into the database
    await Product.insertMany(sampleProducts);
    console.log("Product data seeded successfully");
    process.exit();
  } catch (error) {
    console.log("Error in seeder ", error);
    process.exit(1);
  }
};

seedData();

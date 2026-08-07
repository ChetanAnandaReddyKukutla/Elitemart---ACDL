import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import compression from "compression";

// DB Connection
import connectDB from "./config/db.js";

// Routes
import userRoutes from "./routes/user.routes.js";
import productRoute from "./routes/product.routes.js";
import cartRoute from "./routes/cart.routes.js";
import checkoutRoute from "./routes/checkout.routes.js";
import orderRoute from "./routes/order.routes.js";
import uploadRoute from "./routes/upload.routes.js";
import subscribeRoute from "./routes/subscribe.route.js";
import adminRoute from "./routes/admin.routes.js";
import productAdminRoute from "./routes/productAdmin.routes.js";
import adminOrdersRoute from "./routes/adminOrders.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize
dotenv.config({ path: path.join(__dirname, "../.env") });
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Helmet CSP Configuration
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc: [
          "'self'",
          "data:",
          "https://picsum.photos",
          "https://fastly.picsum.photos",
          "https://res.cloudinary.com",
        ],
        connectSrc: [
          "'self'",
          process.env.CLIENT_URL || "http://localhost:3000",
        ],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
  })
);

app.use(compression());

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/products", productRoute);
app.use("/api/cart", cartRoute);
app.use("/api/checkout", checkoutRoute);
app.use("/api/orders", orderRoute);
app.use("/api/upload", uploadRoute);
app.use("/api", subscribeRoute);

// Admin Routes
app.use("/api/admin/users", adminRoute);
app.use("/api/admin/products", productAdminRoute);
app.use("/api/admin/orders", adminOrdersRoute);

// Serve frontend static files (Vite build)
const frontendPath = path.join(__dirname, "../frontend/dist");
app.use(express.static(frontendPath));

// Correct SPA fallback route
app.get("/{*any}", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

// Start Server
const PORT = process.env.PORT || 5000;
const startServer = async () => {
  const isProduction = process.env.NODE_ENV === "production";

  try {
    await connectDB();
  } catch (error) {
    console.error("Database connection failed:", error.message);

    if (isProduction) {
      console.error("Backend startup failed in production mode.");
      process.exit(1);
    }

    console.warn(
      "Starting backend without database connection (development mode)."
    );
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server is running at http://localhost:${PORT}`);
  });
};

startServer();

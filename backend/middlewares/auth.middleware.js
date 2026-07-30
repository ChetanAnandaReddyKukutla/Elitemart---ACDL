import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/user.model.js";
import {
  findLocalUserById,
  getSanitizedLocalUser,
} from "../lib/localAuthStore.js";

const isDatabaseReady = () => mongoose.connection.readyState === 1;

export const protectRoute = async (req, res, next) => {
  try {
    // Try cookie first
    let token = req.cookies?.jwt;

    // If not in cookie, try Authorization header
    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    let user;
    if (isDatabaseReady()) {
      user = await User.findById(decoded.id).select("-password");
    } else {
      const localUser = await findLocalUserById(decoded.id);
      user = localUser ? getSanitizedLocalUser(localUser) : null;
    }

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error(`Error in protectRoute: ${error.message}`);
    return res
      .status(403)
      .json({ error: "Forbidden: Invalid or expired token" });
  }
};


export const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Unauthorized User" });
  }
};

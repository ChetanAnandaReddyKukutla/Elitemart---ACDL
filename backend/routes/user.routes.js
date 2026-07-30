import express from "express";
import { getProfile, login, signUp } from "../controllers/user.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";

const router = express.Router();
router.post("/register", signUp);
router.post("/login",login);
router.get("/profile",protectRoute,getProfile)
export default router;

import express from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import { createCheckOut, finalizeCheckout, updateCheckout } from "../controllers/checkout.controller.js";
const router = express.Router();
router.post("/",protectRoute,createCheckOut)
router.put("/:id/pay",protectRoute,updateCheckout)
router.post("/:id/finalize",protectRoute,finalizeCheckout)
export default router;

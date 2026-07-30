import express from "express";
import Subscriber from "../models/subscriber.model.js";
const router = express.Router();
router.post("/subscribe", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });
  try {
    let subscriber = await Subscriber.findOne({ email });
    if (subscriber) {
      return res.status(400).json({ message: "email is already subscribed" });
    }
    subscriber = new Subscriber.create({ email });
    await subscriber.save();
    res
      .status(201)
      .json({ message: "Successfully subscribed to the newsletter" });
  } catch (error) {
    console.log("Error in Subscribe route ", error);
    res.status(500).json({ message: "Server Error" });
  }
});
export default router;

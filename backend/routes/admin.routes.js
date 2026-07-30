import express from "express";
import { admin, protectRoute } from "../middlewares/auth.middleware.js";
import User from "../models/user.model.js";

const router = express.Router();

// @route GET /api/admin/users
// @desc Get all users(Admin only)
// @access Private/Admin
router.get("/", protectRoute, admin, async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// @route POST /api/admin/users
// @desc Add a new user(Admin Only)
// @access Private/Admin
router.post("/", protectRoute, admin, async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be atleast 6 letters" });
    }
    user = new User({
      name,
      email,
      password,
      role: role || "customer",
    });
    await user.save();
    res.status(201).json({ message: "User Created Successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// @route PUT /api/admin/users/:id
// @desc Update user info (admin only) - Name, email and role
// @access Private/Admin
router.put("/:id", protectRoute, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.role = req.body.role || user.role;
    }
    const updatedUser = user.save();
    res.json({ message: "User Updated Successfully", user: user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// @route DELETE /api/admin/users/:id
// @desc Delete a user
// @access Private/Admin
router.delete("/:id", protectRoute, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      await user.deleteOne();
      res.json({ message: "User deleted successfully" });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
});

export default router;

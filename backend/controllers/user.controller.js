import generateTokenAndSetCookie from "../lib/util/generateToken.js";
import User from "../models/user.model.js";
import mongoose from "mongoose";
import {
  createLocalUser,
  findLocalUserByEmail,
  getSanitizedLocalUser,
  verifyLocalUserPassword,
} from "../lib/localAuthStore.js";

const isDatabaseReady = () => mongoose.connection.readyState === 1;

export const signUp = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    if (!isDatabaseReady()) {
      try {
        const user = await createLocalUser({ name, email, password });
        const payload = { id: user._id, role: user.role };
        const token = generateTokenAndSetCookie(payload, res);

        return res.status(201).json({
          user: getSanitizedLocalUser(user),
          token,
          message: "Successfully Created",
        });
      } catch (localError) {
        return res
          .status(localError.statusCode || 500)
          .json({ message: localError.message || "Server Error" });
      }
    }

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "User already exists" });

    user = new User({ name, email, password });
    await user.save();

    const payload = { id: user._id, role: user.role };
    const token = generateTokenAndSetCookie(payload, res);

    res.status(201).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
      message: "Successfully Created",
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!isDatabaseReady()) {
      const user = await findLocalUserByEmail(email);
      if (!user) {
        return res.status(400).json({ message: "Invalid Credentials" });
      }

      const isMatch = await verifyLocalUserPassword(user, password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid Password" });
      }

      const payload = { id: user._id, role: user.role || "customer" };
      const token = generateTokenAndSetCookie(payload, res);

      return res.status(200).json({
        user: getSanitizedLocalUser(user),
        token,
        message: "Logged in Successfully",
      });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid Credentials" });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(400).json({ message: "Invalid Password" });

    const payload = { id: user._id, role: user.role };
    const token=generateTokenAndSetCookie(payload, res);

    res.status(200).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
      message: "Logged in Successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};

export const getProfile = async (req, res) => {
  if (!isDatabaseReady()) {
    return res.status(200).json(req.user);
  }

  res.status(200).json(req.user);
};

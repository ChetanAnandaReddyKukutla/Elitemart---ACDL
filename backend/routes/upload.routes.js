import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";
import dotenv from "dotenv";
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });
router.post("/", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file Uploaded" });
    }
    const streamUpload = (fileBuffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream((err, res) => {
          if (res) {
            resolve(res);
          } else {
            reject(err);
          }
        });
        streamifier.createReadStream(fileBuffer).pipe(stream);
      });
    };
    const result = await streamUpload(req.file.buffer);
    res.json({ imageUrl: result.secure_url });
  } catch (error) {
    console.log("Error in uploadRoute ", error);
    res.status(500).json({ message: "Server Error" });
  }
});
export default router;

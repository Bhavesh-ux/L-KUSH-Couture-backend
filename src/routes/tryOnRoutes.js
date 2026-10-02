import express from "express";
import upload from "../middleware/uploadMiddleware.js";
import { testGemini } from "../config/gemini.js";


const router = express.Router();

router.get("/test-gemini", async (req, res, next) => {
  try {
    const result = await testGemini();

    res.json({
      success: true,
      message: result,
    });
  } catch (error) {
    next(error);
  }
});

router.post(
  "/upload",
  upload.single("userImage"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "User image is required",
      });
    }

    res.status(200).json({
      success: true,
      message: "User image received successfully",
      data: {
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
      },
    });
  }
);

export default router;
import { fileTypeFromBuffer } from "file-type";

const validateImage = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next();
    }

    const allowedTypes = ["jpg", "png", "webp"];

    for (const file of req.files) {
      const fileType = await fileTypeFromBuffer(file.buffer);

      if (!fileType || !allowedTypes.includes(fileType.ext)) {
        return res.status(400).json({
          success: false,
          message: "Invalid image file",
        });
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

export default validateImage;
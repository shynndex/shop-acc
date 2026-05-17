import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../../libs/cloudinary.config.js";
import multer from "multer";
import { generateId } from "../../utils/generateId.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    // Tạo unique folder name theo date + random
    const date = new Date().toISOString().split("T")[0];

    return {
      folder: `shop_acc/accounts/${date}`, // Tổ chức ảnh theo ngày
      allowed_formats: ["jpg", "png", "jpeg", "webp", "gif"],
      transformation: [
        { width: 1200, height: 1200, crop: "limit" }, // Giới hạn kích thước tối đa
        { quality: "auto:good" }, // Tự động nén chất lượng tốt
        { fetch_format: "auto" }, // Tự động chọn format tối ưu (WebP)
      ],
      public_id: `${generateId()}`,
    };
  },
});

// File filter: chỉ chấp nhận image
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|gif/;
  const extname = allowedTypes.test(file.originalname.toLowerCase());
  const mimeType = allowedTypes.test(file.mimeType);

  if (extname || mimeType) {
    cb(null, true);
  } else {
    cb(new Error("Chỉ chấp nhận file ảnh (JPEG, PNG, WebP, GIF)"), false);
  }
};

// Tạo multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});

export default upload;

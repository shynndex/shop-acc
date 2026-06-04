import express from "express";
import {
  adminProtect,
  requireRole,
} from "../../middlewares/admin/auth.middleware.js";
import {
  deleteImage,
  deleteImages,
  uploadImage,
} from "../../controllers/admin/cloudinary.controller.js";
import upload, {
  validateUploadedFile,
} from "../../middlewares/admin/upload.middleware.js";
import { adminLimiter } from "../../middlewares/rateLimiter.middleware.js";

const router = express.Router();

// 🛡️ Rate limit + auth
router.use(adminLimiter);
router.use(adminProtect);

// Upload 1 ảnh
// POST /api/admin/upload
// Body: FormData với field "file"
// Validation chain: multer (extension + MIME) → validateUploadedFile (magic bytes) → controller (Cloudinary upload)
router.post("/", upload.single("file"), validateUploadedFile, uploadImage);

//  Xóa 1 ảnh
// DELETE /api/admin/upload
// Body: { public_id: "folder/image_name" }
router.delete("/", deleteImage);

// Xóa nhiều ảnh (optional)
// POST /api/admin/upload/delete-many
// Body: { public_ids: ["id1", "id2"] }
router.post("/delete-many", deleteImages);

export default router;

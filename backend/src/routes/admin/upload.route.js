import express from "express";
import {
  adminProtect,
  requireRole,
} from "../../middlewares/admin/auth.middleware.js";
import { handleUpload } from "../../middlewares/admin/upload.middleware.js";
import {
  deleteImage,
  deleteImages,
  uploadImage,
} from "../../controllers/admin/cloudinary.controller.js";

const router = express.Router();

// Tất cả route đều cần admin authentication
router.use(adminProtect);

// Upload 1 ảnh
// POST /api/admin/upload
// Body: FormData với field "file"
router.post("/", upload.single("file"), uploadImage);

//  Xóa 1 ảnh
// DELETE /api/admin/upload
// Body: { public_id: "folder/image_name" }
router.delete("/", deleteImage);

// Xóa nhiều ảnh (optional)
// POST /api/admin/upload/delete-many
// Body: { public_ids: ["id1", "id2"] }
router.post("/delete-many", deleteImages);

export default router;

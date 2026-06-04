import cloudinary from "../../libs/cloudinary.config.js";
import { asyncHandler, AppError } from "../../middlewares/errorHandler.js";
import { generateId } from "../../utils/generateId.js";

// Upload ảnh với memory storage + magic bytes validation trước khi lên Cloudinary
export const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError("Vui lòng chọn file ảnh", 400);
  }

  // ── Upload buffer lên Cloudinary ─────────────────────────────────
  const date = new Date().toISOString().split("T")[0];
  const fileName = `${generateId()}`;

  const result = await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `shop_acc/accounts/${date}`,
        public_id: fileName,
        allowed_formats: ["jpg", "png", "jpeg", "webp", "gif"],
        transformation: [
          { width: 1200, height: 1200, crop: "limit" },
          { quality: "auto:good" },
          { fetch_format: "auto" },
        ],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      },
    );
    // Stream the buffer to Cloudinary
    uploadStream.end(req.file.buffer);
  });

  // ── Phân loại định dạng ảnh về chuẩn (jpeg → jpg) ───────────────
  const format = result.format === "jpeg" ? "jpg" : result.format;

  res.status(201).json({
    success: true,
    message: "Upload thành công",
    data: {
      secure_url: result.secure_url,
      public_id: result.public_id,
      format,
      size: result.bytes,
      original_name: req.file.originalname,
    },
  });
});

//  Xóa ảnh khỏi Cloudinary bằng public_id
export const deleteImage = asyncHandler(async (req, res) => {
  const { public_id } = req.body;

  if (!public_id) {
    throw new AppError("Thiếu public_id để xóa ảnh", 400);
  }

  const result = await cloudinary.uploader.destroy(public_id);

  if (result.result !== "ok") {
    console.warn("[Cloudinary Delete] Result:", result);
  }

  res.json({
    success: true,
    message: "Đã xóa ảnh khỏi Cloudinary",
    result: result.result,
  });
});

//  Xóa nhiều ảnh (bulk delete)

export const deleteImages = asyncHandler(async (req, res) => {
  const { public_ids } = req.body;

  if (!Array.isArray(public_ids) || public_ids.length === 0) {
    throw new AppError("public_ids phải là mảng không rỗng", 400);
  }

  const result = await cloudinary.api.delete_resources(public_ids, {
    type: "upload",
    resource_type: "image",
  });

  res.json({
    success: true,
    message: `Đã xử lý xóa ${public_ids.length} ảnh`,
    deleted: result.deleted, // Object { "public_id": "deleted" }
    errors: result.errors, // Object { "public_id": "not_found" }
  });
});

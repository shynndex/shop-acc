import cloudinary from "../../libs/cloudinary.config.js";
import { asyncHandler, AppError } from "../../middlewares/errorHandler.js";

// Upload ảnh (middleware 'upload' đã handle mọi thứ)
export const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError("Vui lòng chọn file ảnh", 400);
  }

  // Cloudinary đã upload xong, trả về result trong req.file
  const { secure_url, public_id, format, bytes, original_name } = req.file;

  res.json({
    success: true,
    message: "Upload thành công",
    data: {
      secure_url, // URL HTTPS để dùng ngay
      public_id, // ID để xóa sau này
      format, // jpg/png/webp
      size: bytes, // Kích thước file
      original_name,
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

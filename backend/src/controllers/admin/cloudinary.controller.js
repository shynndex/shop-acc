import cloudinary from "../../libs/cloudinary.config";

// Upload ảnh (middleware 'upload' đã handle mọi thứ)
export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Vui lòng chọn file ảnh" });
    }

    // Cloudinary đã upload xong, trả về result trong req.file
    const { path, secure_url, public_id, format, bytes } = req.file;

    res.json({
      success: true,
      message: "Upload thành công",
      data: {
        url,
        secure_url, // URL HTTPS để dùng ngay
        public_id, // ID để xóa sau này
        format, // jpg/png/webp
        size: bytes, // Kích thước file
        orginal_name: req.file.orginal_name,
      },
    });
  } catch (error) {
    console.error("[Cloudinary Upload] Error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi upload ảnh lên Cloudinary",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

//  Xóa ảnh khỏi Cloudinary bằng public_id
export const deleteImage = async (req, res) => {
  try {
    const { public_id } = req.body;

    if (!public_id) {
      return res.status(400).json({
        success: false,
        message: "Thiếu public_id để xóa ảnh",
      });
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
  } catch (error) {
    console.error("[Cloudinary Delete] Error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi xóa ảnh khỏi Cloudinary",
    });
  }
};

//  Xóa nhiều ảnh (bulk delete)

export const deleteImages = async (req, res) => {
  try {
    const { public_id } = req.body;

    if (!Array.isArray(public_id) || public_id.length === 0) {
      return res.status(400).json({
        success: false,
        message: "public_ids phải là mảng không rỗng",
      });
    }

    const result = await cloudinary.api.delete_resources(public_ids, {
      type: "upload",
      resource_type: "image",
    });

    res.json({
      success: true,
      message: `Đã xử lý xóa ${public_id.length} ảnh`,
      deleted: result.deleted, // Object { "public_id": "deleted" }
      errors: result.errors, // Object { "public_id": "not_found" }
    });
  } catch (error) {
    console.error("[Cloudinary Bulk Delete] Error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi xóa nhiều ảnh",
    });
  }
};

import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../../libs/cloudinary.config.js";
import multer from "multer";
import { generateId } from "../../utils/generateId.js";
import {
  validateImageMagicBytes,
  ALLOWED_IMAGE_MIMES,
  ALLOWED_IMAGE_EXTENSIONS,
} from "../../utils/validateImage.js";

/**
 * Maximum image dimensions (width or height).
 * Images exceeding this will be rejected before Cloudinary upload.
 */
const MAX_IMAGE_DIMENSION = 4000;
const MAX_IMAGE_PIXELS = 16_000_000; // ~16MP (4000×4000 max)

// ── Sharp (dimension validation) — lazy-loaded ─────────────────────────
let sharpInstance = null;
let sharpWarned = false;
async function getSharp() {
  if (sharpInstance === null) {
    try {
      sharpInstance = (await import("sharp")).default;
    } catch {
      if (!sharpWarned) {
        console.warn("[Upload] sharp not installed — dimension validation skipped");
        sharpWarned = true;
      }
      sharpInstance = false; // Mark as unavailable
    }
  }
  return sharpInstance;
}

/**
 * Cloudinary storage configuration.
 * Images are only uploaded to Cloudinary AFTER passing all validation
 * (extension, MIME, and magic bytes checks in fileFilter + validateUploadedFile middleware).
 */
const cloudinaryStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const date = new Date().toISOString().split("T")[0];
    return {
      folder: `shop_acc/accounts/${date}`,
      // Cloudinary-level allowed formats (additional safety net)
      allowed_formats: ["jpg", "png", "jpeg", "webp", "gif"],
      transformation: [
        { width: 1200, height: 1200, crop: "limit" },
        { quality: "auto:good" },
        { fetch_format: "auto" },
      ],
      public_id: `${generateId()}`,
    };
  },
});

/**
 * Use memory storage so we can validate magic bytes BEFORE uploading to Cloudinary.
 * The actual upload to Cloudinary is handled by uploadToCloudinary middleware.
 */
const memoryStorage = multer.memoryStorage();

/**
 * File filter: validates file by extension and MIME type.
 *
 * Defence-in-depth layer 1 & 2:
 *   1. Extension check (.jpg, .png, .webp, .gif)
 *   2. MIME type check (image/jpeg, image/png, etc.)
 *   Layer 3 (magic bytes) is done in validateUploadedFile middleware below.
 */
const fileFilter = (req, file, cb) => {
  // ── Extension check ──────────────────────────────────────────────
  const extMatch = ALLOWED_IMAGE_EXTENSIONS.test(
    file.originalname.toLowerCase(),
  );
  if (!extMatch) {
    return cb(
      new Error(
        "Đuôi file không hợp lệ. Chỉ chấp nhận: JPG, PNG, WebP, GIF",
      ),
      false,
    );
  }

  // ── MIME type check (fixed: file.mimetype, not file.mimeType) ────
  if (!ALLOWED_IMAGE_MIMES.includes(file.mimetype)) {
    return cb(
      new Error(
        `Kiểu file không hợp lệ: ${file.mimetype}. Chỉ chấp nhận file ảnh.`,
      ),
      false,
    );
  }

  cb(null, true);
};

/**
 * Multer instance with memory storage.
 * File buffer is available at req.file.buffer after this middleware.
 */
const upload = multer({
  storage: memoryStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});

/**
 * POST-multer middleware: validates uploaded file's magic bytes + dimensions.
 *
 * Defence-in-depth layer 3 & 4:
 *   3. Reads the first bytes of the file buffer to verify actual content
 *      matches the declared format (prevents renamed .exe → .jpg attacks).
 *   4. Reads image dimensions via sharp to reject oversized images
 *      (prevents memory DoS via massive image dimensions).
 *
 * Must be used AFTER upload.single("file") and BEFORE the controller.
 *
 * Usage: router.post("/", upload.single("file"), validateUploadedFile, controller);
 */
export async function validateUploadedFile(req, res, next) {
  if (!req.file) {
    return next(); // No file to validate (handled by controller)
  }

  // Must have buffer with memoryStorage
  if (!req.file.buffer || req.file.buffer.length === 0) {
    return next(new Error("File rỗng hoặc không đọc được nội dung"));
  }

  // Layer 3: Magic bytes validation
  const magicCheck = validateImageMagicBytes(req.file.buffer);
  if (!magicCheck.valid) {
    return next(new Error(`Nội dung file không hợp lệ: ${magicCheck.reason}`));
  }

  // Layer 4: Dimension validation via sharp (optional — graceful fallback if not installed)
  const sharpLib = await getSharp();
  if (sharpLib) {
    try {
      const metadata = await sharpLib(req.file.buffer).metadata();

      if (!metadata.width || !metadata.height) {
        return next(new Error("Không thể đọc kích thước ảnh"));
      }

      if (metadata.width > MAX_IMAGE_DIMENSION || metadata.height > MAX_IMAGE_DIMENSION) {
        return next(
          new Error(
            `Kích thước ảnh quá lớn (${metadata.width}x${metadata.height}). ` +
            `Tối đa ${MAX_IMAGE_DIMENSION}x${MAX_IMAGE_DIMENSION}px.`,
          ),
        );
      }

      const totalPixels = metadata.width * metadata.height;
      if (totalPixels > MAX_IMAGE_PIXELS) {
        return next(
          new Error(
            `Ảnh có quá nhiều pixel (${totalPixels.toLocaleString()}px). ` +
            `Tối đa ${MAX_IMAGE_PIXELS.toLocaleString()}px.`,
          ),
        );
      }

      // Attach metadata for controller use (optional)
      req.imageMetadata = {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: req.file.buffer.length,
      };
    } catch (err) {
      return next(new Error("Không thể xử lý file ảnh. File có thể bị hỏng."));
    }
  } else if (!sharpWarned) {
    // sharp not available — warn once, then skip silently
    console.warn("[Upload] Skipping dimension validation (sharp not installed)");
    sharpWarned = true;
  }

  next();
}

export default upload;

/**
 * Image Magic Bytes Validation
 *
 * Validates that a file buffer starts with the correct magic bytes
 * (file signature) for common image formats. This prevents attacks
 * where a malicious file (e.g., .exe, .php) is renamed to look like
 * an image and uploaded.
 *
 * Supported formats: JPEG, PNG, WebP, GIF
 */

// Magic byte signatures for supported image formats
const MAGIC_BYTES = {
  /** JPEG: starts with FF D8 FF */
  jpeg: [[0xff, 0xd8, 0xff]],
  /** PNG: starts with 89 50 4E 47 0D 0A 1A 0A */
  png: [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  /** WebP: RIFF .... WEBP (starts with RIFF, WEBP at offset 8) */
  webp: [
    [0x52, 0x49, 0x46, 0x46],
    null, // skip 4 bytes (file size)
    [0x57, 0x45, 0x42, 0x50],
  ],
  /** GIF87a or GIF89a */
  gif: [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61],
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61],
  ],
};

/**
 * Check if a sub-array of bytes matches at a given offset in the buffer.
 * A `null` signature means "skip this many bytes" (for WebP's RIFF format
 * where the file size is between the RIFF and WEBP markers).
 */
function bytesMatch(buffer, signature, offset) {
  if (signature === null) return true; // skip segment
  for (let i = 0; i < signature.length; i++) {
    if (offset + i >= buffer.length || buffer[offset + i] !== signature[i]) {
      return false;
    }
  }
  return true;
}

/**
 * Validate that a file buffer matches the magic bytes of a supported
 * image format.
 *
 * @param {Buffer} buffer - The file content buffer
 * @returns {{ valid: boolean, format?: string, reason?: string }}
 */
export function validateImageMagicBytes(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 4) {
    return { valid: false, reason: "File quá nhỏ hoặc không hợp lệ" };
  }

  // Check each format
  const checks = [
    { format: "jpeg", signatures: MAGIC_BYTES.jpeg },
    { format: "png", signatures: MAGIC_BYTES.png },
    { format: "webp", signatures: MAGIC_BYTES.webp },
    { format: "gif", signatures: MAGIC_BYTES.gif },
  ];

  for (const { format, signatures } of checks) {
    let offset = 0;
    let matched = true;

    for (const sig of signatures) {
      if (!bytesMatch(buffer, sig, offset)) {
        matched = false;
        break;
      }
      // Advance offset past this signature (for WebP: 4 bytes RIFF + 4 bytes skip + 4 bytes WEBP)
      if (sig === null) {
        offset += 4; // skip 4 bytes (file size in WebP)
      } else {
        offset += sig.length;
      }
    }

    if (matched) {
      return { valid: true, format };
    }
  }

  return { valid: false, reason: "File không phải ảnh hợp lệ (JPEG, PNG, WebP, GIF)" };
}

/**
 * MIME type map for validation
 */
export const ALLOWED_IMAGE_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

/**
 * Allowed image extensions
 */
export const ALLOWED_IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|gif)$/i;

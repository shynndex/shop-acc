import React, { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Input } from "../ui/input";
import { Link2, Upload, X } from "lucide-react";
import { Button } from "../ui/button";
import { toast } from "sonner";
import type { AccountImage } from "@/types/admin/account.type";
import { cloudinaryService } from "@/services/admin/cloudinary.service";

interface ImageUploadFieldProps {
  images: AccountImage[];
  setImages: React.Dispatch<React.SetStateAction<AccountImage[]>>;
  onImageUploaded?: (publicId: string) => void;
  onImageDelete?: (publicId: string) => void; // Callback khi xóa thành công
}

const ImageUploadField = ({
  images,
  setImages,
  onImageUploaded,
  onImageDelete, // api xóa ảnh
}: ImageUploadFieldProps) => {
  const [urlInput, setUrlInput] = useState("");

  //Cleanup object URLs khi unmount hoặc xóa ảnh
  useEffect(() => {
    return () => {
      images.forEach((img) => {
        if (img.file && img.preview.startsWith("blob:"))
          URL.revokeObjectURL(img.preview);
      });
    };
  }, [images]);

  // Upload từ máy
  const onDrop = async (acceptedFiles: File[]) => {
    const newImages: AccountImage[] = await Promise.all(
      acceptedFiles.map(async (file) => {
        const preview = URL.createObjectURL(file);

        const item: AccountImage = {
          id: crypto.randomUUID(),
          file,
          url: "",
          preview,
          isUploading: true,
        };

        try {
          const { url, public_id } = await cloudinaryService.uploadImage(file);

          URL.revokeObjectURL(preview);

          onImageUploaded?.(public_id);

          return {
            ...item,
            url,
            public_id,
            isUploading: false,
          };
        } catch (err: any) {
          toast.error("Upload ảnh thất bại");
          return {
            ...item,
            isUploading: false,
            error: err.message,
          };
        }
      }),
    );

    setImages((prev) => [...prev, ...newImages]);
  };

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp", ".gif"] },
      onDrop,
      onDropRejected(fileRejections) {
        fileRejections.forEach(({ file, errors }) => {
          const errorMsg = errors[0]?.message || "File không hợp lệ";
          toast.error(`"${file.name}": ${errorMsg}`);
        });
      },
      multiple: true,
      maxSize: 5 * 1024 * 1024, // 5mb
      // maxFiles: 5,
      disabled: images.some((i) => i.isUploading), // Disable khi đang upload
    });

  // Thêm bằng URL
  const handleAddUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;

    try {
      new URL(trimmed);
    } catch (error) {
      toast.error("URL không hợp lệ. Vui lòng nhập đúng định dạng https://...");
      return;
    }

    setImages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        url: trimmed,
        preview: trimmed,
      },
    ]);
    setUrlInput(""); // reset input
  };

  const removeImage = async (id: string) => {
    const img = images.find((i) => i.id === id);

    if (!img) return;
    // Cleanup blob URL

    if (img?.file && img.preview.startsWith("blob:")) {
      URL.revokeObjectURL(img.preview);
    }

    if (img?.public_id) {
      onImageDelete?.(img.public_id);
    }

    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary"}`}
      >
        <Input {...getInputProps()} />

        <Upload className="mx-auto mb-2 size-6 text-muted-foreground" />

        <p className="text-sm text-muted-foreground">
          {isDragActive
            ? "Thả ảnh vào đây..."
            : "Drag & drop ảnh hoặc click để chọn"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Hỗ trợ: JPG, PNG, WebP • Max 5MB/file
        </p>
      </div>

      {/* Input URL */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={urlInput}
            placeholder="https://example.com/image.jpg"
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddUrl()}
            className="pl-9"
            id="image-url"
          />
        </div>
        <Button type="button" onClick={handleAddUrl} variant="outline">
          Thêm URL
        </Button>
      </div>

      {/* Preview */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {images.map((image) => (
            <div
              key={image.id} // Dùng id thay vì index
              className="relative border rounded-lg overflow-hidden group"
            >
              <img
                src={image.preview}
                alt="preview"
                className="w-full h-32 object-cover"
                onError={(e) => {
                  // Fallback nếu ảnh lỗi
                  (e.target as HTMLImageElement).src =
                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2'%3E%3Crect x='3' y='3' width='18' height='18' rx='2'/%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'/%3E%3Cpath d='M21 15l-5-5L5 21'/%3E%3C/svg%3E";
                }}
              />

              {/* Loading overlay */}
              {image.isUploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="size-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {/* Delete button */}
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(image.id)}
              >
                <X className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUploadField;

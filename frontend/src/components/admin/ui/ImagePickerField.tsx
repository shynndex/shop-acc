import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Link, Trash2, Loader2, ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface ImagePickerFieldProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  placeholder?: string;
  aspectRatio?: string;
}

const ImagePickerField: React.FC<ImagePickerFieldProps> = ({
  value,
  onChange,
  label = "Ảnh",
  placeholder = "https://...",
  aspectRatio = "16/9",
}) => {
  const [urlInput, setUrlInput] = useState(value || "");
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState(value ? "url" : "upload");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) {
      toast.error("Vui lòng nhập URL");
      return;
    }
    onChange(urlInput.trim());
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file ảnh");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ảnh không được quá 5MB");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

      if (cloudName && uploadPreset) {
        // Direct upload to Cloudinary
        formData.append("upload_preset", uploadPreset);
        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          { method: "POST", body: formData },
        );
        const data = await res.json();
        if (data.secure_url) {
          onChange(data.secure_url);
          setUrlInput(data.secure_url);
          toast.success("Tải ảnh lên thành công");
        } else {
          throw new Error(data.error?.message || "Upload failed");
        }
      } else {
        // Fallback: use admin upload API
        const { adminApi } = await import("@/lib/adminAxios");
        const res = await adminApi.post("/upload/image", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const url = res.data?.data?.url || res.data?.url;
        if (url) {
          onChange(url);
          setUrlInput(url);
          toast.success("Tải ảnh lên thành công");
        } else {
          throw new Error("Upload failed");
        }
      }
    } catch (err: any) {
      toast.error(err?.message || "Tải ảnh lên thất bại");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleClear = () => {
    onChange("");
    setUrlInput("");
  };

  return (
    <div className="space-y-3">
      {label && <Label>{label}</Label>}

      {/* Preview */}
      {value ? (
        <div className="relative rounded-lg overflow-hidden border group">
          <div
            className="w-full bg-muted"
            style={{ aspectRatio }}
          >
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://placehold.co/400x225/e2e8f0/94a3b8?text=Invalid+Image";
              }}
            />
          </div>
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleClear}
              className="gap-1"
            >
              <Trash2 className="size-3.5" />
              Xoá ảnh
            </Button>
          </div>
        </div>
      ) : (
        <div
          className="border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/30"
          style={{ aspectRatio }}
        >
          <div className="text-center text-muted-foreground">
            <ImageIcon className="size-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Chưa có ảnh</p>
          </div>
        </div>
      )}

      {/* Upload / URL Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="upload" className="gap-1.5">
            <Upload className="size-3.5" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="url" className="gap-1.5">
            <Link className="size-3.5" />
            URL
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="pt-3">
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Đang tải lên...
                </>
              ) : (
                <>
                  <Upload className="mr-2 size-4" />
                  Chọn ảnh
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="url" className="pt-3">
          <div className="flex items-center gap-2">
            <Input
              placeholder={placeholder}
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={handleUrlSubmit}
              disabled={!urlInput.trim()}
            >
              OK
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ImagePickerField;

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatVND } from "@/lib/utils";
import { gameOptions, typeOptions } from "@/constant/account-options";
import { useAdminAccountStore } from "@/stores/useAdminAccountStore";
import type {
  Account,
  AccountImage,
  AccountType,
  CreateAccountPayload,
  GameType,
} from "@/types/admin/account.type";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";
import ImageUploadField from "../ImageUploadField";
import { cloudinaryService } from "@/services/admin/cloudinary.service";

interface AccountFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Account | null;
  onSuccess: () => void;
}

const getInitialData = (
  initialData?: Account | null,
): CreateAccountPayload => ({
  title: initialData?.title || "",
  game: initialData?.game || "lien-quan",
  price: initialData?.price || 0,
  type: initialData?.type || "standard",
  loginInfo: {
    username: initialData?.loginInfo?.username || "",
    password: initialData?.loginInfo?.password || "",
  },
  description: initialData?.description || "",
  attributes: initialData?.attributes || {},
  images: initialData?.images || [],
});

const AccountForm = ({
  open,
  onOpenChange,
  initialData,
  onSuccess,
}: AccountFormProps) => {
  const { createAccount, updateAccount, loading } = useAdminAccountStore();
  const isEdit = !!initialData;

  const [imageItems, setImageItems] = useState<AccountImage[]>([]);

  const uploadedPublicIds = useRef<Set<string>>(new Set());
  const isSubmitted = useRef(false);

  const [formData, setFormData] = useState<CreateAccountPayload>(
    getInitialData(initialData),
  );

  const [attributeInput, setAttributeInput] = useState({
    key: "",
    value: "",
  });

  useEffect(() => {
    if (open) {
      setFormData(getInitialData(initialData));
      setAttributeInput({ key: "", value: "" });

      if (initialData?.images?.length) {
        const items: AccountImage[] = initialData.images.map((url) => ({
          id: crypto.randomUUID(),
          url,
          preview: url, // Với URL từ server, preview = url luôn
        }));
        setImageItems(items);
      } else {
        setImageItems([]);
      }
    } else {
      // Reset khi đóng dialog
      setImageItems([]);
    }
  }, [open, initialData]);

  useEffect(() => {
    return () => {
      if (!isSubmitted.current) {
        uploadedPublicIds.current.forEach((publicId) => {
          cloudinaryService.deleteImage(publicId).catch((err) => {
            console.warn("Cleanup failed for", publicId, err);
          });
        });
        uploadedPublicIds.current.clear();
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    isSubmitted.current = true;

    const imagesUrl = imageItems
      .filter((img) => img.url) // Chỉ lấy ảnh có URL hợp lệ
      .map((img) => img.url); // Ưu tiên URL đã upload

    const payload: CreateAccountPayload = {
      ...formData,
      images: imagesUrl,
    };

    if (
      !formData.title.trim() ||
      !formData.loginInfo.username ||
      !formData.loginInfo.password
    ) {
      toast.error("Vui lòng nhập đủ các trường bắt buộc");
      return;
    }
    try {
      if (isEdit && initialData) {
        await updateAccount(initialData._id, payload);
        toast.success("Đã cập nhật tài khoản");
      } else {
        await createAccount(payload);
        toast.success("Đã tạo tài khoản thành công");
      }
      onSuccess(); // Đóng modal + refresh list
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Có lỗi xảy ra khi lưu tài khoản");
      isSubmitted.current = false; // Reset để cleanup vẫn chạy nếu fail
      throw error;
    }
  };

  const handleAddAttribute = () => {
    if (!attributeInput.key.trim() || !attributeInput.value.trim()) return;

    setFormData({
      ...formData,
      attributes: {
        ...formData.attributes,
        [attributeInput.key.trim()]: attributeInput.value.trim(),
      },
    });
    setAttributeInput({ key: "", value: "" });
  };

  const handleRemoveAttribute = (key: string) => {
    const newAttrs = { ...formData.attributes };
    delete newAttrs[key];
    setFormData({ ...formData, attributes: newAttrs });
  };

  const handleImageDelete = async (publicId: string) => {
    try {
      await cloudinaryService.deleteImage(publicId);
      uploadedPublicIds.current.delete(publicId);
    } catch (error) {
      toast.error("Xóa ảnh thất bại");
    }
  };

  const handleImageUploaded = (publicId: string) => {
    uploadedPublicIds.current.add(publicId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto p-4 sm:max-w-2xl sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Chỉnh sửa" : "Thêm mới"} tài khoản
            </DialogTitle>
            <DialogDescription>
              {isEdit ? "Cập nhật thông tin" : "Điền thông tin"} tài khoản. Các
              trường có dấu * là bắt buộc.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="space-y-4">
            <Field>
              <Label htmlFor="title">
                Tên tài khoản <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                id="title"
                placeholder="Ví dụ: Acc VIP Liên Quân Rank Cao"
                required
                minLength={3}
              />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field>
                <Label htmlFor="game">
                  Game <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.game}
                  onValueChange={(v: GameType) =>
                    setFormData({ ...formData, game: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn game" />
                  </SelectTrigger>
                  <SelectContent>
                    {gameOptions
                      .filter((option) => Boolean(option.value))
                      .map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <span className="mr-2">{option.icon}</span>
                          {option.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <Label htmlFor="price">
                  Loại tài khoản <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(v: AccountType) =>
                    setFormData({ ...formData, type: v })
                  }
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Kiểu tài khoản" />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions
                      .filter((option) => Boolean(option.value))
                      .map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field>
              <Label htmlFor="price">
                Giá bán <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  value={formData.price || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price: Number(e.target.value),
                    })
                  }
                  id="price"
                  required
                  min="0"
                  step="1000"
                  className="pr-8"
                  placeholder="0"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  đ
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Hiển thị: {formatVND(formData.price)}đ
              </p>
            </Field>

            <Field>
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Mô tả chi tiết tài khoản: rank, skin, tướng, lịch sử..."
                rows={3}
              />
            </Field>

            <div className="space-y-4 rounded-lg border border-orange-200 bg-orange-50/50 p-3 sm:p-4">
              <Label className="text-orange-700 text-base font-semibold">
                Thông tin đăng nhập
              </Label>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field>
                  <Label>
                    Tên đăng nhập <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    value={formData.loginInfo.username}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        loginInfo: {
                          ...formData.loginInfo,
                          username: e.target.value,
                        },
                      })
                    }
                    placeholder="Tên đăng nhập"
                    required
                    minLength={3}
                  />
                </Field>
                <Field>
                  <Label>
                    Mật khẩu <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    value={formData.loginInfo.password}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        loginInfo: {
                          ...formData.loginInfo,
                          password: e.target.value,
                        },
                      })
                    }
                    placeholder="Mật khẩu"
                    required
                    minLength={8}
                  />
                </Field>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Thuộc tính bổ sung</Label>
              <p className="text-xs text-muted-foreground">
                Thêm thông tin như: Rank, Số skin, Tướng sở hữu...
              </p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input
                  placeholder="Tên thuộc tính (vd: Rank)"
                  value={attributeInput.key}
                  onChange={(e) =>
                    setAttributeInput({
                      ...attributeInput,
                      key: e.target.value,
                    })
                  }
                />
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    placeholder="Giá trị (vd: Cao Thủ)"
                    value={attributeInput.value}
                    onChange={(e) =>
                      setAttributeInput({
                        ...attributeInput,
                        value: e.target.value,
                      })
                    }
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      (e.preventDefault(), handleAddAttribute())
                    }
                  />
                  <Button
                    type="button"
                    className="w-full sm:w-auto"
                    size="icon"
                    variant="outline"
                    onClick={handleAddAttribute}
                  >
                    +
                  </Button>
                </div>
              </div>

              {Object.keys(formData.attributes).length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {Object.entries(formData.attributes).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex max-w-full items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-sm"
                    >
                      <span className="font-medium text-muted-foreground">
                        {key}:
                      </span>
                      <span className="break-all">{String(value)}</span>
                      <Button
                        type="button"
                        onClick={() => handleRemoveAttribute(key)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        aria-label={`Xóa thuộc tính ${key}`}
                      >
                        <X className="size-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Field>
              <Label>Hình ảnh tài khoản</Label>
              <ImageUploadField
                images={imageItems}
                setImages={setImageItems}
                onImageUploaded={handleImageUploaded}
                onImageDelete={handleImageDelete}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Ảnh sẽ được hiển thị trong danh sách tài khoản. Nên dùng ảnh rõ
                nét, tỷ lệ 1:1.
              </p>
            </Field>
          </FieldGroup>
          <DialogFooter className="border-t pt-2 sm:pt-4">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="w-full sm:w-auto"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : isEdit ? (
                "Cập nhật"
              ) : (
                "Tạo mới"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AccountForm;

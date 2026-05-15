import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  AccountType,
  CreateAccountPayload,
  GameType,
} from "@/types/admin/account";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

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

  const [formData, setFormData] = useState<CreateAccountPayload>(
    getInitialData(initialData),
  );

  const [attributeInput, setAttributeInput] = useState({
    key: "",
    value: "",
  });

  useEffect(() => {
    if (!open) {
      setFormData(getInitialData(null));
      setAttributeInput({ key: "", value: "" });
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
        await updateAccount(initialData._id, formData);
        toast.success("Đã cập nhật tài khoản");
      } else {
        await createAccount(formData);
        toast.success("Đã tạo tài khoản thành công");
      }
      onSuccess(); // Đóng modal + refresh list
      onOpenChange(false);
    } catch (error) {
      console.error("Có lỗi xảy ra khi submit form:", error);
      toast.error("Có lỗi xảy ra khi submit form");
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
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
              <Label htmlFor="title">Tên tài khoản *</Label>
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
            <div className="grid grid-col-2 gap-4">
              <Field>
                <Label htmlFor="game">Game *</Label>
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
                    {gameOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <span className="mr-2">{option.icon}</span>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <Label htmlFor="price">Loại tài khoản *</Label>
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
                    {typeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field>
              <Label htmlFor="price">Giá bán *</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={formData.price?.toLocaleString("vi-VN")}
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

            <Field>
              <Label>Tên thuộc tính</Label>

              <Input
                placeholder="Ví dụ: Rank"
                value={attributeInput.key}
                onChange={(e) =>
                  setAttributeInput({
                    ...attributeInput,
                    key: e.target.value,
                  })
                }
              />
            </Field>

            <Field>
              <Label>Giá trị</Label>

              <Input
                placeholder="Ví dụ: Cao Thủ"
                value={attributeInput.value}
                onChange={(e) =>
                  setAttributeInput({
                    ...attributeInput,
                    value: e.target.value,
                  })
                }
              />
            </Field>

            <Button
              type="button"
              onClick={() => {
                if (!attributeInput.key || !attributeInput.value) return;

                setFormData({
                  ...formData,
                  attributes: {
                    ...formData.attributes,
                    [attributeInput.key]: attributeInput.value,
                  },
                });

                setAttributeInput({
                  key: "",
                  value: "",
                });
              }}
            >
              Thêm thuộc tính
            </Button>

            <Field></Field>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AccountForm;

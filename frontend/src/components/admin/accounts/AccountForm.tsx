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
import { gameOptions, typeOptions } from "@/pages/admin/Accounts";
import { useAdminAccountStore } from "@/stores/useAdminAccountStore";
import type {
  Account,
  AccountType,
  CreateAccountPayload,
  GameType,
} from "@/types/admin/account";
import React, { useState } from "react";
import { toast } from "sonner";

interface AccountFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Account | null;
  onSuccess: () => void;
}

const AccountForm = ({
  open,
  onOpenChange,
  initialData,
  onSuccess,
}: AccountFormProps) => {
  const { createAccount, updateAccount, loading } = useAdminAccountStore();
  const isEdit = !!initialData;

  const [formData, setFormData] = useState<CreateAccountPayload>({
    title: initialData?.title || "",
    game: initialData?.game || "lien-quan",
    price: initialData?.price || 0,
    type: initialData?.type || "standard",
    loginInfo: {
      username: initialData?.loginInfo?.username || "",
      password: initialData?.loginInfo.password || "",
    },
    description: initialData?.description || "",
    attributes: initialData?.attributes || {},
    images: initialData?.images || [],
  });

  const [attributeInput, setAttributeInput] = useState({
    key: "",
    value: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEdit && initialData) {
        await updateAccount(initialData._id, formData);
      } else {
        await createAccount(formData);
      }
      onSuccess(); // Đóng modal + refresh list
    } catch (error) {
      console.error("Có lỗi xảy ra khi submit form:", error);
      toast.error("Có lỗi xảy ra khi submit form");
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Chỉnh sửa" : "Thêm mới"} tài khoản
            </DialogTitle>
            <DialogDescription>
              {isEdit ? "Chỉnh sửa" : "Thêm mới"} tài khoản tại đây,bấm lưu khi
              đã hoàn thành
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <Label htmlFor="title">Tên tài khoản *</Label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                id="title"
                required
              />
            </Field>
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
                      {option.icon} {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <Label htmlFor="price">Giá *</Label>
              <Input
                type="number"
                value={formatVND(formData.price)}
                onChange={(e) =>
                  setFormData({ ...formData, price: Number(e.target.value) })
                }
                id="price"
                required
              />
            </Field>
            <Field>
              <Label htmlFor="price">Loại tài khoản *</Label>
              <Select
                value={formData.type}
                onValueChange={(v: AccountType) =>
                  setFormData({ ...formData, type: v })
                }
              >
                <SelectTrigger>
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

            <Field>
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
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
        </DialogContent>
      </form>
    </Dialog>
  );
};

export default AccountForm;

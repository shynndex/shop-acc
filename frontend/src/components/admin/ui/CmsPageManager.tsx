import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Pencil,
  Loader2,
  FileText,
  ExternalLink,
  Globe,
} from "lucide-react";
import {
  useCmsPagesQuery,
  useUpdateCmsPage,
} from "@/hooks/queries/useAdminUiQueries";
import CmsEditor from "./CmsEditor";
import type { CmsPage } from "@/types/admin/ui.type";

const CMS_SLUG_LABELS: Record<string, string> = {
  "gioi-thieu": "Giới thiệu",
  "chinh-sach-bao-mat": "Chính sách bảo mật",
  "chinh-sach-doi-tra": "Chính sách đổi trả",
  "dieu-khoan-dich-vu": "Điều khoản dịch vụ",
  "huong-dan-mua-hang": "Hướng dẫn mua hàng",
  "huong-dan-nap-tien": "Hướng dẫn nạp tiền",
  faq: "Câu hỏi thường gặp",
  "lien-he": "Liên hệ",
  footer: "Footer",
};

// ═════════════════════════════════════════════════════════════════════════
// CMS Page Edit Dialog
// ═════════════════════════════════════════════════════════════════════════
interface CmsPageEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  page: CmsPage | null;
  onSuccess: () => void;
}

const CmsPageEditDialog = ({
  open,
  onOpenChange,
  page,
  onSuccess,
}: CmsPageEditDialogProps) => {
  const [title, setTitle] = useState(page?.title || "");
  const [content, setContent] = useState(page?.content || "");
  const [metaTitle, setMetaTitle] = useState(page?.metaTitle || "");
  const [metaDescription, setMetaDescription] = useState(
    page?.metaDescription || "",
  );

  const updateMutation = useUpdateCmsPage();
  const isSubmitting = updateMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Vui lòng nhập tiêu đề");
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: page!._id,
        payload: {
          title: title.trim(),
          content,
          metaTitle: metaTitle.trim(),
          metaDescription: metaDescription.trim(),
        },
      });
      toast.success(`Đã cập nhật trang "${title}" thành công`);
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  React.useEffect(() => {
    if (page) {
      setTitle(page.title);
      setContent(page.content);
      setMetaTitle(page.metaTitle);
      setMetaDescription(page.metaDescription);
    }
  }, [page, open]);

  if (!page) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sửa trang: {CMS_SLUG_LABELS[page.slug] || page.title}</DialogTitle>
          <DialogDescription>
            Slug: <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{page.slug}</code>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cmsTitle">Tiêu đề trang</Label>
            <Input
              id="cmsTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <CmsEditor
            value={content}
            onChange={setContent}
            label="Nội dung"
            minHeight="300px"
          />

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3 text-muted-foreground">
              SEO Settings
            </h4>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="metaTitle">Meta Title</Label>
                <Input
                  id="metaTitle"
                  placeholder="Tiêu đề SEO"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="metaDesc">Meta Description</Label>
                <Textarea
                  id="metaDesc"
                  placeholder="Mô tả SEO"
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Huỷ
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              Cập nhật
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ═════════════════════════════════════════════════════════════════════════
// Main CmsPageManager Component
// ═════════════════════════════════════════════════════════════════════════
const CmsPageManager = () => {
  const { data, isLoading } = useCmsPagesQuery();
  const [showEditor, setShowEditor] = useState(false);
  const [editingPage, setEditingPage] = useState<CmsPage | null>(null);

  const pages: CmsPage[] = data?.pages || [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {pages.length > 0
          ? `${pages.length} trang nội dung`
          : "Chưa có trang nội dung nào"}
      </p>

      {pages.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/30">
          <FileText className="size-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground font-medium">
            Chưa có trang nội dung
          </p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Chạy seed script để tạo các trang CMS mặc định
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {pages.map((page) => (
            <div
              key={page._id}
              className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/30 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <FileText className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">
                    {CMS_SLUG_LABELS[page.slug] || page.title}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <code className="text-xs">{page.slug}</code>
                    <Badge
                      variant={page.isActive ? "default" : "secondary"}
                      className="text-[10px] px-1.5 py-0"
                    >
                      {page.isActive ? "Hoạt động" : "Tắt"}
                    </Badge>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => {
                    setEditingPage(page);
                    setShowEditor(true);
                  }}
                  title="Sửa nội dung"
                >
                  <Pencil className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CmsPageEditDialog
        open={showEditor}
        onOpenChange={setShowEditor}
        page={editingPage}
        onSuccess={() => {}}
      />
    </div>
  );
};

export default CmsPageManager;

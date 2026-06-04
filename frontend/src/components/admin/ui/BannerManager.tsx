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
  Plus,
  Pencil,
  Trash2,
  Loader2,
  ImageIcon,
  GripVertical,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  useBannersQuery,
  useCreateBanner,
  useUpdateBanner,
  useDeleteBanner,
  useReorderBanners,
} from "@/hooks/queries/useAdminUiQueries";
import ImagePickerField from "./ImagePickerField";
import type { Banner } from "@/types/admin/ui.type";

// ═════════════════════════════════════════════════════════════════════════
// Sortable Banner Card
// ═════════════════════════════════════════════════════════════════════════

const SortableBannerCard = ({
  banner,
  onEdit,
  onDelete,
}: {
  banner: Banner;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: banner._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : "auto",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-lg overflow-hidden border bg-card ${isDragging ? "shadow-lg ring-2 ring-primary" : ""}`}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 z-10 cursor-grab active:cursor-grabbing bg-background/80 backdrop-blur rounded-md p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent"
      >
        <GripVertical className="size-4 text-muted-foreground" />
      </div>

      <div className="aspect-video bg-muted relative overflow-hidden">
        <img
          src={banner.imageDesktopUrl}
          alt={banner.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://placehold.co/400x225/e2e8f0/94a3b8?text=No+Image";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-2 left-2 right-2">
          <p className="text-white text-sm font-medium truncate">
            {banner.title}
          </p>
        </div>
        {!banner.isActive && (
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="text-xs">
              Ẩn
            </Badge>
          </div>
        )}
      </div>

      <div className="p-3 space-y-2">
        {banner.headline && (
          <p className="text-xs font-medium text-muted-foreground truncate">
            {banner.headline}
          </p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            #{banner.sortOrder}
          </span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={onEdit}
            >
              <Pencil className="size-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="size-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════
// Banner Form Dialog
// ═════════════════════════════════════════════════════════════════════════
interface BannerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Banner | null;
  onSuccess: () => void;
}

const BannerFormDialog = ({
  open,
  onOpenChange,
  initialData,
  onSuccess,
}: BannerFormDialogProps) => {
  const [title, setTitle] = useState(initialData?.title || "");
  const [imageDesktopUrl, setImageDesktopUrl] = useState(
    initialData?.imageDesktopUrl || "",
  );
  const [imageMobileUrl, setImageMobileUrl] = useState(
    initialData?.imageMobileUrl || "",
  );
  const [headline, setHeadline] = useState(initialData?.headline || "");
  const [description, setDescription] = useState(
    initialData?.description || "",
  );
  const [ctaText, setCtaText] = useState(initialData?.ctaText || "");
  const [ctaLink, setCtaLink] = useState(initialData?.ctaLink || "");

  const createMutation = useCreateBanner();
  const updateMutation = useUpdateBanner();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !imageDesktopUrl.trim()) {
      toast.error("Vui lòng nhập tiêu đề và ảnh desktop");
      return;
    }

    const payload: any = {
      title: title.trim(),
      imageDesktopUrl: imageDesktopUrl.trim(),
      imageMobileUrl: imageMobileUrl.trim(),
      headline: headline.trim(),
      description: description.trim(),
      ctaText: ctaText.trim(),
      ctaLink: ctaLink.trim(),
    };

    try {
      if (initialData?._id) {
        await updateMutation.mutateAsync({ id: initialData._id, payload });
        toast.success("Đã cập nhật banner thành công");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Đã thêm banner thành công");
      }
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  React.useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setImageDesktopUrl(initialData.imageDesktopUrl);
      setImageMobileUrl(initialData.imageMobileUrl);
      setHeadline(initialData.headline);
      setDescription(initialData.description);
      setCtaText(initialData.ctaText);
      setCtaLink(initialData.ctaLink);
    } else {
      setTitle("");
      setImageDesktopUrl("");
      setImageMobileUrl("");
      setHeadline("");
      setDescription("");
      setCtaText("");
      setCtaLink("");
    }
  }, [initialData, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Sửa banner" : "Thêm banner mới"}
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? "Cập nhật thông tin banner"
              : "Thêm banner hiển thị trên trang chủ"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="bannerTitle">Tiêu đề nội bộ</Label>
            <Input
              id="bannerTitle"
              placeholder="Sale mùa hè 2024"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <ImagePickerField
              value={imageDesktopUrl}
              onChange={setImageDesktopUrl}
              label="Ảnh Desktop *"
              aspectRatio="3/1"
            />
            <ImagePickerField
              value={imageMobileUrl}
              onChange={setImageMobileUrl}
              label="Ảnh Mobile"
              aspectRatio="3/4"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="headline">Headline (tiêu đề hiển thị)</Label>
            <Input
              id="headline"
              placeholder="Kho tài khoản game chất lượng"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="desc">Mô tả</Label>
            <Textarea
              id="desc"
              placeholder="Giá tốt nhất thị trường - Bảo hành uy tín"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="ctaText">Nút CTA</Label>
              <Input
                id="ctaText"
                placeholder="Mua ngay"
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ctaLink">Link CTA</Label>
              <Input
                id="ctaLink"
                placeholder="/tai-khoan"
                value={ctaLink}
                onChange={(e) => setCtaLink(e.target.value)}
              />
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
              {initialData ? "Cập nhật" : "Thêm mới"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ═════════════════════════════════════════════════════════════════════════
// Main BannerManager Component
// ═════════════════════════════════════════════════════════════════════════
const BannerManager = () => {
  const { data, isLoading } = useBannersQuery();
  const deleteMutation = useDeleteBanner();
  const reorderMutation = useReorderBanners();
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

  const banners: Banner[] = data?.banners || [];

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px distance before drag starts
      },
    }),
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = banners.findIndex((b) => b._id === active.id);
    const newIndex = banners.findIndex((b) => b._id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    // Save previous order for undo
    const previousItems = banners.map((b, i) => ({
      _id: b._id,
      sortOrder: i,
    }));

    // Reorder the array
    const reordered = [...banners];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    // Update sortOrder based on new position
    const items = reordered.map((b, i) => ({
      _id: b._id,
      sortOrder: i,
    }));

    try {
      await reorderMutation.mutateAsync(items);
      toast.success("Đã cập nhật thứ tự", {
        description: "Kéo thả banner",
        duration: 5000,
        action: {
          label: "Undo",
          onClick: async () => {
            try {
              await reorderMutation.mutateAsync(previousItems);
              toast.success("Đã khôi phục thứ tự ban đầu");
            } catch {
              toast.error("Không thể khôi phục");
            }
          },
        },
      });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  const handleDelete = async (banner: Banner) => {
    if (!confirm(`Xoá banner "${banner.title}"?`)) return;
    try {
      await deleteMutation.mutateAsync(banner._id);
      toast.success(`Đã xoá banner "${banner.title}"`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {banners.length > 0
            ? `${banners.length} banner — Kéo thả để sắp xếp`
            : "Chưa có banner nào"}
        </p>
        <Button
          size="sm"
          onClick={() => {
            setEditingBanner(null);
            setShowForm(true);
          }}
        >
          <Plus className="mr-2 size-3.5" />
          Thêm banner
        </Button>
      </div>

      {banners.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/30">
          <ImageIcon className="size-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground font-medium">
            Chưa có banner nào
          </p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Thêm banner để hiển thị slider trên trang chủ
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              setEditingBanner(null);
              setShowForm(true);
            }}
          >
            <Plus className="mr-2 size-4" />
            Thêm banner đầu tiên
          </Button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={banners.map((b) => b._id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {banners.map((banner) => (
                <SortableBannerCard
                  key={banner._id}
                  banner={banner}
                  onEdit={() => {
                    setEditingBanner(banner);
                    setShowForm(true);
                  }}
                  onDelete={() => handleDelete(banner)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <BannerFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        initialData={editingBanner}
        onSuccess={() => {}}
      />
    </div>
  );
};

export default BannerManager;

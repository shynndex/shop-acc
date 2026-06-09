import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Clock,
  Megaphone,
  GripVertical,
  Eye,
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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  usePopupsQuery,
  useCreatePopup,
  useUpdatePopup,
  useDeletePopup,
  useTogglePopupActive,
  useReorderPopups,
} from "@/hooks/queries/useAdminUiQueries";
import CmsEditor from "./CmsEditor";
import ImagePickerField from "./ImagePickerField";
import type { Popup, PopupType, PopupTrigger, DisplayPage } from "@/types/admin/ui.type";

const DISPLAY_PAGE_OPTIONS: { value: DisplayPage | "all"; label: string }[] = [
  { value: "all", label: "Tất cả trang" },
  { value: "home", label: "Trang chủ" },
  { value: "shop", label: "Cửa hàng" },
  { value: "compare", label: "So sánh" },
  { value: "account-detail", label: "Chi tiết tài khoản" },
  { value: "order-history", label: "Lịch sử đơn hàng" },
  { value: "profile", label: "Trang cá nhân" },
];

// ═════════════════════════════════════════════════════════════════════════
// Sortable Popup Row
// ═════════════════════════════════════════════════════════════════════════

const SortablePopupRow = ({
  popup,
  onEdit,
  onDelete,
  onToggle,
  onPreview,
  getTypeBadge,
}: {
  popup: Popup;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: (id: string) => void;
  onPreview: (popup: Popup) => void;
  getTypeBadge: (type: PopupType) => React.ReactNode;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: popup._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : "auto",
    position: "relative" as const,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b last:border-0 transition-colors ${
        isDragging ? "bg-accent shadow-lg ring-2 ring-primary" : "hover:bg-accent/30"
      }`}
    >
      <td className="p-1 pl-3 w-10">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing inline-flex p-1.5 rounded hover:bg-accent transition-colors"
        >
          <GripVertical className="size-4 text-muted-foreground" />
        </div>
      </td>
      <td className="p-3">
        <div>
          <p className="font-medium">{popup.title}</p>
          <p className="text-xs text-muted-foreground">
            #{popup.sortOrder}
          </p>
        </div>
      </td>
      <td className="p-3">{getTypeBadge(popup.type)}</td>
      <td className="p-3">
        <span className="text-xs text-muted-foreground">
          {popup.triggerType === "timeout"
            ? `${popup.triggerDelay}s`
            : "Click"}
        </span>
      </td>
      <td className="p-3">
        <div className="flex flex-wrap gap-1">
          {popup.displayPages.map((page) => (
            <Badge key={page} variant="outline" className="text-xs">
              {page === "all" ? "Tất cả" : page}
            </Badge>
          ))}
        </div>
      </td>
      <td className="p-3 text-center">
        <Switch
          checked={popup.isActive}
          onCheckedChange={() => onToggle(popup._id)}
        />
      </td>
      <td className="p-3 text-right">
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => onPreview(popup)}
            title="Xem trước"
          >
            <Eye className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={onEdit}
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </td>
    </tr>
  );
};

// ═════════════════════════════════════════════════════════════════════════
// Popup Form Dialog
// ═════════════════════════════════════════════════════════════════════════
interface PopupFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Popup | null;
  onSuccess: () => void;
}

const PopupFormDialog = ({
  open,
  onOpenChange,
  initialData,
  onSuccess,
}: PopupFormDialogProps) => {
  const [title, setTitle] = useState(initialData?.title || "");
  const [type, setType] = useState<PopupType>(initialData?.type || "notification");
  const [content, setContent] = useState(initialData?.content || "");
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || "");
  const [imageMobileUrl, setImageMobileUrl] = useState(
    initialData?.imageMobileUrl || "",
  );
  const [ctaText, setCtaText] = useState(initialData?.ctaText || "");
  const [ctaLink, setCtaLink] = useState(initialData?.ctaLink || "");
  const [displayPages, setDisplayPages] = useState<DisplayPage[]>(
    initialData?.displayPages || ["home"],
  );
  const [triggerType, setTriggerType] = useState<PopupTrigger>(
    initialData?.triggerType || "timeout",
  );
  const [triggerDelay, setTriggerDelay] = useState(
    String(initialData?.triggerDelay ?? 5),
  );

  const createMutation = useCreatePopup();
  const updateMutation = useUpdatePopup();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const togglePage = (page: DisplayPage | "all") => {
    if (page === "all") {
      setDisplayPages(["all"]);
      return;
    }
    setDisplayPages((prev) => {
      const withoutAll = prev.filter((p) => p !== "all");
      if (withoutAll.includes(page)) {
        return withoutAll.filter((p) => p !== page);
      }
      return [...withoutAll, page];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Vui lòng nhập tiêu đề popup");
      return;
    }

    const payload: any = {
      title: title.trim(),
      type,
      content,
      imageUrl,
      imageMobileUrl,
      ctaText,
      ctaLink,
      displayPages,
      triggerType,
      triggerDelay: parseInt(triggerDelay) || 5,
    };

    try {
      if (initialData?._id) {
        await updateMutation.mutateAsync({ id: initialData._id, payload });
        toast.success("Đã cập nhật popup thành công");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Đã thêm popup thành công");
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
      setType(initialData.type);
      setContent(initialData.content);
      setImageUrl(initialData.imageUrl);
      setImageMobileUrl(initialData.imageMobileUrl);
      setCtaText(initialData.ctaText);
      setCtaLink(initialData.ctaLink);
      setDisplayPages(initialData.displayPages);
      setTriggerType(initialData.triggerType);
      setTriggerDelay(String(initialData.triggerDelay));
    } else {
      setTitle("");
      setType("notification");
      setContent("");
      setImageUrl("");
      setImageMobileUrl("");
      setCtaText("");
      setCtaLink("");
      setDisplayPages(["home"]);
      setTriggerType("timeout");
      setTriggerDelay("5");
    }
  }, [initialData, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Sửa popup" : "Thêm popup mới"}
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? "Cập nhật thông tin popup"
              : "Tạo popup hiển thị trên client"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="popupTitle">Tiêu đề</Label>
            <Input
              id="popupTitle"
              placeholder="Sale 50%"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Loại popup</Label>
              <Select value={type} onValueChange={(v: PopupType) => setType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="notification">🔔 Thông báo</SelectItem>
                  <SelectItem value="promotion">🎉 Khuyến mãi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Trigger</Label>
              <Select
                value={triggerType}
                onValueChange={(v: PopupTrigger) => setTriggerType(v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="timeout">
                    <Clock className="size-3 inline mr-1" />
                    Sau N giây
                  </SelectItem>
                  <SelectItem value="click">
                    Click từ admin
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {triggerType === "timeout" && (
            <div className="space-y-1.5">
              <Label htmlFor="triggerDelay">Delay (giây)</Label>
              <Input
                id="triggerDelay"
                type="number"
                min={0}
                value={triggerDelay}
                onChange={(e) => setTriggerDelay(e.target.value)}
              />
            </div>
          )}

          {/* Nội dung notification */}
          {type === "notification" && (
            <CmsEditor
              value={content}
              onChange={setContent}
              label="Nội dung thông báo"
              minHeight="150px"
            />
          )}

          {/* Promotion fields */}
          {type === "promotion" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <ImagePickerField
                  value={imageUrl}
                  onChange={setImageUrl}
                  label="Ảnh nền (Desktop)"
                  aspectRatio="16/9"
                />
                <ImagePickerField
                  value={imageMobileUrl}
                  onChange={setImageMobileUrl}
                  label="Ảnh nền (Mobile)"
                  aspectRatio="4/5"
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
            </>
          )}

          {/* Display Pages */}
          <div className="space-y-2">
            <Label>Hiển thị trên trang</Label>
            <div className="flex flex-wrap gap-2">
              {DISPLAY_PAGE_OPTIONS.map((opt) => {
                const isSelected =
                  opt.value === "all"
                    ? displayPages.includes("all")
                    : displayPages.includes(opt.value as DisplayPage);
                return (
                  <Button
                    key={opt.value}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => togglePage(opt.value as DisplayPage | "all")}
                  >
                    {opt.label}
                  </Button>
                );
              })}
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
// Main PopupManager Component
// ═════════════════════════════════════════════════════════════════════════
const PopupManager = () => {
  const { data, isLoading } = usePopupsQuery();
  const deleteMutation = useDeletePopup();
  const toggleMutation = useTogglePopupActive();
  const reorderMutation = useReorderPopups();
  const [showForm, setShowForm] = useState(false);
  const [editingPopup, setEditingPopup] = useState<Popup | null>(null);
  const [previewPopup, setPreviewPopup] = useState<Popup | null>(null);

  const popups: Popup[] = data?.popups || [];

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = popups.findIndex((p) => p._id === active.id);
    const newIndex = popups.findIndex((p) => p._id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    // Save previous order for undo
    const previousItems = popups.map((p, i) => ({
      _id: p._id,
      sortOrder: i,
    }));

    const reordered = [...popups];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    const items = reordered.map((p, i) => ({
      _id: p._id,
      sortOrder: i,
    }));

    try {
      await reorderMutation.mutateAsync(items);
      toast.success("Đã cập nhật thứ tự", {
        description: "Kéo thả popup",
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

  const handleDelete = async (popup: Popup) => {
    if (!confirm(`Xoá popup "${popup.title}"?`)) return;
    try {
      await deleteMutation.mutateAsync(popup._id);
      toast.success(`Đã xoá popup "${popup.title}"`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await toggleMutation.mutateAsync(id);
    } catch (err: any) {
      toast.error("Có lỗi xảy ra");
    }
  };

  const getTypeBadge = (type: PopupType) => {
    switch (type) {
      case "promotion":
        return <Badge className="bg-orange-500">Khuyến mãi</Badge>;
      case "notification":
        return <Badge variant="secondary">Thông báo</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {popups.length > 0
            ? `${popups.length} popup — Kéo thả để sắp xếp`
            : "Chưa có popup nào"}
        </p>
        <Button
          size="sm"
          onClick={() => {
            setEditingPopup(null);
            setShowForm(true);
          }}
        >
          <Plus className="mr-2 size-3.5" />
          Thêm popup
        </Button>
      </div>

      {popups.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/30">
          <Megaphone className="size-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground font-medium">
            Chưa có popup nào
          </p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Tạo popup để hiển thị thông báo hoặc khuyến mãi trên client
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              setEditingPopup(null);
              setShowForm(true);
            }}
          >
            <Plus className="mr-2 size-4" />
            Thêm popup đầu tiên
          </Button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="w-10 p-1 pl-3"></th>
                  <th className="text-left p-3 font-medium">Tiêu đề</th>
                  <th className="text-left p-3 font-medium">Loại</th>
                  <th className="text-left p-3 font-medium">Trigger</th>
                  <th className="text-left p-3 font-medium">Trang</th>
                  <th className="text-center p-3 font-medium">Kích hoạt</th>
                  <th className="text-right p-3 font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                <SortableContext
                  items={popups.map((p) => p._id)}
                  strategy={verticalListSortingStrategy}
                >
                  {popups.map((popup) => (                      <SortablePopupRow
                        key={popup._id}
                        popup={popup}
                        getTypeBadge={getTypeBadge}
                        onEdit={() => {
                          setEditingPopup(popup);
                          setShowForm(true);
                        }}
                        onDelete={() => handleDelete(popup)}
                        onToggle={() => handleToggle(popup._id)}
                        onPreview={(p) => setPreviewPopup(p)}
                      />
                  ))}
                </SortableContext>
              </tbody>
            </table>
          </div>
        </DndContext>
      )}

      <PopupFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        initialData={editingPopup}
        onSuccess={() => {}}
      />

      {/* ─── Preview Dialog ─── */}
      <Dialog open={!!previewPopup} onOpenChange={() => setPreviewPopup(null)}>
        <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="text-sm">Xem trước popup</DialogTitle>
            <DialogDescription>Preview sẽ hiển thị giống trên client</DialogDescription>
          </DialogHeader>
          {previewPopup && (
            <div className="p-4 pt-2">
              {/* Client-like preview */}
              <div className="relative rounded-xl border bg-background shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Dim overlay simulation */}
                <div className="absolute inset-0 bg-black/40 pointer-events-none" />
                <div className="relative z-10">
                  {previewPopup.type === "promotion" && previewPopup.imageUrl ? (
                    <div className="relative">
                      <img
                        src={previewPopup.imageUrl}
                        alt={previewPopup.title}
                        className="w-full aspect-video object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="text-white font-bold text-base mb-1">{previewPopup.title}</h3>
                        {previewPopup.ctaText && (
                          <button className="bg-primary text-primary-foreground px-4 py-1.5 rounded-lg text-sm font-medium">
                            {previewPopup.ctaText}
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        {previewPopup.type === "promotion" ? (
                          <span className="text-lg">🎉</span>
                        ) : (
                          <span className="text-lg">🔔</span>
                        )}
                        <h3 className="font-bold text-base">{previewPopup.title}</h3>
                      </div>
                      {previewPopup.content && (
                        <div
                          className="prose prose-sm dark:prose-invert max-w-none text-sm text-muted-foreground"
                          dangerouslySetInnerHTML={{ __html: previewPopup.content }}
                        />
                      )}
                      {previewPopup.ctaText && (
                        <button className="mt-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium">
                          {previewPopup.ctaText}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {/* Meta info */}
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="outline" className="text-xs">
                  {previewPopup.type === "promotion" ? "🎉 Khuyến mãi" : "🔔 Thông báo"}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {previewPopup.triggerType === "timeout" ? `⏱️ ${previewPopup.triggerDelay}s` : "🖱️ Click"}
                </Badge>
                {previewPopup.displayPages.map((page) => (
                  <Badge key={page} variant="outline" className="text-xs">
                    📄 {page === "all" ? "Tất cả" : page}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PopupManager;

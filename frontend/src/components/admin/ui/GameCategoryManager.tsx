import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  Gamepad2,
  Loader2,
  GripVertical,
} from "lucide-react";
import {
  useGameCategoriesQuery,
  useCreateGameCategory,
  useUpdateGameCategory,
  useDeleteGameCategory,
  useCreateCategoryItem,
  useUpdateCategoryItem,
  useDeleteCategoryItem,
  useReorderCategoryItems,
} from "@/hooks/queries/useAdminUiQueries";
import ImagePickerField from "./ImagePickerField";
import type {
  GameCategory,
  CategoryItem,
  CreateGameCategoryPayload,
  CreateCategoryItemPayload,
} from "@/types/admin/ui.type";

// ═════════════════════════════════════════════════════════════════════════
// Sortable Category Item Row
// ═════════════════════════════════════════════════════════════════════════
interface SortableRowProps {
  cat: CategoryItem;
  gameId: string;
  onEdit: (item: CategoryItem) => void;
  onDelete: (item: CategoryItem) => void;
}

const SortableCategoryItemRow = ({
  cat,
  gameId,
  onEdit,
  onDelete,
}: SortableRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: cat.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b last:border-0 transition-colors ${
        isDragging ? "z-10 shadow-lg ring-2 ring-primary/40" : ""
      } hover:bg-accent/30`}
    >
      <td className="py-2 pr-2 w-8">
        <button
          className="cursor-grab active:cursor-grabbing opacity-30 hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-accent"
          {...attributes}
          {...listeners}
          aria-label="Kéo để sắp xếp"
        >
          <GripVertical className="size-3.5 text-muted-foreground" />
        </button>
      </td>
      <td className="py-2 pr-4 font-mono text-xs">{cat.id}</td>
      <td className="py-2 pr-4 font-medium">{cat.name}</td>
      <td className="py-2 pr-4 text-muted-foreground">{cat.typeValue}</td>
      <td className="py-2 pr-4 text-right">
        {cat.priceFrom.toLocaleString("vi-VN")}₫
      </td>
      <td className="py-2 pr-4 text-right">{cat.stock}</td>
      <td className="py-2 pr-4 text-right text-muted-foreground">{cat.sortOrder}</td>
      <td className="py-2 text-right">
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => onEdit(cat)}
          >
            <Pencil className="size-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-destructive"
            onClick={() => onDelete(cat)}
          >
            <Trash2 className="size-3" />
          </Button>
        </div>
      </td>
    </tr>
  );
};

// ═════════════════════════════════════════════════════════════════════════
// Game Category Form Dialog
// ═════════════════════════════════════════════════════════════════════════
interface GameFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: GameCategory | null;
  onSuccess: () => void;
}

const GameFormDialog = ({
  open,
  onOpenChange,
  initialData,
  onSuccess,
}: GameFormDialogProps) => {
  const [gameSlug, setGameSlug] = useState(initialData?.gameSlug || "");
  const [gameName, setGameName] = useState(initialData?.gameName || "");
  const [gameIcon, setGameIcon] = useState(initialData?.gameIcon || "🎮");
  const [iconType, setIconType] = useState<"emoji" | "image">(
    initialData?.iconType || "emoji",
  );
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);

  const createMutation = useCreateGameCategory();
  const updateMutation = useUpdateGameCategory();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameSlug.trim() || !gameName.trim()) {
      toast.error("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    const payload: any = {
      gameSlug: gameSlug.trim(),
      gameName: gameName.trim(),
      gameIcon: gameIcon.trim(),
      iconType,
      isActive,
    };

    try {
      if (initialData?._id) {
        await updateMutation.mutateAsync({ id: initialData._id, payload });
        toast.success("Đã cập nhật game thành công");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Đã thêm game thành công");
      }
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  React.useEffect(() => {
    if (initialData) {
      setGameSlug(initialData.gameSlug);
      setGameName(initialData.gameName);
      setGameIcon(initialData.gameIcon);
      setIconType(initialData.iconType);
      setIsActive(initialData.isActive);
    } else {
      setGameSlug("");
      setGameName("");
      setGameIcon("🎮");
      setIconType("emoji");
      setIsActive(true);
    }
  }, [initialData, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Sửa game" : "Thêm game mới"}
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? "Cập nhật thông tin game"
              : "Thêm danh mục game mới"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="gameSlug">Game Slug</Label>
              <Input
                id="gameSlug"
                placeholder="lien-quan"
                value={gameSlug}
                onChange={(e) =>
                  setGameSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                }
                required
                disabled={!!initialData}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gameName">Tên game</Label>
              <Input
                id="gameName"
                placeholder="LIÊN QUÂN MOBILE"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="gameIcon">Icon</Label>
              <Input
                id="gameIcon"
                placeholder="🎮 hoặc URL"
                value={gameIcon}
                onChange={(e) => setGameIcon(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label>Loại icon</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={iconType === "emoji" ? "default" : "outline"}
                size="sm"
                onClick={() => setIconType("emoji")}
              >
                Emoji
              </Button>
              <Button
                type="button"
                variant={iconType === "image" ? "default" : "outline"}
                size="sm"
                onClick={() => setIconType("image")}
              >
                Ảnh
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label>Kích hoạt</Label>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
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
// Category Item Form Dialog
// ═════════════════════════════════════════════════════════════════════════
interface CategoryItemFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gameId: string;
  initialData?: CategoryItem | null;
  onSuccess: () => void;
}

const CategoryItemFormDialog = ({
  open,
  onOpenChange,
  gameId,
  initialData,
  onSuccess,
}: CategoryItemFormDialogProps) => {
  const [catId, setCatId] = useState(initialData?.id || "");
  const [name, setName] = useState(initialData?.name || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [typeValue, setTypeValue] = useState(initialData?.typeValue || "");
  const [image, setImage] = useState(initialData?.image || "");
  const [priceFrom, setPriceFrom] = useState(
    String(initialData?.priceFrom ?? 0),
  );
  const [stock, setStock] = useState(String(initialData?.stock ?? 0));

  const createMutation = useCreateCategoryItem();
  const updateMutation = useUpdateCategoryItem();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // Auto-generate slug from name
  React.useEffect(() => {
    if (!initialData && name) {
      setSlug(
        name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, ""),
      );
    }
  }, [name, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catId.trim() || !name.trim() || !slug.trim() || !typeValue.trim()) {
      toast.error("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    const payload: CreateCategoryItemPayload = {
      id: catId.trim(),
      name: name.trim(),
      slug: slug.trim(),
      typeValue: typeValue.trim(),
      image,
      priceFrom: parseInt(priceFrom) || 0,
      stock: parseInt(stock) || 0,
    };

    try {
      if (initialData) {
        await updateMutation.mutateAsync({
          gameId,
          itemId: initialData.id,
          payload,
        });
        toast.success("Đã cập nhật danh mục thành công");
      } else {
        await createMutation.mutateAsync({ gameId, payload });
        toast.success("Đã thêm danh mục thành công");
      }
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  React.useEffect(() => {
    if (initialData) {
      setCatId(initialData.id);
      setName(initialData.name);
      setSlug(initialData.slug);
      setTypeValue(initialData.typeValue);
      setImage(initialData.image);
      setPriceFrom(String(initialData.priceFrom));
      setStock(String(initialData.stock));
    } else {
      setCatId("");
      setName("");
      setSlug("");
      setTypeValue("");
      setImage("");
      setPriceFrom("0");
      setStock("0");
    }
  }, [initialData, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Sửa danh mục" : "Thêm danh mục mới"}
          </DialogTitle>
          <DialogDescription>Quản lý danh mục con trong game</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="catId">ID</Label>
              <Input
                id="catId"
                placeholder="lq-trang"
                value={catId}
                onChange={(e) => setCatId(e.target.value)}
                required
                disabled={!!initialData}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="catName">Tên danh mục</Label>
              <Input
                id="catName"
                placeholder="Nick Thông Tin Đẹp"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="catSlug">Slug</Label>
              <Input
                id="catSlug"
                placeholder="nick-thong-tin-dep"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="typeValue">Type Value</Label>
              <Input
                id="typeValue"
                placeholder="trang"
                value={typeValue}
                onChange={(e) => setTypeValue(e.target.value)}
                required
              />
            </div>
          </div>

          <ImagePickerField
            value={image}
            onChange={setImage}
            label="Ảnh đại diện"
            aspectRatio="4/3"
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="priceFrom">Giá từ (₫)</Label>
              <Input
                id="priceFrom"
                type="number"
                min={0}
                value={priceFrom}
                onChange={(e) => setPriceFrom(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="stock">Tồn kho</Label>
              <Input
                id="stock"
                type="number"
                min={0}
                value={stock}
                onChange={(e) => setStock(e.target.value)}
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Thứ tự danh mục được sắp xếp bằng kéo thả trong danh sách
          </p>

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
// DragOverlay content
// ═════════════════════════════════════════════════════════════════════════
const DragOverlayContent = ({ cat }: { cat: CategoryItem }) => (
  <div className="flex items-center gap-3 px-4 py-2 bg-popover rounded-lg shadow-xl border border-primary/30 text-sm font-medium">
    <GripVertical className="size-3.5 text-primary" />
    <span>{cat.name}</span>
    <span className="text-muted-foreground">({cat.typeValue})</span>
  </div>
);

// ═════════════════════════════════════════════════════════════════════════
// Main GameCategoryManager Component
// ═════════════════════════════════════════════════════════════════════════
const GameCategoryManager = () => {
  const { data, isLoading } = useGameCategoriesQuery();
  const deleteGameMutation = useDeleteGameCategory();
  const deleteItemMutation = useDeleteCategoryItem();
  const reorderMutation = useReorderCategoryItems();

  const [showGameForm, setShowGameForm] = useState(false);
  const [editingGame, setEditingGame] = useState<GameCategory | null>(null);
  const [expandedGames, setExpandedGames] = useState<Set<string>>(new Set());

  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<CategoryItem | null>(null);
  const [selectedGameId, setSelectedGameId] = useState<string>("");

  // DnD state per game
  const [activeDragItem, setActiveDragItem] = useState<CategoryItem | null>(null);
  const [dragGameId, setDragGameId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const games: GameCategory[] = data?.games || [];
  const totalItems = data?.totalItems || 0;

  const toggleExpand = (gameId: string) => {
    setExpandedGames((prev) => {
      const next = new Set(prev);
      if (next.has(gameId)) next.delete(gameId);
      else next.add(gameId);
      return next;
    });
  };

  const handleDeleteGame = async (game: GameCategory) => {
    if (!confirm(`Xoá game "${game.gameName}"? Tài khoản thuộc game này sẽ không bị ảnh hưởng.`))
      return;
    try {
      await deleteGameMutation.mutateAsync(game._id);
      toast.success(`Đã xoá game "${game.gameName}"`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  const handleDeleteItem = async (gameId: string, item: CategoryItem) => {
    if (!confirm(`Xoá danh mục "${item.name}"?`))
      return;
    try {
      await deleteItemMutation.mutateAsync({ gameId, itemId: item.id });
      toast.success(`Đã xoá danh mục "${item.name}"`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  // ─── Drag & Drop handlers ───────────────────────────────────────────
  const handleDragStart = (event: DragStartEvent, gameId: string) => {
    const game = games.find((g) => g._id === gameId);
    if (!game) return;
    const item = game.categories.find((cat) => cat.id === event.active.id);
    if (item) setActiveDragItem(item);
    setDragGameId(gameId);
  };

  const handleDragEnd = async (event: DragEndEvent, gameId: string) => {
    setActiveDragItem(null);
    setDragGameId(null);

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const game = games.find((g) => g._id === gameId);
    if (!game) return;

    // Compute new order
    const items = [...game.categories];
    const oldIndex = items.findIndex((cat) => cat.id === active.id);
    const newIndex = items.findIndex((cat) => cat.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const [moved] = items.splice(oldIndex, 1);
    items.splice(newIndex, 0, moved);

    // Save previous order for undo
    const previousItems = game.categories.map((cat, i) => ({
      id: cat.id,
      sortOrder: i,
    }));

    // Compute new sortOrders
    const reordered = items.map((cat, i) => ({
      id: cat.id,
      sortOrder: i,
    }));

    try {
      await reorderMutation.mutateAsync({ gameId, items: reordered });
      toast.success("Đã cập nhật thứ tự danh mục", {
        duration: 5000,
        description: "Kéo thả danh mục trong game",
        action: {
          label: "Undo",
          onClick: async () => {
            try {
              await reorderMutation.mutateAsync({ gameId, items: previousItems });
              toast.success("Đã khôi phục thứ tự ban đầu");
            } catch {
              toast.error("Không thể khôi phục thứ tự");
            }
          },
        },
      });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Có lỗi khi sắp xếp");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {totalItems > 0
            ? `${totalItems} game`
            : "Chưa có game nào"}
        </p>
        <Button size="sm" onClick={() => { setEditingGame(null); setShowGameForm(true); }}>
          <Plus className="mr-2 size-3.5" />
          Thêm game
        </Button>
      </div>

      {games.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/30">
          <Gamepad2 className="size-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground font-medium">Chưa có danh mục game nào</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Thêm game để hiển thị danh mục tài khoản trên trang chủ
          </p>
          <Button variant="outline" className="mt-4" onClick={() => { setEditingGame(null); setShowGameForm(true); }}>
            <Plus className="mr-2 size-4" />
            Thêm game đầu tiên
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {games.map((game) => (
            <Card key={game._id} className="overflow-hidden">
              <div
                className={`flex items-center justify-between p-4 cursor-pointer hover:bg-accent/50 transition-colors ${
                  !game.isActive ? "opacity-60" : ""
                }`}
                onClick={() => toggleExpand(game._id)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{game.gameIcon}</span>
                  <div>
                    <h3 className="font-semibold">{game.gameName}</h3>
                    <p className="text-xs text-muted-foreground">
                      {game.gameSlug} · {game.categories.length} danh mục
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={game.isActive ? "default" : "secondary"}>
                    {game.isActive ? "Hoạt động" : "Tắt"}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={(e) => { e.stopPropagation(); setEditingGame(game); setShowGameForm(true); }}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-destructive"
                    onClick={(e) => { e.stopPropagation(); handleDeleteGame(game); }}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                  {expandedGames.has(game._id) ? (
                    <ChevronDown className="size-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="size-4 text-muted-foreground" />
                  )}
                </div>
              </div>

              {expandedGames.has(game._id) && (
                <div className="border-t px-4 py-3 bg-muted/20">
                  {game.categories.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Chưa có danh mục nào
                    </p>
                  ) : (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragStart={(e) => handleDragStart(e, game._id)}
                      onDragEnd={(e) => handleDragEnd(e, game._id)}
                    >
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b text-left text-muted-foreground">
                              <th className="pb-2 pr-2 w-8"></th>
                              <th className="pb-2 pr-4 font-medium">ID</th>
                              <th className="pb-2 pr-4 font-medium">Tên</th>
                              <th className="pb-2 pr-4 font-medium">Type</th>
                              <th className="pb-2 pr-4 font-medium text-right">Giá từ</th>
                              <th className="pb-2 pr-4 font-medium text-right">Tồn</th>
                              <th className="pb-2 pr-4 font-medium text-right">Thứ tự</th>
                              <th className="pb-2 font-medium text-right">Thao tác</th>
                            </tr>
                          </thead>
                          <tbody>
                            <SortableContext
                              items={game.categories.map((cat) => cat.id)}
                              strategy={verticalListSortingStrategy}
                            >
                              {game.categories.map((cat) => (
                                <SortableCategoryItemRow
                                  key={cat.id}
                                  cat={cat}
                                  gameId={game._id}
                                  onEdit={(item) => {
                                    setEditingItem(item);
                                    setSelectedGameId(game._id);
                                    setShowItemForm(true);
                                  }}
                                  onDelete={(item) => handleDeleteItem(game._id, item)}
                                />
                              ))}
                            </SortableContext>
                          </tbody>
                        </table>
                      </div>

                      <DragOverlay>
                        {activeDragItem && dragGameId === game._id ? (
                          <DragOverlayContent cat={activeDragItem} />
                        ) : null}
                      </DragOverlay>
                    </DndContext>
                  )}

                  <div className="mt-3 pt-3 border-t flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingItem(null);
                        setSelectedGameId(game._id);
                        setShowItemForm(true);
                      }}
                    >
                      <Plus className="mr-2 size-3.5" />
                      Thêm danh mục
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <GameFormDialog
        open={showGameForm}
        onOpenChange={setShowGameForm}
        initialData={editingGame}
        onSuccess={() => {}}
      />

      {selectedGameId && (
        <CategoryItemFormDialog
          open={showItemForm}
          onOpenChange={setShowItemForm}
          gameId={selectedGameId}
          initialData={editingItem}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
};

export default GameCategoryManager;

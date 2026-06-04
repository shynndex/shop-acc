import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { GlassCard } from "@/components/ui/glass-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty";
import { SkeletonTable } from "@/components/ui/skeletons";

import { useGiftcodesQuery, useCreateGiftcode, useToggleGiftcodeStatus, useDeleteGiftcode } from "@/hooks/queries/useAdminQueries";
import { exportTableToCsv } from "@/hooks/useExportCsv";
import type { Giftcode, CreateGiftcodePayload } from "@/types/admin/giftcode.type";
import { PageHeader } from "@/components/admin/shared";
import { Download, Loader2, Plus, Search, Tag, Trash2, Gift } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

const CSV_COLUMNS = [
  { key: "code", label: "Mã code" },
  { key: "type", label: "Loại" },
  { key: "value", label: "Giá trị" },
  { key: "usedCount", label: "Đã dùng" },
  { key: "maxUses", label: "Tối đa" },
  { key: "expiresAt", label: "Hạn sử dụng" },
  { key: "isActive", label: "Hoạt động" },
  { key: "minOrderAmount", label: "Đơn tối thiểu" },
];

const GiftcodesPage = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useGiftcodesQuery({ page, limit: 20, search: search || undefined });

  const { mutateAsync: createGiftcode } = useCreateGiftcode();
  const { mutateAsync: toggleStatus } = useToggleGiftcodeStatus();
  const { mutateAsync: deleteGiftcode } = useDeleteGiftcode();

  const giftcodes: Giftcode[] = data?.giftcodes || [];
  const totalPages = data?.totalPages || 1;
  const [showCreate, setShowCreate] = useState(false);

  const handleSearch = () => {
    setPage(1);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xoá giftcode này?")) return;
    try {
      await deleteGiftcode(id);
      toast.success("Đã xoá giftcode");
    } catch (error: any) {
      toast.error(error?.message || "Xoá thất bại");
    }
  };

  const handleToggleActive = async (giftcode: Giftcode) => {
    try {
      await toggleStatus({ id: giftcode._id, isActive: !giftcode.isActive });
      toast.success(giftcode.isActive ? "Đã vô hiệu hoá" : "Đã kích hoạt");
    } catch (error: any) {
      toast.error(error?.message || "Cập nhật thất bại");
    }
  };

  const getTypeBadge = (type: string) => {
    return type === "percent" ? (
      <Badge className="bg-blue-100 text-blue-700">%</Badge>
    ) : (
      <Badge className="bg-green-100 text-green-700">VNĐ</Badge>
    );
  };

  const getStatusBadge = (gc: Giftcode) => {
    if (!gc.isActive) return <Badge variant="outline" className="text-muted-foreground">Tắt</Badge>;
    if (gc.maxUses !== null && gc.usedCount >= gc.maxUses) return <Badge variant="outline" className="text-orange-500">Hết lượt</Badge>;
    if (gc.expiresAt && new Date(gc.expiresAt) < new Date()) return <Badge variant="outline" className="text-red-500">Hết hạn</Badge>;
    return <Badge className="bg-green-100 text-green-700">Hoạt động</Badge>;
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <PageHeader
        title="Quản lý mã giảm giá"
        description="Tạo và quản lý giftcode / mã giảm giá cho người dùng"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() =>
                exportTableToCsv(
                  giftcodes.map((gc) => ({
                    ...gc,
                    value: gc.type === "percent" ? `${gc.value}%` : `${gc.value.toLocaleString("vi-VN")}đ`,
                    expiresAt: gc.expiresAt ? new Date(gc.expiresAt).toLocaleDateString("vi-VN") : "Không giới hạn",
                    isActive: getStatusBadge(gc).props.children,
                  })),
                  CSV_COLUMNS,
                  `giftcodes_${Date.now()}.csv`,
                )
              }
              disabled={giftcodes.length === 0}
            >
              <Download className="mr-2 size-4" />
              Export CSV
            </Button>
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
              <DialogTrigger
                render={<Button><Plus className="mr-2 size-4" /> Tạo mã</Button>}
              />
              <DialogContent className="sm:max-w-md">
                <CreateGiftcodeForm onSuccess={() => { setShowCreate(false); }} />
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center mb-4">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo mã code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="sm" onClick={handleSearch} className="w-full sm:w-auto">Tìm</Button>
      </div>

      <GlassCard className="overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="p-6 min-w-[600px]">
              <SkeletonTable rows={5} cols={7} />
            </div>
          ) : giftcodes.length === 0 ? (
            <EmptyState
              icon={Gift}
              title="Chưa có mã giảm giá nào"
              description="Hãy tạo mã giảm giá đầu tiên để bắt đầu khuyến mãi!"
              action={
                <Button onClick={() => setShowCreate(true)}>
                  <Plus className="mr-2 size-4" /> Tạo mã đầu tiên
                </Button>
              }
            />
          ) : (
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Mã code</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Giá trị</TableHead>
                  <TableHead>Đã dùng / Tối đa</TableHead>
                  <TableHead>Hạn sử dụng</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {giftcodes.map((gc) => (
                  <TableRow key={gc._id} className="transition-colors duration-150 hover:bg-muted/50">
                    <TableCell className="font-mono font-bold">{gc.code}</TableCell>
                    <TableCell>{getTypeBadge(gc.type)}</TableCell>
                    <TableCell>
                      {gc.type === "percent" ? `${gc.value}%` : `${gc.value.toLocaleString("vi-VN")}đ`}
                      {gc.minOrderAmount > 0 && (
                        <span className="text-xs text-muted-foreground block">
                          Min: {gc.minOrderAmount.toLocaleString("vi-VN")}đ
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {gc.usedCount}{gc.maxUses !== null ? ` / ${gc.maxUses}` : " / ∞"}
                    </TableCell>
                    <TableCell>
                      {gc.expiresAt
                        ? new Date(gc.expiresAt).toLocaleDateString("vi-VN")
                        : "Không giới hạn"}
                    </TableCell>
                    <TableCell>{getStatusBadge(gc)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant={gc.isActive ? "default" : "outline"}
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleToggleActive(gc)}
                        >
                          {gc.isActive ? "Bật" : "Tắt"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-red-500 hover:text-red-700"
                          onClick={() => handleDelete(gc._id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </GlassCard>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              variant={p === page ? "default" : "outline"}
              size="sm"
              onClick={() => setPage(p)}
              className={p === page ? "bg-gradient-brand text-white border-0 shadow-glow-sm" : ""}
            >
              {p}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Create Giftcode Form ────────────────────────────────────────────────

function CreateGiftcodeForm({ onSuccess }: { onSuccess: () => void }) {
  const [code, setCode] = useState("");
  const [type, setType] = useState<"percent" | "fixed">("percent");
  const [value, setValue] = useState("");
  const [minOrderAmount, setMinOrderAmount] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { mutateAsync: createGiftcode } = useCreateGiftcode();

  const formatCode = (input: string) => {
    return input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !value) {
      toast.error("Vui lòng nhập mã code và giá trị");
      return;
    }

    const payload: CreateGiftcodePayload = {
      code: formatCode(code),
      type,
      value: parseInt(value),
    };
    if (minOrderAmount) payload.minOrderAmount = parseInt(minOrderAmount);
    if (maxUses) payload.maxUses = parseInt(maxUses);
    if (expiresAt) payload.expiresAt = new Date(expiresAt).toISOString();

    setSubmitting(true);
    try {
      await createGiftcode(payload);
      toast.success("Tạo giftcode thành công!");
      onSuccess();
    } catch (error: any) {
      toast.error(error?.message || "Tạo thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Tạo mã giảm giá mới</DialogTitle>
        <DialogDescription>Nhập thông tin mã giảm giá bên dưới</DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Mã code *</label>
          <Input
            placeholder="VD: SAMSAM10"
            value={code}
            onChange={(e) => setCode(formatCode(e.target.value))}
            maxLength={20}
          />
        </div>          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Loại giảm *</label>
            <Select value={type} onValueChange={(v: "percent" | "fixed") => setType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percent">Phần trăm (%)</SelectItem>
                <SelectItem value="fixed">Số tiền cố định (VNĐ)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Giá trị *</label>
            <Input
              type="number"
              placeholder={type === "percent" ? "VD: 10" : "VD: 50000"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              min={1}
              max={type === "percent" ? 100 : undefined}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Đơn hàng tối thiểu</label>
            <Input
              type="number"
              placeholder="0 = không yêu cầu"
              value={minOrderAmount}
              onChange={(e) => setMinOrderAmount(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Số lượt tối đa</label>
            <Input
              type="number"
              placeholder="Để trống = không giới hạn"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Hạn sử dụng</label>
          <Input
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
          Tạo mã
        </Button>
      </DialogFooter>
    </form>
  );
}

export default GiftcodesPage;

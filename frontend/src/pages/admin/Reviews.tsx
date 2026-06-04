import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { GlassCard } from "@/components/ui/glass-card";
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
import { EmptyState } from "@/components/ui/empty";
import { SkeletonTable } from "@/components/ui/skeletons";
import { useReviewsQuery, useReviewStatsQuery, useModerateReview } from "@/hooks/queries/useAdminQueries";
import { exportTableToCsv } from "@/hooks/useExportCsv";
import type { Review } from "@/types";
import { PageHeader } from "@/components/admin/shared";
import {
  CheckCircle,
  Download,
  MessageSquareText,
  Star,
  ThumbsDown,
  ThumbsUp,
  XCircle,
  MessagesSquare,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const CSV_COLUMNS = [
  { key: "user.displayName", label: "Người dùng" },
  { key: "account.title", label: "Sản phẩm" },
  { key: "rating", label: "Đánh giá" },
  { key: "comment", label: "Nội dung" },
  { key: "status", label: "Trạng thái" },
  { key: "createdAt", label: "Ngày tạo" },
];

const ReviewPage = () => {
  const [statusFilter, setStatusFilter] = useState("pending");
  const [page, setPage] = useState(1);

  const { data: listData, isLoading: listLoading } = useReviewsQuery({
    status: statusFilter === "all" ? undefined : statusFilter,
    page,
    limit: 20,
  });

  const { data: statsData, isLoading: statsLoading } = useReviewStatsQuery();

  const reviews: Review[] = listData?.reviews || [];
  const totalPages = listData?.totalPages || 1;
  const stats = statsData || { pending: 0, approved: 0, rejected: 0 };

  const { mutateAsync: moderate } = useModerateReview();

  const handleModerate = async (id: string, status: "approved" | "rejected") => {
    try {
      await moderate({ id, status });
      toast.success(status === "approved" ? "Đã duyệt đánh giá" : "Đã từ chối đánh giá");
    } catch {
      toast.error("Có lỗi xảy ra");
    }
  };

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`size-3.5 ${s <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
        />
      ))}
    </div>
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="text-amber-600 border-amber-300">Chờ duyệt</Badge>;
      case "approved":
        return <Badge className="bg-green-100 text-green-700">Đã duyệt</Badge>;
      case "rejected":
        return <Badge variant="destructive">Từ chối</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <PageHeader
        title="Quản lý đánh giá"
        description="Duyệt và quản lý đánh giá sản phẩm từ người dùng"
        actions={
          <div className="flex items-center gap-3">
            {!statsLoading && (
              <>
                <Badge variant="outline" className="text-amber-600 border-amber-300">
                  Chờ: {stats.pending}
                </Badge>
                <Badge className="bg-green-100 text-green-700">Đã duyệt: {stats.approved}</Badge>
              </>
            )}
            <Button
              variant="outline"
              onClick={() =>
                exportTableToCsv(
                  reviews.map((r) => ({
                    ...r,
                    user: r.user || { displayName: "N/A", username: "" },
                    account: typeof r.account === "object" ? r.account : { title: "N/A", game: "", price: 0 },
                    rating: `${r.rating}/5`,
                    status: getStatusBadge(r.status)?.props?.children || r.status,
                    createdAt: new Date(r.createdAt).toLocaleDateString("vi-VN"),
                  })),
                  CSV_COLUMNS,
                  `reviews_${Date.now()}.csv`,
                )
              }
              disabled={reviews.length === 0}
            >
              <Download className="mr-2 size-4" />
              Export CSV
            </Button>
          </div>
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center mb-4">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Chờ duyệt</SelectItem>
            <SelectItem value="approved">Đã duyệt</SelectItem>
            <SelectItem value="rejected">Từ chối</SelectItem>
            <SelectItem value="all">Tất cả</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <GlassCard className="overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          {listLoading ? (
            <div className="p-6 min-w-[600px]">
              <SkeletonTable rows={5} cols={7} />
            </div>
          ) : reviews.length === 0 ? (
            <EmptyState
              icon={MessagesSquare}
              title="Chưa có đánh giá nào"
              description={
                statusFilter === "pending"
                  ? "Chưa có đánh giá nào cần duyệt"
                  : "Không tìm thấy đánh giá nào với trạng thái này"
              }
            />
          ) : (
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Người dùng</TableHead>
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead>Đánh giá</TableHead>
                  <TableHead>Nội dung</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((review, idx) => (
                  <TableRow
                    key={review._id}
                    className="transition-colors duration-150 hover:bg-muted/50 animate-in fade-in slide-in-from-bottom-1 duration-300"
                    style={{ animationDelay: `${idx * 40}ms` }}
                  >
                    <TableCell className="font-medium">
                      {review.user?.displayName || review.user?.username || "N/A"}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {typeof review.account === "object"
                          ? review.account.title
                          : "N/A"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {typeof review.account === "object"
                          ? `${review.account.game} - ${review.account.price?.toLocaleString("vi-VN")}đ`
                          : ""}
                      </div>
                    </TableCell>
                    <TableCell>{renderStars(review.rating)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {review.comment || <span className="text-muted-foreground italic">Không có bình luận</span>}
                    </TableCell>
                    <TableCell>{getStatusBadge(review.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                    </TableCell>
                    <TableCell className="text-right">
                      {review.status === "pending" && (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-green-600 hover:text-green-800 hover:bg-green-50 transition-all duration-200 hover:scale-110 active:scale-90"
                            onClick={() => handleModerate(review._id, "approved")}
                            title="Duyệt"
                          >
                            <ThumbsUp className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-red-600 hover:text-red-800 hover:bg-red-50 transition-all duration-200 hover:scale-110 active:scale-90"
                            onClick={() => handleModerate(review._id, "rejected")}
                            title="Từ chối"
                          >
                            <ThumbsDown className="size-4" />
                          </Button>
                        </div>
                      )}
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
              className={`transition-all duration-200 hover:scale-105 active:scale-95 ${p === page ? "bg-gradient-brand text-white border-0 shadow-glow-sm" : ""}`}
            >
              {p}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewPage;

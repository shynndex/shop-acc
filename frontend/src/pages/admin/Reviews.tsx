import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/adminAxios";
import type { Review } from "@/types";
import {
  CheckCircle,
  MessageSquareText,
  Star,
  ThumbsDown,
  ThumbsUp,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const ReviewPage = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const data = await api.get("/admin/reviews", {
        params: { status: statusFilter === "all" ? undefined : statusFilter, page, limit: 20 },
      });
      const result = data.data || data;
      setReviews(result.reviews || []);
      setTotalPages(result.totalPages || 1);
    } catch {
      toast.error("Không thể tải đánh giá");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await api.get("/admin/reviews/stats");
      const result = data.data || data;
      if (result) setStats(result);
    } catch {}
  };

  useEffect(() => {
    fetchReviews();
  }, [statusFilter, page]);

  useEffect(() => {
    fetchStats();
  }, []);

  const handleModerate = async (id: string, status: "approved" | "rejected") => {
    try {
      await api.patch(`/admin/reviews/${id}/status`, { status });
      toast.success(status === "approved" ? "Đã duyệt đánh giá" : "Đã từ chối đánh giá");
      fetchReviews();
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
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquareText className="size-6" /> Quản lý đánh giá
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Duyệt và quản lý đánh giá sản phẩm từ người dùng
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-amber-600 border-amber-300">
            Chờ: {stats.pending}
          </Badge>
          <Badge className="bg-green-100 text-green-700">Đã duyệt: {stats.approved}</Badge>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
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

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : reviews.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              Chưa có đánh giá nào
            </div>
          ) : (
            <Table>
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
                {reviews.map((review) => (
                  <TableRow key={review._id}>
                    <TableCell className="font-medium">
                      {review.user?.displayName || review.user?.username || "N/A"}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{review.account?.title || "N/A"}</div>
                      <div className="text-xs text-muted-foreground">
                        {review.account?.game} - {review.account?.price?.toLocaleString("vi-VN")}đ
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
                            className="size-8 text-green-600 hover:text-green-800 hover:bg-green-50"
                            onClick={() => handleModerate(review._id, "approved")}
                            title="Duyệt"
                          >
                            <ThumbsUp className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-red-600 hover:text-red-800 hover:bg-red-50"
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
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              variant={p === page ? "default" : "outline"}
              size="sm"
              onClick={() => setPage(p)}
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

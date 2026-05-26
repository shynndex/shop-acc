import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { orderService } from "@/services/client/orderService";
import { reviewService } from "@/services/client/reviewService";
import {
  CheckCircle,
  Clock,
  Copy,
  EyeOff,
  History,
  MessageSquare,
  Package,
  Search,
  Star,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { toast } from "sonner";

interface OrderItem {
  _id: string;
  transactionId: string;
  account: {
    _id: string;
    title: string;
    price: number;
    loginInfo?: {
      username: string;
      password: string;
    };
  };
  amount: number;
  status: string;
  completedAt: string;
  createdAt: string;
}

const OrderHistoryPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [highlightedOrderId, setHighlightedOrderId] = useState<string | null>(
    null,
  );
  const [reviewedOrders, setReviewedOrders] = useState<Set<string>>(new Set());
  const [reviewDialog, setReviewDialog] = useState<{
    open: boolean;
    orderId: string;
    accountId: string;
  } | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Fetch order history from API
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await orderService.getUserOrders({ limit: 50 });
        setOrders(response.orders || []);
      } catch (error) {
        console.error("Error fetching orders:", error);
        toast.error("Không thể tải lịch sử đơn hàng");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  // Xử lý state điều hướng từ trang chi tiết
  useEffect(() => {
    if (location.state?.newOrderId) {
      setHighlightedOrderId(location.state.newOrderId);
      setShowSuccessBanner(true);
      setExpandedOrderId(location.state.newOrderId);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Auto ẩn banner thành công sau 5s
  useEffect(() => {
    if (showSuccessBanner) {
      const timer = setTimeout(() => setShowSuccessBanner(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessBanner]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Đã copy ${label}`);
  };

  const filteredOrders = orders.filter(
    (order) =>
      order.account?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <History className="w-8 h-8 text-blue-600" />
          Lịch sử đơn hàng
        </h1>
        <p className="text-muted-foreground">
          Quản lý tất cả tài khoản bạn đã mua tại ShopSamcc
        </p>
      </div>

      {showSuccessBanner && (
        <Alert className="mb-6 bg-green-50 border-green-200 text-green-800 animate-in fade-in slide-in-from-top-2">
          <CheckCircle className="size-5 text-green-600" />
          <AlertTitle className="font-semibold">Thành công!</AlertTitle>
          <AlertDescription>
            Bạn đã mua tài khoản thành công. Thông tin đã được lưu vào đơn hàng
            bên dưới.
          </AlertDescription>
        </Alert>
      )}

      {/* Thanh tìm kiếm */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm theo tên tài khoản hoặc mã đơn hàng..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="size-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {searchTerm
              ? "Không tìm thấy đơn hàng phù hợp"
              : "Bạn chưa có đơn hàng nào"}
          </h3>
          <p className="text-muted-foreground mb-6">
            {searchTerm
              ? "Thử tìm kiếm với từ khóa khác"
              : "Bạn chưa mua tài khoản nào. Hãy khám phá kho nick ngay!"}
          </p>
          {!searchTerm && (
            <Button onClick={() => navigate("/tai-khoan/lien-quan")}>Khám phá ngay</Button>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const orderId = order.transactionId || order._id;
            const isExpanded = expandedOrderId === orderId;
            const isHighlighted = highlightedOrderId === orderId;

            return (
              <Card
                key={order._id}
                className={`overflow-hidden transition-all duration-300 ${isHighlighted ? "ring-2 ring-blue-500 shadow-lg" : "hover:shadow-md"}`}
              >
                <CardHeader
                  className="pb-3 cursor-pointer select-none"
                  onClick={() =>
                    setExpandedOrderId(isExpanded ? null : orderId)
                  }
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg font-bold flex items-center gap-2">
                        {order.account?.title || "Tài khoản"}
                        {isHighlighted && (
                          <Badge
                            variant="secondary"
                            className="bg-blue-100 text-blue-700"
                          >
                            Mới mua
                          </Badge>
                        )}
                      </CardTitle>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {new Date(
                            order.completedAt || order.createdAt,
                          ).toLocaleString("vi-VN")}
                        </span>
                        <span className="font-mono">#{orderId}</span>
                      </div>
                    </div>                        <div className="flex items-center gap-3">
                      <span className="text-xl font-bold text-red-600">
                        {order.amount?.toLocaleString("vi-VN")}đ
                      </span>
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 border-green-200"
                      >
                        Hoàn thành
                      </Badge>
                      {order.account?._id && !reviewedOrders.has(order._id) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            setReviewDialog({
                              open: true,
                              orderId: order._id,
                              accountId: typeof order.account === 'string' ? order.account : order.account._id,
                            });
                          }}
                        >
                          <Star className="size-4 mr-1" />
                          Đánh giá
                        </Button>
                      )}
                      {reviewedOrders.has(order._id) && (
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          <MessageSquare className="size-3 mr-1" />
                          Đã đánh giá
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && order.account?.loginInfo && (
                  <CardContent className="pt-0 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="border-t pt-4 mt-2">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold flex items-center gap-2 text-sm">
                          <Package className="size-4" />
                          Thông tin đăng nhập
                        </h4>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border group hover:border-blue-300 transition-colors">
                          <div className="flex-1 min-w-0 mr-4">
                            <span className="text-xs text-muted-foreground uppercase font-medium block mb-1">
                              Tên đăng nhập
                            </span>
                            <span className="font-mono text-sm select-all break-all">
                              {order.account.loginInfo.username}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(
                                order.account!.loginInfo!.username,
                                "tên đăng nhập",
                              );
                            }}
                          >
                            <Copy className="size-4" />
                          </Button>
                        </div>

                        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border group hover:border-blue-300 transition-colors">
                          <div className="flex-1 min-w-0 mr-4">
                            <span className="text-xs text-muted-foreground uppercase font-medium block mb-1">
                              Mật khẩu
                            </span>
                            <span className="font-mono text-sm select-all break-all">
                              {order.account.loginInfo.password}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(
                                order.account!.loginInfo!.password,
                                "mật khẩu",
                              );
                            }}
                          >
                            <Copy className="size-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                        <EyeOff className="size-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-amber-800">
                          <strong>Bảo mật:</strong> Vui lòng đổi mật khẩu game
                          ngay sau khi nhận tài khoản để đảm bảo an toàn. Shop
                          không chịu trách nhiệm nếu tài khoản bị khóa do không
                          đổi mật khẩu.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Review Dialog */}
      <Dialog
        open={reviewDialog?.open || false}
        onOpenChange={(open) => !open && setReviewDialog(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Đánh giá sản phẩm</DialogTitle>
            <DialogDescription>
              Chia sẻ trải nghiệm của bạn về tài khoản này.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium block mb-2">Chất lượng</label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setReviewRating(s)}
                    className="cursor-pointer hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`size-8 ${s <= reviewRating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">Bình luận (tuỳ chọn)</label>
              <Textarea
                placeholder="Viết cảm nhận của bạn về tài khoản..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={3}
                maxLength={1000}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setReviewDialog(null)}>
              Huỷ
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              disabled={submittingReview}
              onClick={async () => {
                if (!reviewDialog) return;
                try {
                  setSubmittingReview(true);
                  await reviewService.create({
                    accountId: reviewDialog.accountId,
                    orderId: reviewDialog.orderId,
                    rating: reviewRating,
                    comment: reviewComment,
                  });
                  toast.success("Đánh giá của bạn đã được gửi và chờ admin duyệt");
                  setReviewedOrders((prev) => new Set(prev).add(reviewDialog.orderId));
                  setReviewDialog(null);
                  setReviewComment("");
                  setReviewRating(5);
                } catch (error: any) {
                  toast.error(error?.message || "Không thể gửi đánh giá");
                } finally {
                  setSubmittingReview(false);
                }
              }}
            >
              {submittingReview ? "Đang gửi..." : "Gửi đánh giá"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderHistoryPage;

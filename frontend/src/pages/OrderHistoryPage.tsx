import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/useAuthStore";
import type { Order } from "@/types";
import {
  CheckCircle,
  Clock,
  Copy,
  EyeOff,
  History,
  Package,
  Search,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { toast } from "sonner";

const OrderHistoryPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [orders, setOrders] = useState<Order[]>([]); // danh sách đơn hàng
  const [searchTerm, setSearchTerm] = useState(""); // ô tìm kiếm
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null); // thiết kế mở rộng
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [highlightedOrderId, setHighlightedOrderId] = useState<string | null>(
    null,
  );

  //Todo:xử lý gọi api order history

  // Xử lý state điều hướng từ trang chi tiết
  useEffect(() => {
    if (location.state?.newOrderId) {
      setHighlightedOrderId(location.state.newOrderId);
      setShowSuccessBanner(true);
      setExpandedOrderId(location.state.newOrderId); // Auto mở đơn mới
      window.history.replaceState({}, document.title); // Xóa state để không hiện lại khi F5
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
      order.accountTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.orderId.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (!user) {
    return (
      <div className="container py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Vui lòng đăng nhập</h2>
        <p className="text-muted-foreground mb-6">
          Bạn cần đăng nhập để xem lịch sử mua hàng.
        </p>
        <Button onClick={() => navigate("/signin")}>Đăng nhập ngay</Button>
      </div>
    );
  }

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

      {/* Danh sách đơn hàng */}
      {filteredOrders.length === 0 ? (
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
            <Button onClick={() => navigate("/shop")}>Khám phá ngay</Button>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const isExpanded = expandedOrderId === order.orderId;
            const isHighlighted = highlightedOrderId === order.orderId;

            return (
              <Card
                key={order.orderId}
                className={`overflow-hidden transition-all duration-300 ${isHighlighted ? "ring-2 ring-blue-500 shadow-lg" : "hover:shadow-md"}`}
              >
                <CardHeader
                  className="pb-3 cursor-pointer select-none"
                  onClick={() =>
                    setExpandedOrderId(isExpanded ? null : order.orderId)
                  }
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg font-bold flex items-center gap-2">
                        {order.accountTitle}
                        {isHighlighted && (
                          <Badge
                            variant={"secondary"}
                            className="bg-blue-100 text-blue-700"
                          >
                            Mới mua
                          </Badge>
                        )}
                      </CardTitle>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {new Date(order.purchasedAt).toLocaleString("vi-VN")}
                        </span>
                        <span className="font-mono">#{order.orderId}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-bold text-red-600">
                        {order.price.toLocaleString("vi-VN")}đ
                      </span>
                      <Badge
                        variant={"outline"}
                        className="bg-green-50 text-green-700 border-green-200"
                      >
                        Hoàn thành
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-0 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="border-t pt-4 mt-2">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold flex items-center gap-2 text-sm">
                          <Package className="size-4" />
                          Thông tin đăng nhập
                        </h4>
                      </div>

                      <div className="space-y-3">
                        {Object.entries(order.credentials).map(
                          ([key, value]) => (
                            <div
                              key={key}
                              className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border group hover:border-blue-300 transition-colors"
                            >
                              <div className="flex-1 min-w-0 mr-4">
                                <span className="text-xs text-muted-foreground uppercase font-medium block mb-1">
                                  {key}
                                </span>
                                <span className="font-mono text-sm select-all break-all">
                                  {value}
                                </span>
                              </div>
                              <Button
                                variant={"ghost"}
                                size={"icon"}
                                className={
                                  "size-8 opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                }
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopy(value, key);
                                }}
                              >
                                <Copy className="size-4" />
                              </Button>
                            </div>
                          ),
                        )}
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
    </div>
  );
};

export default OrderHistoryPage;

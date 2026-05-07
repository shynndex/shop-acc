import { ProductGallery } from "@/components/client/ProductGallery";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { accountService } from "@/services/client/accountService";
import { useAuthStore } from "@/stores/useAuthStore";
import type { Account } from "@/types";
import { ShoppingCart } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

// --- MOCK DATA CHO PHẦN LIÊN QUAN (Demo UI) ---
const MOCK_RELATED = [
  {
    id: "rel1",
    code: "#UEU1349284",
    rank: "Kim Cương",
    price: 600000,
    image: "https://placehold.co/300x200",
  },
  {
    id: "rel2",
    code: "#UEU1519279",
    rank: "Đồng",
    price: 210000,
    discount: 58,
    image: "https://placehold.co/300x200",
  },
  {
    id: "rel3",
    code: "#UEU1520967",
    rank: "Đồng",
    price: 300000,
    discount: 50,
    image: "https://placehold.co/300x200",
  },
  {
    id: "rel4",
    code: "#UEU1603214",
    rank: "Đồng",
    price: 800000,
    discount: 47,
    image: "https://placehold.co/300x200",
  },
  {
    id: "rel5",
    code: "#UEU1469541",
    rank: "Đồng",
    price: 950000,
    discount: 21,
    image: "https://placehold.co/300x200",
  },
];

const AccountDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();

  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Trạng thái mua hàng
  const [purchased, setPurchased] = useState(false);
  const [credentials, setCredentials] = useState<any>(null);
  const [showCredentials, setShowCredentials] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Dialog state
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any>(null);

  // Fetch sản phẩm
  useEffect(() => {
    if (id) {
      accountService
        .getById(id)
        .then(setAccount)
        .catch(() => toast.error("Không tìm thấy tài khoản"))
        .finally(() => setLoading(false));
    }
  }, [id]);

  // Kiểm tra trạng thái đã mua
  useEffect(() => {
    const saved = localStorage.getItem(`purchased_${user?.id}_${id}`);

    if (saved) {
      setPurchased(true);
      setCredentials(JSON.parse(saved));
    }
  }, [id, user?.id]);

  const handlePurchase = async () => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để mua tài khoản");
      navigate("/signin");
      return;
    }

    if (!account) {
      return;
    }

    if ((user.balance || 0) < account.price) {
      toast.error("Số dư không đủ. Vui lòng nạp thêm tiền.");
      return;
    }

    try {
      setProcessing(true);
      // Giả lập delay API
      await new Promise((r) => setTimeout(r, 1000));

      const mockCreds = {
        user: "game_acc_123",
        pass: "MatKhau123@",
        server: "Asia",
        note: "ShopSamcc khuyến cáo đổi mật khẩu ngay khi nhận nick.",
      };

      const orderData = {
        orderId: `ORD${Date.now()}`,
        accountId: account.id,
        accountTitle: account.title,
        credentials: mockCreds,
        price: account.price,
        purchasedAt: new Date().toISOString(),
      };

      const orderKey = `order_${user.id}_${Date.now()}`;
      localStorage.setItem(orderKey, JSON.stringify(orderData));
      localStorage.setItem(
        `purchased_${user.id}_${id}`,
        JSON.stringify(mockCreds),
      );

      // Trừ tiền
      updateUser({ balance: (user.balance || 0) - account.price });

      setCurrentOrder(orderData);
      setShowSuccessDialog(true);
      setPurchased(true);
      setCredentials(mockCreds);
    } catch (error) {
      toast.error("Có lỗi xảy ra khi mua tài khoản");
    } finally {
      setProcessing(false);
    }
  };

  const handleViewOrderHistory = () => {
    setShowSuccessDialog(false);
    navigate("/me/orders", {
      state: {
        successMessage: "Đã mua thành công tài khoản!",
        newOrderId: currentOrder?.orderId,
      },
    });
  };

  const images = account?.images?.length
    ? account.images
    : ["https://placehold.co/600x400?text=No+Image"];

  if (loading)
    return <div className="p-10 text-center">Đang tải thông tin...</div>;
  if (!account)
    return <div className="p-10 text-center">Không tìm thấy tài khoản</div>;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-4">
          <ProductGallery images={images} />
          <div className="mt-6">
            <h3 className="font-semibold text-lg mb-2">Chi tiết dịch vụ</h3>
            <p className="text-muted-foreground text-sm">
              Bảo hành uy tín - Hoàn tiền nếu lỗi thông tin trong 24h đầu.
            </p>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="bg-white border rounded-lg shadow-sm p-6 sticky top-24">
            <div className="mb-4">
              <h1 className="text-xl font-bold leading-tight mb-2">
                {account?.title}
              </h1>
              <Badge
                variant={"outline"}
                className="text-xs bg-gray-50 text-gray-600"
              >
                Mã số: #
                {account.attributes?.code || id?.slice(0, 8).toUpperCase()}
              </Badge>
            </div>

            <div className="mb-6 bg-gray-50 rounded-lg p-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mức Rank</span>
                <span className="font-medium">
                  {account.attributes?.rank || "Chưa cập nhật"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Đăng Ký</span>
                <span className="font-medium text-blue-600">
                  Trắng thông tin
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Số tướng</span>
                <span className="font-medium">
                  {account.attributes?.heroes || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Số Skin</span>
                <span className="font-medium">
                  {account.attributes?.skins || 0}
                </span>
              </div>

              <div className="mb-6 border-b pb-6">
                <div className="flex items-end gap-3 mb-1">
                  {account.attributes?.originalPrice && (
                    <span className="text-muted-foreground line-through text-sm">
                      {account.attributes.originalPrice.toLocaleString("vi-VN")}
                      đ
                    </span>
                  )}
                  <span className="text-3xl font-bold text-red-600">
                    {account.attributes?.discount.toLocaleString("vi-VN")} đ
                  </span>
                  {account.attributes?.discount && (
                    <Badge className="bg-red-500 hover:bg-red-600 ml-2">
                      -{account.attributes.discount}%
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Rẻ vô đối,giá tốt nhất thị trường
                </p>
              </div>

              <Button
                className={
                  "w-full h-12 text-lg font-bold bg-blue-600 hover:bg-blue shadow-sm"
                }
                onClick={handlePurchase}
                disabled={processing}
              >
                {processing ? (
                  <span className="flex items-center gap-2">
                    <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent">
                      Đang xử lý...
                    </span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <ShoppingCart className="size-5" />
                    Mua ngay
                  </span>
                )}
              </Button>

              {user?.balance ||
                (0 < account.price && (
                  <Button
                    variant={"outline"}
                    className={
                      "w-full h-10 mt-3 border-blue-200 text-blue-600 hover:bg-blue-50"
                    }
                    onClick={() =>
                      toast.info("Tính năng thanh toán thẻ đang phát triển")
                    }
                  >
                    Mua bằng ATM,Momo{" "}
                    <span className="ml-2 font-bold">
                      {account.price?.toLocaleString("vi-VN")} đ
                    </span>
                  </Button>
                ))}
            </div>
          </div>
        </div>

        {/* Mô tả tài khoản */}
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4 border-b pb-2">
            Mô tả tài khoản
          </h2>
          <div className="prose max-w-none text-muted-foreground whitespace-pre-wrap">
            {account.description || "Chưa có mô tả chi tiết"}
          </div>

          {/* Tài khoản liên quan */}
          <div className="mt-12 border-t pt-8">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
              Tài khoản liên quan
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {MOCK_RELATED.map((item) => (
                <Card
                  key={item.id}
                  className="cursor-pointer hover:shadow-md transition group border"
                >
                  <div className="aspect-[3/2] overflow-hidden rounded-t-lg bg-gray-100">
                    <img
                      src={item.image}
                      alt={item.code}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  </div>
                  <CardContent className="p-3 space-y-1">
                    <p className="font-bold text-sm text-blue-600">
                      {item.code}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Mức rank: {item.rank}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Đăng ký: Trắng thông tin
                    </p>
                    <div className="flex items-center justify-between pt-2">
                      <span className="font-bold text-sm">
                        {item.price?.toLocaleString("vi-VN")}đ
                      </span>
                      {item.discount && (
                        <Badge
                          variant={"destructive"}
                          className="h-5 px-1 text-[10px]"
                        >
                          {item.discount}%
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountDetailPage;

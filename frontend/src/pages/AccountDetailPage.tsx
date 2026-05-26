import { ProductGallery } from "@/components/client/ProductGallery";
import GiftCodeInput from "@/components/client/GiftCodeInput";
import type { GiftCodeResult } from "@/components/client/GiftCodeInput";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { accountService } from "@/services/client/accountService";
import { orderService } from "@/services/client/orderService";
import { depositService } from "@/services/client/depositService";
import { reviewService } from "@/services/client/reviewService";
import { useAuthStore } from "@/stores/useAuthStore";
import type { Account, Review } from "@/types";
import {
  BadgePercent,
  Banknote,
  ChevronRight,
  Copy,
  ExternalLink,
  Layers,
  Loader2,
  MessageSquare,
  QrCode,
  ShoppingCart,
  Star,
  Tag,
  Timer,
  XCircle,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { formatVND } from "@/lib/utils";

// ─── Star Rating Component ────────────────────────────────────────────────

const StarRating = ({
  value,
  onChange,
  size = "md",
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: "sm" | "md" | "lg";
}) => {
  const sizeClass = size === "sm" ? "size-4" : size === "lg" ? "size-8" : "size-5";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(s)}
          className={`${onChange ? "cursor-pointer hover:scale-110" : "cursor-default"} transition-transform`}
        >
          <Star
            className={`${sizeClass} ${s <= value ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
          />
        </button>
      ))}
    </div>
  );
};

// ─── Review Card ──────────────────────────────────────────────────────────

const ReviewCard = ({ review }: { review: Review }) => (
  <div className="border rounded-lg p-4 space-y-2">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="size-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600">
          {review.user?.displayName?.charAt(0)?.toUpperCase() || "U"}
        </div>
        <div>
          <p className="text-sm font-semibold">
            {review.user?.displayName || review.user?.username || "Người dùng"}
          </p>
          <p className="text-xs text-muted-foreground">
            {new Date(review.createdAt).toLocaleDateString("vi-VN")}
          </p>
        </div>
      </div>
      <StarRating value={review.rating} size="sm" />
    </div>
    {review.comment && (
      <p className="text-sm text-muted-foreground">{review.comment}</p>
    )}
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────

const AccountDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();

  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);

  // Purchase state
  const [processing, setProcessing] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [discountCode, setDiscountCode] = useState<string | null>(null);

  // PayOS Purchase QR Dialog
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [qrData, setQrData] = useState<any>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [checkingPayment, setCheckingPayment] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewTotal, setReviewTotal] = useState(0);
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Suggestions state
  const [suggestions, setSuggestions] = useState<Account[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);

  const reviewFormRef = useRef<HTMLDivElement>(null);

  // Fetch account
  useEffect(() => {
    if (id) {
      accountService
        .getById(id)
        .then((data) => setAccount(data?.account || data))
        .catch(() => toast.error("Không tìm thấy tài khoản"))
        .finally(() => setLoading(false));
    }
  }, [id]);

  // Fetch reviews
  useEffect(() => {
    if (id) {
      setReviewsLoading(true);
      reviewService
        .getPublic({ accountId: id, limit: 10 })
        .then((data) => {
          setReviews(data.reviews || []);
          setReviewTotal(data.totalItems || 0);
        })
        .catch(() => {})
        .finally(() => setReviewsLoading(false));
    }
  }, [id]);

  // Fetch my review (if logged in)
  useEffect(() => {
    if (user && id) {
      reviewService
        .getMyReview(id)
        .then((data) => {
          if (data?.review) setMyReview(data.review);
        })
        .catch(() => {});
    }
  }, [user, id]);

  // Fetch suggestions
  useEffect(() => {
    if (id) {
      setSuggestionsLoading(true);
      accountService
        .getSuggestions({ accountId: id, type: "related", limit: 4 })
        .then((data) => setSuggestions(Array.isArray(data) ? data : []))
        .catch(() => {})
        .finally(() => setSuggestionsLoading(false));
    }
  }, [id]);

  // Countdown timer for QR payment
  useEffect(() => {
    if (!showQRDialog || !qrData?.expiresAt) return;
    const expires = new Date(qrData.expiresAt).getTime();
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((expires - now) / 1000));
      setCountdown(diff);
      if (diff <= 0) {
        clearInterval(interval);
        toast.warning("Thời gian thanh toán đã hết.");
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [showQRDialog, qrData?.expiresAt]);

  const handleDiscountApply = (result: GiftCodeResult) => {
    if (result.valid && result.code) {
      setDiscountCode(result.code);
    }
  };

  const handleDiscountRemove = () => {
    setDiscountCode(null);
  };

  // ── Balance Purchase ──
  const handleBalancePurchase = async () => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để mua tài khoản");
      navigate("/signin");
      return;
    }
    if (!account) return;
    if ((user.balance || 0) < account.price) {
      toast.error("Số dư không đủ. Vui lòng nạp thêm tiền.");
      return;
    }

    try {
      setProcessing(true);
      const data = await orderService.purchaseAccount(
        account.id,
        discountCode || undefined,
        "balance",
      );

      if (data?.data?.newBalance !== undefined) {
        updateUser({ balance: data.data.newBalance });
      }

      setCurrentOrder(data);
      setShowSuccessDialog(true);
    } catch (error: any) {
      const message =
        error?.message || error?.response?.data?.message || "Có lỗi xảy ra khi mua tài khoản";
      toast.error(message);
    } finally {
      setProcessing(false);
    }
  };

  // ── PayOS Purchase (QR) ──
  const handlePayOSPurchase = async () => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để mua tài khoản");
      navigate("/signin");
      return;
    }
    if (!account) return;

    setQrLoading(true);
    try {
      const res = await depositService.createPayOSPurchase({
        accountId: account.id,
        discountCode: discountCode || undefined,
      });

      if (res?.success && res?.data) {
        setQrData(res.data);
        setShowQRDialog(true);
        toast.info("Đã tạo mã QR. Vui lòng chuyển khoản để thanh toán.", { duration: 5000 });
      } else {
        toast.error(res?.message || "Không thể tạo yêu cầu thanh toán");
      }
    } catch (error: any) {
      const message =
        error?.message || error?.response?.data?.message || "Có lỗi xảy ra";
      toast.error(message);
    } finally {
      setQrLoading(false);
    }
  };

  // ── Check PayOS Payment Status ──
  const handleCheckPayment = async () => {
    if (!qrData?.bankDepositId) return;
    setCheckingPayment(true);
    try {
      const res = await depositService.checkPayOSPurchaseStatus(qrData.bankDepositId);
      if (res?.success && res?.data) {
        if (res.data.status === "PAID") {
          toast.success("Thanh toán thành công!");
          setShowQRDialog(false);
          setCurrentOrder({ data: { order: res.data.order }, order: res.data.order });
          setShowSuccessDialog(true);
        } else if (res.data.status === "CANCELLED") {
          toast.error("Giao dịch đã bị huỷ.");
          setShowQRDialog(false);
        } else {
          toast.info("Đang chờ xác nhận thanh toán...");
        }
      }
    } catch (error: any) {
      toast.error(error?.message || "Lỗi kiểm tra thanh toán");
    } finally {
      setCheckingPayment(false);
    }
  };

  // ── Cancel PayOS Purchase ──
  const handleCancelPurchase = async () => {
    if (!qrData?.bankDepositId) return;
    try {
      await depositService.cancelPayOSPurchase(qrData.bankDepositId);
      toast.info("Đã huỷ giao dịch.");
      setShowQRDialog(false);
      setQrData(null);
    } catch (error: any) {
      toast.error(error?.message || "Lỗi huỷ giao dịch");
    }
  };

  const handleViewOrderHistory = () => {
    setShowSuccessDialog(false);
    navigate("/me/orders", {
      state: {
        successMessage: "Đã mua thành công tài khoản!",
        newOrderId: currentOrder?.data?.order?.transactionId || currentOrder?.order?.transactionId,
      },
    });
  };

  const handleSubmitReview = async () => {
    if (!user || !id || !currentOrder?.data?.order?._id) {
      toast.error("Bạn cần mua tài khoản để đánh giá");
      return;
    }

    try {
      setSubmittingReview(true);
      await reviewService.create({
        accountId: id,
        orderId: currentOrder.data.order._id,
        rating: reviewRating,
        comment: reviewComment,
      });
      toast.success("Đánh giá của bạn đã được gửi và chờ admin duyệt");
      setShowReviewForm(false);
      setReviewComment("");
    } catch (error: any) {
      toast.error(error?.message || "Không thể gửi đánh giá");
    } finally {
      setSubmittingReview(false);
    }
  };

  const images = account?.images?.length
    ? account.images
    : ["https://placehold.co/600x400?text=No+Image"];

  if (loading)
    return <div className="p-10 text-center">Đang tải thông tin...</div>;
  if (!account)
    return <div className="p-10 text-center">Không tìm thấy tài khoản</div>;

  // Format countdown
  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column - Images + Description */}
        <div className="lg:col-span-7 space-y-4">
          <ProductGallery images={images} />

          {/* Giftcode Section */}
          <div className="mt-6">
            <Separator className="mb-4" />
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <BadgePercent className="size-4" /> Mã giảm giá
            </h4>
            <GiftCodeInput
              amount={account?.price || 0}
              game={account?.game}
              onApply={handleDiscountApply}
              onRemove={handleDiscountRemove}
            />
          </div>

          {/* Description */}
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4 border-b pb-2">
              Mô tả tài khoản
            </h2>
            <div className="prose max-w-none text-muted-foreground whitespace-pre-wrap">
              {account.description || "Chưa có mô tả chi tiết"}
            </div>
          </div>

          {/* Reviews Section */}
          <div className="mt-8">
            <Separator className="mb-6" />
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <MessageSquare className="size-5" />
                  Đánh giá sản phẩm
                </h2>
                {account.rating && account.rating.count > 0 && (
                  <div className="flex items-center gap-2 mt-1">
                    <StarRating value={Math.round(account.rating.avg)} size="sm" />
                    <span className="text-sm text-muted-foreground">
                      {account.rating.avg} / 5 ({account.rating.count} đánh giá)
                    </span>
                  </div>
                )}
              </div>
              {user && currentOrder && !myReview && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowReviewForm(!showReviewForm)}
                >
                  Viết đánh giá
                </Button>
              )}
            </div>

            {/* Review Form */}
            {showReviewForm && (
              <div ref={reviewFormRef} className="border rounded-lg p-4 mb-6 space-y-4 bg-gray-50">
                <h3 className="font-semibold">Đánh giá của bạn</h3>
                <div>
                  <label className="text-sm font-medium block mb-2">Chất lượng</label>
                  <StarRating value={reviewRating} onChange={setReviewRating} size="lg" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-2">Bình luận (tuỳ chọn)</label>
                  <Textarea
                    placeholder="Chia sẻ trải nghiệm của bạn về tài khoản này..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows={3}
                    maxLength={1000}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={handleSubmitReview}
                    disabled={submittingReview}
                  >
                    {submittingReview ? "Đang gửi..." : "Gửi đánh giá"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowReviewForm(false)}
                  >
                    Huỷ
                  </Button>
                </div>
              </div>
            )}

            {/* My Review */}
            {myReview && (
              <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-2">Đánh giá của bạn:</p>
                <ReviewCard review={myReview} />
              </div>
            )}

            {/* Reviews List */}
            {reviewsLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
              </div>
            ) : reviews.length > 0 ? (
              <div className="space-y-3">
                {reviews.map((review) => (
                  <ReviewCard key={review._id} review={review} />
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Chưa có đánh giá nào cho sản phẩm này.
              </p>
            )}
          </div>

          {/* Suggestions - styled like HomePage sections */}
          {(suggestionsLoading || suggestions.length > 0) && (
            <section className="mt-8 px-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl lg:text-2xl font-bold flex items-center gap-2">
                    <Layers className="size-5 lg:size-6 text-purple-500" />
                    Sản phẩm tương tự
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Tài khoản liên quan bạn có thể quan tâm
                  </p>
                </div>
                {account?.game && (
                  <Button
                    variant="ghost"
                    className="text-blue-600"
                    onClick={() => navigate(`/tai-khoan/${account.game}`)}
                  >
                    Xem tất cả <ChevronRight className="size-4 ml-1" />
                  </Button>
                )}
              </div>

              {suggestionsLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-40 w-full" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {suggestions.map((s) => (
                    <Card
                      key={s.id}
                      className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-blue-400 overflow-hidden"
                      onClick={() => navigate(`/tai-khoan/${s.game}/${s.id}`)}
                    >
                      <div className="aspect-video bg-gray-100 overflow-hidden relative">
                        {s.attributes?.discount && (
                          <Badge className="absolute top-2 left-2 bg-red-500 hover:bg-red-600 z-10">
                            -{s.attributes.discount}%
                          </Badge>
                        )}
                        {s.rating && s.rating.count > 0 && (
                          <Badge className="absolute top-2 right-2 bg-yellow-500 hover:bg-yellow-600 flex items-center gap-1 z-10">
                            <Star className="size-3 fill-white" />
                            {s.rating.avg}
                          </Badge>
                        )}
                        {s.images?.[0] ? (
                          <img
                            src={s.images[0]}
                            alt={s.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-3xl">🎮</div>
                        )}
                      </div>
                      <CardContent className="p-3">
                        <p className="text-sm font-semibold line-clamp-1">{s.title}</p>
                        {s.attributes?.code && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground bg-gray-100 px-2 py-1 rounded w-fit mt-1">
                            <Tag className="size-3" />
                            <span className="font-mono">{s.attributes.code}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-1">
                          <div>
                            {s.attributes?.originalPrice && (
                              <p className="text-xs text-muted-foreground line-through">
                                {s.attributes.originalPrice.toLocaleString("vi-VN")}đ
                              </p>
                            )}
                            <p className="text-sm font-bold text-red-600">
                              {s.price.toLocaleString("vi-VN")}đ
                            </p>
                          </div>
                          {s.rating && s.rating.count > 0 && (
                            <span className="text-xs text-yellow-600 flex items-center gap-0.5">
                              <Star className="size-3 fill-yellow-400 text-yellow-400" />
                              {s.rating.avg}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        {/* Right Column - Purchase Box */}
        <div className="lg:col-span-5">
          <div className="bg-white border rounded-lg shadow-sm p-6 sticky top-24">
            <div className="mb-4">
              <h1 className="text-xl font-bold leading-tight mb-2">
                {account?.title}
              </h1>
              <Badge
                variant="outline"
                className="text-xs bg-gray-50 text-gray-600"
              >
                Mã số: #{account.attributes?.code || id?.slice(0, 8).toUpperCase()}
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
                  {account.attributes?.heroes || account.attributes?.heroCount || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Số Skin</span>
                <span className="font-medium">
                  {account.attributes?.skins || account.attributes?.skinCount || 0}
                </span>
              </div>

              {/* Rating display */}
              {account.rating && account.rating.count > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Đánh giá</span>
                  <span className="font-medium flex items-center gap-1">
                    <Star className="size-4 fill-yellow-400 text-yellow-400" />
                    {account.rating.avg} ({account.rating.count})
                  </span>
                </div>
              )}
            </div>

            {/* Price */}
            <div className="mb-4 border-b pb-6">
              <div className="flex items-end gap-3 mb-1">
                {account.attributes?.originalPrice && (
                  <span className="text-muted-foreground line-through text-sm">
                    {account.attributes.originalPrice.toLocaleString("vi-VN")}đ
                  </span>
                )}
                <span className="text-3xl font-bold text-red-600">
                  {account.price?.toLocaleString("vi-VN")} đ
                </span>
                {account.attributes?.discount && (
                  <Badge className="bg-red-500 hover:bg-red-600 ml-2">
                    -{account.attributes.discount}%
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Rẻ vô đối, giá tốt nhất thị trường
              </p>
            </div>

            {/* Payment Method: 2 Buttons */}
            <div className="space-y-3">
              {/* Balance Purchase */}
              <Button
                className="w-full h-12 text-lg font-bold bg-blue-600 hover:bg-blue-700 shadow-sm"
                onClick={handleBalancePurchase}
                disabled={processing || qrLoading}
              >
                {processing ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Đang xử lý...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Banknote className="size-5" />
                    Mua bằng số dư
                    {user && (
                      <span className="text-sm font-normal opacity-80">
                        ({formatVND(user.balance || 0)})
                      </span>
                    )}
                  </span>
                )}
              </Button>

              {user && (user.balance || 0) < account.price && (
                <p className="text-xs text-red-500 mt-1 text-center">
                  Số dư không đủ.{" "}
                  <button
                    className="underline hover:text-red-700"
                    onClick={() => navigate("/?deposit=true")}
                  >
                    Nạp thêm tiền
                  </button>
                </p>
              )}

              {/* PayOS Bank Transfer Purchase */}
              <Button
                className="w-full h-12 text-lg font-bold bg-purple-600 hover:bg-purple-700 shadow-sm"
                onClick={handlePayOSPurchase}
                disabled={processing || qrLoading}
              >
                {qrLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Đang tạo mã QR...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <QrCode className="size-5" />
                    Mua qua chuyển khoản (PayOS)
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── PayOS QR Payment Dialog ── */}
      <Dialog
        open={showQRDialog}
        onOpenChange={(val) => {
          setShowQRDialog(val);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="size-5 text-purple-600" />
              Thanh toán qua chuyển khoản
            </DialogTitle>
            <DialogDescription>
              Quét mã QR hoặc chuyển khoản theo thông tin bên dưới
            </DialogDescription>
          </DialogHeader>

          {qrData && (
            <div className="space-y-4">
              {/* Countdown Timer */}
              <div className="flex items-center justify-center gap-2 text-sm">
                <Timer className="size-4 text-orange-500" />
                <span className={`font-mono font-bold ${countdown < 60 ? "text-red-500" : "text-gray-700"}`}>
                  {formatCountdown(countdown)}
                </span>
              </div>

              {/* QR Code */}
              <div className="flex justify-center bg-muted/30 rounded-lg p-4">
                {qrData.qrImage ? (
                  <QRCodeSVG
                    value={qrData.qrImage}
                    size={220}
                    level="L"
                    imageSettings={{
                      src: "../../public/viet_qr_1.png",
                      height: 40,
                      width: 40,
                      excavate: true,
                    }}
                  />
                ) : (
                  <div className="size-[220px] flex items-center justify-center bg-gray-100 rounded-lg">
                    <QrCode className="size-16 text-gray-300" />
                  </div>
                )}
              </div>

              {/* Transfer Info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Số tiền</span>
                  <span className="font-bold text-red-600">{formatVND(qrData.amount)}</span>
                </div>

                <div className="flex justify-between text-sm items-center">
                  <span className="text-muted-foreground">Chủ tài khoản</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{qrData.accountName}</span>
                    <button
                      className="text-blue-600 hover:text-blue-800"
                      onClick={() => {
                        navigator.clipboard.writeText(qrData.accountName || "");
                        toast.success("Đã copy chủ tài khoản");
                      }}
                    >
                      <Copy className="size-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between text-sm items-center">
                  <span className="text-muted-foreground">Số tài khoản</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium">{qrData.accountNumber}</span>
                    <button
                      className="text-blue-600 hover:text-blue-800"
                      onClick={() => {
                        navigator.clipboard.writeText(qrData.accountNumber || "");
                        toast.success("Đã copy số tài khoản");
                      }}
                    >
                      <Copy className="size-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ngân hàng</span>
                  <span className="font-medium">{qrData.bankName}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Nội dung CK</span>
                  <span className="font-mono text-xs font-medium">
                    {qrData.referenceCode}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tài khoản mua</span>
                  <span className="font-medium text-sm truncate max-w-[200px]">
                    {qrData.accountTitle}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                  onClick={handleCheckPayment}
                  disabled={checkingPayment}
                >
                  {checkingPayment ? (
                    <><Loader2 className="mr-2 size-4 animate-spin" /> Đang kiểm tra...</>
                  ) : (
                    <><ExternalLink className="mr-2 size-4" /> Đã thanh toán — Kiểm tra</>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancelPurchase}
                  className="text-red-500 border-red-200 hover:bg-red-50"
                >
                  <XCircle className="mr-2 size-4" /> Huỷ
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Success Dialog ── */}
      {showSuccessDialog && currentOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="text-center">
              <div className="size-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="size-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold mb-1">
                Mua thành công!
              </h2>
              <p className="text-muted-foreground text-sm">
                Tài khoản đã được thêm vào đơn hàng của bạn
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tài khoản</span>
                <span className="font-medium">{account?.title}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Số tiền</span>
                <span className="font-bold text-red-600">
                  {account?.price?.toLocaleString("vi-VN")}đ
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Phương thức</span>
                <span className="font-medium">
                  {currentOrder?.data?.order?.paymentMethod === "payos"
                    ? "Chuyển khoản (PayOS)"
                    : "Số dư ví"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Mã đơn</span>
                <span className="font-mono text-xs">
                  #{currentOrder?.data?.order?.transactionId || currentOrder?.order?.transactionId}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={handleViewOrderHistory}
              >
                <ExternalLink className="size-4 mr-2" />
                Xem chi tiết đơn hàng
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowSuccessDialog(false);
                  setShowReviewForm(true);
                }}
              >
                Viết đánh giá ngay
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountDetailPage;

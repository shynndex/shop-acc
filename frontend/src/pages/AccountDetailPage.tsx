import { ProductGallery } from "@/components/client/ProductGallery";
import GiftCodeInput from "@/components/client/GiftCodeInput";
import type { GiftCodeResult } from "@/components/client/GiftCodeInput";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientButton } from "@/components/ui/gradient-button";
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

      // Interceptor đã unwrap success.data, data = { order, account, newBalance, discount? }
      if (data?.newBalance !== undefined) {
        updateUser({ balance: data.newBalance });
      }

      setCurrentOrder(data);
      setShowSuccessDialog(true);
    } catch (error: any) {
      const message =
        error?.message || "Có lỗi xảy ra khi mua tài khoản";
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

      // Interceptor đã unwrap success.data, res = { bankDepositId, qrImage, amount, ... }
      if (res) {
        setQrData(res);
        setShowQRDialog(true);
        toast.info("Đã tạo mã QR. Vui lòng chuyển khoản để thanh toán.", { duration: 5000 });
      }
    } catch (error: any) {
      const message =
        error?.message || "Có lỗi xảy ra";
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
      // Interceptor đã unwrap success.data, res = { status, message, order }
      const res = await depositService.checkPayOSPurchaseStatus(qrData.bankDepositId);
      if (res?.status === "PAID") {
        toast.success("Thanh toán thành công!");
        setShowQRDialog(false);
        setCurrentOrder({ order: res.order });
        setShowSuccessDialog(true);
      } else if (res?.status === "CANCELLED") {
        toast.error("Giao dịch đã bị huỷ.");
        setShowQRDialog(false);
      } else if (res?.status === "PENDING") {
        toast.info("Đang chờ xác nhận thanh toán...");
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
        // Interceptor đã unwrap — currentOrder.order trực tiếp, không qua .data
        newOrderId: currentOrder?.order?.transactionId,
      },
    });
  };

  const handleSubmitReview = async () => {
    if (!user || !id || !currentOrder?.order?._id) {
      toast.error("Bạn cần mua tài khoản để đánh giá");
      return;
    }

    try {
      setSubmittingReview(true);
      await reviewService.create({
        accountId: id,
        orderId: currentOrder.order._id,
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
    return (
      <div className="py-12 min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full size-12 border-4 border-blue-200 border-t-blue-600 mx-auto shadow-glow-sm" />
          <p className="text-muted-foreground animate-pulse">Đang tải thông tin...</p>
        </div>
      </div>
    );
  if (!account)
    return (
      <div className="py-12 min-h-[60vh] flex items-center justify-center">
        <GlassCard className="max-w-md p-8 text-center">
          <p className="text-muted-foreground">Không tìm thấy tài khoản</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/")}>Về trang chủ</Button>
        </GlassCard>
      </div>
    );

  // Format countdown
  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="py-6 sm:py-8 space-y-6 sm:space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column - Images + Description */}
        <div className="lg:col-span-7 space-y-4">
          <ProductGallery images={images} />

          {/* Giftcode Section */}
          <GlassCard className="p-4 sm:p-5" variant="subtle">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <BadgePercent className="size-4 text-blue-500" /> Mã giảm giá
            </h4>
            <GiftCodeInput
              amount={account?.price || 0}
              game={account?.game}
              onApply={handleDiscountApply}
              onRemove={handleDiscountRemove}
            />
          </GlassCard>

          {/* Description */}
          <GlassCard className="p-4 sm:p-5">
            <h2 className="text-base sm:text-lg font-bold mb-3 flex items-center gap-2 border-b pb-2 border-border/50">
              <BadgePercent className="size-4 text-blue-500" />
              Mô tả tài khoản
            </h2>
            <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {account.description || "Chưa có mô tả chi tiết"}
            </div>
          </GlassCard>

          {/* Reviews Section */}
          <GlassCard className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                  <MessageSquare className="size-4 sm:size-5 text-blue-500" />
                  Đánh giá sản phẩm
                </h2>
                {account.rating && account.rating.count > 0 && (
                  <div className="flex items-center gap-2 mt-1">
                    <StarRating value={Math.round(account.rating.avg)} size="sm" />
                    <span className="text-xs text-muted-foreground">
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
              <div ref={reviewFormRef} className="rounded-lg p-4 mb-4 space-y-4 glass-subtle border-border/30">
                <h3 className="font-semibold text-sm">Đánh giá của bạn</h3>
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
                    className="bg-muted/20"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <GradientButton
                    className="w-full sm:w-auto h-10"
                    onClick={handleSubmitReview}
                    disabled={submittingReview}
                  >
                    {submittingReview ? "Đang gửi..." : "Gửi đánh giá"}
                  </GradientButton>
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto"
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
          </GlassCard>            {/* Suggestions */}
          {(suggestionsLoading || suggestions.length > 0) && (
            <section className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                    <Layers className="size-4 sm:size-5 text-purple-500" />
                    Sản phẩm tương tự
                  </h2>
                  <p className="text-xs text-muted-foreground">Tài khoản liên quan bạn có thể quan tâm</p>
                </div>
                {account?.game && (
                  <Button variant="ghost" size="sm" className="text-blue-600 text-xs" onClick={() => navigate(`/tai-khoan/${account.game}`)}>
                    Xem tất cả <ChevronRight className="size-3 ml-0.5" />
                  </Button>
                )}
              </div>

              {suggestionsLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {[1, 2, 3, 4].map((i) => (<Skeleton key={i} className="h-36 w-full rounded-xl" />))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {suggestions.map((s) => (
                    <Card
                      key={s.id}
                      className="group cursor-pointer border border-border/50 bg-background/80 backdrop-blur-sm hover:border-blue-400 hover:shadow-md transition-all duration-300 overflow-hidden"
                      onClick={() => navigate(`/tai-khoan/${s.game}/${s.id}`)}
                    >
                      <div className="aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 overflow-hidden relative">
                        {s.attributes?.discount && (
                          <Badge className="absolute top-1.5 left-1.5 bg-red-500 text-[11px] px-2 py-0.5 h-auto border-0 z-10">-{s.attributes.discount}%</Badge>
                        )}
                        {s.images?.[0] ? (
                          <img src={s.images[0]} alt={s.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="flex items-center justify-center h-full"><span className="text-3xl">🎮</span></div>
                        )}
                      </div>
                      <CardContent className="p-3 space-y-1">
                        <p className="text-sm font-semibold line-clamp-1 group-hover:text-blue-600 transition-colors">{s.title}</p>
                        {s.attributes?.code && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground overflow-hidden"><Tag className="size-3 shrink-0" /><span className="font-mono truncate min-w-0">{s.attributes.code}</span></div>
                        )}
                        <div className="flex items-center justify-between">
                          {s.attributes?.originalPrice ? (
                            <div>
                              <p className="text-xs text-muted-foreground line-through">{s.attributes.originalPrice.toLocaleString("vi-VN")}đ</p>
                              <p className="text-sm font-bold text-red-600">{s.price.toLocaleString("vi-VN")}đ</p>
                            </div>
                          ) : (
                            <p className="text-sm font-bold text-red-600">{s.price.toLocaleString("vi-VN")}đ</p>
                          )}
                          {s.rating && s.rating.count > 0 && (
                            <span className="text-xs text-yellow-600 flex items-center gap-0.5"><Star className="size-3 fill-yellow-400 text-yellow-400" />{s.rating.avg}</span>
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
          <GlassCard className="p-4 sm:p-5 sticky top-24" hover>
            <div className="mb-4">
              <h1 className="text-lg sm:text-xl font-bold leading-tight mb-2">
                {account?.title}
              </h1>
              <Badge variant="outline" className="text-[10px] bg-muted/20 text-muted-foreground border-border/50">
                Mã số: #{account.attributes?.code || id?.slice(0, 8).toUpperCase()}
              </Badge>
            </div>

            <div className="mb-5 rounded-xl p-4 space-y-2.5 text-sm bg-gradient-brand-soft border border-blue-200/30">
              {[
                { label: "Mức Rank", value: account.attributes?.rank || "Chưa cập nhật" },
                { label: "Đăng ký", value: "Trắng thông tin", highlight: true },
                { label: "Số tướng", value: (account.attributes?.heroes || account.attributes?.heroCount || 0).toLocaleString() },
                { label: "Số Skin", value: (account.attributes?.skins || account.attributes?.skinCount || 0).toLocaleString() },
              ].map((item) => (
                <div key={item.label} className="flex justify-between">
                  <span className="text-muted-foreground text-xs">{item.label}</span>
                  <span className={`font-medium text-xs ${item.highlight ? "text-blue-600" : ""}`}>{item.value}</span>
                </div>
              ))}
              {account.rating && account.rating.count > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-xs">Đánh giá</span>
                  <span className="font-medium text-xs flex items-center gap-1">
                    <Star className="size-3.5 fill-yellow-400 text-yellow-400" />
                    {account.rating.avg} ({account.rating.count})
                  </span>
                </div>
              )}
            </div>

            {/* Price */}
            <div className="mb-5 pb-5 border-b border-border/30">
              <div className="flex items-end gap-2 mb-1">
                {account.attributes?.originalPrice && (
                  <span className="text-muted-foreground line-through text-xs">
                    {account.attributes.originalPrice.toLocaleString("vi-VN")}đ
                  </span>
                )}
                <span className="text-2xl sm:text-3xl font-bold text-red-600">
                  {account.price?.toLocaleString("vi-VN")}đ
                </span>
                {account.attributes?.discount && (
                  <Badge className="bg-red-500 border-0">-{account.attributes.discount}%</Badge>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">Giá tốt nhất thị trường, đảm bảo uy tín</p>
            </div>

            {/* Payment Buttons */}
            <div className="space-y-3">
              <GradientButton
                className="w-full h-11 text-sm font-bold"
                onClick={handleBalancePurchase}
                disabled={processing || qrLoading}
              >
                {processing ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Đang xử lý...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Banknote className="size-4" />
                    <span>Mua bằng số dư</span>
                    {user && (
                      <span className="text-xs font-normal opacity-80">({formatVND(user.balance || 0)})</span>
                    )}
                  </span>
                )}
              </GradientButton>

              {user && (user.balance || 0) < account.price && (
                <p className="text-[11px] text-red-500 text-center">
                  Số dư không đủ.{" "}
                  <button className="underline hover:text-red-700 font-medium" onClick={() => navigate("/?deposit=true")}>
                    Nạp thêm tiền
                  </button>
                </p>
              )}

              <Button
                className="w-full h-11 text-sm font-bold bg-purple-600 hover:bg-purple-700 shadow-sm"
                onClick={handlePayOSPurchase}
                disabled={processing || qrLoading}
              >
                {qrLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Đang tạo mã QR...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <QrCode className="size-4" />
                    Mua qua chuyển khoản
                  </span>
                )}
              </Button>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* ── PayOS QR Payment Dialog ── */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="size-5 text-purple-600" />
              Thanh toán qua chuyển khoản
            </DialogTitle>
            <DialogDescription>Quét mã QR hoặc chuyển khoản theo thông tin bên dưới</DialogDescription>
          </DialogHeader>

          {qrData && (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-sm">
                <Timer className="size-4 text-orange-500" />
                <span className={`font-mono font-bold ${countdown < 60 ? "text-red-500" : "text-foreground"}`}>
                  {formatCountdown(countdown)}
                </span>
              </div>

              <div className="flex justify-center bg-card rounded-xl p-4 border border-border/20">
                {qrData.qrImage ? (
                  <QRCodeSVG value={qrData.qrImage} className="size-[180px] sm:size-[220px]" level="L"
                    imageSettings={{ src: "../../public/viet_qr_1.png", height: 32, width: 32, excavate: true }}
                  />
                ) : (
                  <div className="size-[180px] sm:size-[220px] flex items-center justify-center bg-muted/20 rounded-lg">
                    <QrCode className="size-12 sm:size-16 text-muted-foreground/30" />
                  </div>
                )}
              </div>

              <div className="rounded-xl p-4 space-y-3 bg-gradient-brand-soft border border-blue-200/30">
                {[
                  { label: "Số tiền", value: formatVND(qrData.amount), highlight: true },
                  { label: "Chủ tài khoản", value: qrData.accountName, copy: true },
                  { label: "Số tài khoản", value: qrData.accountNumber, copy: true },
                  { label: "Ngân hàng", value: qrData.bankName },
                  { label: "Nội dung CK", value: qrData.referenceCode, mono: true },
                  { label: "Tài khoản mua", value: qrData.accountTitle },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between text-sm items-center">
                    <span className="text-muted-foreground text-xs">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className={`${item.highlight ? "font-bold text-red-600" : "font-medium"} ${item.mono ? "font-mono text-xs" : "text-xs"} truncate max-w-[180px]`}>
                        {item.value}
                      </span>
                      {item.copy && (
                        <button className="text-blue-600 hover:text-blue-800 shrink-0" onClick={() => { navigator.clipboard.writeText(item.value || ""); toast.success(`Đã copy ${item.label}`); }}>
                          <Copy className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button className="w-full sm:flex-1 bg-purple-600 hover:bg-purple-700" onClick={handleCheckPayment} disabled={checkingPayment}>
                  {checkingPayment ? <><Loader2 className="mr-2 size-4 animate-spin" /> Đang kiểm tra...</> : <><ExternalLink className="mr-2 size-4" /> Đã thanh toán</>}
                </Button>
                <Button variant="outline" onClick={handleCancelPurchase} className="w-full sm:w-auto text-red-500 border-red-200 hover:bg-red-50">
                  <XCircle className="mr-2 size-4" /> Huỷ
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Success Dialog ── */}
      {showSuccessDialog && currentOrder && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <GlassCard className="max-w-md w-full p-4 sm:p-6 text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="space-y-4">
              <div className="size-14 sm:size-16 rounded-full bg-gradient-brand flex items-center justify-center mx-auto shadow-glow">
                <ShoppingCart className="size-7 sm:size-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold mb-1">Mua thành công!</h2>
                <p className="text-sm text-muted-foreground">Tài khoản đã được thêm vào đơn hàng của bạn</p>
              </div>

              <div className="rounded-xl p-4 space-y-2 text-sm bg-gradient-brand-soft border border-blue-200/30 text-left">
                {[
                  { label: "Tài khoản", value: account?.title },
                  { label: "Số tiền", value: `${account?.price?.toLocaleString("vi-VN")}đ`, highlight: true },
                  { label: "Phương thức", value: currentOrder?.order?.paymentMethod === "payos" ? "Chuyển khoản (PayOS)" : "Số dư ví" },
                  { label: "Mã đơn", value: `#${currentOrder?.order?.transactionId}`, mono: true },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between">
                    <span className="text-muted-foreground text-xs">{item.label}</span>
                    <span className={`${item.highlight ? "font-bold text-red-600" : "font-medium"} ${item.mono ? "font-mono text-xs" : "text-xs"}`}>{item.value}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <GradientButton className="w-full h-10" onClick={handleViewOrderHistory}>
                  <ExternalLink className="size-4 mr-1" /> Xem chi tiết
                </GradientButton>
                <Button variant="outline" className="w-full sm:w-auto" onClick={() => { setShowSuccessDialog(false); setShowReviewForm(true); }}>
                  Viết đánh giá
                </Button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default AccountDetailPage;

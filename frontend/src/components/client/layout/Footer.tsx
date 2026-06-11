import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { uiService } from "@/services/client/uiService";
import { useSiteConfig } from "@/hooks/usePublicSiteConfig";
import {
  Mail,
  Phone,
  MapPin,
  Shield,
  CreditCard,
  Headphones,
  Gamepad2,
  ChevronRight,
  Heart,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { GameCategory } from "@/types/admin/ui.type";

/* ─── Footer Links Config ─── */
const FOOTER_LINKS = {
  support: {
    title: "Hỗ trợ",
    icon: Headphones,
    links: [
      { label: "Hướng dẫn mua hàng", slug: "huong-dan-mua-hang" },
      { label: "Chính sách đổi trả", slug: "chinh-sach-doi-tra" },
      { label: "Câu hỏi thường gặp", slug: "faq" },
      { label: "Phương thức nạp tiền", slug: "huong-dan-nap-tien" },
    ],
  },
  about: {
    title: "Về chúng tôi",
    icon: Heart,
    links: [
      { label: "Giới thiệu", slug: "gioi-thieu" },
      { label: "Điều khoản dịch vụ", slug: "dieu-khoan-dich-vu" },
      { label: "Chính sách bảo mật", slug: "chinh-sach-bao-mat" },
      { label: "Tuyển dụng", slug: "tuyen-dung" },
    ],
  },
};

const LinkSection = ({ title, icon: Icon, links }: { title: string; icon: React.ElementType; links: { label: string; slug: string }[] }) => (
  <div className="space-y-3 sm:space-y-4">
    <h4 className="flex items-center gap-2 text-sm font-semibold text-white/90">
      <Icon className="size-4 text-blue-400" />
      {title}
    </h4>
    <ul className="space-y-2">
      {links.map((link) => (
        <li key={link.label}>
          <Link to={`/pages/${link.slug}`} className="group flex items-center gap-1.5 text-sm text-white/60 hover:text-blue-400 transition-all duration-200">
            <ChevronRight className="size-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200" />
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

const GameLinks = () => {
  const { data: categoriesData } = useQuery({
    queryKey: ["ui", "categories"],
    queryFn: () => uiService.getCategories(),
    staleTime: 30 * 60 * 1000,
    retry: false,
  });
  const games: GameCategory[] = categoriesData?.data?.games || categoriesData?.games || [];

  return (
    <div className="space-y-3 sm:space-y-4">
      <h4 className="flex items-center gap-2 text-sm font-semibold text-white/90">
        <Gamepad2 className="size-4 text-blue-400" /> Game nổi bật
      </h4>
      {games.length > 0 ? (
        <ul className="space-y-2">
          {games.slice(0, 4).map((game: GameCategory) => (
            <li key={game.gameSlug}>
              <Link to={`/tai-khoan/${game.gameSlug}`} className="group flex items-center gap-2 text-sm text-white/60 hover:text-blue-400 transition-all duration-200">
                <span className="text-base">{game.gameIcon}</span>
                <span>{game.gameName}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="space-y-2">
          {["Liên Quân", "Valorant", "Free Fire", "LMHT"].map((name) => (
            <li key={name}>
              <span className="flex items-center gap-2 text-sm text-white/40">
                <span>🎮</span>
                <span>{name}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export const Footer = () => {
  const { shopName } = useSiteConfig();

  return (
    <footer className="w-full mt-auto relative overflow-hidden">
      {/* Footer background — uses dynamic --site-footer, fallback to slate-900 */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "var(--site-footer, #1f2937)" }}
      />
      {/* Subtle gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 25% 25%, rgba(37, 99, 235, 0.3) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(6, 182, 212, 0.2) 0%, transparent 50%)" }} />
      </div>
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

      <div className="relative z-10 safe-area-bottom">
        <div className="container-wrapper py-10 sm:py-14">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-6">
            <div className="lg:col-span-3 space-y-4 sm:space-y-5">
              <Link to="/" className="inline-flex items-center gap-2">
                <div className="size-8 rounded-lg bg-gradient-brand flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <Sparkles className="size-4 text-white" />
                </div>
                <span className="text-xl font-bold text-gradient-brand">{shopName}</span>
              </Link>
              <p className="text-sm text-white/50 leading-relaxed max-w-xs">Nền tảng giao dịch tài khoản game uy tín hàng đầu Việt Nam. Bảo mật 100%, hỗ trợ 24/7, thanh toán đa dạng.</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="gap-1.5 bg-white/5 text-white/70 border-white/10 hover:bg-white/10"><Shield className="size-3" /> SSL 256-bit</Badge>
                <Badge variant="secondary" className="gap-1.5 bg-white/5 text-white/70 border-white/10 hover:bg-white/10"><CreditCard className="size-3" /> Thanh toán an toàn</Badge>
              </div>
              <div className="flex -space-x-1.5">
                {[Phone, Mail, Headphones].map((Icon, i) => (
                  <div key={i} className="size-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-blue-500/20 hover:border-blue-500/30 transition-all duration-200 cursor-pointer">
                    <Icon className="size-3.5 text-white/60 hover:text-blue-400 transition-colors" />
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2">
              <LinkSection title={FOOTER_LINKS.support.title} icon={FOOTER_LINKS.support.icon} links={FOOTER_LINKS.support.links} />
            </div>

            <div className="lg:col-span-2">
              <LinkSection title={FOOTER_LINKS.about.title} icon={FOOTER_LINKS.about.icon} links={FOOTER_LINKS.about.links} />
            </div>

            <div className="lg:col-span-2">
              <GameLinks />
            </div>

            <div className="lg:col-span-3 space-y-3 sm:space-y-4">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-white/90">
                <Mail className="size-4 text-blue-400" /> Đăng ký nhận tin
              </h4>
              <p className="text-xs text-white/40 leading-relaxed">Nhận thông báo khuyến mãi, sự kiện và tài khoản mới nhất qua email.</p>
              <div className="flex gap-2">
                <Input type="email" placeholder="Nhập email của bạn" className="h-10 flex-1 min-w-0 bg-white/5 border-white/10 text-white/80 placeholder:text-white/30 text-sm focus:border-blue-500/50 focus:ring-blue-500/20" />
                <Button size="sm" className="h-10 shrink-0 bg-gradient-brand text-white hover:bg-gradient-brand-hover gap-1.5 px-4">
                  <span className="hidden sm:inline">Đăng ký</span>
                  <ArrowRight className="size-4 sm:size-3.5" />
                </Button>
              </div>
              <p className="text-[10px] text-white/30 flex items-center gap-1"><Shield className="size-3" /> Cam kết không spam. Hủy đăng ký bất cứ lúc nào.</p>
            </div>
          </div>
        </div>

        <div className="mx-auto container-wrapper">
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        <div className="container-wrapper py-4 sm:py-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
              {[
                { icon: Phone, text: "1900 xxxx" },
                { icon: MapPin, text: "Hà Nội, Việt Nam" },
                { icon: Headphones, text: "Hỗ trợ 24/7" },
                { icon: Shield, text: "Bảo mật" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-white/50">
                  <item.icon className="size-4 text-blue-400" />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/30">Thanh toán:</span>
              <span className="text-lg">💳</span>
              <span className="text-lg">🏦</span>
              <span className="text-lg">📱</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/5 bg-black/20">
          <div className="container-wrapper py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/40">
              <p>© 2025 {shopName}. Tất cả quyền được bảo lưu.</p>
              <p>Made with <span className="text-red-400">❤️</span> for gamers</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

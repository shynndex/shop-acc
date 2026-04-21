import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
//   Facebook,
//   Instagram,
//   Twitter,
//   Youtube,
  Mail,
  Phone,
  MapPin,
  Shield,
  CreditCard,
  Truck,
  Headphones,
} from "lucide-react";

const footerLinks = {
  support: [
    { label: "Hướng dẫn mua hàng", href: "#" },
    { label: "Phương thức thanh toán", href: "#" },
    { label: "Chính sách đổi trả", href: "#" },
    { label: "Câu hỏi thường gặp", href: "#" },
  ],
  about: [
    { label: "Giới thiệu ShopSam", href: "#" },
    { label: "Tuyển dụng", href: "#" },
    { label: "Điều khoản dịch vụ", href: "#" },
    { label: "Chính sách bảo mật", href: "#" },
  ],
  games: [
    { label: "Liên Quân Mobile", href: "#" },
    { label: "Blox Fruits", href: "#" },
    { label: "Free Fire", href: "#" },
    { label: "Teamfight Tactics", href: "#" },
  ],
};

export const Footer = () => {
  return (
    <footer className="w-full border-t bg-background mt-auto">
      {/* Top Section */}
      <div className="container px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-cyan-500 via-orange-500 to-cyan-500 bg-clip-text text-transparent">
                ShopSam
              </span>
            </div>
            <p className="text-sm text-muted-foreground max-w-sm">
              Nền tảng giao dịch tài khoản game uy tín hàng đầu Việt Nam. 
              Bảo mật 100%, hỗ trợ 24/7, thanh toán đa dạng.
            </p>
            
            {/* Social Links */}
            {/* <div className="flex items-center gap-3">
              {[Facebook, Instagram, Twitter, Youtube].map((Icon, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-full hover:bg-primary hover:text-primary-foreground"
                >
                  <Icon className="h-4 w-4" />
                </Button>
              ))}
            </div> */}

            {/* Trust Badges */}
            <div className="flex flex-wrap gap-2 pt-2">
              <Badge variant="secondary" className="gap-1">
                <Shield className="h-3 w-3" /> Bảo mật SSL
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <CreditCard className="h-3 w-3" /> Thanh toán an toàn
              </Badge>
            </div>
          </div>

          {/* Links Columns */}
          <div>
            <h4 className="font-semibold mb-4">Hỗ trợ</h4>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Về chúng tôi</h4>
            <ul className="space-y-2">
              {footerLinks.about.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Game nổi bật</h4>
            <ul className="space-y-2">
              {footerLinks.games.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Newsletter */}
      <div className="border-t border-border/50">
        <div className="container px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>Đăng ký nhận tin khuyến mãi</span>
            </div>
            <div className="flex w-full md:w-auto gap-2">
              <Input
                type="email"
                placeholder="Nhập email của bạn"
                className="max-w-xs bg-muted/50"
              />
              <Button className="bg-blue-600 hover:bg-blue-700">Đăng ký</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border/50 bg-muted/30">
        <div className="container px-4 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>© 2024 ShopSam. All rights reserved.</p>
            
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" /> 1900 xxxx
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> Hà Nội, Việt Nam
              </span>
              <span className="flex items-center gap-1">
                <Headphones className="h-3 w-3" /> Support 24/7
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
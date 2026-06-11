import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSiteConfig, useUpdateSiteConfig } from "@/hooks/queries/useSiteConfig";
import { Globe, Bell, FileText, Store } from "lucide-react";

/* ─── Section wrapper ─────────────────────────────────────────── */
function Section({ icon, title, desc, children }: { icon: React.ReactNode; title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4 p-5 rounded-xl border border-border/50 bg-background/50">
      <div className="flex items-center gap-3">
        <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
          {icon}
        </div>
        <div>
          <h4 className="text-sm font-semibold">{title}</h4>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   Cài đặt website — General SiteConfig editor
   ════════════════════════════════════════════════════════════════════ */
const GeneralSettingsPage = () => {
  const { data, isLoading } = useSiteConfig();
  const updateConfig = useUpdateSiteConfig();

  const [form, setForm] = useState({
    shopName: "",
    description: "",
    logo: "",
    favicon: "",
    topNotification: "",
    footerContent: "",
  });

  useEffect(() => {
    if (data?.data) {
      setForm({
        shopName: data.data.shopName || "",
        description: data.data.description || "",
        logo: data.data.logo || "",
        favicon: data.data.favicon || "",
        topNotification: data.data.topNotification || "",
        footerContent: data.data.footerContent || "",
      });
    }
  }, [data]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    updateConfig.mutate({
      shopName: form.shopName,
      description: form.description,
      logo: form.logo,
      favicon: form.favicon,
      topNotification: form.topNotification,
      footerContent: form.footerContent,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <GlassCard className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Store className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold">Cài đặt website</h3>
            <p className="text-sm text-muted-foreground">
              Quản lý tên shop, mô tả, logo, favicon và nội dung website
            </p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={updateConfig.isPending}
          className="bg-gradient-brand text-white hover:bg-gradient-brand-hover"
        >
          {updateConfig.isPending ? "Đang lưu..." : "Lưu thay đổi"}
        </Button>
      </div>

      <div className="space-y-5">
        {/* ── Website Info ──────────────────────────────────────────── */}
        <Section icon={<Globe className="size-4" />} title="Thông tin website" desc="Tên shop, mô tả, logo và favicon">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm">Tên shop</Label>
              <p className="text-[11px] text-muted-foreground mb-1">Hiển thị trên toàn bộ website</p>
              <Input
                value={form.shopName}
                onChange={(e) => handleChange("shopName", e.target.value)}
                placeholder="ShopSam"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Mô tả website</Label>
              <p className="text-[11px] text-muted-foreground mb-1">Hiển thị ở footer và SEO</p>
              <Input
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Nền tảng giao dịch tài khoản game uy tín"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm">Logo URL</Label>
              <p className="text-[11px] text-muted-foreground mb-1">Đường dẫn ảnh logo (ưu tiên hiển thị)</p>
              <Input
                value={form.logo}
                onChange={(e) => handleChange("logo", e.target.value)}
                placeholder="https://example.com/logo.png"
              />
              {form.logo && (
                <div className="mt-2 size-12 rounded-lg border border-border/50 overflow-hidden">
                  <img src={form.logo} alt="Logo preview" className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Favicon URL</Label>
              <p className="text-[11px] text-muted-foreground mb-1">Icon hiển thị trên tab trình duyệt</p>
              <Input
                value={form.favicon}
                onChange={(e) => handleChange("favicon", e.target.value)}
                placeholder="https://example.com/favicon.ico"
              />
            </div>
          </div>
        </Section>

        {/* ── Notifications & Content ──────────────────────────────── */}
        <Section icon={<Bell className="size-4" />} title="Thông báo & Nội dung" desc="Thông báo đầu trang và nội dung footer">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm">Thông báo đầu trang</Label>
              <p className="text-[11px] text-muted-foreground mb-1">Hiển thị phía trên cùng của website</p>
              <Textarea
                value={form.topNotification}
                onChange={(e) => handleChange("topNotification", e.target.value)}
                placeholder="Nhập thông báo..."
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Nội dung footer</Label>
              <p className="text-[11px] text-muted-foreground mb-1">Hiển thị ở cuối website</p>
              <Textarea
                value={form.footerContent}
                onChange={(e) => handleChange("footerContent", e.target.value)}
                placeholder="Nhập nội dung footer..."
                rows={4}
              />
            </div>
          </div>
        </Section>

        {/* ── Additional content pages ─────────────────────────────── */}
        <Section icon={<FileText className="size-4" />} title="Trang nội dung" desc="Quản lý các trang chính sách, hướng dẫn">
          <p className="text-xs text-muted-foreground">
            Các trang như Chính sách bảo mật, Điều khoản sử dụng, Hướng dẫn nạp tiền, Hướng dẫn mua tài khoản
            được quản lý qua mục <strong>Giao diện → Trang nội dung</strong>.
          </p>
        </Section>
      </div>
    </GlassCard>
  );
};

export default GeneralSettingsPage;

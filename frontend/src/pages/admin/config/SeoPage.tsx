import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSiteConfig, useUpdateSiteConfig } from "@/hooks/queries/useSiteConfig";
import { Search, BarChart3 } from "lucide-react";

const SeoPage = () => {
  const { data, isLoading } = useSiteConfig();
  const updateConfig = useUpdateSiteConfig();

  const [seo, setSeo] = useState({
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
    ogImage: "",
    googleAnalyticsId: "",
    facebookPixelId: "",
  });

  useEffect(() => {
    if (data?.data?.seo) {
      setSeo(data.data.seo);
    }
  }, [data]);

  const handleChange = (field: string, value: string) => {
    setSeo((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    updateConfig.mutate({ seo });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Search className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold">SEO & Analytics</h3>
            <p className="text-sm text-muted-foreground">
              Quản lý meta tags, Google Analytics và Facebook Pixel
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
        <div>
          <Label className="text-sm text-muted-foreground">Meta Title</Label>
          <Input
            value={seo.metaTitle}
            onChange={(e) => handleChange("metaTitle", e.target.value)}
            placeholder="ShopSam - Mua bán tài khoản game"
            className="mt-1.5"
          />
          <p className="text-xs text-muted-foreground mt-1">
            {seo.metaTitle.length}/60 ký tự (nên dưới 60)
          </p>
        </div>

        <div>
          <Label className="text-sm text-muted-foreground">Meta Description</Label>
          <Textarea
            value={seo.metaDescription}
            onChange={(e) => handleChange("metaDescription", e.target.value)}
            placeholder="Mô tả ngắn gọn về website..."
            className="mt-1.5"
            rows={3}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {seo.metaDescription.length}/160 ký tự (nên dưới 160)
          </p>
        </div>

        <div>
          <Label className="text-sm text-muted-foreground">Meta Keywords</Label>
          <Input
            value={seo.metaKeywords}
            onChange={(e) => handleChange("metaKeywords", e.target.value)}
            placeholder="game, acc, tài khoản, mua bán"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label className="text-sm text-muted-foreground">OG Image URL</Label>
          <Input
            value={seo.ogImage}
            onChange={(e) => handleChange("ogImage", e.target.value)}
            placeholder="https://example.com/og-image.png"
            className="mt-1.5"
          />
        </div>

        <div className="pt-4 border-t border-border/50">
          <h4 className="text-sm font-semibold flex items-center gap-2 mb-4">
            <BarChart3 className="size-4" />
            Analytics
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">Google Analytics ID</Label>
              <Input
                value={seo.googleAnalyticsId}
                onChange={(e) => handleChange("googleAnalyticsId", e.target.value)}
                placeholder="G-XXXXXXXXXX"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Facebook Pixel ID</Label>
              <Input
                value={seo.facebookPixelId}
                onChange={(e) => handleChange("facebookPixelId", e.target.value)}
                placeholder="1234567890"
                className="mt-1.5"
              />
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

export default SeoPage;

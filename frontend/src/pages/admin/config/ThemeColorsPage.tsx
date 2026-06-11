import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSiteConfig, useUpdateSiteConfig } from "@/hooks/queries/useSiteConfig";
import { Palette } from "lucide-react";

const ThemeColorsPage = () => {
  const { data, isLoading } = useSiteConfig();
  const updateConfig = useUpdateSiteConfig();

  const [theme, setTheme] = useState({
    primary: "#3b82f6",
    button: "#2563eb",
    heading: "#111827",
    background: "#ffffff",
    footer: "#1f2937",
    footerText: "#ffffff",
  });

  useEffect(() => {
    if (data?.data?.theme) {
      setTheme(data.data.theme);
    }
  }, [data]);

  const handleChange = (field: string, value: string) => {
    setTheme((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    updateConfig.mutate({ theme });
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

  const colorFields = [
    { key: "primary", label: "Màu chủ đạo", description: "Dùng cho links, icons, accent" },
    { key: "button", label: "Màu nút bấm", description: "Màu nền của các nút chính" },
    { key: "heading", label: "Màu tiêu đề", description: "Màu của heading và text quan trọng" },
    { key: "background", label: "Màu nền", description: "Màu nền chính của website" },
    { key: "footer", label: "Màu footer", description: "Màu nền của footer" },
    { key: "footerText", label: "Màu chữ footer", description: "Màu chữ trong footer" },
  ];

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Palette className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold">Màu sắc giao diện</h3>
            <p className="text-sm text-muted-foreground">
              Thay đổi màu chủ đạo, nút bấm, tiêu đề, nền, footer
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

      <div className="space-y-4">
        {colorFields.map(({ key, label, description }) => (
          <div
            key={key}
            className="flex items-center gap-4 p-4 rounded-lg border border-border/50 bg-background/50"
          >
            <input
              type="color"
              value={theme[key as keyof typeof theme]}
              onChange={(e) => handleChange(key, e.target.value)}
              className="size-10 rounded-lg border border-border/50 cursor-pointer"
            />
            <div className="flex-1">
              <Label className="text-sm font-medium">{label}</Label>
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            </div>
            <Input
              value={theme[key as keyof typeof theme]}
              onChange={(e) => handleChange(key, e.target.value)}
              className="w-28 font-mono text-sm"
              placeholder="#000000"
            />
          </div>
        ))}
      </div>
    </GlassCard>
  );
};

export default ThemeColorsPage;

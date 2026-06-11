import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSiteConfig, useUpdateSiteConfig } from "@/hooks/queries/useSiteConfig";
import { api } from "@/lib/adminAxios";
import { MessageCircle, Megaphone, Zap, Send } from "lucide-react";

const SupportChannelsPage = () => {
  const { data, isLoading } = useSiteConfig();
  const updateConfig = useUpdateSiteConfig();

  const [support, setSupport] = useState({
    chatEnabled: true,
    messengerEnabled: true,
    zaloEnabled: true,
    telegramEnabled: true,
    discordEnabled: false,
    marqueeEnabled: true,
    marqueeSpeed: "normal" as "slow" | "normal" | "fast",
  });
  const [manualMessage, setManualMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (data?.data?.support) {
      setSupport(data.data.support);
    }
  }, [data]);

  const handleToggle = (field: string, value: boolean) => {
    setSupport((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    updateConfig.mutate({ support });
  };

  const handleSendManual = async () => {
    if (!manualMessage.trim()) return;
    setSending(true);
    try {
      await api.post("/marquee", { message: manualMessage.trim() });
      toast.success("Đã gửi thông báo chạy chữ");
      setManualMessage("");
    } catch (err: any) {
      toast.error(err?.message || "Gửi thất bại");
    } finally {
      setSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  const channels = [
    { key: "chatEnabled", label: "Box Chat hỗ trợ", description: "Hiển thị box chat nổi ở góc màn hình" },
    { key: "messengerEnabled", label: "Facebook Messenger", description: "Hiển thị nút Messenger trong box chat" },
    { key: "zaloEnabled", label: "Zalo", description: "Hiển thị nút Zalo trong box chat" },
    { key: "telegramEnabled", label: "Telegram", description: "Hiển thị nút Telegram trong box chat" },
    { key: "discordEnabled", label: "Discord", description: "Hiển thị nút Discord trong box chat" },
  ];

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <MessageCircle className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold">Kênh hỗ trợ</h3>
            <p className="text-sm text-muted-foreground">
              Bật/tắt các kênh liên hệ và thông báo chạy chữ
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
        {channels.map(({ key, label, description }) => (
          <div
            key={key}
            className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-background/50"
          >
            <div>
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            </div>
            <Switch
              checked={support[key as keyof typeof support] as boolean}
              onCheckedChange={(checked) => handleToggle(key, checked)}
            />
          </div>
        ))}

        <div className="p-4 rounded-lg border border-border/50 bg-background/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium flex items-center gap-2">
                <Megaphone className="size-4" />
                Thanh thông báo chạy chữ
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Hiển thị thông báo realtime trên trang chủ
              </p>
            </div>
            <Switch
              checked={support.marqueeEnabled}
              onCheckedChange={(checked) => handleToggle("marqueeEnabled", checked)}
            />
          </div>
          {support.marqueeEnabled && (
            <div className="mt-3 pt-3 border-t border-border/30">
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Zap className="size-3" />
                Tốc độ chạy chữ
              </p>
              <Select
                value={support.marqueeSpeed}
                onValueChange={(v: "slow" | "normal" | "fast") =>
                  setSupport((prev) => ({ ...prev, marqueeSpeed: v }))
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="slow">Chậm</SelectItem>
                  <SelectItem value="normal">Bình thường</SelectItem>
                  <SelectItem value="fast">Nhanh</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* ── Manual marquee message ──────────────────────────────── */}
        <div className="p-4 rounded-lg border border-border/50 bg-background/50">
          <p className="text-sm font-medium flex items-center gap-2 mb-1">
            <Send className="size-4" />
            Gửi thông báo thủ công
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            Thông báo sẽ hiển thị ngay lập tức trên thanh chạy chữ
          </p>
          <div className="flex gap-2">
            <Input
              value={manualMessage}
              onChange={(e) => setManualMessage(e.target.value)}
              placeholder="Nhập nội dung thông báo..."
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendManual();
              }}
            />
            <Button
              onClick={handleSendManual}
              disabled={sending || !manualMessage.trim()}
              size="sm"
              className="shrink-0 bg-gradient-brand text-white hover:bg-gradient-brand-hover"
            >
              {sending ? "Đang gửi..." : "Gửi"}
            </Button>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

export default SupportChannelsPage;

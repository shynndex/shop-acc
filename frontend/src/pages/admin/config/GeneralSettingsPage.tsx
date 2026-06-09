import { GlassCard } from "@/components/ui/glass-card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { configService } from "@/services/admin/bankAccount.service";
import { Settings, ShieldCheck, ExternalLink } from "lucide-react";

const queryKeys = {
  general: ["admin", "config", "general"] as const,
};

const GeneralSettingsPage = () => {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.general,
    queryFn: () => configService.getGeneral(),
  });

  const config = data?.data;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!config) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Không thể tải cấu hình
      </div>
    );
  }

  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <Settings className="size-5" />
        </div>
        <div>
          <h3 className="text-base font-semibold">Thông tin chung</h3>
          <p className="text-sm text-muted-foreground">Cấu hình cơ bản của hệ thống</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm text-muted-foreground">Tên trang</Label>
            <p className="text-sm font-medium mt-1">{config.siteName}</p>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Frontend URL</Label>
            <div className="flex items-center gap-2 mt-1">
              <code className="text-sm bg-muted dark:bg-muted/50 px-2 py-0.5 rounded">
                {config.frontendUrl}
              </code>
              <a
                href={config.frontendUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="size-3.5 text-muted-foreground hover:text-foreground" />
              </a>
            </div>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Nạp tối thiểu</Label>
            <p className="text-sm font-medium mt-1">
              {config.minDeposit.toLocaleString("vi-VN")}đ
            </p>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Nạp tối đa</Label>
            <p className="text-sm font-medium mt-1">
              {config.maxDeposit.toLocaleString("vi-VN")}đ
            </p>
          </div>
        </div>

        <div>
          <Label className="text-sm text-muted-foreground">Nhà mạng thẻ cào hỗ trợ</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {config.cardProviders.map((provider: string) => (
              <Badge key={provider} variant="secondary">
                {provider}
              </Badge>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <p className="text-xs text-muted-foreground">
            <ShieldCheck className="size-3 inline mr-1" />
            Cấu hình có thể thay đổi qua file <code>.env</code> và cần khởi động lại server
          </p>
        </div>
      </div>
    </GlassCard>
  );
};

export default GeneralSettingsPage;

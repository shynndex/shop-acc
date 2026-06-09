import { GlassCard } from "@/components/ui/glass-card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { configService } from "@/services/admin/bankAccount.service";
import { CreditCard, CheckCircle2, XCircle, ShieldCheck } from "lucide-react";

const queryKeys = {
  cardProviders: ["admin", "config", "card-providers"] as const,
};

const CardProvidersPage = () => {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.cardProviders,
    queryFn: () => configService.getCardProviders(),
  });

  const config = data?.data;

  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <CreditCard className="size-5" />
        </div>
        <div>
          <h3 className="text-base font-semibold">Nhà cung cấp thẻ cào</h3>
          <p className="text-sm text-muted-foreground">Cấu hình đối tác nạp thẻ cào</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : !config ? (
        <div className="text-center py-12 text-muted-foreground">
          Không thể tải cấu hình
        </div>
      ) : (
        <div className="space-y-4">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
              config.isConfigured
                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
            }`}
          >
            {config.isConfigured ? (
              <>
                <CheckCircle2 className="size-4" />
                Đã cấu hình
              </>
            ) : (
              <>
                <XCircle className="size-4" />
                Chưa cấu hình
              </>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">Partner ID</Label>
              <p className="text-sm font-mono mt-1 bg-muted dark:bg-muted/50 px-2 py-1 rounded">
                {config.partnerId}
              </p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Base URL</Label>
              <p className="text-sm font-mono mt-1 bg-muted dark:bg-muted/50 px-2 py-1 rounded">
                {config.baseUrl}
              </p>
            </div>
          </div>

          <div>
            <Label className="text-sm text-muted-foreground">Nhà mạng hỗ trợ</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {config.providers.map((provider: string) => (
                <Badge key={provider} variant="secondary">
                  {provider}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm text-muted-foreground">Cache fee TTL</Label>
            <p className="text-sm font-medium mt-1">{config.feeCacheTTL}</p>
          </div>

          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              <ShieldCheck className="size-3 inline mr-1" />
              Thông tin nhà cung cấp được cấu hình qua file <code>.env</code>.
              Partner Key không được hiển thị vì lý do bảo mật.
            </p>
          </div>
        </div>
      )}
    </GlassCard>
  );
};

export default CardProvidersPage;

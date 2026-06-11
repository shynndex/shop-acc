import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { siteConfigService } from "@/services/admin/siteConfig.service";
import type { SiteConfigData } from "@/services/admin/siteConfig.service";
import { toast } from "sonner";

export const siteConfigKeys = {
  all: ["admin", "site-config"] as const,
};

/**
 * Hook to fetch site config (admin)
 */
export function useSiteConfig() {
  return useQuery({
    queryKey: siteConfigKeys.all,
    queryFn: () => siteConfigService.getConfig(),
    staleTime: 30_000,
  });
}

/**
 * Hook to update site config (admin)
 */
export function useUpdateSiteConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Partial<SiteConfigData>) =>
      siteConfigService.updateConfig(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(siteConfigKeys.all, data);
      toast.success("Cập nhật cấu hình thành công");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Có lỗi xảy ra khi cập nhật cấu hình");
    },
  });
}

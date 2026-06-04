import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { uiService } from "@/services/admin/ui.service";

// ─── Query Keys ─────────────────────────────────────────────────────────
export const uiQueryKeys = {
  games: {
    all: ["admin", "ui", "games"] as const,
    list: (params?: Record<string, any>) => ["admin", "ui", "games", "list", params] as const,
    detail: (id: string) => ["admin", "ui", "games", id] as const,
  },
  popups: {
    all: ["admin", "ui", "popups"] as const,
    list: (params?: Record<string, any>) => ["admin", "ui", "popups", "list", params] as const,
    detail: (id: string) => ["admin", "ui", "popups", id] as const,
  },
  banners: {
    all: ["admin", "ui", "banners"] as const,
    list: (params?: Record<string, any>) => ["admin", "ui", "banners", "list", params] as const,
    detail: (id: string) => ["admin", "ui", "banners", id] as const,
  },
  cmsPages: {
    all: ["admin", "ui", "cmsPages"] as const,
    list: () => ["admin", "ui", "cmsPages", "list"] as const,
    detail: (id: string) => ["admin", "ui", "cmsPages", id] as const,
  },
};

// ─── Game Categories ────────────────────────────────────────────────────
export function useGameCategoriesQuery(params?: Record<string, any>) {
  return useQuery({
    queryKey: uiQueryKeys.games.list(params),
    queryFn: () => uiService.listGames(params),
  });
}

export function useCreateGameCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => uiService.createGame(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: uiQueryKeys.games.all }),
  });
}

export function useUpdateGameCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      uiService.updateGame(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: uiQueryKeys.games.all }),
  });
}

export function useDeleteGameCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => uiService.deleteGame(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: uiQueryKeys.games.all }),
  });
}

export function useCreateCategoryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ gameId, payload }: { gameId: string; payload: any }) =>
      uiService.createCategoryItem(gameId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: uiQueryKeys.games.all }),
  });
}

export function useUpdateCategoryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ gameId, itemId, payload }: { gameId: string; itemId: string; payload: any }) =>
      uiService.updateCategoryItem(gameId, itemId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: uiQueryKeys.games.all }),
  });
}

export function useDeleteCategoryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ gameId, itemId }: { gameId: string; itemId: string }) =>
      uiService.deleteCategoryItem(gameId, itemId),
    onSuccess: () => qc.invalidateQueries({ queryKey: uiQueryKeys.games.all }),
  });
}

// ─── Popups ─────────────────────────────────────────────────────────────
export function usePopupsQuery(params?: Record<string, any>) {
  return useQuery({
    queryKey: uiQueryKeys.popups.list(params),
    queryFn: () => uiService.listPopups(params),
  });
}

export function useCreatePopup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => uiService.createPopup(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: uiQueryKeys.popups.all }),
  });
}

export function useUpdatePopup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      uiService.updatePopup(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: uiQueryKeys.popups.all }),
  });
}

export function useDeletePopup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => uiService.deletePopup(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: uiQueryKeys.popups.all }),
  });
}

export function useTogglePopupActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => uiService.togglePopupActive(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: uiQueryKeys.popups.all }),
  });
}

// ─── Banners ────────────────────────────────────────────────────────────
export function useBannersQuery(params?: Record<string, any>) {
  return useQuery({
    queryKey: uiQueryKeys.banners.list(params),
    queryFn: () => uiService.listBanners(params),
  });
}

export function useCreateBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => uiService.createBanner(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: uiQueryKeys.banners.all }),
  });
}

export function useUpdateBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      uiService.updateBanner(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: uiQueryKeys.banners.all }),
  });
}

export function useDeleteBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => uiService.deleteBanner(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: uiQueryKeys.banners.all }),
  });
}

export function useReorderBanners() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: { _id: string; sortOrder: number }[]) =>
      uiService.reorderBanners(items),
    onSuccess: () => qc.invalidateQueries({ queryKey: uiQueryKeys.banners.all }),
  });
}

export function useReorderPopups() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: { _id: string; sortOrder: number }[]) =>
      uiService.reorderPopups(items),
    onSuccess: () => qc.invalidateQueries({ queryKey: uiQueryKeys.popups.all }),
  });
}

export function useReorderCategoryItems() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ gameId, items }: { gameId: string; items: { id: string; sortOrder: number }[] }) =>
      uiService.reorderCategoryItems(gameId, items),
    onSuccess: () => qc.invalidateQueries({ queryKey: uiQueryKeys.games.all }),
  });
}

// ─── CMS Pages ──────────────────────────────────────────────────────────
export function useCmsPagesQuery() {
  return useQuery({
    queryKey: uiQueryKeys.cmsPages.list(),
    queryFn: () => uiService.listCmsPages(),
  });
}

export function useUpdateCmsPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      uiService.updateCmsPage(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: uiQueryKeys.cmsPages.all }),
  });
}

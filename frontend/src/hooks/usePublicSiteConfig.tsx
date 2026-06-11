import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { uiService, type PublicSiteConfigData } from "@/services/client/uiService";

/* ─── Context ──────────────────────────────────────────────────── */
interface SiteConfigContextValue {
  siteConfig: PublicSiteConfigData | undefined;
  isLoading: boolean;
  shopName: string;
}

const SiteConfigContext = createContext<SiteConfigContextValue>({
  siteConfig: undefined,
  isLoading: true,
  shopName: "ShopSam", // fallback
});

/* ─── Hook ──────────────────────────────────────────────────────── */
export function useSiteConfig() {
  return useContext(SiteConfigContext);
}

/* ─── Apply theme colours as CSS custom properties ────────────── */
function applyThemeColours(theme: PublicSiteConfigData["theme"]) {
  const root = document.documentElement;

  // Remove preload class so transitions are enabled after first paint
  root.classList.remove("preload");

  const map: Record<string, string> = {
    "--site-primary": theme.primary,
    "--site-button": theme.button,
    "--site-heading": theme.heading,
    "--site-background": theme.background,
    "--site-footer": theme.footer,
    "--site-footer-text": theme.footerText,
  };

  for (const [prop, value] of Object.entries(map)) {
    if (value && value.trim()) {
      root.style.setProperty(prop, value.trim());
    }
  }
}

/* ─── Apply favicon from SiteConfig ───────────────────────────── */
function applyFavicon(url: string | undefined) {
  if (!url || !url.trim()) return;
  let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.href = url.trim();
}

/* ─── Theme Applier (inner component) ──────────────────────────── */
function ThemeApplier({ siteConfig }: { siteConfig: PublicSiteConfigData | undefined }) {
  useEffect(() => {
    if (siteConfig?.theme) {
      applyThemeColours(siteConfig.theme);
    }
    if (siteConfig?.favicon) {
      applyFavicon(siteConfig.favicon);
    }
  }, [siteConfig]);

  return null;
}

/* ─── Provider ──────────────────────────────────────────────────── */
export function SiteConfigProvider({ children }: { children: ReactNode }) {
  const { data, isLoading } = useQuery({
    queryKey: ["public", "site-config"],
    queryFn: () => uiService.getSiteConfig(),
    staleTime: 10 * 60 * 1000, // 10 min cache
    gcTime: 30 * 60 * 1000,
  });

  const value: SiteConfigContextValue = {
    siteConfig: data,
    isLoading,
    shopName: data?.shopName || "ShopSam",
  };

  return (
    <SiteConfigContext.Provider value={value}>
      <ThemeApplier siteConfig={data} />
      {children}
    </SiteConfigContext.Provider>
  );
}

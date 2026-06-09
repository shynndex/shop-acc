import { Suspense, lazy } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminAuth } from "@/stores/useAdminAuth";
import { Gamepad2, Megaphone, ImageIcon, FileText, ShieldAlert } from "lucide-react";

const LazyGameCategoryManager = lazy(() => import("@/components/admin/ui/GameCategoryManager"));
const LazyPopupManager = lazy(() => import("@/components/admin/ui/PopupManager"));
const LazyBannerManager = lazy(() => import("@/components/admin/ui/BannerManager"));
const LazyCmsPageManager = lazy(() => import("@/components/admin/ui/CmsPageManager"));

const uiSections = [
  { key: "games", icon: <Gamepad2 className="size-4" />, label: "Danh mục game", Component: LazyGameCategoryManager },
  { key: "popups", icon: <Megaphone className="size-4" />, label: "Popup / Modal", Component: LazyPopupManager },
  { key: "banners", icon: <ImageIcon className="size-4" />, label: "Banner", Component: LazyBannerManager },
  { key: "pages", icon: <FileText className="size-4" />, label: "Trang nội dung", Component: LazyCmsPageManager },
];

const UiManagementPage = () => {
  const { admin } = useAdminAuth();
  const isSuperAdmin = admin?.role === "super_admin";

  if (!isSuperAdmin) {
    return (
      <GlassCard className="p-6">
        <div className="text-center py-16">
          <ShieldAlert className="size-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground font-medium">Không có quyền truy cập</p>
          <p className="text-sm text-muted-foreground/70 mt-1">Chỉ Super Admin mới có thể quản lý giao diện</p>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <Gamepad2 className="size-5" />
        </div>
        <div>
          <h3 className="text-base font-semibold">Quản lý giao diện</h3>
          <p className="text-sm text-muted-foreground">Quản lý danh mục game, popup, banner và trang nội dung</p>
        </div>
      </div>

      <div className="space-y-4">
        {uiSections.map(({ key, icon, label, Component }) => (
          <Card key={key}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                {icon}
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense
                fallback={
                  <div className="space-y-3">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                }
              >
                <Component />
              </Suspense>
            </CardContent>
          </Card>
        ))}
      </div>
    </GlassCard>
  );
};

export default UiManagementPage;

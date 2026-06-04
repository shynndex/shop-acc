import { GlassCard } from "@/components/ui/glass-card";
import { GradientButton } from "@/components/ui/gradient-button";
import { Home, SearchX } from "lucide-react";
import { useNavigate } from "react-router";

const NotFoundPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-slate-900 dark:via-slate-950 dark:to-black">
      {/* Decorative blobs */}
      <div className="absolute top-20 -left-20 size-64 bg-blue-200/20 dark:bg-blue-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-10 -right-20 size-48 bg-cyan-200/20 dark:bg-cyan-500/5 rounded-full blur-3xl" />

      <GlassCard className="max-w-md w-full p-8 sm:p-10 text-center relative">
        <div className="inline-flex items-center justify-center size-20 rounded-full bg-gradient-brand mx-auto mb-6">
          <SearchX className="size-10 text-white" />
        </div>

        <h1 className="text-6xl sm:text-7xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent mb-2">
          404
        </h1>
        <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-3">
          Page Not Found
        </h3>

        <p className="text-muted-foreground text-sm sm:text-base mb-8 max-w-xs mx-auto">
          The page you are looking for might have been removed, had its name
          changed or is temporarily unavailable.
        </p>

        <GradientButton className="mx-auto" onClick={() => navigate("/")}>
          <Home className="size-4 mr-2" />
          Về trang chủ
        </GradientButton>
      </GlassCard>
    </div>
  );
};

export default NotFoundPage;

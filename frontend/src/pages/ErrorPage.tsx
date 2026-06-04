import { useNavigate, useRouteError, isRouteErrorResponse } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientButton } from "@/components/ui/gradient-button";

export default function ErrorPage() {
  const navigate = useNavigate();
  const error = useRouteError();

  let title = "Có lỗi xảy ra";
  let message = "Something went wrong";

  if (isRouteErrorResponse(error)) {
    title = `${error.status}`;
    message = error.statusText;
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-slate-900 dark:via-slate-950 dark:to-black">
      <div className="absolute top-0 left-0 size-96 bg-red-200/20 dark:bg-red-500/5 rounded-full blur-3xl -translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 right-0 size-64 bg-amber-200/20 dark:bg-amber-500/5 rounded-full blur-3xl translate-x-1/4 translate-y-1/4" />
      <GlassCard className="max-w-md w-full p-8 text-center relative">
        <div className="inline-flex items-center justify-center size-16 rounded-full bg-gradient-to-br from-red-400 to-amber-500 mb-4">
          <AlertTriangle className="size-8 text-white" />
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold break-all text-foreground">{title}</h1>
        <p className="text-muted-foreground text-sm sm:text-base mt-4 mb-6">{message}</p>
        <GradientButton onClick={() => navigate("/")}>
          Về trang chủ
        </GradientButton>
      </GlassCard>
    </div>
  );
}
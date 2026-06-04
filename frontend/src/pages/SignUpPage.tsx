import { SignupForm } from "@/components/client/signup-form";
import { Sparkles, Shield, Zap } from "lucide-react";

export default function SignupPage() {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 md:p-10 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950" />
      <div className="absolute top-10 -left-20 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-10 -right-20 w-80 h-80 bg-cyan-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1.5s" }} />

      <div className="relative w-full max-w-2xl">
        <div className="grid lg:grid-cols-5 rounded-2xl overflow-hidden border border-border/30 shadow-xl">
          {/* Form side */}
          <div className="lg:col-span-3 p-6 sm:p-8 glass-strong">
            <SignupForm />
          </div>

          {/* Decorative side */}
          <div className="relative hidden lg:flex lg:col-span-2 flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-600 via-cyan-500 to-blue-700 text-white">
            <div className="text-center space-y-4 z-10">
              <div className="text-5xl mb-3">🚀</div>
              <h3 className="text-xl font-bold">Tham gia ngay!</h3>
              <p className="text-blue-100 text-xs leading-relaxed">
                Hàng ngàn tài khoản game chất lượng đang chờ bạn
              </p>
              <div className="flex flex-col gap-2 pt-3">
                {[
                  { icon: Sparkles, text: "Tài khoản đa dạng" },
                  { icon: Shield, text: "Bảo mật tuyệt đối" },
                  { icon: Zap, text: "Thanh toán nhanh" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-2 text-xs text-blue-100">
                    <item.icon className="size-3.5" />
                    {item.text}
                  </div>
                ))}
              </div>
            </div>

            {/* Decorative blobs */}
            <div className="absolute top-10 left-10 w-24 h-24 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-32 h-32 bg-cyan-300/20 rounded-full blur-3xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

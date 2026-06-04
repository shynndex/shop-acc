import { LoginForm } from "@/components/admin/login-form";

export default function Login() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-black dark:from-slate-950 dark:to-black">
      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 size-96 bg-blue-500/10 rounded-full blur-3xl -translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 right-0 size-64 bg-cyan-500/10 rounded-full blur-3xl translate-x-1/4 translate-y-1/4" />
      <div className="w-full max-w-xs sm:max-w-sm md:max-w-md relative">
        <LoginForm />
      </div>
    </div>
  );
}

import { GalleryVerticalEnd } from "lucide-react";
import { LoginForm } from "@/components/login-form";
export default function SignInPage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-xl flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          {/* <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <GalleryVerticalEnd className="size-4" />
          </div> */}
        </a>
        <LoginForm />
      </div>
    </div>
  );
}

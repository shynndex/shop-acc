import { cn } from "@/lib/utils";
import { GradientButton } from "@/components/ui/gradient-button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router";
import { useAuthStore } from "@/stores/useAuthStore";
import { useState } from "react";
import { toast } from "sonner";

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const navigate = useNavigate();
  const { signUp, loading } = useAuthStore();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      if (formData.password.length < 6) {
        toast.error("Mật khẩu phải có ít nhất 6 ký tự");
        return;
      }

      const success = await signUp({
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      if (success) {
        toast.success("Đăng ký thành công! Vui lòng kiểm tra email để xác thực.");
        navigate("/signin", { state: { registered: true, email: formData.email } });
      }
    } catch (error: any) {
      console.error(error);

      const message =
        error?.message ||
        "Có lỗi xảy ra, vui lòng thử lại";

      toast.error(message);
    }
  };

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={handleSubmit}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Tạo tài khoản</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Điền thông tin bên dưới để tạo tài khoản
          </p>
        </div>

        <Field>
          <FieldLabel htmlFor="username">Tên tài khoản</FieldLabel>
          <Input
            id="username"
            type="text"
            placeholder="nguyenvana"
            required
            value={formData.username}
            onChange={handleChange}
            minLength={3}
            autoComplete="username"
          />
          <FieldDescription>
            Tên tài khoản dùng để đăng nhập và hiển thị.
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="example@gmail.com"
            required
            value={formData.email}
            onChange={handleChange}
            autoComplete="email"
          />
          <FieldDescription>
            Chúng tôi sẽ sử dụng email này để liên hệ với bạn.
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="password">Mật khẩu</FieldLabel>
          <Input
            id="password"
            type="password"
            required
            value={formData.password}
            onChange={handleChange}
            minLength={6}
            autoComplete="new-password"
          />
          <FieldDescription>
            Tối thiểu 6 ký tự.
          </FieldDescription>
        </Field>

        <Field>
          <GradientButton
            type="submit"
            className="w-full h-11"
            disabled={loading}
          >
            {loading ? "Đang xử lý..." : "Tạo tài khoản"}
          </GradientButton>
        </Field>

        <FieldDescription className="text-center">
          Đã có tài khoản?{" "}
          <Link
            to="/signin"
            className="text-blue-700 font-medium hover:underline"
          >
            Đăng nhập
          </Link>
        </FieldDescription>
      </FieldGroup>
    </form>
  );
}

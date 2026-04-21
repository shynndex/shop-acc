import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      if (formData.password !== formData.confirmPassword) {
        toast.error("Mật khẩu xác nhận không khớp");
        return;
      }

      if (formData.password.length < 8) {
        toast.error("Mật khẩu phải có ít nhất 8 ký tự");
        return;
      }

      const success = await signUp({
        username: formData.username,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
      });

      if (success) {
        toast.success("Đăng ký thành công!, Vui lòng đăng nhập.");
        navigate("/signin");
      } else {
        toast.error("Đăng ký thất bại");
      }
    } catch (error: any) {
      console.error(error);

      const message =
        error?.response?.data?.message || 
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
          <FieldLabel htmlFor="username">Tên đăng nhập</FieldLabel>
          <Input
            id="username"
            type="text"
            placeholder="nguyenvana"
            required
            value={formData.username}
            onChange={handleChange}
            minLength={3}
          />
          <FieldDescription>
            Username dùng để đăng nhập, không chứa khoảng trắng.
          </FieldDescription>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="firstName">Họ</FieldLabel>
            <Input
              id="firstName"
              type="text"
              placeholder="Nguyễn"
              required
              value={formData.firstName}
              onChange={handleChange}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="lastName">Tên</FieldLabel>
            <Input
              id="lastName"
              type="text"
              placeholder="Văn A"
              required
              value={formData.lastName}
              onChange={handleChange}
            />
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="example@gmail.com"
            required
            value={formData.email}
            onChange={handleChange}
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
            minLength={8}
          />
          <FieldDescription>
            Tối thiểu 8 ký tự, nên có chữ hoa, số và ký tự đặc biệt.
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="confirmPassword">Xác nhận mật khẩu</FieldLabel>
          <Input
            id="confirmPassword"
            type="password"
            required
            value={formData.confirmPassword}
            onChange={handleChange}
          />
          <FieldDescription>Nhập lại mật khẩu để xác nhận.</FieldDescription>
        </Field>

        <Field>
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? "Đang xử lý..." : "Tạo tài khoản"}
          </Button>
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

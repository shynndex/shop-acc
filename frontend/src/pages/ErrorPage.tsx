// pages/ErrorPage.tsx
import { Link, useRouteError, isRouteErrorResponse } from "react-router-dom";

export default function ErrorPage() {
  const error = useRouteError();

  let title = "Có lỗi xảy ra";
  let message = "Something went wrong";

  if (isRouteErrorResponse(error)) {
    title = `${error.status}`;
    message = error.statusText;
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold">{title}</h1>

        <p className="text-muted-foreground">{message}</p>

        <Link
          to="/"
          className="px-4 py-2 rounded bg-primary text-white"
        >
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}
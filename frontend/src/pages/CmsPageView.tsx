import React, { useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { uiService } from "@/services/client/uiService";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";

const CMS_SLUG_LABELS: Record<string, string> = {
  "gioi-thieu": "Giới thiệu",
  "chinh-sach-bao-mat": "Chính sách bảo mật",
  "chinh-sach-doi-tra": "Chính sách đổi trả",
  "dieu-khoan-dich-vu": "Điều khoản dịch vụ",
  "huong-dan-mua-hang": "Hướng dẫn mua hàng",
  "huong-dan-nap-tien": "Hướng dẫn nạp tiền",
  faq: "Câu hỏi thường gặp",
  "lien-he": "Liên hệ",
};

// Simple Helmet component using document.title + meta
function SeoMeta({ title, description }: { title?: string; description?: string }) {
  const prevTitleRef = useRef(document.title);
  const prevDescRef = useRef<string | null>(null);

  useEffect(() => {
    if (title) {
      prevTitleRef.current = document.title;
      document.title = title;
    }
    return () => {
      document.title = prevTitleRef.current;
    };
  }, [title]);

  useEffect(() => {
    if (!description) return;
    const meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (meta) {
      prevDescRef.current = meta.content;
      meta.content = description;
    }
    return () => {
      if (prevDescRef.current !== null) {
        const m = document.querySelector('meta[name="description"]');
        if (m) m.setAttribute("content", prevDescRef.current);
      }
    };
  }, [description]);

  return null;
}

const CmsPageView = () => {
  const { slug } = useParams<{ slug: string }>();
  const pageSlug = slug || "";

  const { data, isLoading, error } = useQuery({
    queryKey: ["ui", "cms", pageSlug],
    queryFn: () => uiService.getCmsPage(pageSlug),
    staleTime: 60 * 60 * 1000, // Cache 1 giờ
    retry: false,
  });

  const page = data;

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <FileText className="size-16 mx-auto text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Trang không tồn tại</h2>
        <p className="text-muted-foreground mb-6">
          Trang bạn đang tìm kiếm không có sẵn hoặc đã bị xoá.
        </p>
        <Button asChild>
          <Link to="/">
            <ArrowLeft className="mr-2 size-4" />
            Về trang chủ
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link to="/">
            <ArrowLeft className="mr-2 size-4" />
            Về trang chủ
          </Link>
        </Button>
        <h1 className="text-3xl font-bold text-foreground">
          {CMS_SLUG_LABELS[page.slug] || page.title}
        </h1>
      </div>

      <div
        className="prose prose-sm sm:prose-base max-w-none prose-headings:text-foreground prose-a:text-blue-600 prose-img:rounded-lg"
        dangerouslySetInnerHTML={{ __html: page.content }}
      />

      <SeoMeta title={page.metaTitle} description={page.metaDescription} />
    </div>
  );
};

export default CmsPageView;

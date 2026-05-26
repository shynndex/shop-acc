import { Button } from "@/components/ui/button";
import { useCompareStore } from "@/stores/useCompareStore";
import { X, GitCompareArrows, Trash2 } from "lucide-react";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";

export const CompareBar = () => {
  const navigate = useNavigate();
  const { ids, remove, clear } = useCompareStore();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (ids.length > 0) {
      // Small delay for mount animation
      const t = setTimeout(() => setVisible(true), 50);
      return () => clearTimeout(t);
    }
    setVisible(false);
  }, [ids.length]);

  if (ids.length === 0) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-[0_-4px_20px_rgba(0,0,0,0.1)] px-4 py-3 transition-all duration-300 ${
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-full opacity-0"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <GitCompareArrows className="size-5 text-blue-600" />
          <span className="text-sm font-medium">
            Đã chọn{" "}
            <strong className="text-blue-600">{ids.length}</strong>
            /5 sản phẩm
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Selected items preview */}
          <div className="hidden sm:flex items-center gap-1.5">
            {ids.slice(0, 5).map((id) => (
              <div
                key={id}
                className="relative size-8 rounded-full bg-blue-100 border-2 border-blue-300 flex items-center justify-center group hover:shadow-xl transition-all duration-300"
              >
                <span className="text-xs font-bold text-blue-700">
                  #
                </span>
                <button
                  onClick={() => remove(id)}
                  className="absolute -top-1 -right-1 size-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={clear}
            className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="size-4 mr-1" />
            <span className="hidden sm:inline">Xoá tất cả</span>
          </Button>

          <Button
            size="sm"
            disabled={ids.length < 2}
            onClick={() => navigate("/so-sanh")}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
          >
            <GitCompareArrows className="size-4 mr-1.5" />
            So sánh
            {ids.length >= 2 && ` (${ids.length})`}
          </Button>
        </div>
      </div>
    </div>
  );
};

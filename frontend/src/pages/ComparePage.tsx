import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { accountService } from "@/services/client/accountService";
import { useCompareStore } from "@/stores/useCompareStore";
import type { Account } from "@/types";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  BarChart3,
  Gamepad2,
  GitCompareArrows,
  Hash,
  Medal,
  Palette,
  ShoppingCart,
  Star,
  Tag,
  TrendingUp,
  Trash2,
  Users,
  X,
} from "lucide-react";

// ─── Type helpers ──────────────────────────────────────────────────────────

interface CompareRow {
  label: string;
  icon: React.ReactNode;
  getValue: (acc: Account) => React.ReactNode;
  highlightDiff?: boolean;
}

const ComparePage = () => {
  const navigate = useNavigate();
  const { ids, clear, remove } = useCompareStore();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ids.length < 2) {
      setAccounts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    accountService
      .compare(ids)
      .then((data) => {
        setAccounts(data.accounts || []);
      })
      .catch(() => {
        setAccounts([]);
      })
      .finally(() => setLoading(false));
  }, [ids]);

  // Collect all unique attribute keys across selected accounts
  const allAttrKeys = Array.from(
    new Set(
      accounts.flatMap((acc) => Object.keys(acc.attributes || {})),
    ),
  ).filter((k) => k !== "code" && k !== "originalPrice" && k !== "discount");

  // Determine if a row has differences
  const hasDiff = (getVal: (acc: Account) => string | number | null) => {
    const vals = accounts.map((a) => String(getVal(a) ?? ""));
    return new Set(vals).size > 1;
  };

  // ─── Rows definition ───────────────────────────────────────────────────

  const rows: CompareRow[] = [
    {
      label: "Hình ảnh",
      icon: <Palette className="size-4" />,
      getValue: (acc) =>
        acc.images?.[0] ? (
          <img
            src={acc.images[0]}
            alt={acc.title}
            className="w-full h-28 object-cover rounded-lg"
          />
        ) : (
          <div className="flex items-center justify-center h-28 text-4xl bg-gray-50 rounded-lg">
            🎮
          </div>
        ),
    },
    {
      label: "Tên sản phẩm",
      icon: <Tag className="size-4" />,
      getValue: (acc) => (
        <span className="font-semibold text-sm line-clamp-2">
          {acc.title}
        </span>
      ),
      highlightDiff: true,
    },
    {
      label: "Giá bán",
      icon: <TrendingUp className="size-4" />,
      getValue: (acc) => (
        <span className="text-lg font-bold text-red-600">
          {acc.price.toLocaleString("vi-VN")} đ
        </span>
      ),
      highlightDiff: true,
    },
    {
      label: "Game",
      icon: <Gamepad2 className="size-4" />,
      getValue: (acc) => acc.game,
    },
    {
      label: "Loại",
      icon: <Hash className="size-4" />,
      getValue: (acc) => acc.type || "—",
      highlightDiff: true,
    },
    {
      label: "Đánh giá",
      icon: <Star className="size-4" />,
      getValue: (acc) =>
        acc.rating && acc.rating.count > 0
          ? `${acc.rating.avg}★ (${acc.rating.count})`
          : "Chưa có",
      highlightDiff: true,
    },
    {
      label: "Mã tài khoản",
      icon: <Hash className="size-4" />,
      getValue: (acc) => (
        <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
          {acc.attributes?.code || acc.id.slice(0, 8).toUpperCase()}
        </code>
      ),
      highlightDiff: true,
    },
  ];

  // Dynamic attribute rows
  const attrRowLabels: Record<string, { label: string; icon: React.ReactNode }> = {
    rank: { label: "Rank", icon: <Medal className="size-4" /> },
    skinCount: { label: "Số skin", icon: <Palette className="size-4" /> },
    skins: { label: "Số skin", icon: <Palette className="size-4" /> },
    heroCount: { label: "Số tướng", icon: <Users className="size-4" /> },
    heroes: { label: "Số tướng", icon: <Users className="size-4" /> },
    level: { label: "Cấp độ", icon: <BarChart3 className="size-4" /> },
  };

  for (const key of allAttrKeys) {
    const meta = attrRowLabels[key] || {
      label: key,
      icon: <Tag className="size-4" />,
    };
    rows.push({
      label: meta.label,
      icon: meta.icon,
      getValue: (acc) => {
        const val = acc.attributes?.[key];
        if (val === undefined || val === null) return "—";
        if (typeof val === "number") return val.toLocaleString("vi-VN");
        return String(val);
      },
      highlightDiff: true,
    });
  }

  // ─── Empty state ─────────────────────────────────────────────────────

  if (!loading && accounts.length < 2) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md">
          <div className="inline-flex items-center justify-center size-24 rounded-full bg-blue-50">
            <GitCompareArrows className="size-12 text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold">Chưa có sản phẩm để so sánh</h2>
          <p className="text-muted-foreground">
            Vui lòng chọn ít nhất 2 sản phẩm từ danh sách để bắt đầu so sánh.
          </p>
          <Button
            onClick={() => navigate(-1)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeft className="size-4 mr-2" />
            Quay lại cửa hàng
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="animate-spin rounded-full size-12 border-4 border-blue-200 border-t-blue-600" />
      </div>
    );
  }

  // ─── Main table ──────────────────────────────────────────────────────

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <GitCompareArrows className="size-8 text-blue-600" />
            So sánh sản phẩm
          </h1>
          <p className="text-muted-foreground mt-1">
            So sánh {accounts.length} sản phẩm — các điểm khác biệt được{" "}
            <span className="bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded text-sm font-medium">
              tô vàng
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="size-4 mr-1" /> Quay lại
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clear}
            className="text-red-500 border-red-200 hover:bg-red-50"
          >
            <Trash2 className="size-4 mr-1" /> Xoá tất cả
          </Button>
        </div>
      </div>

      {/* Compare Table */}
      <div className="overflow-x-auto rounded-xl border shadow-sm bg-white">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr>
              <th className="sticky left-0 bg-gray-50 z-10 w-40 md:w-52 px-4 py-3 text-left text-sm font-semibold text-gray-600 border-r border-b"></th>
              {accounts.map((acc) => (
                <th
                  key={acc.id}
                  className="px-4 py-3 text-center border-b min-w-[180px] max-w-[240px]"
                >
                  <button
                    onClick={() => remove(acc.id)}
                    className="float-right opacity-0 hover:opacity-100 transition-opacity text-red-400 hover:text-red-600"
                    title="Bỏ khỏi so sánh"
                  >
                    <X className="size-4" />
                  </button>
                  <span className="text-sm font-semibold line-clamp-2">
                    {acc.title}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const diff =
                row.highlightDiff && hasDiff((a) => String(row.getValue(a) ?? ""));

              return (
                <tr
                  key={idx}
                  className={`border-t transition-colors ${
                    diff ? "bg-yellow-50/60" : "hover:bg-gray-50"
                  }`}
                >
                  <td className="sticky left-0 bg-inherit z-10 px-4 py-3 text-sm font-medium text-gray-600 border-r flex items-center gap-2 whitespace-nowrap">
                    <span className="text-gray-400">{row.icon}</span>
                    {row.label}
                    {diff && (
                      <span className="inline-flex items-center justify-center size-5 rounded-full bg-yellow-200 text-yellow-800 text-[10px] font-bold">
                        !
                      </span>
                    )}
                  </td>
                  {accounts.map((acc) => (
                    <td
                      key={acc.id}
                      className={`px-4 py-3 text-center text-sm ${
                        diff ? "bg-yellow-50" : ""
                      }`}
                    >
                      {row.getValue(acc)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-center gap-4 mt-8">
        {accounts.map((acc) => (
          <Button
            key={acc.id}
            variant="outline"
            size="sm"
            onClick={() =>
              navigate(`/tai-khoan/${acc.game}/${acc.id}`)
            }
            className="gap-2"
          >
            <ShoppingCart className="size-4" />
            Mua: {acc.title.slice(0, 20)}
            {acc.title.length > 20 ? "..." : ""}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default ComparePage;

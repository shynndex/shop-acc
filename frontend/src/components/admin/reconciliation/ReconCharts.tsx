import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SkeletonCard } from "@/components/ui/skeletons";
import { cn, formatVND } from "@/lib/utils";
import type {
  ChartDataPoint,
  TopDepositor,
  MethodDistribution,
} from "@/types/admin/reconciliation.type";
import { BarChart3, PieChart as PieIcon, Users, Wallet } from "lucide-react";

const COLORS = {
  bank: "#3b82f6",
  card: "#8b5cf6",
  bankLight: "#93c5fd",
  cardLight: "#c4b5fd",
};

const STATUS_COLORS: Record<string, string> = {
  PAID: "#22c55e",
  SUCCESS: "#10b981",
  PENDING: "#f59e0b",
  FAILED: "#ef4444",
  CANCELLED: "#6b7280",
};

const STATUS_LABELS: Record<string, string> = {
  PAID: "Đã thanh toán",
  SUCCESS: "Thành công",
  PENDING: "Chờ xử lý",
  FAILED: "Thất bại",
  CANCELLED: "Đã hủy",
};

interface ReconChartsProps {
  timeSeries?: ChartDataPoint[];
  statusDistribution?: Record<string, number>;
  topDepositors?: TopDepositor[];
  methodDistribution?: MethodDistribution[];
  loading?: boolean;
}

function ChartSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-4 w-32 bg-muted rounded animate-pulse" />
      <div className="h-[200px] bg-muted rounded animate-pulse" />
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg p-3 text-sm">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div className="size-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium">{formatVND(entry.value)}đ</span>
        </div>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload, total }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0];
  const pct = total > 0 ? ((data.value / total) * 100).toFixed(0) : "0";
  return (
    <div className="bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg p-3 text-sm">
      <div className="flex items-center gap-2">
        <div className="size-2 rounded-full" style={{ backgroundColor: data.payload.fill }} />
        <span className="font-medium">{STATUS_LABELS[data.name] || data.name}</span>
      </div>
      <p className="text-muted-foreground mt-1">
        {data.value} giao dịch ({pct}%)
      </p>
    </div>
  );
}

export function ReconCharts({
  timeSeries = [],
  statusDistribution = {},
  topDepositors = [],
  methodDistribution = [],
  loading,
}: ReconChartsProps) {
  const pieData = useMemo(() => {
    return Object.entries(statusDistribution).map(([name, value]) => ({
      name,
      value,
      fill: STATUS_COLORS[name] || "#6b7280",
    }));
  }, [statusDistribution]);

  const pieTotal = useMemo(
    () => pieData.reduce((sum, d) => sum + d.value, 0),
    [pieData],
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <ChartSkeleton />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
      {/* ── Time Series Bar Chart ──────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BarChart3 className="size-4 text-blue-600" />
            Nạp tiền theo ngày
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 pt-0">
          {timeSeries.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
              Chưa có dữ liệu
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={timeSeries} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => {
                    const d = new Date(v);
                    return `${d.getDate()}/${d.getMonth() + 1}`;
                  }}
                />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="bank" name="Chuyển khoản" fill={COLORS.bank} radius={[2, 2, 0, 0]} />
                <Bar dataKey="card" name="Thẻ cào" fill={COLORS.card} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* ── Status Distribution Pie Chart ──────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <PieIcon className="size-4 text-green-600" />
            Tỷ lệ trạng thái
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 pt-0">
          {pieData.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
              Chưa có dữ liệu
            </div>
          ) : (
            <div className="flex items-center">
              <ResponsiveContainer width="45%" height={160}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip total={pieTotal} />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2 pl-2">
                {pieData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="size-2 rounded-full" style={{ backgroundColor: item.fill }} />
                      <span className="text-muted-foreground">{STATUS_LABELS[item.name] || item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-medium">{item.value}</span>
                      <span className="text-muted-foreground ml-1">
                        ({pieTotal > 0 ? ((item.value / pieTotal) * 100).toFixed(0) : 0}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Top Depositors ────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="size-4 text-purple-600" />
            Top người nạp tiền
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 pt-0">
          {topDepositors.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
              Chưa có dữ liệu
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                data={topDepositors.slice(0, 6)}
                layout="vertical"
                margin={{ top: 0, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <YAxis
                  dataKey="username"
                  type="category"
                  tick={{ fontSize: 11 }}
                  width={80}
                  tickFormatter={(v) => (v.length > 10 ? `${v.slice(0, 10)}...` : v)}
                />
                <Tooltip
                  formatter={(value: number) => [formatVND(value) + "đ", "Tổng nạp"]}
                />
                <Bar dataKey="totalAmount" fill={COLORS.bank} radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* ── Method Distribution ───────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Wallet className="size-4 text-orange-600" />
            Phân bổ phương thức
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 pt-0">
          {methodDistribution.every((m) => m.amount === 0) ? (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
              Chưa có dữ liệu
            </div>
          ) : (
            <div className="flex items-center">
              <ResponsiveContainer width="45%" height={160}>
                <PieChart>
                  <Pie
                    data={methodDistribution.filter((m) => m.amount > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={2}
                    dataKey="amount"
                    nameKey="label"
                  >
                    {methodDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.method === "bank" ? COLORS.bank : COLORS.card}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip total={methodDistribution.reduce((s, m) => s + m.amount, 0)} />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-3 pl-2">
                {methodDistribution.map((m) => {
                  const total = methodDistribution.reduce((s, x) => s + x.amount, 0);
                  const pct = total > 0 ? ((m.amount / total) * 100).toFixed(0) : "0";
                  return (
                    <div key={m.method}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <div className="flex items-center gap-2">
                          <div
                            className="size-2 rounded-full"
                            style={{
                              backgroundColor:
                                m.method === "bank" ? COLORS.bank : COLORS.card,
                            }}
                          />
                          <span>{m.label}</span>
                        </div>
                        <span className="font-medium">{formatVND(m.amount)}đ</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor:
                              m.method === "bank" ? COLORS.bank : COLORS.card,
                          }}
                        />
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {m.count} giao dịch · {pct}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

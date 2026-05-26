
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { GameDistribution } from "@/types/admin/analytics.type";

interface GameDistributionChartProps {
  data: GameDistribution[];
  loading?: boolean;
}

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#6366f1"];

export function GameDistributionChart({ data, loading }: GameDistributionChartProps) {
  if (loading || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Phân bổ theo game</CardTitle>
          <CardDescription>Số lượng tài khoản bán theo từng game</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
          {loading ? "Đang tải dữ liệu..." : "Không có dữ liệu"}
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((item, idx) => ({
    name: item.label,
    value: item.count,
    revenue: item.revenue,
    color: item.color || COLORS[idx % COLORS.length],
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Phân bổ theo game</CardTitle>
        <CardDescription>Số lượng tài khoản bán theo từng game</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number | string | undefined, name: string | undefined, props: any) => [
                `${value ?? 0} tài khoản`,
                props?.payload?.name ?? name
              ]}
              labelFormatter={(label) => `Game: ${label}`}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Bảng tổng hợp bên dưới chart */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          {data.map((item, idx) => (
            <div key={item.game} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.color || COLORS[idx % COLORS.length] }} 
              />
              <span className="flex-1">{item.label}</span>
              <span className="font-medium">{item.count}</span>
              {item.revenue !== undefined && (
                <span className="text-muted-foreground text-xs">
                  ({(item.revenue / 1000).toFixed(0)}kđ)
                </span>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { RevenueDataPoint } from "@/types/admin/analytics.type";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import React from "react";

interface RevenueChartProps {
  data: RevenueDataPoint[];
  loading?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-background border rounded-lg p-3 shadow-lg text-sm">
        <p className="font-medium mb-2">{label}</p>
        {payload.map((item: any, idx: number) => (
          <p
            key={idx}
            className="flex items-center gap-2"
            style={{ color: item.color }}
          >
            <span
              className="size-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            {item.name}:
            {item.name === "Doanh thu"
              ? `${item.value.toLocaleString("vi-VN")}đ`
              : `${item.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const RevenueChart = ({ data, loading }: RevenueChartProps) => {
  if (loading || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Doanh thu theo thời gian</CardTitle>
          <CardDescription>Biểu đồ doanh thu hàng ngày</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={data}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) =>
                  new Date(value).toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })
                }
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                name="Doanh thu"
                stroke="#22c55e"
                strokeWidth={2}
                dot={{ r: 3, fill: "#22c55e" }}
                activeDot={{ r: 5 }}
              />
              {data[0].orders !== undefined && (
                <Line
                  type="monotone"
                  dataKey="orders"
                  name="Đơn hàng"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  }
  return <div>RevenueChart</div>;
};

export default RevenueChart;

"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

export type RevenueHistoryPoint = {
  fiscalYear: number;
  revenue: number;
  periodEnd: string;
  filed: string;
};

type RevenueChartProps = {
  data: RevenueHistoryPoint[];
};

export default function RevenueChart({
  data,
}: RevenueChartProps) {
  const chartData = data.map((record) => ({
    year: record.fiscalYear,
    revenue: record.revenue / 1_000_000_000,
  }));

  return (
    <div className="mt-8">
      <h3 className="mb-4 text-xl font-semibold">
        Revenue Trend
      </h3>

      <p className="mb-5 text-sm text-gray-500">
        Annual revenue in USD billions
      </p>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{
              top: 10,
              right: 20,
              left: 0,
              bottom: 5,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e7eb"
            />

            <XAxis
              dataKey="year"
              tickLine={false}
            />

            <YAxis
              tickFormatter={(value: number) => `$${value}B`}
              tickLine={false}
            />

            <Tooltip
              formatter={(value, name) => [
                `$${Number(value).toFixed(2)}B`,
                name === "revenue" ? "Revenue" : String(name),
              ]}
              labelFormatter={(year) => `Fiscal Year ${year}`}
            />

            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#2563eb"
              strokeWidth={3}
              dot={{ r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
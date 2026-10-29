"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";

type RevenueGrowthPoint = {
  fiscalYear: number;
  revenue: number;
  growth: number | null;
};

type RevenueGrowthChartProps = {
  data: RevenueGrowthPoint[];
};

export default function RevenueGrowthChart({
  data,
}: RevenueGrowthChartProps) {
  const chartData = data.map((record) => ({
    year: record.fiscalYear,
    growth:
      record.growth === null
        ? null
        : record.growth * 100,
  }));

  return (
    <div className="mt-10">
      <h3 className="mb-4 text-xl font-semibold">
        Revenue Growth Trend
      </h3>

      <p className="mb-5 text-sm text-gray-500">
        Year-over-year revenue growth (%)
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
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="year" />

            <YAxis
              tickFormatter={(value: number) =>
                `${value}%`
              }
            />

            <Tooltip
              formatter={(value) =>
                value == null
                  ? "N/A"
                  : `${Number(value).toFixed(2)}%`
              }
              labelFormatter={(year) =>
                `Fiscal Year ${year}`
              }
            />

            <ReferenceLine
              y={0}
              stroke="#9ca3af"
              strokeDasharray="3 3"
            />

            <Line
              type="monotone"
              dataKey="growth"
              stroke="#16a34a"
              strokeWidth={3}
              dot={{ r: 5 }}
              activeDot={{ r: 7 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
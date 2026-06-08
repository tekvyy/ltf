"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ChartDataPoint {
  date: string;
  value: number;
}

interface LoansChartProps {
  data: ChartDataPoint[];
}

// Format large numbers for Y-axis
function formatYAxisValue(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`;
  }
  return value.toString();
}

// Format currency for tooltip
function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function LoansChart({ data }: LoansChartProps) {
  // Calculate dynamic Y-axis domain and ticks based on data
  const { maxValue, ticks } = useMemo(() => {
    const max = Math.max(...data.map((d) => d.value), 0);

    if (max === 0) {
      return { maxValue: 100, ticks: [0, 25, 50, 75, 100] };
    }

    // Round up to a nice number
    const magnitude = Math.pow(10, Math.floor(Math.log10(max)));
    const normalized = max / magnitude;
    let niceMax: number;

    if (normalized <= 1) niceMax = magnitude;
    else if (normalized <= 2) niceMax = 2 * magnitude;
    else if (normalized <= 5) niceMax = 5 * magnitude;
    else niceMax = 10 * magnitude;

    // Generate 4-5 tick marks
    const tickCount = 4;
    const tickInterval = niceMax / tickCount;
    const calculatedTicks = Array.from({ length: tickCount + 1 }, (_, i) => i * tickInterval);

    return { maxValue: niceMax, ticks: calculatedTicks };
  }, [data]);

  const currentYear = new Date().getFullYear();

  return (
    <Card className="bg-card">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold tracking-tight">
          Approved loans value
        </CardTitle>
        <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {currentYear}
        </span>
      </CardHeader>
      <CardContent>
        <div className="h-[180px] sm:h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" vertical={false} horizontal={true} stroke="var(--border)" />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                width={50}
                domain={[0, maxValue]}
                ticks={ticks}
                tickFormatter={formatYAxisValue}
              />
              <Tooltip
                cursor={{ stroke: "var(--primary)", strokeWidth: 1, strokeOpacity: 0.4 }}
                contentStyle={{
                  backgroundColor: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: "10px",
                  fontSize: "12px",
                  color: "var(--popover-foreground)",
                  boxShadow: "0 8px 24px -8px rgba(0,0,0,0.18)",
                }}
                formatter={(value) => [formatCurrency(value as number), "Approved Loans"]}
                labelStyle={{ fontWeight: 600, marginBottom: 4, color: "var(--foreground)" }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--primary)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorValue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

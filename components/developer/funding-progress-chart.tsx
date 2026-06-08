"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { Project } from "@/lib/types";

interface FundingProgressChartProps {
  projects: Project[];
}

export function FundingProgressChart({ projects }: FundingProgressChartProps) {
  const { chartData, totalFunding, totalTarget, trend, percentageChange } = useMemo(() => {
    // Get the last 6 months
    const now = new Date();
    const months: { month: string; year: number; monthNum: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        month: date.toLocaleDateString("en-US", { month: "short" }),
        year: date.getFullYear(),
        monthNum: date.getMonth(),
      });
    }

    // Filter projects that have funding (approved, funded, or completed with amount_raised > 0)
    const fundedProjects = projects.filter(
      (p) => (p.amount_raised && p.amount_raised > 0) ||
             ["approved", "funded", "completed"].includes(p.status)
    );

    // Calculate monthly data
    let cumulativeRaised = 0;
    let cumulativeTarget = 0;

    const data = months.map(({ month, year, monthNum }) => {
      // Find projects that got funding in this month
      // Use funded_at, approved_at, or created_at as the reference date
      const monthProjects = fundedProjects.filter((project) => {
        const refDate = new Date(
          project.funded_at || project.approved_at || project.created_at
        );
        return refDate.getFullYear() === year && refDate.getMonth() === monthNum;
      });

      // Add this month's values to cumulative totals
      monthProjects.forEach((project) => {
        cumulativeRaised += project.amount_raised || 0;
        cumulativeTarget += project.loan_amount || 0;
      });

      return {
        month,
        raised: cumulativeRaised,
        target: cumulativeTarget,
      };
    });

    // Calculate trend (comparing last month to previous month)
    const currentMonthRaised = data[data.length - 1]?.raised || 0;
    const previousMonthRaised = data[data.length - 2]?.raised || 0;
    const monthlyChange = currentMonthRaised - previousMonthRaised;
    const change = previousMonthRaised > 0
      ? (monthlyChange / previousMonthRaised) * 100
      : monthlyChange > 0 ? 100 : 0;

    return {
      chartData: data,
      totalFunding: cumulativeRaised,
      totalTarget: cumulativeTarget,
      trend: change >= 0 ? "up" : "down",
      percentageChange: Math.abs(change).toFixed(1),
    };
  }, [projects]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value}`;
  };

  // Calculate funding percentage
  const fundingPercentage = totalTarget > 0
    ? Math.round((totalFunding / totalTarget) * 100)
    : 0;

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold">Funding Progress</h2>
          <p className="text-sm text-muted-foreground">Cumulative funding over time</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary">{formatCurrency(totalFunding)}</p>
          <p className="text-sm text-muted-foreground">
            of {formatCurrency(totalTarget)} target ({fundingPercentage}%)
          </p>
          {(totalFunding > 0 || Number(percentageChange) > 0) && (
            <div className="flex items-center justify-end gap-1 text-sm mt-1">
              {trend === "up" ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className={trend === "up" ? "text-green-600" : "text-red-600"}>
                {percentageChange}%
              </span>
              <span className="text-muted-foreground">vs last month</span>
            </div>
          )}
        </div>
      </div>

      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorRaised" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-3)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="var(--chart-3)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              tickFormatter={formatCurrency}
              width={60}
            />
            <Tooltip
              cursor={{ stroke: "var(--primary)", strokeWidth: 1, strokeOpacity: 0.4 }}
              contentStyle={{
                backgroundColor: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                color: "var(--popover-foreground)",
                boxShadow: "0 8px 24px -8px rgb(0 0 0 / 0.18)",
              }}
              formatter={(value, name) => [
                formatCurrency(value as number),
                name === "raised" ? "Amount Raised" : "Target Amount",
              ]}
              labelFormatter={(label) => label}
            />
            <Area
              type="monotone"
              dataKey="target"
              stroke="var(--chart-3)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorTarget)"
              name="target"
            />
            <Area
              type="monotone"
              dataKey="raised"
              stroke="var(--primary)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorRaised)"
              name="raised"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-6 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-primary" />
          <span className="text-muted-foreground">Amount Raised</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-blue-500" />
          <span className="text-muted-foreground">Target Amount</span>
        </div>
      </div>
    </div>
  );
}

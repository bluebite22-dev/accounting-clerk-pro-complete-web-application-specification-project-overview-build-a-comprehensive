"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card } from "@/components/ui/card";

interface CashFlowData {
  date: string;
  income: number;
  expenses: number;
  netCashFlow: number;
}

interface CashFlowChartProps {
  data: CashFlowData[];
  title?: string;
  height?: number;
}

function formatCurrency(value: number | undefined): string {
  if (value === undefined) return "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ color: string; name: string; value: number }>; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-3">
        <p className="text-neutral-100 mb-2">
          {label ? new Date(label).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          }) : ""}
        </p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export function CashFlowChart({ data, title = "Cash Flow", height = 300 }: CashFlowChartProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorNetFlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            stroke="#9CA3AF"
            fontSize={12}
          />
          <YAxis
            tickFormatter={(value: string | number) => formatCurrency(value as number)}
            stroke="#9CA3AF"
            fontSize={12}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Area
            type="monotone"
            dataKey="income"
            name="Income"
            stroke="#10B981"
            fillOpacity={1}
            fill="url(#colorIncome)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="expenses"
            name="Expenses"
            stroke="#EF4444"
            fillOpacity={1}
            fill="url(#colorExpenses)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="netCashFlow"
            name="Net Cash Flow"
            stroke="#3B82F6"
            fillOpacity={1}
            fill="url(#colorNetFlow)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}

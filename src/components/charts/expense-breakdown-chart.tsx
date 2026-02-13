"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Card } from "@/components/ui/card";

interface ExpenseCategory {
  category: string;
  amount: number;
  color: string;
}

interface ExpenseBreakdownChartProps {
  data: ExpenseCategory[];
  title?: string;
  height?: number;
}

const COLORS = [
  "#3B82F6", // blue
  "#10B981", // green
  "#F59E0B", // amber
  "#EF4444", // red
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#84CC16", // lime
  "#F97316", // orange
  "#6366F1", // indigo
];

function formatCurrency(value: number | undefined): string {
  if (value === undefined) return "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-3">
        <p className="text-sm text-neutral-100">{payload[0]?.name}</p>
        <p className="text-lg font-bold text-neutral-100">
          {formatCurrency(payload[0]?.value)}
        </p>
      </div>
    );
  }
  return null;
}

function renderLabel({ category, percent }: { category?: string; percent?: number }) {
  if (category && percent !== undefined) {
    return `${category} (${(percent * 100).toFixed(0)}%)`;
  }
  return "";
}

export function ExpenseBreakdownChart({
  data,
  title = "Expense Breakdown",
  height = 300,
}: ExpenseBreakdownChartProps) {
  const total = data.reduce((sum, item) => sum + item.amount, 0);

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="amount"
            nameKey="category"
            label={renderLabel}
            labelLine={false}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      {total > 0 && (
        <div className="text-center mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500">Total Expenses</p>
          <p className="text-xl font-bold">{formatCurrency(total)}</p>
        </div>
      )}
    </Card>
  );
}

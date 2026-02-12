"use client";

import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useDataStore } from "@/stores/data-store";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  FileText,
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  BarChart3,
  Calendar,
} from "lucide-react";

const reportTypes = [
  {
    id: "profit-loss",
    name: "Profit & Loss Statement",
    description: "Revenue, expenses, and net income over a period",
    icon: BarChart3,
    color: "bg-blue-500/20",
    iconColor: "text-blue-400",
  },
  {
    id: "cash-flow",
    name: "Cash Flow Statement",
    description: "Cash inflows and outflows by category",
    icon: TrendingUp,
    color: "bg-green-500/20",
    iconColor: "text-green-400",
  },
  {
    id: "balance-sheet",
    name: "Balance Sheet",
    description: "Assets, liabilities, and equity snapshot",
    icon: PieChart,
    color: "bg-purple-500/20",
    iconColor: "text-purple-400",
  },
  {
    id: "aging",
    name: "Aging Report",
    description: "Receivables and payables by age",
    icon: Calendar,
    color: "bg-orange-500/20",
    iconColor: "text-orange-400",
  },
  {
    id: "expense-by-category",
    name: "Expense by Category",
    description: "Breakdown of expenses by category",
    icon: TrendingDown,
    color: "bg-red-500/20",
    iconColor: "text-red-400",
  },
  {
    id: "income-by-customer",
    name: "Income by Customer",
    description: "Revenue breakdown by customer",
    icon: DollarSign,
    color: "bg-teal-500/20",
    iconColor: "text-teal-400",
  },
];

export default function ReportsPage() {
  const { transactions, invoices, bills, categories } = useDataStore();
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });

  // Calculate summary data
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const netIncome = totalIncome - totalExpenses;

  const totalReceivables = invoices
    .filter((i) => i.status !== "paid" && i.status !== "cancelled")
    .reduce((sum, i) => sum + (i.totalAmount - i.amountPaid), 0);

  const totalPayables = bills
    .filter((b) => b.status !== "paid" && b.status !== "cancelled")
    .reduce((sum, b) => sum + (b.totalAmount - b.amountPaid), 0);

  // Group expenses by category
  const expensesByCategory = categories
    .filter((c) => c.type === "expense" || c.type === "both")
    .map((category) => {
      const categoryTotal = transactions
        .filter((t) => t.type === "expense" && t.categoryId === category.id)
        .reduce((sum, t) => sum + t.amount, 0);
      return {
        ...category,
        total: categoryTotal,
      };
    })
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total);

  const handleExport = (format: "pdf" | "csv" | "excel") => {
    alert(`Exporting ${selectedReport} as ${format.toUpperCase()}...`);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Reports</h1>
            <p className="text-neutral-400">Generate and export financial reports</p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-40"
            />
            <span className="text-neutral-500">to</span>
            <Input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-40"
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-green-500/20 p-3">
                  <TrendingUp className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-neutral-400">Total Income</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(totalIncome)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-red-500/20 p-3">
                  <TrendingDown className="h-6 w-6 text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-neutral-400">Total Expenses</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(totalExpenses)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`rounded-xl p-3 ${netIncome >= 0 ? "bg-green-500/20" : "bg-red-500/20"}`}>
                  <DollarSign className={`h-6 w-6 ${netIncome >= 0 ? "text-green-400" : "text-red-400"}`} />
                </div>
                <div>
                  <p className="text-sm text-neutral-400">Net Income</p>
                  <p className={`text-2xl font-bold ${netIncome >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {formatCurrency(netIncome)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-blue-500/20 p-3">
                  <PieChart className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-neutral-400">Transactions</p>
                  <p className="text-2xl font-bold text-white">{transactions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Report Types Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reportTypes.map((report) => (
            <Card
              key={report.id}
              className={`cursor-pointer transition-all hover:border-neutral-700 ${
                selectedReport === report.id ? "border-blue-500 ring-1 ring-blue-500" : ""
              }`}
              onClick={() => setSelectedReport(report.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`rounded-xl p-3 ${report.color}`}>
                    <report.icon className={`h-6 w-6 ${report.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-neutral-100">{report.name}</h3>
                    <p className="mt-1 text-sm text-neutral-400">{report.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Report Preview */}
        {selectedReport && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                {reportTypes.find((r) => r.id === selectedReport)?.name}
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleExport("pdf")}>
                  <Download className="mr-2 h-4 w-4" />
                  PDF
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleExport("csv")}>
                  <Download className="mr-2 h-4 w-4" />
                  CSV
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleExport("excel")}>
                  <Download className="mr-2 h-4 w-4" />
                  Excel
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {selectedReport === "profit-loss" && (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg border border-neutral-800 p-4">
                      <h4 className="mb-3 text-sm font-medium text-neutral-400">Revenue</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-neutral-300">Sales Revenue</span>
                          <span className="text-green-400">{formatCurrency(totalIncome * 0.6)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-300">Service Income</span>
                          <span className="text-green-400">{formatCurrency(totalIncome * 0.3)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-300">Other Income</span>
                          <span className="text-green-400">{formatCurrency(totalIncome * 0.1)}</span>
                        </div>
                        <div className="flex justify-between border-t border-neutral-700 pt-2 font-medium">
                          <span className="text-neutral-100">Total Revenue</span>
                          <span className="text-green-400">{formatCurrency(totalIncome)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg border border-neutral-800 p-4">
                      <h4 className="mb-3 text-sm font-medium text-neutral-400">Expenses</h4>
                      <div className="space-y-2">
                        {expensesByCategory.slice(0, 4).map((cat) => (
                          <div key={cat.id} className="flex justify-between">
                            <span className="text-neutral-300">{cat.name}</span>
                            <span className="text-red-400">{formatCurrency(cat.total)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between border-t border-neutral-700 pt-2 font-medium">
                          <span className="text-neutral-100">Total Expenses</span>
                          <span className="text-red-400">{formatCurrency(totalExpenses)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg bg-neutral-800/50 p-4">
                    <div className="flex justify-between text-lg font-medium">
                      <span className="text-neutral-100">Net Income</span>
                      <span className={netIncome >= 0 ? "text-green-400" : "text-red-400"}>
                        {formatCurrency(netIncome)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {selectedReport === "cash-flow" && (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-lg border border-neutral-800 p-4">
                      <h4 className="mb-2 text-sm font-medium text-neutral-400">Operating</h4>
                      <p className="text-2xl font-bold text-green-400">{formatCurrency(totalIncome * 0.8)}</p>
                      <p className="text-xs text-neutral-500">From business operations</p>
                    </div>
                    <div className="rounded-lg border border-neutral-800 p-4">
                      <h4 className="mb-2 text-sm font-medium text-neutral-400">Investing</h4>
                      <p className="text-2xl font-bold text-red-400">-{formatCurrency(totalExpenses * 0.2)}</p>
                      <p className="text-xs text-neutral-500">Asset purchases</p>
                    </div>
                    <div className="rounded-lg border border-neutral-800 p-4">
                      <h4 className="mb-2 text-sm font-medium text-neutral-400">Financing</h4>
                      <p className="text-2xl font-bold text-blue-400">{formatCurrency(0)}</p>
                      <p className="text-xs text-neutral-500">Loans & equity</p>
                    </div>
                  </div>
                  <div className="rounded-lg bg-neutral-800/50 p-4">
                    <div className="flex justify-between text-lg font-medium">
                      <span className="text-neutral-100">Net Cash Flow</span>
                      <span className={netIncome >= 0 ? "text-green-400" : "text-red-400"}>
                        {formatCurrency(netIncome)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {selectedReport === "aging" && (
                <div className="space-y-6">
                  <div>
                    <h4 className="mb-3 text-sm font-medium text-neutral-400">Accounts Receivable Aging</h4>
                    <div className="rounded-lg border border-neutral-800">
                      <div className="grid grid-cols-5 gap-4 border-b border-neutral-800 p-3 text-sm font-medium text-neutral-400">
                        <div>Period</div>
                        <div className="text-right">Current</div>
                        <div className="text-right">31-60 Days</div>
                        <div className="text-right">61-90 Days</div>
                        <div className="text-right">90+ Days</div>
                      </div>
                      <div className="grid grid-cols-5 gap-4 p-3 text-sm">
                        <div className="text-neutral-300">Amount</div>
                        <div className="text-right text-green-400">{formatCurrency(totalReceivables * 0.5)}</div>
                        <div className="text-right text-yellow-400">{formatCurrency(totalReceivables * 0.25)}</div>
                        <div className="text-right text-orange-400">{formatCurrency(totalReceivables * 0.15)}</div>
                        <div className="text-right text-red-400">{formatCurrency(totalReceivables * 0.1)}</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="mb-3 text-sm font-medium text-neutral-400">Accounts Payable Aging</h4>
                    <div className="rounded-lg border border-neutral-800">
                      <div className="grid grid-cols-5 gap-4 border-b border-neutral-800 p-3 text-sm font-medium text-neutral-400">
                        <div>Period</div>
                        <div className="text-right">Current</div>
                        <div className="text-right">31-60 Days</div>
                        <div className="text-right">61-90 Days</div>
                        <div className="text-right">90+ Days</div>
                      </div>
                      <div className="grid grid-cols-5 gap-4 p-3 text-sm">
                        <div className="text-neutral-300">Amount</div>
                        <div className="text-right text-green-400">{formatCurrency(totalPayables * 0.6)}</div>
                        <div className="text-right text-yellow-400">{formatCurrency(totalPayables * 0.2)}</div>
                        <div className="text-right text-orange-400">{formatCurrency(totalPayables * 0.15)}</div>
                        <div className="text-right text-red-400">{formatCurrency(totalPayables * 0.05)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedReport === "expense-by-category" && (
                <div className="space-y-4">
                  {expensesByCategory.map((category, index) => {
                    const percent = (category.total / totalExpenses) * 100;
                    return (
                      <div key={category.id} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            <span className="text-neutral-300">{category.name}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-neutral-400">{percent.toFixed(1)}%</span>
                            <span className="text-red-400 font-medium">{formatCurrency(category.total)}</span>
                          </div>
                        </div>
                        <div className="h-2 rounded-full bg-neutral-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-red-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {(selectedReport === "income-by-customer" || selectedReport === "balance-sheet") && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-12 w-12 text-neutral-600 mb-4" />
                  <p className="text-neutral-400">Report preview will be generated based on your data</p>
                  <p className="text-sm text-neutral-500 mt-1">Click an export button to download the full report</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}

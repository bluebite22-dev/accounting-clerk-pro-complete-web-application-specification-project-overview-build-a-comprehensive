"use client";

import { useMemo } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDataStore } from "@/stores/data-store";
import { formatCurrency, formatDate, calculateDaysUntil } from "@/lib/utils";
import { CashFlowChart, ExpenseBreakdownChart, IncomeExpensesBarChart } from "@/components/charts";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Clock,
  AlertTriangle,
  Plus,
  Receipt,
  Building2,
  Target,
  Calendar,
} from "lucide-react";

function StatCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  iconColor,
}: {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: React.ElementType;
  iconColor: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-neutral-400">{title}</p>
            <p className="mt-1 text-2xl font-bold text-white">{value}</p>
            {change && (
              <div className="mt-2 flex items-center gap-1">
                {changeType === "positive" ? (
                  <ArrowUpRight className="h-4 w-4 text-green-400" />
                ) : changeType === "negative" ? (
                  <ArrowDownRight className="h-4 w-4 text-red-400" />
                ) : null}
                <span
                  className={`text-sm ${
                    changeType === "positive"
                      ? "text-green-400"
                      : changeType === "negative"
                      ? "text-red-400"
                      : "text-neutral-400"
                  }`}
                >
                  {change}
                </span>
              </div>
            )}
          </div>
          <div className={`rounded-xl p-3 ${iconColor}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Button variant="outline" className="h-auto flex-col gap-2 py-4">
            <div className="rounded-lg bg-green-500/20 p-2">
              <Plus className="h-5 w-5 text-green-400" />
            </div>
            <span className="text-xs">Add Income</span>
          </Button>
          <Button variant="outline" className="h-auto flex-col gap-2 py-4">
            <div className="rounded-lg bg-red-500/20 p-2">
              <Receipt className="h-5 w-5 text-red-400" />
            </div>
            <span className="text-xs">Add Expense</span>
          </Button>
          <Button variant="outline" className="h-auto flex-col gap-2 py-4">
            <div className="rounded-lg bg-blue-500/20 p-2">
              <FileText className="h-5 w-5 text-blue-400" />
            </div>
            <span className="text-xs">New Invoice</span>
          </Button>
          <Button variant="outline" className="h-auto flex-col gap-2 py-4">
            <div className="rounded-lg bg-purple-500/20 p-2">
              <Building2 className="h-5 w-5 text-purple-400" />
            </div>
            <span className="text-xs">New Bill</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function UpcomingPayments() {
  const { bills } = useDataStore();
  
  const upcomingBills = bills
    .filter((b) => b.status !== "paid" && b.status !== "cancelled")
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Upcoming Payments</CardTitle>
        <Button variant="ghost" size="sm">View All</Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {upcomingBills.map((bill) => {
            const daysUntil = calculateDaysUntil(bill.dueDate);
            const isOverdue = daysUntil < 0;
            const isUrgent = daysUntil <= 3 && daysUntil >= 0;
            
            return (
              <div key={bill.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-2 ${isOverdue ? "bg-red-500/20" : isUrgent ? "bg-yellow-500/20" : "bg-neutral-800"}`}>
                    <Calendar className={`h-4 w-4 ${isOverdue ? "text-red-400" : isUrgent ? "text-yellow-400" : "text-neutral-400"}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-100">{bill.vendorName}</p>
                    <p className="text-xs text-neutral-500">{bill.billNumber}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-neutral-100">{formatCurrency(bill.totalAmount)}</p>
                  <p className={`text-xs ${isOverdue ? "text-red-400" : isUrgent ? "text-yellow-400" : "text-neutral-500"}`}>
                    {isOverdue ? `${Math.abs(daysUntil)} days overdue` : daysUntil === 0 ? "Due today" : `Due in ${daysUntil} days`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function OverdueInvoices() {
  const { invoices } = useDataStore();
  
  const overdueInvoices = invoices
    .filter((inv) => inv.status === "overdue" || (inv.status !== "paid" && inv.status !== "cancelled" && calculateDaysUntil(inv.dueDate) < 0))
    .slice(0, 5);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          Overdue Invoices
        </CardTitle>
        <Button variant="ghost" size="sm">View All</Button>
      </CardHeader>
      <CardContent>
        {overdueInvoices.length === 0 ? (
          <p className="text-center text-sm text-neutral-500 py-4">No overdue invoices</p>
        ) : (
          <div className="space-y-4">
            {overdueInvoices.map((invoice) => {
              const daysOverdue = Math.abs(calculateDaysUntil(invoice.dueDate));
              
              return (
                <div key={invoice.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-red-500/20 p-2">
                      <FileText className="h-4 w-4 text-red-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-100">{invoice.customerName}</p>
                      <p className="text-xs text-neutral-500">{invoice.invoiceNumber}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-neutral-100">{formatCurrency(invoice.totalAmount - invoice.amountPaid)}</p>
                    <p className="text-xs text-red-400">{daysOverdue} days overdue</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RecentTransactions() {
  const { transactions } = useDataStore();
  
  const recentTransactions = transactions.slice(0, 6);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Recent Transactions</CardTitle>
        <Button variant="ghost" size="sm">View All</Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentTransactions.map((txn) => (
            <div key={txn.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`rounded-lg p-2 ${txn.type === "income" ? "bg-green-500/20" : "bg-red-500/20"}`}>
                  {txn.type === "income" ? (
                    <TrendingUp className="h-4 w-4 text-green-400" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-400" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-100">{txn.description}</p>
                  <p className="text-xs text-neutral-500">{formatDate(txn.date)}</p>
                </div>
              </div>
              <p className={`text-sm font-medium ${txn.type === "income" ? "text-green-400" : "text-red-400"}`}>
                {txn.type === "income" ? "+" : "-"}{formatCurrency(txn.amount)}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ActiveStopOrders() {
  const { stopOrders } = useDataStore();
  
  const activeStops = stopOrders.filter((s) => s.isActive).slice(0, 3);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5 text-orange-400" />
          Active Stop Orders
        </CardTitle>
        <Badge variant="warning">{activeStops.length} Active</Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activeStops.map((stop) => (
            <div key={stop.id} className="rounded-lg border border-neutral-800 bg-neutral-800/50 p-3">
              <div className="flex items-center justify-between mb-2">
                <Badge variant={stop.type === "vendor" ? "destructive" : "warning"}>
                  {stop.type.charAt(0).toUpperCase() + stop.type.slice(1)}
                </Badge>
                <span className="text-xs text-neutral-500">
                  Blocked: {formatCurrency(stop.blockedAmount)}
                </span>
              </div>
              <p className="text-sm text-neutral-300">{stop.reason}</p>
              <p className="text-xs text-neutral-500 mt-1">
                Triggered {stop.triggeredCount} times
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function BudgetOverview() {
  const { budgets } = useDataStore();
  
  const activeBudget = budgets.find((b) => b.status === "active");

  if (!activeBudget) return null;

  const utilizationPercent = (activeBudget.totalSpent / activeBudget.totalAllocated) * 100;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">{activeBudget.name}</CardTitle>
        <Badge variant={utilizationPercent > 90 ? "destructive" : utilizationPercent > 75 ? "warning" : "success"}>
          {utilizationPercent.toFixed(0)}% Used
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-400">Spent</span>
              <span className="text-neutral-100">{formatCurrency(activeBudget.totalSpent)} / {formatCurrency(activeBudget.totalAllocated)}</span>
            </div>
            <div className="h-2 rounded-full bg-neutral-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  utilizationPercent > 90 ? "bg-red-500" : utilizationPercent > 75 ? "bg-yellow-500" : "bg-green-500"
                }`}
                style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
              />
            </div>
          </div>

          {/* Line items */}
          <div className="space-y-2">
            {activeBudget.lineItems.slice(0, 3).map((item) => {
              const itemPercent = (item.spent / item.allocated) * 100;
              return (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="text-neutral-400">{item.categoryName}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-100">{itemPercent.toFixed(0)}%</span>
                    {itemPercent > item.alertThreshold && (
                      <AlertTriangle className="h-4 w-4 text-yellow-400" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { transactions, invoices, bills, categories } = useDataStore();
  
  // Calculate summary stats
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalReceivables = invoices
    .filter((i) => i.status !== "paid" && i.status !== "cancelled")
    .reduce((sum, i) => sum + (i.totalAmount - i.amountPaid), 0);
  
  const totalPayables = bills
    .filter((b) => b.status !== "paid" && b.status !== "cancelled")
    .reduce((sum, b) => sum + (b.totalAmount - b.amountPaid), 0);

  // Prepare chart data - Cash Flow
  const cashFlowData = useMemo(() => {
    const monthlyData: Record<string, { income: number; expenses: number }> = {};
    
    transactions.forEach((t) => {
      const date = new Date(t.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
      
      if (!monthlyData[key]) {
        monthlyData[key] = { income: 0, expenses: 0 };
      }
      
      if (t.type === "income") {
        monthlyData[key].income += t.amount;
      } else {
        monthlyData[key].expenses += t.amount;
      }
    });
    
    return Object.entries(monthlyData)
      .map(([date, data]) => ({
        date,
        income: data.income,
        expenses: data.expenses,
        netCashFlow: data.income - data.expenses,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-12);
  }, [transactions]);

  // Prepare chart data - Monthly Income vs Expenses
  const monthlyComparisonData = useMemo(() => {
    const monthlyData: Record<string, { income: number; expenses: number }> = {};
    
    transactions.forEach((t) => {
      const date = new Date(t.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      
      if (!monthlyData[key]) {
        monthlyData[key] = { income: 0, expenses: 0 };
      }
      
      if (t.type === "income") {
        monthlyData[key].income += t.amount;
      } else {
        monthlyData[key].expenses += t.amount;
      }
    });
    
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    return Object.entries(monthlyData)
      .map(([month, data]) => {
        const [year, monthNum] = month.split("-");
        return {
          month: `${monthNames[parseInt(monthNum) - 1]} ${year}`,
          income: data.income,
          expenses: data.expenses,
        };
      })
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12);
  }, [transactions]);

  // Prepare chart data - Expense Breakdown by Category
  const expenseBreakdownData = useMemo(() => {
    const categoryData: Record<string, { amount: number; color: string }> = {};
    
    transactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        const category = categories.find((c) => c.id === t.categoryId);
        const name = category?.name || "Uncategorized";
        
        if (!categoryData[name]) {
          categoryData[name] = {
            amount: 0,
            color: category?.color || "#6B7280",
          };
        }
        
        categoryData[name].amount += t.amount;
      });
    
    return Object.entries(categoryData)
      .map(([category, data]) => ({
        category,
        amount: data.amount,
        color: data.color,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8);
  }, [transactions, categories]);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-neutral-400">Welcome back! Here is your financial overview.</p>
        </div>

        {/* Stats grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Income"
            value={formatCurrency(totalIncome)}
            change="+12.5% from last month"
            changeType="positive"
            icon={TrendingUp}
            iconColor="bg-green-500"
          />
          <StatCard
            title="Total Expenses"
            value={formatCurrency(totalExpenses)}
            change="+8.2% from last month"
            changeType="negative"
            icon={TrendingDown}
            iconColor="bg-red-500"
          />
          <StatCard
            title="Accounts Receivable"
            value={formatCurrency(totalReceivables)}
            change="5 invoices pending"
            changeType="neutral"
            icon={FileText}
            iconColor="bg-blue-500"
          />
          <StatCard
            title="Accounts Payable"
            value={formatCurrency(totalPayables)}
            change="3 bills due this week"
            changeType="neutral"
            icon={Clock}
            iconColor="bg-purple-500"
          />
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          <CashFlowChart data={cashFlowData} title="Cash Flow Trend" />
          <ExpenseBreakdownChart data={expenseBreakdownData} title="Expense Breakdown" />
        </div>

        <IncomeExpensesBarChart data={monthlyComparisonData} title="Income vs Expenses" />

        {/* Quick Actions */}
        <QuickActions />

        {/* Main content grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          <UpcomingPayments />
          <OverdueInvoices />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RecentTransactions />
          </div>
          <div className="space-y-6">
            <ActiveStopOrders />
            <BudgetOverview />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

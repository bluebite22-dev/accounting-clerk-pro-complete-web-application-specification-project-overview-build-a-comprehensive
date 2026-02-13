import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { transactions, invoices, bills, categories } from "@/db/schema";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";
import { subYears, startOfYear, endOfYear, subMonths, startOfMonth, endOfMonth, format } from "date-fns";

// GET /api/reports/comparative - Get comparative reports (YoY, MoM)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const reportType = searchParams.get("type") || "profit-loss"; // profit-loss, income, expense, invoices, bills
    const currentPeriodStart = searchParams.get("currentStart");
    const currentPeriodEnd = searchParams.get("currentEnd");
    const comparisonType = searchParams.get("comparison") || "year-over-year"; // year-over-year, month-over-month

    if (!companyId) {
      return NextResponse.json({ error: "companyId required" }, { status: 400 });
    }

    // Parse or default to current year
    const now = new Date();
    const currentStart = currentPeriodStart ? new Date(currentPeriodStart) : startOfYear(now);
    const currentEnd = currentPeriodEnd ? new Date(currentPeriodEnd) : endOfYear(now);

    // Calculate comparison period
    let comparisonStart: Date;
    let comparisonEnd: Date;

    if (comparisonType === "year-over-year") {
      comparisonStart = subYears(currentStart, 1);
      comparisonEnd = subYears(currentEnd, 1);
    } else {
      comparisonStart = subMonths(currentStart, 1);
      comparisonEnd = subMonths(currentEnd, 1);
    }

    // Build report based on type
    let currentData: any;
    let comparisonData: any;

    switch (reportType) {
      case "profit-loss":
        currentData = await getProfitLossData(companyId, currentStart, currentEnd);
        comparisonData = await getProfitLossData(companyId, comparisonStart, comparisonEnd);
        break;
      case "income":
        currentData = await getIncomeData(companyId, currentStart, currentEnd);
        comparisonData = await getIncomeData(companyId, comparisonStart, comparisonEnd);
        break;
      case "expense":
        currentData = await getExpenseData(companyId, currentStart, currentEnd);
        comparisonData = await getExpenseData(companyId, comparisonStart, comparisonEnd);
        break;
      case "invoices":
        currentData = await getInvoiceData(companyId, currentStart, currentEnd);
        comparisonData = await getInvoiceData(companyId, comparisonStart, comparisonEnd);
        break;
      case "bills":
        currentData = await getBillData(companyId, currentStart, currentEnd);
        comparisonData = await getBillData(companyId, comparisonStart, comparisonEnd);
        break;
      default:
        return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
    }

    // Calculate variances and percentages
    const comparison = calculateComparison(currentData, comparisonData, comparisonType);

    return NextResponse.json({
      report: {
        type: reportType,
        comparisonType,
        currentPeriod: {
          start: currentStart.toISOString(),
          end: currentEnd.toISOString(),
          label: format(currentStart, "MMM d, yyyy") + " - " + format(currentEnd, "MMM d, yyyy"),
        },
        comparisonPeriod: {
          start: comparisonStart.toISOString(),
          end: comparisonEnd.toISOString(),
          label: format(comparisonStart, "MMM d, yyyy") + " - " + format(comparisonEnd, "MMM d, yyyy"),
        },
        currentData,
        comparisonData,
        comparison,
      },
    });
  } catch (error) {
    console.error("Error fetching comparative report:", error);
    return NextResponse.json(
      { error: "Failed to fetch comparative report" },
      { status: 500 }
    );
  }
}

async function getProfitLossData(companyId: string, startDate: Date, endDate: Date) {
  const income = await db.select({
    total: sql<number>`SUM(${transactions.amount})`,
  })
  .from(transactions)
  .where(and(
    eq(transactions.companyId, companyId),
    eq(transactions.type, "income"),
    gte(transactions.date, startDate),
    lte(transactions.date, endDate)
  ));

  const expenses = await db.select({
    total: sql<number>`SUM(${transactions.amount})`,
  })
  .from(transactions)
  .where(and(
    eq(transactions.companyId, companyId),
    eq(transactions.type, "expense"),
    gte(transactions.date, startDate),
    lte(transactions.date, endDate)
  ));

  const incomeTotal = income[0]?.total || 0;
  const expenseTotal = expenses[0]?.total || 0;

  return {
    income: incomeTotal,
    expenses: expenseTotal,
    netIncome: incomeTotal - expenseTotal,
    margin: incomeTotal > 0 ? ((incomeTotal - expenseTotal) / incomeTotal) * 100 : 0,
  };
}

async function getIncomeData(companyId: string, startDate: Date, endDate: Date) {
  const byCategory = await db.select({
    category: categories.name,
    total: sql<number>`SUM(${transactions.amount})`,
  })
  .from(transactions)
  .leftJoin(categories, eq(transactions.categoryId, categories.id))
  .where(and(
    eq(transactions.companyId, companyId),
    eq(transactions.type, "income"),
    gte(transactions.date, startDate),
    lte(transactions.date, endDate)
  ))
  .groupBy(categories.id)
  .orderBy(desc(sql`SUM(${transactions.amount})`));

  const total = byCategory.reduce((sum, cat) => sum + (cat.total || 0), 0);

  return {
    total,
    byCategory: byCategory.map(c => ({
      category: c.category || "Uncategorized",
      amount: c.total || 0,
      percentage: total > 0 ? ((c.total || 0) / total) * 100 : 0,
    })),
  };
}

async function getExpenseData(companyId: string, startDate: Date, endDate: Date) {
  const byCategory = await db.select({
    category: categories.name,
    total: sql<number>`SUM(${transactions.amount})`,
  })
  .from(transactions)
  .leftJoin(categories, eq(transactions.categoryId, categories.id))
  .where(and(
    eq(transactions.companyId, companyId),
    eq(transactions.type, "expense"),
    gte(transactions.date, startDate),
    lte(transactions.date, endDate)
  ))
  .groupBy(categories.id)
  .orderBy(desc(sql`SUM(${transactions.amount})`));

  const total = byCategory.reduce((sum, cat) => sum + (cat.total || 0), 0);

  return {
    total,
    byCategory: byCategory.map(c => ({
      category: c.category || "Uncategorized",
      amount: c.total || 0,
      percentage: total > 0 ? ((c.total || 0) / total) * 100 : 0,
    })),
  };
}

async function getInvoiceData(companyId: string, startDate: Date, endDate: Date) {
  const totals = await db.select({
    total: sql<number>`SUM(${invoices.totalAmount})`,
    paid: sql<number>`SUM(${invoices.amountPaid})`,
    count: sql<number>`COUNT(*)`,
    avgDaysToPay: sql<number>`AVG(julianday(${invoices.paidAt}) - julianday(${invoices.issueDate}))`,
  })
  .from(invoices)
  .where(and(
    eq(invoices.companyId, companyId),
    gte(invoices.issueDate, startDate),
    lte(invoices.issueDate, endDate)
  ));

  const statusBreakdown = await db.select({
    status: invoices.status,
    count: sql<number>`COUNT(*)`,
    total: sql<number>`SUM(${invoices.totalAmount})`,
  })
  .from(invoices)
  .where(and(
    eq(invoices.companyId, companyId),
    gte(invoices.issueDate, startDate),
    lte(invoices.issueDate, endDate)
  ))
  .groupBy(invoices.status);

  return {
    total: totals[0]?.total || 0,
    collected: totals[0]?.paid || 0,
    outstanding: (totals[0]?.total || 0) - (totals[0]?.paid || 0),
    count: totals[0]?.count || 0,
    avgDaysToPay: totals[0]?.avgDaysToPay || 0,
    byStatus: statusBreakdown,
  };
}

async function getBillData(companyId: string, startDate: Date, endDate: Date) {
  const totals = await db.select({
    total: sql<number>`SUM(${bills.totalAmount})`,
    paid: sql<number>`SUM(${bills.amountPaid})`,
    count: sql<number>`COUNT(*)`,
  })
  .from(bills)
  .where(and(
    eq(bills.companyId, companyId),
    gte(bills.issueDate, startDate),
    lte(bills.issueDate, endDate)
  ));

  const statusBreakdown = await db.select({
    status: bills.status,
    count: sql<number>`COUNT(*)`,
    total: sql<number>`SUM(${bills.totalAmount})`,
  })
  .from(bills)
  .where(and(
    eq(bills.companyId, companyId),
    gte(bills.issueDate, startDate),
    lte(bills.issueDate, endDate)
  ))
  .groupBy(bills.status);

  return {
    total: totals[0]?.total || 0,
    paid: totals[0]?.paid || 0,
    outstanding: (totals[0]?.total || 0) - (totals[0]?.paid || 0),
    count: totals[0]?.count || 0,
    byStatus: statusBreakdown,
  };
}

function calculateComparison(current: any, comparison: any, comparisonType: string) {
  const isYearOverYear = comparisonType === "year-over-year";
  const periodLabel = isYearOverYear ? "Last Year" : "Last Month";

  // Helper to calculate variance
  const variance = (curr: number, comp: number) => curr - comp;
  const percentChange = (curr: number, comp: number) => 
    comp !== 0 ? ((curr - comp) / Math.abs(comp)) * 100 : (curr > 0 ? 100 : 0);

  // Handle nested comparisons for profit/loss
  if (current.netIncome !== undefined) {
    return {
      income: {
        current: current.income,
        previous: comparison.income,
        variance: variance(current.income, comparison.income),
        percentChange: percentChange(current.income, comparison.income),
        trend: current.income >= comparison.income ? "up" : "down",
      },
      expenses: {
        current: current.expenses,
        previous: comparison.expenses,
        variance: variance(current.expenses, comparison.expenses),
        percentChange: percentChange(current.expenses, comparison.expenses),
        trend: current.expenses >= comparison.expenses ? "up" : "down",
      },
      netIncome: {
        current: current.netIncome,
        previous: comparison.netIncome,
        variance: variance(current.netIncome, comparison.netIncome),
        percentChange: percentChange(current.netIncome, comparison.netIncome),
        trend: current.netIncome >= comparison.netIncome ? "up" : "down",
      },
      margin: {
        current: current.margin,
        previous: comparison.margin,
        variance: variance(current.margin, comparison.margin),
        percentChange: percentChange(current.margin, comparison.margin),
      },
      summary: {
        profitable: current.netIncome > 0,
        improved: current.netIncome >= comparison.netIncome,
        label: periodLabel,
      },
    };
  }

  // For other report types, compare totals
  return {
    total: {
      current: current.total,
      previous: comparison.total,
      variance: variance(current.total, comparison.total),
      percentChange: percentChange(current.total, comparison.total),
      trend: current.total >= comparison.total ? "up" : "down",
    },
    summary: {
      label: periodLabel,
    },
  };
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { budgets, budgetLineItems } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

// GET /api/budgets - List budgets
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    let conditions: any[] = [];
    if (companyId) conditions.push(eq(budgets.companyId, companyId));
    if (status) conditions.push(eq(budgets.status, status as "draft" | "active" | "closed"));

    const result = await db.select()
      .from(budgets)
      .where(conditions.length > 0 ? conditions.length === 1 ? conditions[0] : undefined : undefined)
      .orderBy(desc(budgets.createdAt))
      .limit(limit)
      .offset(offset);

    // Fetch line items for each budget
    const budgetsWithItems = await Promise.all(
      result.map(async (budget) => {
        const items = await db.select()
          .from(budgetLineItems)
          .where(eq(budgetLineItems.budgetId, budget.id));
        return { ...budget, lineItems: items };
      })
    );

    return NextResponse.json({ data: budgetsWithItems });
  } catch (error) {
    console.error("Error fetching budgets:", error);
    return NextResponse.json(
      { error: "Failed to fetch budgets" },
      { status: 500 }
    );
  }
}

// POST /api/budgets - Create budget
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const budgetId = body.id || `budget_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    
    const result = await db.insert(budgets).values({
      id: budgetId,
      companyId: body.companyId || "default_company",
      name: body.name,
      description: body.description,
      period: body.period || "monthly",
      startDate: body.startDate ? new Date(body.startDate) : new Date(),
      endDate: body.endDate ? new Date(body.endDate) : new Date(),
      totalAllocated: body.totalAllocated || 0,
      totalSpent: body.totalSpent || 0,
      status: body.status || "draft",
    }).returning();

    // If line items provided, insert them
    if (body.lineItems && Array.isArray(body.lineItems)) {
      const lineItems = body.lineItems.map((item: any) => ({
        id: `bl_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        budgetId,
        categoryId: item.categoryId,
        allocated: item.allocated || 0,
        spent: item.spent || 0,
        alertThreshold: item.alertThreshold || 80,
      }));
      await db.insert(budgetLineItems).values(lineItems);
    }

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Error creating budget:", error);
    return NextResponse.json(
      { error: "Failed to create budget" },
      { status: 500 }
    );
  }
}

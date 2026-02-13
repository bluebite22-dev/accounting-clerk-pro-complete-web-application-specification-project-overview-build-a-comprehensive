import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { transactions, categories, accounts, customers, vendors } from "@/db/schema";
import { eq, and, desc, gte, lte, sql, isNull } from "drizzle-orm";

// GET /api/transactions - List transactions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const type = searchParams.get("type");
    const categoryId = searchParams.get("categoryId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const isReconciled = searchParams.get("isReconciled");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    let conditions: any[] = [];
    if (companyId) conditions.push(eq(transactions.companyId, companyId));
    if (type) conditions.push(eq(transactions.type, type as "income" | "expense" | "transfer"));
    if (categoryId) conditions.push(eq(transactions.categoryId, categoryId));
    if (isReconciled !== null && isReconciled !== "") {
      conditions.push(eq(transactions.isReconciled, isReconciled === "true"));
    }
    if (startDate) conditions.push(gte(transactions.date, new Date(startDate)));
    if (endDate) conditions.push(lte(transactions.date, new Date(endDate)));

    const result = await db.select({
      id: transactions.id,
      type: transactions.type,
      amount: transactions.amount,
      date: transactions.date,
      description: transactions.description,
      reference: transactions.reference,
      paymentMethod: transactions.paymentMethod,
      isReconciled: transactions.isReconciled,
      category: categories.name,
      account: accounts.name,
      customer: customers.name,
      vendor: vendors.name,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .leftJoin(accounts, eq(transactions.accountId, accounts.id))
    .leftJoin(customers, eq(transactions.customerId, customers.id))
    .leftJoin(vendors, eq(transactions.vendorId, vendors.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(transactions.date))
    .limit(limit)
    .offset(offset);

    // Get totals
    const totals = await db.select({
      income: sql<number>`SUM(CASE WHEN ${transactions.type} = 'income' THEN ${transactions.amount} ELSE 0 END)`,
      expense: sql<number>`SUM(CASE WHEN ${transactions.type} = 'expense' THEN ${transactions.amount} ELSE 0 END)`,
    })
    .from(transactions)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

    return NextResponse.json({
      data: result,
      totals: {
        income: totals[0]?.income || 0,
        expense: totals[0]?.expense || 0,
        net: (totals[0]?.income || 0) - (totals[0]?.expense || 0),
      },
      meta: { limit, offset }
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

// POST /api/transactions - Create transaction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const result = await db.insert(transactions).values({
      id: body.id,
      companyId: body.companyId,
      type: body.type,
      amount: body.amount,
      date: new Date(body.date),
      categoryId: body.categoryId || null,
      accountId: body.accountId || null,
      customerId: body.customerId || null,
      vendorId: body.vendorId || null,
      invoiceId: body.invoiceId || null,
      billId: body.billId || null,
      paymentMethod: body.paymentMethod,
      reference: body.reference,
      description: body.description,
      notes: body.notes,
      isTaxable: body.isTaxable ?? true,
      createdBy: body.createdBy,
    }).returning();

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { invoices, invoiceLineItems, customers } from "@/db/schema";
import { eq, and, desc, gte, lte, sql, isNull } from "drizzle-orm";

// GET /api/invoices - List invoices
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const customerId = searchParams.get("customerId");
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    let conditions: any[] = [];
    if (companyId) conditions.push(eq(invoices.companyId, companyId));
    if (customerId) conditions.push(eq(invoices.customerId, customerId));
    if (status) conditions.push(eq(invoices.status, status as any));
    if (startDate) conditions.push(gte(invoices.issueDate, new Date(startDate)));
    if (endDate) conditions.push(lte(invoices.issueDate, new Date(endDate)));

    const result = await db.select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      customerId: invoices.customerId,
      customerName: customers.name,
      status: invoices.status,
      issueDate: invoices.issueDate,
      dueDate: invoices.dueDate,
      totalAmount: invoices.totalAmount,
      amountPaid: invoices.amountPaid,
      createdAt: invoices.createdAt,
    })
    .from(invoices)
    .leftJoin(customers, eq(invoices.customerId, customers.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(invoices.createdAt))
    .limit(limit)
    .offset(offset);

    // Get summary
    const summary = await db.select({
      total: sql<number>`SUM(${invoices.totalAmount})`,
      paid: sql<number>`SUM(${invoices.amountPaid})`,
      count: sql<number>`COUNT(*)`,
    })
    .from(invoices)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

    return NextResponse.json({
      data: result,
      summary: {
        total: summary[0]?.total || 0,
        paid: summary[0]?.paid || 0,
        outstanding: (summary[0]?.total || 0) - (summary[0]?.paid || 0),
        count: summary[0]?.count || 0,
      },
      meta: { limit, offset }
    });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}

// POST /api/invoices - Create invoice
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const invoiceResult = await db.insert(invoices).values({
      id: body.id,
      companyId: body.companyId,
      invoiceNumber: body.invoiceNumber,
      customerId: body.customerId,
      status: body.status || "draft",
      issueDate: new Date(body.issueDate),
      dueDate: new Date(body.dueDate),
      subtotal: body.subtotal,
      taxAmount: body.taxAmount || 0,
      discountAmount: body.discountAmount || 0,
      totalAmount: body.totalAmount,
      notes: body.notes,
      terms: body.terms,
      createdBy: body.createdBy,
    }).returning();

    const invoice = invoiceResult[0];

    // Insert line items if provided
    if (body.lineItems && body.lineItems.length > 0) {
      await db.insert(invoiceLineItems).values(
        body.lineItems.map((item: any) => ({
          id: item.id,
          invoiceId: invoice.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate || 0,
          total: item.total,
        }))
      );
    }

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 500 }
    );
  }
}

// PATCH /api/invoices - Update invoice (e.g., mark as paid)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, amountPaid } = body;

    const updateData: any = { updatedAt: new Date() };
    if (status) updateData.status = status;
    if (amountPaid !== undefined) {
      updateData.amountPaid = amountPaid;
      if (status === "paid") updateData.paidAt = new Date();
    }

    const result = await db.update(invoices)
      .set(updateData)
      .where(eq(invoices.id, id))
      .returning();

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error updating invoice:", error);
    return NextResponse.json(
      { error: "Failed to update invoice" },
      { status: 500 }
    );
  }
}

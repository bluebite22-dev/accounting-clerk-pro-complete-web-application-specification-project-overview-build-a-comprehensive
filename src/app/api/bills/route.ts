import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bills, billLineItems, vendors } from "@/db/schema";
import { eq, and, desc, gte, lte, sql, isNull } from "drizzle-orm";

// GET /api/bills - List bills
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const vendorId = searchParams.get("vendorId");
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    let conditions: any[] = [];
    if (companyId) conditions.push(eq(bills.companyId, companyId));
    if (vendorId) conditions.push(eq(bills.vendorId, vendorId));
    if (status) conditions.push(eq(bills.status, status as any));
    if (startDate) conditions.push(gte(bills.issueDate, new Date(startDate)));
    if (endDate) conditions.push(lte(bills.issueDate, new Date(endDate)));

    const result = await db.select({
      id: bills.id,
      billNumber: bills.billNumber,
      vendorId: bills.vendorId,
      vendorName: vendors.name,
      status: bills.status,
      issueDate: bills.issueDate,
      dueDate: bills.dueDate,
      totalAmount: bills.totalAmount,
      amountPaid: bills.amountPaid,
      createdAt: bills.createdAt,
    })
    .from(bills)
    .leftJoin(vendors, eq(bills.vendorId, vendors.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(bills.createdAt))
    .limit(limit)
    .offset(offset);

    // Get summary
    const summary = await db.select({
      total: sql<number>`SUM(${bills.totalAmount})`,
      paid: sql<number>`SUM(${bills.amountPaid})`,
      count: sql<number>`COUNT(*)`,
    })
    .from(bills)
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
    console.error("Error fetching bills:", error);
    return NextResponse.json(
      { error: "Failed to fetch bills" },
      { status: 500 }
    );
  }
}

// POST /api/bills - Create bill
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const billResult = await db.insert(bills).values({
      id: body.id,
      companyId: body.companyId,
      billNumber: body.billNumber,
      vendorId: body.vendorId,
      status: body.status || "draft",
      issueDate: new Date(body.issueDate),
      dueDate: new Date(body.dueDate),
      subtotal: body.subtotal,
      taxAmount: body.taxAmount || 0,
      totalAmount: body.totalAmount,
      notes: body.notes,
      createdBy: body.createdBy,
    }).returning();

    const bill = billResult[0];

    // Insert line items if provided
    if (body.lineItems && body.lineItems.length > 0) {
      await db.insert(billLineItems).values(
        body.lineItems.map((item: any) => ({
          id: item.id,
          billId: bill.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate || 0,
          total: item.total,
          categoryId: item.categoryId || null,
        }))
      );
    }

    return NextResponse.json(bill, { status: 201 });
  } catch (error) {
    console.error("Error creating bill:", error);
    return NextResponse.json(
      { error: "Failed to create bill" },
      { status: 500 }
    );
  }
}

// PATCH /api/bills - Update bill (approve, mark as paid)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, amountPaid, approvedBy, approvalNotes } = body;

    const updateData: any = { updatedAt: new Date() };
    if (status) updateData.status = status;
    if (amountPaid !== undefined) {
      updateData.amountPaid = amountPaid;
      if (status === "paid") updateData.paidAt = new Date();
    }
    if (approvedBy) {
      updateData.approvedBy = approvedBy;
      updateData.approvedAt = new Date();
    }
    if (approvalNotes) updateData.approvalNotes = approvalNotes;

    const result = await db.update(bills)
      .set(updateData)
      .where(eq(bills.id, id))
      .returning();

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error updating bill:", error);
    return NextResponse.json(
      { error: "Failed to update bill" },
      { status: 500 }
    );
  }
}

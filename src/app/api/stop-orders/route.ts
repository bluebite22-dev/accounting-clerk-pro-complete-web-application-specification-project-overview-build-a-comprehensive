import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { stopOrders, auditLog } from "@/db/schema";
import { eq, and, desc, gte, lte, sql, isNull } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

// GET /api/stop-orders - List stop orders
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    let conditions: any[] = [];
    if (companyId) conditions.push(eq(stopOrders.companyId, companyId));
    if (type) conditions.push(eq(stopOrders.type, type as any));
    if (startDate) conditions.push(gte(stopOrders.createdAt, new Date(startDate)));
    if (endDate) conditions.push(lte(stopOrders.createdAt, new Date(endDate)));

    const result = await db.select({
      id: stopOrders.id,
      type: stopOrders.type,
      fullName: stopOrders.fullName,
      manNo: stopOrders.manNo,
      rank: stopOrders.rank,
      deductionAmount: stopOrders.deductionAmount,
      durationMonths: stopOrders.durationMonths,
      startMonth: stopOrders.startMonth,
      status: sql<string>`CASE 
        WHEN ${stopOrders.isActive} = 1 THEN 'active' 
        ELSE 'inactive' 
      END`,
      isActive: stopOrders.isActive,
      createdAt: stopOrders.createdAt,
      approvedBy: stopOrders.authorizedBy,
      deliveries: sql<number>`COALESCE(CAST(${stopOrders.deductionAmount} / 150 AS INTEGER), 0)`,
    })
    .from(stopOrders)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(stopOrders.createdAt))
    .limit(limit)
    .offset(offset);

    // Get counts
    const counts = await db.select({
      total: sql<number>`COUNT(*)`,
      active: sql<number>`SUM(CASE WHEN ${stopOrders.isActive} = 1 THEN 1 ELSE 0 END)`,
    })
    .from(stopOrders)
    .where(eq(stopOrders.companyId, companyId || ""));

    return NextResponse.json({
      data: result,
      counts: {
        total: counts[0]?.total || 0,
        active: counts[0]?.active || 0,
      },
      meta: { limit, offset }
    });
  } catch (error) {
    console.error("Error fetching stop orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch stop orders" },
      { status: 500 }
    );
  }
}

// POST /api/stop-orders - Create stop order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const result = await db.insert(stopOrders).values({
      id: body.id || uuidv4(),
      companyId: body.companyId,
      formDate: body.formDate ? new Date(body.formDate) : null,
      type: body.type || "payroll",
      fullName: body.fullName,
      sex: body.sex,
      nrcNo: body.nrcNo,
      manNo: body.manNo,
      rank: body.rank,
      barrack: body.barrack,
      district: body.district,
      province: body.province,
      mobile: body.mobile,
      email: body.email,
      deductionAmount: body.deductionAmount,
      durationMonths: body.durationMonths,
      startMonth: body.startMonth,
      amountInWords: body.amountInWords,
      authorizedBy: body.authorizedBy,
      accountNumber: body.accountNumber,
      companyName: body.companyName,
      createdBy: body.createdBy,
    }).returning();

    // Log audit entry
    if (body.companyId && body.createdBy) {
      await db.insert(auditLog).values({
        id: uuidv4(),
        companyId: body.companyId,
        userId: body.createdBy,
        action: "CREATE",
        entityType: "stop_order",
        entityId: result[0].id,
        newValue: JSON.stringify(body),
      });
    }

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Error creating stop order:", error);
    return NextResponse.json(
      { error: "Failed to create stop order" },
      { status: 500 }
    );
  }
}

// PATCH /api/stop-orders - Update stop order (approve/reject)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action, approvedBy, notes, updatedBy } = body;

    if (action === "approve" || action === "reject") {
      const updateData: any = {
        isActive: action === "approve",
        updatedAt: new Date(),
      };

      if (action === "approve") {
        updateData.authorizedBy = approvedBy;
        updateData.notifyOnTrigger = body.notifyOnTrigger ?? true;
      }

      const result = await db.update(stopOrders)
        .set(updateData)
        .where(eq(stopOrders.id, id))
        .returning();

      if (body.companyId && updatedBy) {
        await db.insert(auditLog).values({
          id: uuidv4(),
          companyId: body.companyId,
          userId: updatedBy,
          action: action === "approve" ? "APPROVE" : "REJECT",
          entityType: "stop_order",
          entityId: id,
          newValue: JSON.stringify({ notes, approvedBy }),
        });
      }

      return NextResponse.json({
        ...result[0],
        action: action === "approve" ? "approved" : "rejected"
      });
    }

    const updateData = { ...body, updatedAt: new Date() };
    delete updateData.id;
    delete updateData.action;

    const result = await db.update(stopOrders)
      .set(updateData)
      .where(eq(stopOrders.id, id))
      .returning();

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error updating stop order:", error);
    return NextResponse.json(
      { error: "Failed to update stop order" },
      { status: 500 }
    );
  }
}

// DELETE /api/stop-orders - Delete stop order
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const updatedBy = searchParams.get("updatedBy");

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    const result = await db.delete(stopOrders)
      .where(eq(stopOrders.id, id))
      .returning();

    return NextResponse.json({ deleted: result[0]?.id });
  } catch (error) {
    console.error("Error deleting stop order:", error);
    return NextResponse.json(
      { error: "Failed to delete stop order" },
      { status: 500 }
    );
  }
}

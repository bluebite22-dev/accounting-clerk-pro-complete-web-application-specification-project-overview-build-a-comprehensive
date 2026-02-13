import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

// GET /api/customers - List customers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const isActive = searchParams.get("isActive");
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    let conditions: any[] = [];
    if (companyId) conditions.push(eq(customers.companyId, companyId));
    if (isActive !== null && isActive !== "") {
      conditions.push(eq(customers.isActive, isActive === "true"));
    }

    const result = await db.select()
      .from(customers)
      .where(conditions.length > 0 ? conditions.length === 1 ? conditions[0] : undefined : undefined)
      .orderBy(desc(customers.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}

// POST /api/customers - Create customer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const result = await db.insert(customers).values({
      id: body.id || `cust_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      companyId: body.companyId || "default_company",
      name: body.name,
      email: body.email,
      phone: body.phone,
      address: body.address,
      creditLimit: body.creditLimit || 0,
      paymentTerms: body.paymentTerms || 30,
      notes: body.notes,
      isActive: body.isActive ?? true,
    }).returning();

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Error creating customer:", error);
    return NextResponse.json(
      { error: "Failed to create customer" },
      { status: 500 }
    );
  }
}

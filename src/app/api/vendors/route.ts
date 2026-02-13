import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { vendors } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

// GET /api/vendors - List vendors
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const isActive = searchParams.get("isActive");
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    let conditions: any[] = [];
    if (companyId) conditions.push(eq(vendors.companyId, companyId));
    if (isActive !== null && isActive !== "") {
      conditions.push(eq(vendors.isActive, isActive === "true"));
    }

    const result = await db.select()
      .from(vendors)
      .where(conditions.length > 0 ? conditions.length === 1 ? conditions[0] : undefined : undefined)
      .orderBy(desc(vendors.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("Error fetching vendors:", error);
    return NextResponse.json(
      { error: "Failed to fetch vendors" },
      { status: 500 }
    );
  }
}

// POST /api/vendors - Create vendor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const result = await db.insert(vendors).values({
      id: body.id || `vend_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      companyId: body.companyId || "default_company",
      name: body.name,
      email: body.email,
      phone: body.phone,
      address: body.address,
      paymentDetails: body.paymentDetails,
      taxId: body.taxId,
      is1099Eligible: body.is1099Eligible ?? false,
      paymentTerms: body.paymentTerms || 30,
      discountTerms: body.discountTerms,
      notes: body.notes,
      isActive: body.isActive ?? true,
    }).returning();

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Error creating vendor:", error);
    return NextResponse.json(
      { error: "Failed to create vendor" },
      { status: 500 }
    );
  }
}

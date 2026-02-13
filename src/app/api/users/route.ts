import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, companies } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import crypto from "crypto";

// GET /api/users - List users
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const role = searchParams.get("role");
    const isActive = searchParams.get("isActive");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    let conditions: any[] = [];
    if (companyId) conditions.push(eq(users.companyId, companyId));
    if (role) conditions.push(eq(users.role, role as any));
    if (isActive !== null) conditions.push(eq(users.isActive, isActive === "true"));

    const result = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      isActive: users.isActive,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
      company: companies.name,
    })
    .from(users)
    .leftJoin(companies, eq(users.companyId, companies.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset);

    return NextResponse.json({ 
      data: result,
      meta: { limit, offset }
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// POST /api/users - Create user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const passwordHash = crypto
      .createHash("sha256")
      .update(body.password)
      .digest("hex");

    const result = await db.insert(users).values({
      id: body.id,
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      role: body.role || "clerk",
      companyId: body.companyId,
      passwordHash,
      avatar: body.avatar,
    }).returning();

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}

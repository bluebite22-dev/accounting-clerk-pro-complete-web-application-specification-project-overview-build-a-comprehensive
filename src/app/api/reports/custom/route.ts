import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customReports, companies, users } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

// Column types for drag-and-drop builder
type ColumnType = 
  | "text"
  | "number"
  | "currency"
  | "date"
  | "select"
  | "calculate"
  | "group";

interface ReportColumn {
  id: string;
  field: string;
  label: string;
  type: ColumnType;
  width: number;
  visible: boolean;
  sortable: boolean;
  calculations?: string[];
}

interface ReportFilter {
  id: string;
  field: string;
  operator: "equals" | "contains" | "gt" | "lt" | "between" | "in";
  value: any;
}

interface ReportLayout {
  columns: ReportColumn[];
  filters: ReportFilter[];
  groupBy?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  calculations: {
    field: string;
    type: "sum" | "avg" | "count" | "min" | "max";
    label: string;
  }[];
}

// GET /api/reports/custom - List custom reports
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const includePublic = searchParams.get("public") === "true";

    let conditions = [eq(customReports.companyId, companyId || "")];
    if (includePublic) {
      conditions.push(eq(customReports.isPublic, true));
    }

    const result = await db.select({
      id: customReports.id,
      name: customReports.name,
      description: customReports.description,
      columns: customReports.columns,
      filters: customReports.filters,
      groupBy: customReports.groupBy,
      sortBy: customReports.sortBy,
      sortDir: customReports.sortDir,
      isPublic: customReports.isPublic,
      createdBy: users.firstName,
      createdAt: customReports.createdAt,
      updatedAt: customReports.updatedAt,
    })
    .from(customReports)
    .leftJoin(users, eq(customReports.createdBy, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(customReports.updatedAt));

    // Parse JSON columns and filters
    const parsed = result.map(r => ({
      ...r,
      columns: typeof r.columns === "string" ? JSON.parse(r.columns) : r.columns,
      filters: typeof r.filters === "string" ? JSON.parse(r.filters) : r.filters,
    }));

    return NextResponse.json({ customReports: parsed });
  } catch (error) {
    console.error("Error fetching custom reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch custom reports" },
      { status: 500 }
    );
  }
}

// POST /api/reports/custom - Create custom report
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, name, description, layout, isPublic, createdBy } = body;

    const result = await db.insert(customReports).values({
      id: uuidv4(),
      companyId,
      name,
      description,
      layout: JSON.stringify(layout),
      columns: JSON.stringify(layout.columns),
      filters: JSON.stringify(layout.filters || []),
      sortBy: layout.sortBy,
      sortDir: layout.sortDir,
      groupBy: layout.groupBy,
      calculations: JSON.stringify(layout.calculations || []),
      isPublic: isPublic || false,
      createdBy,
    }).returning();

    return NextResponse.json({
      customReport: {
        ...result[0],
        layout: body.layout,
      }
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating custom report:", error);
    return NextResponse.json(
      { error: "Failed to create custom report" },
      { status: 500 }
    );
  }
}

// PUT /api/reports/custom - Update custom report
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, companyId, name, description, layout, isPublic } = body;

    const updateData: any = { updatedAt: new Date() };
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (layout) {
      updateData.layout = JSON.stringify(layout);
      updateData.columns = JSON.stringify(layout.columns);
      updateData.filters = JSON.stringify(layout.filters || []);
      updateData.sortBy = layout.sortBy;
      updateData.sortDir = layout.sortDir;
      updateData.groupBy = layout.groupBy;
      updateData.calculations = JSON.stringify(layout.calculations || []);
    }
    if (isPublic !== undefined) updateData.isPublic = isPublic;

    const result = await db.update(customReports)
      .set(updateData)
      .where(and(eq(customReports.id, id), eq(customReports.companyId, companyId)))
      .returning();

    return NextResponse.json({ customReport: result[0] });
  } catch (error) {
    console.error("Error updating custom report:", error);
    return NextResponse.json(
      { error: "Failed to update custom report" },
      { status: 500 }
    );
  }
}

// DELETE /api/reports/custom - Delete custom report
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const companyId = searchParams.get("companyId");

    if (!id || !companyId) {
      return NextResponse.json({ error: "ID and companyId required" }, { status: 400 });
    }

    await db.delete(customReports)
      .where(and(eq(customReports.id, id), eq(customReports.companyId, companyId)));

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Error deleting custom report:", error);
    return NextResponse.json(
      { error: "Failed to delete custom report" },
      { status: 500 }
    );
  }
}

// POST /api/reports/custom/generate - Generate report data from layout
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, companyId, dateRange } = body;

    // Get the custom report
    const [report] = await db.select()
      .from(customReports)
      .where(and(eq(customReports.id, id), eq(customReports.companyId, companyId)));

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const layout = typeof report.layout === "string" 
      ? JSON.parse(report.layout) 
      : report.layout;

    // In production, this would build and execute the query based on layout
    // For now, return the layout structure for the UI to render

    return NextResponse.json({
      reportId: id,
      layout,
      generatedAt: new Date().toISOString(),
      data: [], // Would be populated from database query
    });
  } catch (error) {
    console.error("Error generating custom report:", error);
    return NextResponse.json(
      { error: "Failed to generate custom report" },
      { status: 500 }
    );
  }
}

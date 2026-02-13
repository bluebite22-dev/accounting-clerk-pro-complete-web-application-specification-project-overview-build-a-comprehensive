import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { scheduledReports, reportHistory, companies, users } from "@/db/schema";
import { eq, and, desc, gte } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { addDays, addWeeks, addMonths, parseISO, isBefore } from "date-fns";

// Schedule parsing helper
function parseSchedule(schedule: string, fromDate: Date = new Date()): Date {
  const [frequency, time] = schedule.split(" ");
  const [hour, minute] = (time || "09:00").split(":").map(Number);
  
  let nextDate = new Date(fromDate);
  nextDate.setHours(hour, minute, 0, 0);
  
  switch (frequency) {
    case "daily":
      return addDays(nextDate, 1);
    case "weekly":
      return addWeeks(nextDate, 1);
    case "monthly":
      return addMonths(nextDate, 1);
    case "quarterly":
      return addMonths(nextDate, 3);
    default:
      // Try to parse as cron-like expression
      if (schedule.includes(" ")) {
        // Simple cron: "0 9 * * 1" = every Monday at 9am
        return addWeeks(nextDate, 1);
      }
      return addDays(nextDate, 1);
  }
}

// GET /api/reports/scheduled - List scheduled reports
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const isActive = searchParams.get("isActive");

    let conditions = [];
    if (companyId) conditions.push(eq(scheduledReports.companyId, companyId));
    if (isActive !== null) conditions.push(eq(scheduledReports.isActive, isActive === "true"));

    const result = await db.select({
      id: scheduledReports.id,
      name: scheduledReports.name,
      description: scheduledReports.description,
      reportType: scheduledReports.reportType,
      schedule: scheduledReports.schedule,
      recipients: scheduledReports.recipients,
      format: scheduledReports.format,
      isActive: scheduledReports.isActive,
      nextRunAt: scheduledReports.nextRunAt,
      lastRunAt: scheduledReports.lastRunAt,
      createdBy: users.firstName,
      createdAt: scheduledReports.createdAt,
    })
    .from(scheduledReports)
    .leftJoin(users, eq(scheduledReports.createdBy, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(scheduledReports.createdAt));

    return NextResponse.json({ scheduledReports: result });
  } catch (error) {
    console.error("Error fetching scheduled reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch scheduled reports" },
      { status: 500 }
    );
  }
}

// POST /api/reports/scheduled - Create scheduled report
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, name, description, reportType, schedule, recipients, format, filters, createdBy } = body;

    // Parse recipients JSON
    const recipientsArray = typeof recipients === "string" ? JSON.parse(recipients) : recipients;
    
    const nextRunAt = parseSchedule(schedule);

    const result = await db.insert(scheduledReports).values({
      id: uuidv4(),
      companyId,
      name,
      description,
      reportType,
      schedule,
      recipients: JSON.stringify(recipientsArray),
      format: format || "pdf",
      filters: filters ? JSON.stringify(filters) : null,
      nextRunAt,
      isActive: true,
      createdBy,
    }).returning();

    return NextResponse.json({
      scheduledReport: result[0],
      nextRunAt: nextRunAt.toISOString(),
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating scheduled report:", error);
    return NextResponse.json(
      { error: "Failed to create scheduled report" },
      { status: 500 }
    );
  }
}

// PUT /api/reports/scheduled - Update scheduled report
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, companyId, name, description, reportType, schedule, recipients, format, filters, isActive } = body;

    const updateData: any = { updatedAt: new Date() };
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (reportType) updateData.reportType = reportType;
    if (schedule) {
      updateData.schedule = schedule;
      updateData.nextRunAt = parseSchedule(schedule);
    }
    if (recipients) updateData.recipients = JSON.stringify(recipients);
    if (format) updateData.format = format;
    if (filters) updateData.filters = JSON.stringify(filters);
    if (isActive !== undefined) updateData.isActive = isActive;

    const result = await db.update(scheduledReports)
      .set(updateData)
      .where(and(eq(scheduledReports.id, id), eq(scheduledReports.companyId, companyId)))
      .returning();

    return NextResponse.json({ scheduledReport: result[0] });
  } catch (error) {
    console.error("Error updating scheduled report:", error);
    return NextResponse.json(
      { error: "Failed to update scheduled report" },
      { status: 500 }
    );
  }
}

// DELETE /api/reports/scheduled - Delete scheduled report
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const companyId = searchParams.get("companyId");

    if (!id || !companyId) {
      return NextResponse.json({ error: "ID and companyId required" }, { status: 400 });
    }

    await db.delete(scheduledReports)
      .where(and(eq(scheduledReports.id, id), eq(scheduledReports.companyId, companyId)));

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Error deleting scheduled report:", error);
    return NextResponse.json(
      { error: "Failed to delete scheduled report" },
      { status: 500 }
    );
  }
}

// POST /api/reports/scheduled/run - Manually trigger a scheduled report
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, companyId } = body;

    // Get the scheduled report
    const [report] = await db.select()
      .from(scheduledReports)
      .where(and(eq(scheduledReports.id, id), eq(scheduledReports.companyId, companyId)));

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Create a history entry
    const historyId = uuidv4();
    await db.insert(reportHistory).values({
      id: historyId,
      reportId: id,
      companyId,
      status: "generating",
    });

    // In production, this would trigger async report generation
    // and email delivery

    // Update next run time
    const nextRunAt = parseSchedule(report.schedule);
    await db.update(scheduledReports)
      .set({ 
        lastRunAt: new Date(),
        nextRunAt,
        updatedAt: new Date(),
      })
      .where(eq(scheduledReports.id, id));

    return NextResponse.json({
      success: true,
      historyId,
      message: "Report generation triggered",
      nextRunAt: nextRunAt.toISOString(),
    });
  } catch (error) {
    console.error("Error running scheduled report:", error);
    return NextResponse.json(
      { error: "Failed to run scheduled report" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getAuditLogs, deleteOldAuditLogs, formatAuditLogsAsCSV } from "@/lib/audit-logger";
import { AuditAction, AuditEntityType } from "@/lib/audit-logger";

// Mock company ID for demo
const DEMO_COMPANY_ID = "comp_1";

// GET /api/audit-logs - List audit logs with filtering
export async function GET(request: NextRequest) {
  try {
    // For demo, use mock company ID
    const companyId = DEMO_COMPANY_ID;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const userId = searchParams.get("userId") || undefined;
    const action = searchParams.get("action") as AuditAction | undefined;
    const entityType = searchParams.get("entityType") as AuditEntityType | undefined;
    const entityId = searchParams.get("entityId") || undefined;
    const startDate = searchParams.get("startDate") ? new Date(searchParams.get("startDate")!) : undefined;
    const endDate = searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : undefined;
    const exportCsv = searchParams.get("export") === "csv";

    const result = await getAuditLogs({
      companyId,
      userId,
      action,
      entityType,
      entityId,
      startDate,
      endDate,
      page,
      limit,
    });

    if (exportCsv) {
      const csv = formatAuditLogsAsCSV(result.logs.map(log => ({
        id: log.id,
        userId: log.userId || "",
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        ipAddress: log.ipAddress,
        createdAt: log.createdAt instanceof Date ? log.createdAt.getTime() : log.createdAt,
      })));

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="audit-logs-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 });
  }
}

// DELETE /api/audit-logs - Delete old audit logs (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const companyId = DEMO_COMPANY_ID;

    const { searchParams } = new URL(request.url);
    const beforeDate = searchParams.get("beforeDate");
    
    if (!beforeDate) {
      return NextResponse.json({ error: "Missing beforeDate parameter" }, { status: 400 });
    }

    const deletedCount = await deleteOldAuditLogs(new Date(beforeDate));
    
    return NextResponse.json({ 
      message: `Deleted ${deletedCount} audit logs`,
      deletedCount 
    });
  } catch (error) {
    console.error("Error deleting audit logs:", error);
    return NextResponse.json({ error: "Failed to delete audit logs" }, { status: 500 });
  }
}

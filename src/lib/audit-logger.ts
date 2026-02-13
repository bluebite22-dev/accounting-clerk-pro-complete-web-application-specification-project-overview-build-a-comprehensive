import { db } from "@/db";
import { auditLog } from "@/db/schema";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import { v4 as uuid } from "uuid";

// Action types for audit logging
export type AuditAction = 
  | "create" | "read" | "update" | "delete" | "login" | "logout"
  | "approve" | "reject" | "cancel" | "export" | "import" | "print"
  | "send" | "receive" | "upload" | "download" | "sync" | "archive"
  | "restore" | "void" | "post" | "unpost" | "reconcile" | "unreconcile";

export type AuditEntityType =
  | "user" | "company" | "customer" | "vendor" | "invoice" | "bill"
  | "transaction" | "stop_order" | "budget" | "category" | "account"
  | "report" | "webhook" | "integration" | "settings" | "notification"
  | "session" | "export" | "import" | "delivery";

export interface AuditLogEntry {
  id?: string;
  companyId: string;
  userId: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

// Create an audit log entry
export async function createAuditLog(entry: AuditLogEntry): Promise<string> {
  const id = uuid();
  
  await db.insert(auditLog).values({
    id,
    companyId: entry.companyId,
    userId: entry.userId,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    oldValue: entry.oldValue ? JSON.stringify(entry.oldValue) : undefined,
    newValue: entry.newValue ? JSON.stringify(entry.newValue) : undefined,
    ipAddress: entry.ipAddress,
    userAgent: entry.userAgent,
  });

  return id;
}

// Get audit logs for a company with filtering and pagination
export async function getAuditLogs(params: {
  companyId: string;
  userId?: string;
  action?: AuditAction;
  entityType?: AuditEntityType;
  entityId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const {
    companyId,
    userId,
    action,
    entityType,
    entityId,
    startDate,
    endDate,
    page = 1,
    limit = 50,
  } = params;

  // Build conditions
  const conditions = [eq(auditLog.companyId, companyId)];
  
  if (userId) conditions.push(eq(auditLog.userId, userId));
  if (action) conditions.push(eq(auditLog.action, action));
  if (entityType) conditions.push(eq(auditLog.entityType, entityType));
  if (entityId) conditions.push(eq(auditLog.entityId, entityId));
  if (startDate) conditions.push(gte(auditLog.createdAt, startDate));
  if (endDate) conditions.push(lte(auditLog.createdAt, endDate));
  
  // Get total count
  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(auditLog)
    .where(and(...conditions));
  
  const total = totalResult[0]?.count || 0;

  // Get paginated results
  const logs = await db
    .select()
    .from(auditLog)
    .where(and(...conditions))
    .orderBy(desc(auditLog.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);

  // Parse JSON fields
  const parsedLogs = logs.map((log) => ({
    ...log,
    oldValue: log.oldValue ? JSON.parse(log.oldValue) : undefined,
    newValue: log.newValue ? JSON.parse(log.newValue) : undefined,
  }));

  return {
    logs: parsedLogs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// Get audit logs for a specific entity
export async function getEntityAuditTrail(
  companyId: string,
  entityType: AuditEntityType,
  entityId: string
) {
  const logs = await db
    .select()
    .from(auditLog)
    .where(
      and(
        eq(auditLog.companyId, companyId),
        eq(auditLog.entityType, entityType),
        eq(auditLog.entityId, entityId)
      )
    )
    .orderBy(desc(auditLog.createdAt));

  return logs.map((log) => ({
    ...log,
    oldValue: log.oldValue ? JSON.parse(log.oldValue) : undefined,
    newValue: log.newValue ? JSON.parse(log.newValue) : undefined,
  }));
}

// Get user activity summary
export async function getUserActivitySummary(
  companyId: string,
  startDate: Date,
  endDate: Date
) {
  const logs = await db
    .select({
      userId: auditLog.userId,
      action: auditLog.action,
      count: sql<number>`count(*)`,
    })
    .from(auditLog)
    .where(
      and(
        eq(auditLog.companyId, companyId),
        gte(auditLog.createdAt, startDate),
        lte(auditLog.createdAt, endDate)
      )
    )
    .groupBy(auditLog.userId, auditLog.action);

  return logs;
}

// Get action counts by type
export async function getActionCounts(
  companyId: string,
  startDate?: Date,
  endDate?: Date
) {
  const conditions = [eq(auditLog.companyId, companyId)];
  
  if (startDate) conditions.push(gte(auditLog.createdAt, startDate));
  if (endDate) conditions.push(lte(auditLog.createdAt, endDate));

  const results = await db
    .select({
      action: auditLog.action,
      count: sql<number>`count(*)`,
    })
    .from(auditLog)
    .where(and(...conditions))
    .groupBy(auditLog.action);

  return results;
}

// Delete old audit logs (for retention policy)
export async function deleteOldAuditLogs(beforeDate: Date): Promise<number> {
  const result = await db
    .delete(auditLog)
    .where(lte(auditLog.createdAt, beforeDate));

  // Get the changes count from drizzle
  const changes = await db.select({ count: sql<number>`changes()` }).from(auditLog);
  return changes[0]?.count || 0;
}

// Export audit logs to CSV format
export function formatAuditLogsAsCSV(logs: Array<{
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string | null;
  ipAddress: string | null;
  createdAt: number;
}>): string {
  const headers = ["ID", "User ID", "Action", "Entity Type", "Entity ID", "IP Address", "Timestamp"];
  const rows = logs.map((log) => [
    log.id,
    log.userId,
    log.action,
    log.entityType,
    log.entityId || "",
    log.ipAddress || "",
    new Date(log.createdAt).toISOString(),
  ]);

  return [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n");
}

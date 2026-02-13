import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { webhooks, webhookLogs, auditLog } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";

// Webhook event types
export type WebhookEventType = 
  | "invoice.created"
  | "invoice.paid"
  | "invoice.overdue"
  | "invoice.viewed"
  | "invoice.cancelled"
  | "bill.created"
  | "bill.paid"
  | "bill.overdue"
  | "bill.approved"
  | "bill.cancelled"
  | "transaction.created"
  | "stop_order.created"
  | "stop_order.approved"
  | "stop_order.rejected"
  | "stop_order.triggered"
  | "stop_order.expired"
  | "user.login"
  | "user.created"
  | "budget.alert"
  | "delivery.created";

// Webhook status type
type WebhookStatus = "active" | "paused" | "failed";

// All available webhook events
export const WEBHOOK_EVENTS: { value: WebhookEventType; label: string }[] = [
  { value: "invoice.created", label: "Invoice Created" },
  { value: "invoice.paid", label: "Invoice Paid" },
  { value: "invoice.overdue", label: "Invoice Overdue" },
  { value: "invoice.viewed", label: "Invoice Viewed" },
  { value: "invoice.cancelled", label: "Invoice Cancelled" },
  { value: "bill.created", label: "Bill Created" },
  { value: "bill.paid", label: "Bill Paid" },
  { value: "bill.overdue", label: "Bill Overdue" },
  { value: "bill.approved", label: "Bill Approved" },
  { value: "bill.cancelled", label: "Bill Cancelled" },
  { value: "transaction.created", label: "Transaction Created" },
  { value: "stop_order.created", label: "Stop Order Created" },
  { value: "stop_order.approved", label: "Stop Order Approved" },
  { value: "stop_order.rejected", label: "Stop Order Rejected" },
  { value: "stop_order.triggered", label: "Stop Order Triggered" },
  { value: "stop_order.expired", label: "Stop Order Expired" },
  { value: "user.login", label: "User Login" },
  { value: "user.created", label: "User Created" },
  { value: "budget.alert", label: "Budget Alert" },
  { value: "delivery.created", label: "Delivery Created" },
];

// Verify webhook signature
function verifySignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
};

// Calculate retry delay with exponential backoff
function getRetryDelay(retryCount: number): number {
  const delay = RETRY_CONFIG.initialDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, retryCount);
  return Math.min(delay, RETRY_CONFIG.maxDelay);
}

// GET /api/webhooks - List configured webhooks
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const status = searchParams.get("status");
    const includeLogs = searchParams.get("includeLogs") === "true";

    let query = db.select({
      id: webhooks.id,
      url: webhooks.url,
      events: webhooks.events,
      status: webhooks.status,
      failureCount: webhooks.failureCount,
      lastTriggered: webhooks.lastTriggered,
      lastFailedAt: webhooks.lastFailedAt,
      createdAt: webhooks.createdAt,
      updatedAt: webhooks.updatedAt,
    })
    .from(webhooks)
    .where(eq(webhooks.companyId, companyId || ""))
    .orderBy(desc(webhooks.createdAt));

    if (status) {
      const webhookStatus = status as WebhookStatus;
      query = db.select({
        id: webhooks.id,
        url: webhooks.url,
        events: webhooks.events,
        status: webhooks.status,
        failureCount: webhooks.failureCount,
        lastTriggered: webhooks.lastTriggered,
        lastFailedAt: webhooks.lastFailedAt,
        createdAt: webhooks.createdAt,
        updatedAt: webhooks.updatedAt,
      })
      .from(webhooks)
      .where(and(
        eq(webhooks.companyId, companyId || ""),
        eq(webhooks.status, webhookStatus)
      ))
      .orderBy(desc(webhooks.createdAt));
    }

    const result = await query;

    // Parse events JSON
    const webhooksWithParsedEvents = result.map((w: any) => ({
      ...w,
      events: JSON.parse(w.events),
    }));

    // Optionally include recent logs
    if (includeLogs && companyId) {
      const logsResult = await db.select({
        id: webhookLogs.id,
        webhookId: webhookLogs.webhookId,
        event: webhookLogs.event,
        status: webhookLogs.status,
        responseCode: webhookLogs.responseCode,
        createdAt: webhookLogs.createdAt,
      })
      .from(webhookLogs)
      .innerJoin(webhooks, eq(webhooks.id, webhookLogs.webhookId))
      .where(eq(webhooks.companyId, companyId))
      .orderBy(desc(webhookLogs.createdAt))
      .limit(50);

      return NextResponse.json({ 
        webhooks: webhooksWithParsedEvents,
        recentLogs: logsResult 
      });
    }

    return NextResponse.json({ webhooks: webhooksWithParsedEvents });
  } catch (error) {
    console.error("Error fetching webhooks:", error);
    return NextResponse.json(
      { error: "Failed to fetch webhooks" },
      { status: 500 }
    );
  }
}

// POST /api/webhooks - Create webhook
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, url, events, description, active } = body;

    if (!url || !events || events.length === 0) {
      return NextResponse.json(
        { error: "URL and at least one event are required" },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    const secret = crypto.randomBytes(32).toString("hex");

    const result = await db.insert(webhooks).values({
      id: uuidv4(),
      companyId,
      url,
      events: JSON.stringify(events),
      secret,
      description,
      status: active !== false ? "active" : "paused",
      failureCount: 0,
    }).returning();

    // Log the creation
    await db.insert(auditLog).values({
      id: uuidv4(),
      companyId,
      action: "webhook.created",
      entityType: "webhook",
      entityId: result[0].id,
      newValue: JSON.stringify({ url, events }),
    });

    return NextResponse.json({
      webhook: {
        ...result[0],
        events: JSON.parse(result[0].events),
        secret, // Only returned on creation
      }
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating webhook:", error);
    return NextResponse.json(
      { error: "Failed to create webhook" },
      { status: 500 }
    );
  }
}

// PUT /api/webhooks - Update webhook
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, companyId, url, events, description, status } = body;

    if (!id || !companyId) {
      return NextResponse.json(
        { error: "ID and companyId are required" },
        { status: 400 }
      );
    }

    const updateData: any = { updatedAt: new Date() };
    
    if (url) {
      try {
        new URL(url);
        updateData.url = url;
      } catch {
        return NextResponse.json(
          { error: "Invalid URL format" },
          { status: 400 }
        );
      }
    }
    
    if (events) updateData.events = JSON.stringify(events);
    if (description !== undefined) updateData.description = description;
    if (status) updateData.status = status as WebhookStatus;

    const result = await db.update(webhooks)
      .set(updateData)
      .where(and(eq(webhooks.id, id), eq(webhooks.companyId, companyId)))
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Webhook not found" },
        { status: 404 }
      );
    }

    // Log the update
    await db.insert(auditLog).values({
      id: uuidv4(),
      companyId,
      action: "webhook.updated",
      entityType: "webhook",
      entityId: id,
      newValue: JSON.stringify(updateData),
    });

    return NextResponse.json({ 
      webhook: {
        ...result[0],
        events: JSON.parse(result[0].events),
      }
    });
  } catch (error) {
    console.error("Error updating webhook:", error);
    return NextResponse.json(
      { error: "Failed to update webhook" },
      { status: 500 }
    );
  }
}

// DELETE /api/webhooks - Delete webhook
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const companyId = searchParams.get("companyId");

    if (!id || !companyId) {
      return NextResponse.json({ error: "ID and companyId required" }, { status: 400 });
    }

    // Check if webhook exists
    const webhook = await db.select()
      .from(webhooks)
      .where(and(eq(webhooks.id, id), eq(webhooks.companyId, companyId)))
      .limit(1);

    if (webhook.length === 0) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    // Delete associated logs first
    await db.delete(webhookLogs)
      .where(eq(webhookLogs.webhookId, id));

    // Delete the webhook
    await db.delete(webhooks)
      .where(and(eq(webhooks.id, id), eq(webhooks.companyId, companyId)));

    // Log the deletion
    await db.insert(auditLog).values({
      id: uuidv4(),
      companyId,
      action: "webhook.deleted",
      entityType: "webhook",
      entityId: id,
      oldValue: JSON.stringify(webhook[0]),
    });

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Error deleting webhook:", error);
    return NextResponse.json(
      { error: "Failed to delete webhook" },
      { status: 500 }
    );
  }
}

// PATCH /api/webhooks - Retry failed webhook
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { webhookId, logId, companyId } = body;

    if (!webhookId || !companyId) {
      return NextResponse.json(
        { error: "webhookId and companyId are required" },
        { status: 400 }
      );
    }

    // Get webhook
    const webhook = await db.select()
      .from(webhooks)
      .where(and(eq(webhooks.id, webhookId), eq(webhooks.companyId, companyId)))
      .limit(1);

    if (webhook.length === 0) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    const wh = webhook[0];

    // If logId provided, retry specific log
    if (logId) {
      const log = await db.select()
        .from(webhookLogs)
        .where(eq(webhookLogs.id, logId))
        .limit(1);

      if (log.length === 0) {
        return NextResponse.json({ error: "Log not found" }, { status: 404 });
      }

      const originalLog = log[0];
      const payload = originalLog.payload;

      if (!payload) {
        return NextResponse.json(
          { error: "No payload found in log" },
          { status: 400 }
        );
      }

      // Retry the delivery
      const signature = crypto
        .createHmac("sha256", wh.secret)
        .update(payload)
        .digest("hex");

      try {
        const response = await fetch(wh.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Signature": signature,
            "X-Webhook-Event": originalLog.event,
            "X-Webhook-Delivery": originalLog.id,
            "X-Webhook-Retry": String(originalLog.retryCount + 1),
          },
          body: payload,
        });

        // Update log
        await db.update(webhookLogs)
          .set({
            status: response.ok ? "delivered" : "failed",
            responseCode: response.status,
            retryCount: sql`${webhookLogs.retryCount} + 1`,
          })
          .where(eq(webhookLogs.id, logId));

        // Update webhook status if successful
        if (response.ok) {
          await db.update(webhooks)
            .set({
              failureCount: 0,
              lastTriggered: new Date(),
              status: "active",
              updatedAt: new Date(),
            })
            .where(eq(webhooks.id, webhookId));
        }

        return NextResponse.json({ 
          success: response.ok,
          responseCode: response.status 
        });
      } catch (error: any) {
        await db.update(webhookLogs)
          .set({
            status: "failed",
            errorMessage: error.message,
            retryCount: sql`${webhookLogs.retryCount} + 1`,
          })
          .where(eq(webhookLogs.id, logId));

        return NextResponse.json({ 
          success: false,
          error: error.message 
        });
      }
    }

    return NextResponse.json({ message: "Use webhookId with logId to retry" });
  } catch (error) {
    console.error("Error retrying webhook:", error);
    return NextResponse.json(
      { error: "Failed to retry webhook" },
      { status: 500 }
    );
  }
}

// Internal function to trigger webhooks
export async function triggerWebhooks(
  companyId: string,
  event: WebhookEventType,
  data: any
) {
  try {
    const result = await db.select()
      .from(webhooks)
      .where(and(
        eq(webhooks.companyId, companyId),
        eq(webhooks.status, "active" as WebhookStatus)
      ));

    for (const webhook of result) {
      const events = JSON.parse(webhook.events as string);
      if (!events.includes(event)) continue;

      const payload = JSON.stringify({
        event,
        timestamp: new Date().toISOString(),
        data,
      });

      const signature = crypto
        .createHmac("sha256", webhook.secret)
        .update(payload)
        .digest("hex");

      // Create initial log entry
      const logId = uuidv4();
      await db.insert(webhookLogs).values({
        id: logId,
        webhookId: webhook.id,
        event,
        payload,
        status: "pending",
      });

      // Attempt delivery
      await deliverWebhook(webhook.id, webhook.url, event, payload, signature, webhook.secret);
    }
  } catch (error) {
    console.error("Error triggering webhooks:", error);
  }
}

// Deliver webhook with retry logic
async function deliverWebhook(
  webhookId: string,
  url: string,
  event: string,
  payload: string,
  signature: string,
  secret: string
) {
  let retryCount = 0;
  let lastError: string | null = null;
  let responseCode: number | null = null;

  while (retryCount <= RETRY_CONFIG.maxRetries) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": signature,
          "X-Webhook-Event": event,
          "X-Webhook-Delivery": webhookId,
        },
        body: payload,
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      responseCode = response.status;

      if (response.ok) {
        // Success - update webhook and log
        await db.update(webhooks)
          .set({
            lastTriggered: new Date(),
            failureCount: 0,
            status: "active",
            updatedAt: new Date(),
          })
          .where(eq(webhooks.id, webhookId));

        await db.update(webhookLogs)
          .set({
            status: "delivered",
            responseCode,
            retryCount,
            createdAt: new Date(),
          })
          .where(eq(webhookLogs.webhookId, webhookId));

        return true;
      }

      // HTTP error - don't retry on client errors (4xx)
      if (responseCode >= 400 && responseCode < 500) {
        lastError = `Client error: ${response.statusText}`;
        break;
      }

      // Server errors (5xx) - retry
      lastError = `Server error: ${response.statusText}`;
    } catch (error: any) {
      lastError = error.message;
    }

    // Check if we should retry
    if (retryCount < RETRY_CONFIG.maxRetries) {
      const delay = getRetryDelay(retryCount);
      await new Promise(resolve => setTimeout(resolve, delay));
      retryCount++;

      // Recalculate signature for retry
      const newSignature = crypto
        .createHmac("sha256", secret)
        .update(payload)
        .digest("hex");
      signature = newSignature;
    } else {
      break;
    }
  }

  // All retries failed - update webhook status
  await db.update(webhooks)
    .set({
      failureCount: sql`${webhooks.failureCount} + 1`,
      lastFailedAt: new Date(),
      status: retryCount >= RETRY_CONFIG.maxRetries ? "failed" : "active",
      updatedAt: new Date(),
    })
    .where(eq(webhooks.id, webhookId));

  await db.update(webhookLogs)
    .set({
      status: "failed",
      errorMessage: lastError,
      responseCode,
      retryCount,
      createdAt: new Date(),
    })
    .where(eq(webhookLogs.webhookId, webhookId));

  return false;
}

// Get webhook logs for a specific webhook
export async function getWebhookLogs(webhookId: string, companyId: string, limit = 50) {
  try {
    const logs = await db.select({
      id: webhookLogs.id,
      event: webhookLogs.event,
      status: webhookLogs.status,
      responseCode: webhookLogs.responseCode,
      errorMessage: webhookLogs.errorMessage,
      retryCount: webhookLogs.retryCount,
      createdAt: webhookLogs.createdAt,
    })
    .from(webhookLogs)
    .innerJoin(webhooks, eq(webhooks.id, webhookLogs.webhookId))
    .where(and(
      eq(webhooks.id, webhookId),
      eq(webhooks.companyId, companyId)
    ))
    .orderBy(desc(webhookLogs.createdAt))
    .limit(limit);

    return logs;
  } catch (error) {
    console.error("Error fetching webhook logs:", error);
    throw error;
  }
}

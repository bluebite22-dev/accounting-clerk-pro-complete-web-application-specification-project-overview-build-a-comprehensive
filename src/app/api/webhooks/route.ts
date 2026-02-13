import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { webhooks, webhookLogs, auditLog, notifications } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";

// Webhook event types
export type WebhookEventType = 
  | "invoice.created"
  | "invoice.paid"
  | "invoice.overdue"
  | "bill.created"
  | "bill.paid"
  | "bill.overdue"
  | "transaction.created"
  | "stop_order.created"
  | "stop_order.approved"
  | "stop_order.triggered"
  | "user.login"
  | "user.created";

// Verify webhook signature
function verifySignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// GET /api/webhooks - List configured webhooks
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    const result = await db.select({
      id: webhooks.id,
      url: webhooks.url,
      events: webhooks.events,
      status: webhooks.status,
      failureCount: webhooks.failureCount,
      lastTriggered: webhooks.lastTriggered,
      createdAt: webhooks.createdAt,
    })
    .from(webhooks)
    .where(eq(webhooks.companyId, companyId || ""))
    .orderBy(desc(webhooks.createdAt));

    return NextResponse.json({ webhooks: result });
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

    return NextResponse.json({
      webhook: {
        ...result[0],
        secret,
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

    const updateData: any = { updatedAt: new Date() };
    if (url) updateData.url = url;
    if (events) updateData.events = JSON.stringify(events);
    if (description !== undefined) updateData.description = description;
    if (status) updateData.status = status;

    const result = await db.update(webhooks)
      .set(updateData)
      .where(and(eq(webhooks.id, id), eq(webhooks.companyId, companyId)))
      .returning();

    return NextResponse.json({ webhook: result[0] });
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

    await db.delete(webhooks)
      .where(and(eq(webhooks.id, id), eq(webhooks.companyId, companyId)));

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Error deleting webhook:", error);
    return NextResponse.json(
      { error: "Failed to delete webhook" },
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
        eq(webhooks.status, "active")
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

      try {
        const response = await fetch(webhook.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Signature": signature,
            "X-Webhook-Event": event,
          },
          body: payload,
        });

        await db.update(webhooks)
          .set({
            lastTriggered: new Date(),
            failureCount: 0,
            updatedAt: new Date(),
          })
          .where(eq(webhooks.id, webhook.id));

        await db.insert(webhookLogs).values({
          id: uuidv4(),
          webhookId: webhook.id,
          event,
          status: "delivered",
          responseCode: response.status,
        });
      } catch (error: any) {
        await db.update(webhooks)
          .set({
            failureCount: sql`${webhooks.failureCount} + 1`,
            updatedAt: new Date(),
          })
          .where(eq(webhooks.id, webhook.id));

        await db.insert(webhookLogs).values({
          id: uuidv4(),
          webhookId: webhook.id,
          event,
          status: "failed",
          errorMessage: error.message,
        });
      }
    }
  } catch (error) {
    console.error("Error triggering webhooks:", error);
  }
}

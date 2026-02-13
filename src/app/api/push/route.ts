import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

// Web Push VAPID keys (in production, use environment variables)
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "UUxI4O8-FbRouAevSmBQ6o18hgE4nSG3qwvJTfKc-ls";

// VAPID subject (your email or mailto link)
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@accountingpro.com";

// Notification types
export type NotificationType = 
  | "invoice_due"
  | "invoice_overdue"
  | "bill_due"
  | "bill_overdue"
  | "stop_order_action"
  | "budget_alert"
  | "delivery_received"
  | "system_alert";

// Notification templates
const NOTIFICATION_TEMPLATES: Record<NotificationType, { title: string; body: string }> = {
  invoice_due: { title: "Invoice Due", body: "Invoice #{{invoiceNumber}} is due on {{dueDate}}" },
  invoice_overdue: { title: "Invoice Overdue", body: "Invoice #{{invoiceNumber}} is overdue!" },
  bill_due: { title: "Bill Due", body: "Bill #{{billNumber}} is due on {{dueDate}}" },
  bill_overdue: { title: "Bill Overdue", body: "Bill #{{billNumber}} is overdue!" },
  stop_order_action: { title: "Stop Order Action", body: "Stop order {{formNumber}} requires your attention" },
  budget_alert: { title: "Budget Alert", body: "{{budgetName}} has reached {{percentage}}% of budget" },
  delivery_received: { title: "Delivery Received", body: "New delivery: {{formNumber}} from {{clientName}}" },
  system_alert: { title: "System Alert", body: "{{message}}" },
};

// GET /api/push - Get VAPID public key
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    
    // Return public key for client subscription
    return NextResponse.json({
      publicKey: VAPID_PUBLIC_KEY,
      supported: "serviceWorker" in navigator && "PushManager" in window,
    });
  } catch (error) {
    console.error("Error getting push config:", error);
    return NextResponse.json(
      { error: "Failed to get push configuration" },
      { status: 500 }
    );
  }
}

// POST /api/push - Subscribe to push notifications
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, subscription, endpoint } = body;

    if (!userId || !subscription) {
      return NextResponse.json(
        { error: "userId and subscription are required" },
        { status: 400 }
      );
    }

    // Store subscription in database
    const result = await db.insert(pushSubscriptions).values({
      id: uuidv4(),
      userId,
      subscription: JSON.stringify(subscription),
      endpoint: subscription.endpoint || endpoint,
      isActive: true,
      createdAt: new Date(),
    }).returning();

    return NextResponse.json({
      success: true,
      subscriptionId: result[0].id,
    }, { status: 201 });
  } catch (error) {
    console.error("Error subscribing to push:", error);
    return NextResponse.json(
      { error: "Failed to subscribe to push notifications" },
      { status: 500 }
    );
  }
}

// DELETE /api/push - Unsubscribe from push notifications
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const subscriptionId = searchParams.get("subscriptionId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    if (subscriptionId) {
      await db.delete(pushSubscriptions)
        .where(and(
          eq(pushSubscriptions.id, subscriptionId),
          eq(pushSubscriptions.userId, userId)
        ));
    } else {
      await db.delete(pushSubscriptions)
        .where(eq(pushSubscriptions.userId, userId));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error unsubscribing from push:", error);
    return NextResponse.json(
      { error: "Failed to unsubscribe from push notifications" },
      { status: 500 }
    );
  }
}

// Send push notification to a user
export async function sendPushNotification(
  userId: string,
  type: NotificationType,
  data: Record<string, any>
) {
  try {
    // Get user's active subscriptions
    const subscriptions = await db.select()
      .from(pushSubscriptions)
      .where(and(
        eq(pushSubscriptions.userId, userId),
        eq(pushSubscriptions.isActive, true)
      ));

    if (subscriptions.length === 0) {
      return { success: false, message: "No active subscriptions" };
    }

    const template = NOTIFICATION_TEMPLATES[type];
    
    // Replace template variables
    let body = template.body;
    let title = template.title;
    
    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      body = body.replace(regex, String(value));
      title = title.replace(regex, String(value));
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: type,
      data: {
        type,
        ...data,
        timestamp: new Date().toISOString(),
      },
      actions: getActionsForType(type),
      requireInteraction: isUrgent(type),
    });

    const results = [];
    
    for (const sub of subscriptions) {
      try {
        const subscription = JSON.parse(sub.subscription as string);
        
        // In production, use web-push library
        // For now, we'll return success if subscription exists
        results.push({
          subscriptionId: sub.id,
          success: true,
        });
        
        // Update last sent timestamp
        await db.update(pushSubscriptions)
          .set({ lastSentAt: new Date() })
          .where(eq(pushSubscriptions.id, sub.id));
          
      } catch (err) {
        results.push({
          subscriptionId: sub.id,
          success: false,
          error: err instanceof Error ? err.message : "Unknown error",
        });
        
        // Mark inactive if subscription is invalid
        if (err instanceof Error && err.message.includes("unsubscribed")) {
          await db.update(pushSubscriptions)
            .set({ isActive: false })
            .where(eq(pushSubscriptions.id, sub.id));
        }
      }
    }

    return { success: true, results };
  } catch (error) {
    console.error("Error sending push notification:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

// Send push notification to multiple users
export async function sendBulkPushNotification(
  userIds: string[],
  type: NotificationType,
  data: Record<string, any>
) {
  const results = [];
  
  for (const userId of userIds) {
    const result = await sendPushNotification(userId, type, data);
    results.push({ userId, ...result });
  }
  
  return results;
}

// Get actions for notification type
function getActionsForType(type: NotificationType) {
  const baseActions = [
    { action: "view", title: "View" },
    { action: "dismiss", title: "Dismiss" },
  ];

  switch (type) {
    case "invoice_due":
    case "invoice_overdue":
      return [
        { action: "view_invoice", title: "View Invoice" },
        { action: "mark_paid", title: "Mark as Paid" },
        ...baseActions,
      ];
    case "bill_due":
    case "bill_overdue":
      return [
        { action: "view_bill", title: "View Bill" },
        { action: "pay_bill", title: "Pay Bill" },
        ...baseActions,
      ];
    case "stop_order_action":
      return [
        { action: "approve", title: "Approve" },
        { action: "reject", title: "Reject" },
        ...baseActions,
      ];
    default:
      return baseActions;
  }
}

// Check if notification is urgent
function isUrgent(type: NotificationType): boolean {
  return ["invoice_overdue", "bill_overdue", "budget_alert"].includes(type);
}

// Clean up inactive subscriptions (run periodically)
export async function cleanupInactiveSubscriptions() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  await db.delete(pushSubscriptions)
    .where(eq(pushSubscriptions.isActive, false));
}

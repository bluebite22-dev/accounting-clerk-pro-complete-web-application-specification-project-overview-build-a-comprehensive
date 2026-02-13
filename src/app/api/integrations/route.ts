import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { transactions, invoices, bills } from "@/db/schema";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";
import crypto from "crypto";

// Integration types
type IntegrationType = "quickbooks" | "xero" | "stripe" | "paypal" | "sage";

// Verify webhook signature
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
  algorithm: string = "sha256"
): boolean {
  const expectedSignature = crypto
    .createHmac(algorithm, secret)
    .update(payload)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// GET /api/integrations - List configured integrations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    // In production, fetch from database
    // This returns mock data for demonstration
    const integrations = [
      {
        id: "quickbooks",
        name: "QuickBooks Online",
        type: "accounting",
        status: "connected",
        lastSync: new Date().toISOString(),
        features: ["invoices", "expenses", "reports"],
      },
      {
        id: "xero",
        name: "Xero",
        type: "accounting",
        status: "disconnected",
        features: ["invoices", "bank_feeds", "reports"],
      },
      {
        id: "stripe",
        name: "Stripe",
        type: "payment",
        status: "connected",
        lastSync: new Date().toISOString(),
        features: ["payments", "refunds", "subscriptions"],
      },
      {
        id: "paypal",
        name: "PayPal",
        type: "payment",
        status: "disconnected",
        features: ["payments", "invoices"],
      },
    ];

    return NextResponse.json({ integrations });
  } catch (error) {
    console.error("Error fetching integrations:", error);
    return NextResponse.json(
      { error: "Failed to fetch integrations" },
      { status: 500 }
    );
  }
}

// POST /api/integrations - Configure integration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { integration, credentials, companyId } = body;

    // In production, store encrypted credentials in database
    // This would include OAuth tokens, API keys, etc.
    
    return NextResponse.json({
      success: true,
      integration: {
        id: integration,
        status: "configured",
        configuredAt: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error("Error configuring integration:", error);
    return NextResponse.json(
      { error: "Failed to configure integration" },
      { status: 500 }
    );
  }
}

// Sync data with external integration
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { integration, direction, entityType, filters } = body;

    // Example: Sync invoices with QuickBooks
    if (integration === "quickbooks" && direction === "outbound") {
      // Export invoices to QuickBooks
      const companyId = filters?.companyId;
      
      const invoicesToSync = await db.select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        totalAmount: invoices.totalAmount,
        dueDate: invoices.dueDate,
        customerId: invoices.customerId,
      })
      .from(invoices)
      .where(eq(invoices.companyId, companyId));

      // In production, this would call QuickBooks API
      // const qbResponse = await quickbooksAPI.createInvoice(invoicesToSync);

      return NextResponse.json({
        success: true,
        synced: invoicesToSync.length,
        integration,
        direction,
        entityType,
      });
    }

    // Import data from integration
    if (integration === "quickbooks" && direction === "inbound") {
      // In production, fetch from QuickBooks API and import
      return NextResponse.json({
        success: true,
        imported: 0,
        integration,
        direction,
        entityType,
      });
    }

    return NextResponse.json({ error: "Unknown integration or direction" }, { status: 400 });
  } catch (error) {
    console.error("Error syncing integration:", error);
    return NextResponse.json(
      { error: "Failed to sync integration" },
      { status: 500 }
    );
  }
}

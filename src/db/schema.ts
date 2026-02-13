import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// Users & Authentication
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: text("role", { enum: ["admin", "accountant", "clerk", "auditor", "viewer"] }).notNull().default("clerk"),
  companyId: text("company_id").references(() => companies.id),
  avatar: text("avatar"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  failedLoginAttempts: integer("failed_login_attempts").notNull().default(0),
  lockedUntil: integer("locked_until", { mode: "timestamp" }),
  lastLoginAt: integer("last_login_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Companies (Multi-tenant)
export const companies = sqliteTable("companies", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  logo: text("logo"),
  fiscalYearStart: integer("fiscal_year_start").notNull().default(1), // Month 1-12
  currency: text("currency").notNull().default("USD"),
  taxId: text("tax_id"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Chart of Accounts
export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  code: text("code").notNull(),
  name: text("name").notNull(),
  type: text("type", { enum: ["asset", "liability", "equity", "revenue", "expense"] }).notNull(),
  parentId: text("parent_id"),
  description: text("description"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Customers
export const customers = sqliteTable("customers", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  creditLimit: real("credit_limit").default(0),
  paymentTerms: integer("payment_terms").default(30), // Net 30, Net 60, etc.
  notes: text("notes"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Vendors
export const vendors = sqliteTable("vendors", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  paymentDetails: text("payment_details"), // JSON for bank info
  taxId: text("tax_id"),
  is1099Eligible: integer("is_1099_eligible", { mode: "boolean" }).default(false),
  paymentTerms: integer("payment_terms").default(30),
  discountTerms: text("discount_terms"), // e.g., "2/10 Net 30"
  notes: text("notes"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Categories
export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  name: text("name").notNull(),
  type: text("type", { enum: ["income", "expense", "both"] }).notNull(),
  parentId: text("parent_id"),
  color: text("color").default("#6B7280"),
  icon: text("icon"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Transactions
export const transactions = sqliteTable("transactions", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  type: text("type", { enum: ["income", "expense", "transfer"] }).notNull(),
  amount: real("amount").notNull(),
  date: integer("date", { mode: "timestamp" }).notNull(),
  categoryId: text("category_id").references(() => categories.id),
  accountId: text("account_id").references(() => accounts.id),
  customerId: text("customer_id").references(() => customers.id),
  vendorId: text("vendor_id").references(() => vendors.id),
  invoiceId: text("invoice_id").references(() => invoices.id),
  billId: text("bill_id").references(() => bills.id),
  paymentMethod: text("payment_method", { enum: ["cash", "check", "bank_transfer", "credit_card", "other"] }),
  reference: text("reference"),
  description: text("description"),
  notes: text("notes"),
  attachmentUrl: text("attachment_url"),
  isReconciled: integer("is_reconciled", { mode: "boolean" }).default(false),
  isTaxable: integer("is_taxable", { mode: "boolean" }).default(true),
  taxAmount: real("tax_amount").default(0),
  createdBy: text("created_by").references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Invoices (Accounts Receivable)
export const invoices = sqliteTable("invoices", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  invoiceNumber: text("invoice_number").notNull().unique(),
  customerId: text("customer_id").notNull().references(() => customers.id),
  status: text("status", { enum: ["draft", "sent", "viewed", "partial", "paid", "overdue", "cancelled", "written_off"] }).notNull().default("draft"),
  issueDate: integer("issue_date", { mode: "timestamp" }).notNull(),
  dueDate: integer("due_date", { mode: "timestamp" }).notNull(),
  subtotal: real("subtotal").notNull(),
  taxAmount: real("tax_amount").default(0),
  discountAmount: real("discount_amount").default(0),
  totalAmount: real("total_amount").notNull(),
  amountPaid: real("amount_paid").default(0),
  notes: text("notes"),
  terms: text("terms"),
  createdBy: text("created_by").references(() => users.id),
  sentAt: integer("sent_at", { mode: "timestamp" }),
  paidAt: integer("paid_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Invoice Line Items
export const invoiceLineItems = sqliteTable("invoice_line_items", {
  id: text("id").primaryKey(),
  invoiceId: text("invoice_id").notNull().references(() => invoices.id),
  description: text("description").notNull(),
  quantity: real("quantity").notNull().default(1),
  unitPrice: real("unit_price").notNull(),
  taxRate: real("tax_rate").default(0),
  total: real("total").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Bills (Accounts Payable)
export const bills = sqliteTable("bills", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  billNumber: text("bill_number"),
  vendorId: text("vendor_id").notNull().references(() => vendors.id),
  status: text("status", { enum: ["draft", "pending", "approved", "partial", "paid", "overdue", "cancelled"] }).notNull().default("draft"),
  issueDate: integer("issue_date", { mode: "timestamp" }).notNull(),
  dueDate: integer("due_date", { mode: "timestamp" }).notNull(),
  subtotal: real("subtotal").notNull(),
  taxAmount: real("tax_amount").default(0),
  totalAmount: real("total_amount").notNull(),
  amountPaid: real("amount_paid").default(0),
  notes: text("notes"),
  approvalNotes: text("approval_notes"),
  createdBy: text("created_by").references(() => users.id),
  approvedBy: text("approved_by").references(() => users.id),
  approvedAt: integer("approved_at", { mode: "timestamp" }),
  paidAt: integer("paid_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Bill Line Items
export const billLineItems = sqliteTable("bill_line_items", {
  id: text("id").primaryKey(),
  billId: text("bill_id").notNull().references(() => bills.id),
  description: text("description").notNull(),
  quantity: real("quantity").notNull().default(1),
  unitPrice: real("unit_price").notNull(),
  taxRate: real("tax_rate").default(0),
  total: real("total").notNull(),
  categoryId: text("category_id").references(() => categories.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Stop Orders (Payroll Deduction Authorizations)
export const stopOrders = sqliteTable("stop_orders", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  
  // Form metadata
  formDate: integer("form_date", { mode: "timestamp" }),
  type: text("type", { enum: ["amount", "vendor", "category", "recurring", "date", "payroll"] }).notNull().default("payroll"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  
  // Employee details
  fullName: text("full_name"),
  sex: text("sex", { enum: ["M", "F"] }),
  nrcNo: text("nrc_no"),
  manNo: text("man_no"),
  rank: text("rank", { enum: ["officer", "soldier", "civilian"] }),
  barrack: text("barrack"),
  district: text("district"),
  province: text("province"),
  mobile: text("mobile"),
  email: text("email"),
  
  // Deduction details
  deductionAmount: real("deduction_amount"),
  durationMonths: integer("duration_months"),
  startMonth: text("start_month"), // YYYY-MM format
  monthlyDeductionFrom: integer("monthly_deduction_from", { mode: "timestamp" }),
  monthlyDeductionTo: integer("monthly_deduction_to", { mode: "timestamp" }),
  amountInWords: text("amount_in_words"),
  authorizedBy: text("authorized_by"),
  
  // Remittance details
  accountNumber: text("account_number"),
  companyName: text("company_name"),
  
  // Legacy fields (for backward compatibility)
  target: text("target"),
  conditions: text("conditions"),
  reason: text("reason"),
  effectiveFrom: integer("effective_from", { mode: "timestamp" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  notifyOnTrigger: integer("notify_on_trigger", { mode: "boolean" }).default(true),
  requireOverride: integer("require_override", { mode: "boolean" }).default(true),
  triggeredCount: integer("triggered_count").default(0),
  blockedAmount: real("blocked_amount").default(0),
  
  // Audit
  createdBy: text("created_by").references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Budgets
export const budgets = sqliteTable("budgets", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  name: text("name").notNull(),
  description: text("description"),
  period: text("period", { enum: ["monthly", "quarterly", "annual"] }).notNull(),
  startDate: integer("start_date", { mode: "timestamp" }).notNull(),
  endDate: integer("end_date", { mode: "timestamp" }).notNull(),
  totalAllocated: real("total_allocated").notNull(),
  totalSpent: real("total_spent").default(0),
  status: text("status", { enum: ["draft", "active", "closed"] }).notNull().default("draft"),
  createdBy: text("created_by").references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Budget Line Items
export const budgetLineItems = sqliteTable("budget_line_items", {
  id: text("id").primaryKey(),
  budgetId: text("budget_id").notNull().references(() => budgets.id),
  categoryId: text("category_id").references(() => categories.id),
  allocated: real("allocated").notNull(),
  spent: real("spent").default(0),
  alertThreshold: integer("alert_threshold").default(80), // Percentage
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Recurring Transactions
export const recurringTransactions = sqliteTable("recurring_transactions", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  type: text("type", { enum: ["income", "expense"] }).notNull(),
  amount: real("amount").notNull(),
  frequency: text("frequency", { enum: ["daily", "weekly", "monthly", "quarterly", "yearly"] }).notNull(),
  dayOfMonth: integer("day_of_month"), // For monthly: 1-31, -1 for last day
  dayOfWeek: integer("day_of_week"), // For weekly: 0-6
  categoryId: text("category_id").references(() => categories.id),
  customerId: text("customer_id").references(() => customers.id),
  vendorId: text("vendor_id").references(() => vendors.id),
  description: text("description"),
  nextOccurrence: integer("next_occurrence", { mode: "timestamp" }).notNull(),
  endDate: integer("end_date", { mode: "timestamp" }),
  occurrencesLeft: integer("occurrences_left"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  autoInvoice: integer("auto_invoice", { mode: "boolean" }).default(false),
  createdBy: text("created_by").references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Audit Log
export const auditLog = sqliteTable("audit_log", {
  id: text("id").primaryKey(),
  companyId: text("company_id").references(() => companies.id),
  userId: text("user_id").references(() => users.id),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  oldValue: text("old_value"), // JSON
  newValue: text("new_value"), // JSON
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Notifications
export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  type: text("type", { enum: ["info", "warning", "error", "success"] }).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  link: text("link"),
  isRead: integer("is_read", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Webhooks
export const webhooks = sqliteTable("webhooks", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  url: text("url").notNull(),
  events: text("events").notNull(),
  secret: text("secret").notNull(),
  description: text("description"),
  status: text("status", { enum: ["active", "paused", "failed"] }).notNull().default("active"),
  failureCount: integer("failure_count").notNull().default(0),
  lastTriggered: integer("last_triggered", { mode: "timestamp" }),
  lastFailedAt: integer("last_failed_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Webhook Logs
export const webhookLogs = sqliteTable("webhook_logs", {
  id: text("id").primaryKey(),
  webhookId: text("webhook_id").notNull().references(() => webhooks.id),
  event: text("event").notNull(),
  payload: text("payload"),
  status: text("status", { enum: ["delivered", "failed", "pending"] }).notNull().default("pending"),
  responseCode: integer("response_code"),
  responseBody: text("response_body"),
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Scheduled Reports
export const scheduledReports = sqliteTable("scheduled_reports", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  name: text("name").notNull(),
  description: text("description"),
  reportType: text("report_type", { enum: ["profit-loss", "cash-flow", "balance-sheet", "aging", "custom"] }).notNull(),
  schedule: text("schedule").notNull(),
  recipients: text("recipients").notNull(),
  format: text("format", { enum: ["pdf", "excel", "csv", "json"] }).notNull().default("pdf"),
  filters: text("filters"),
  lastRunAt: integer("last_run_at", { mode: "timestamp" }),
  nextRunAt: integer("next_run_at", { mode: "timestamp" }),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdBy: text("created_by").references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Report History
export const reportHistory = sqliteTable("report_history", {
  id: text("id").primaryKey(),
  reportId: text("report_id").notNull().references(() => scheduledReports.id),
  companyId: text("company_id").notNull().references(() => companies.id),
  generatedAt: integer("generated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  status: text("status", { enum: ["generating", "completed", "failed"] }).notNull().default("generating"),
  fileUrl: text("file_url"),
  errorMessage: text("error_message"),
  recipientCount: integer("recipient_count").default(0),
});

// Custom Report Templates
export const customReports = sqliteTable("custom_reports", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  name: text("name").notNull(),
  description: text("description"),
  layout: text("layout").notNull(),
  columns: text("columns").notNull(),
  filters: text("filters"),
  sortBy: text("sort_by"),
  sortDir: text("sort_dir", { enum: ["asc", "desc"] }),
  groupBy: text("group_by"),
  calculations: text("calculations"),
  isPublic: integer("is_public", { mode: "boolean" }).default(false),
  createdBy: text("created_by").references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Integration Credentials
export const integrationCredentials = sqliteTable("integration_credentials", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  integrationType: text("integration_type", { enum: ["quickbooks", "xero", "stripe", "paypal", "sage"] }).notNull(),
  credentials: text("credentials").notNull(),
  status: text("status", { enum: ["active", "expired", "revoked"] }).notNull().default("active"),
  lastSyncAt: integer("last_sync_at", { mode: "timestamp" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Company = typeof companies.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Vendor = typeof vendors.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type Invoice = typeof invoices.$inferSelect;
export type Bill = typeof bills.$inferSelect;
export type StopOrder = typeof stopOrders.$inferSelect;
export type Budget = typeof budgets.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Account = typeof accounts.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Webhook = typeof webhooks.$inferSelect;
export type WebhookLog = typeof webhookLogs.$inferSelect;
export type ScheduledReport = typeof scheduledReports.$inferSelect;
export type ReportHistory = typeof reportHistory.$inferSelect;
export type CustomReport = typeof customReports.$inferSelect;
export type IntegrationCredential = typeof integrationCredentials.$inferSelect;

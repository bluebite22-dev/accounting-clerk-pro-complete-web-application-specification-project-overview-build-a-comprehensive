import { pgTable, text, integer, real, timestamp, boolean, serial } from "drizzle-orm/pg-core";

// Users & Authentication
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: text("role", { enum: ["admin", "accountant", "clerk", "auditor", "viewer"] }).notNull().default("clerk"),
  companyId: text("company_id").references(() => companies.id),
  avatar: text("avatar"),
  isActive: boolean("is_active").notNull().default(true),
  failedLoginAttempts: integer("failed_login_attempts").notNull().default(0),
  lockedUntil: timestamp("locked_until"),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Companies (Multi-tenant)
export const companies = pgTable("companies", {
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
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Chart of Accounts
export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  code: text("code").notNull(),
  name: text("name").notNull(),
  type: text("type", { enum: ["asset", "liability", "equity", "revenue", "expense"] }).notNull(),
  parentId: text("parent_id"),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Customers
export const customers = pgTable("customers", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  creditLimit: real("credit_limit").default(0),
  paymentTerms: integer("payment_terms").default(30), // Net 30, Net 60, etc.
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Vendors
export const vendors = pgTable("vendors", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  paymentDetails: text("payment_details"), // JSON for bank info
  taxId: text("tax_id"),
  is1099Eligible: boolean("is_1099_eligible").default(false),
  paymentTerms: integer("payment_terms").default(30),
  discountTerms: text("discount_terms"), // e.g., "2/10 Net 30"
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Categories
export const categories = pgTable("categories", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  name: text("name").notNull(),
  type: text("type", { enum: ["income", "expense", "both"] }).notNull(),
  parentId: text("parent_id"),
  color: text("color").default("#6B7280"),
  icon: text("icon"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Transactions
export const transactions = pgTable("transactions", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  type: text("type", { enum: ["income", "expense", "transfer"] }).notNull(),
  amount: real("amount").notNull(),
  date: timestamp("date").notNull(),
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
  isReconciled: boolean("is_reconciled").default(false),
  isTaxable: boolean("is_taxable").default(true),
  taxAmount: real("tax_amount").default(0),
  createdBy: text("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Invoices (Accounts Receivable)
export const invoices = pgTable("invoices", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  invoiceNumber: text("invoice_number").notNull().unique(),
  customerId: text("customer_id").notNull().references(() => customers.id),
  status: text("status", { enum: ["draft", "sent", "viewed", "partial", "paid", "overdue", "cancelled", "written_off"] }).notNull().default("draft"),
  issueDate: timestamp("issue_date").notNull(),
  dueDate: timestamp("due_date").notNull(),
  subtotal: real("subtotal").notNull(),
  taxAmount: real("tax_amount").default(0),
  discountAmount: real("discount_amount").default(0),
  totalAmount: real("total_amount").notNull(),
  amountPaid: real("amount_paid").default(0),
  notes: text("notes"),
  terms: text("terms"),
  createdBy: text("created_by").references(() => users.id),
  sentAt: timestamp("sent_at"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Invoice Line Items
export const invoiceLineItems = pgTable("invoice_line_items", {
  id: text("id").primaryKey(),
  invoiceId: text("invoice_id").notNull().references(() => invoices.id),
  description: text("description").notNull(),
  quantity: real("quantity").notNull().default(1),
  unitPrice: real("unit_price").notNull(),
  taxRate: real("tax_rate").default(0),
  total: real("total").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Bills (Accounts Payable)
export const bills = pgTable("bills", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  billNumber: text("bill_number"),
  vendorId: text("vendor_id").notNull().references(() => vendors.id),
  status: text("status", { enum: ["draft", "pending", "approved", "partial", "paid", "overdue", "cancelled"] }).notNull().default("draft"),
  issueDate: timestamp("issue_date").notNull(),
  dueDate: timestamp("due_date").notNull(),
  subtotal: real("subtotal").notNull(),
  taxAmount: real("tax_amount").default(0),
  totalAmount: real("total_amount").notNull(),
  amountPaid: real("amount_paid").default(0),
  notes: text("notes"),
  approvalNotes: text("approval_notes"),
  createdBy: text("created_by").references(() => users.id),
  approvedBy: text("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Bill Line Items
export const billLineItems = pgTable("bill_line_items", {
  id: text("id").primaryKey(),
  billId: text("bill_id").notNull().references(() => bills.id),
  description: text("description").notNull(),
  quantity: real("quantity").notNull().default(1),
  unitPrice: real("unit_price").notNull(),
  taxRate: real("tax_rate").default(0),
  total: real("total").notNull(),
  categoryId: text("category_id").references(() => categories.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Stop Orders (Payroll Deduction Authorizations)
export const stopOrders = pgTable("stop_orders", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  
  // Form metadata
  formDate: timestamp("form_date"),
  type: text("type", { enum: ["amount", "vendor", "category", "recurring", "date", "payroll"] }).notNull().default("payroll"),
  isActive: boolean("is_active").notNull().default(true),
  
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
  monthlyDeductionFrom: timestamp("monthly_deduction_from"),
  monthlyDeductionTo: timestamp("monthly_deduction_to"),
  amountInWords: text("amount_in_words"),
  authorizedBy: text("authorized_by"),
  
  // Remittance details
  accountNumber: text("account_number"),
  companyName: text("company_name"),
  
  // Legacy fields (for backward compatibility)
  target: text("target"),
  conditions: text("conditions"),
  reason: text("reason"),
  effectiveFrom: timestamp("effective_from"),
  expiresAt: timestamp("expires_at"),
  notifyOnTrigger: boolean("notify_on_trigger").default(true),
  requireOverride: boolean("require_override").default(true),
  triggeredCount: integer("triggered_count").default(0),
  blockedAmount: real("blocked_amount").default(0),
  
  // Audit
  createdBy: text("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Budgets
export const budgets = pgTable("budgets", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  name: text("name").notNull(),
  description: text("description"),
  period: text("period", { enum: ["monthly", "quarterly", "annual"] }).notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  totalAllocated: real("total_allocated").notNull(),
  totalSpent: real("total_spent").default(0),
  status: text("status", { enum: ["draft", "active", "closed"] }).notNull().default("draft"),
  createdBy: text("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Budget Line Items
export const budgetLineItems = pgTable("budget_line_items", {
  id: text("id").primaryKey(),
  budgetId: text("budget_id").notNull().references(() => budgets.id),
  categoryId: text("category_id").references(() => categories.id),
  allocated: real("allocated").notNull(),
  spent: real("spent").default(0),
  alertThreshold: integer("alert_threshold").default(80), // Percentage
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Recurring Transactions
export const recurringTransactions = pgTable("recurring_transactions", {
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
  nextOccurrence: timestamp("next_occurrence").notNull(),
  endDate: timestamp("end_date"),
  occurrencesLeft: integer("occurrences_left"),
  isActive: boolean("is_active").notNull().default(true),
  autoInvoice: boolean("auto_invoice").default(false),
  createdBy: text("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Audit Log
export const auditLog = pgTable("audit_log", {
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
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Notifications
export const notifications = pgTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  type: text("type", { enum: ["info", "warning", "error", "success"] }).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  link: text("link"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Webhooks
export const webhooks = pgTable("webhooks", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  url: text("url").notNull(),
  events: text("events").notNull(),
  secret: text("secret").notNull(),
  description: text("description"),
  status: text("status", { enum: ["active", "paused", "failed"] }).notNull().default("active"),
  failureCount: integer("failure_count").notNull().default(0),
  lastTriggered: timestamp("last_triggered"),
  lastFailedAt: timestamp("last_failed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Webhook Logs
export const webhookLogs = pgTable("webhook_logs", {
  id: text("id").primaryKey(),
  webhookId: text("webhook_id").notNull().references(() => webhooks.id),
  event: text("event").notNull(),
  payload: text("payload"),
  status: text("status", { enum: ["delivered", "failed", "pending"] }).notNull().default("pending"),
  responseCode: integer("response_code"),
  responseBody: text("response_body"),
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Scheduled Reports
export const scheduledReports = pgTable("scheduled_reports", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  name: text("name").notNull(),
  description: text("description"),
  reportType: text("report_type", { enum: ["profit-loss", "cash-flow", "balance-sheet", "aging", "custom"] }).notNull(),
  schedule: text("schedule").notNull(),
  recipients: text("recipients").notNull(),
  format: text("format", { enum: ["pdf", "excel", "csv", "json"] }).notNull().default("pdf"),
  filters: text("filters"),
  lastRunAt: timestamp("last_run_at"),
  nextRunAt: timestamp("next_run_at"),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: text("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Report History
export const reportHistory = pgTable("report_history", {
  id: text("id").primaryKey(),
  reportId: text("report_id").notNull().references(() => scheduledReports.id),
  companyId: text("company_id").notNull().references(() => companies.id),
  generatedAt: timestamp("generated_at").notNull().defaultNow(),
  status: text("status", { enum: ["generating", "completed", "failed"] }).notNull().default("generating"),
  fileUrl: text("file_url"),
  errorMessage: text("error_message"),
  recipientCount: integer("recipient_count").default(0),
});

// Custom Report Templates
export const customReports = pgTable("custom_reports", {
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
  isPublic: boolean("is_public").default(false),
  createdBy: text("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Integration Credentials
export const integrationCredentials = pgTable("integration_credentials", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull().references(() => companies.id),
  integrationType: text("integration_type", { enum: ["quickbooks", "xero", "stripe", "paypal", "sage"] }).notNull(),
  credentials: text("credentials").notNull(),
  status: text("status", { enum: ["active", "expired", "revoked"] }).notNull().default("active"),
  lastSyncAt: timestamp("last_sync_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Push Subscriptions
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  subscription: text("subscription").notNull(),
  endpoint: text("endpoint").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  lastSentAt: timestamp("last_sent_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
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
export type PushSubscription = typeof pushSubscriptions.$inferSelect;

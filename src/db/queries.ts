import { eq, desc, and, like, gte, lte, sql } from "drizzle-orm";
import { db } from "./index";
import * as schema from "./schema";

// ========================
// CUSTOMERS
// ========================
export async function getCustomers(companyId?: string) {
  if (companyId) {
    return db.select().from(schema.customers).where(eq(schema.customers.companyId, companyId)).orderBy(desc(schema.customers.createdAt));
  }
  return db.select().from(schema.customers).orderBy(desc(schema.customers.createdAt));
}

export async function createCustomer(data: { name: string; companyId?: string; email?: string; phone?: string; address?: string; creditLimit?: number; paymentTerms?: number; isActive?: boolean }) {
  const id = `cust_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const result = await db.insert(schema.customers).values({
    id,
    name: data.name,
    companyId: data.companyId || "default_company",
    email: data.email,
    phone: data.phone,
    address: data.address,
    creditLimit: data.creditLimit ?? 0,
    paymentTerms: data.paymentTerms ?? 30,
    isActive: data.isActive ?? true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning();
  return result;
}

export async function updateCustomer(id: string, data: Partial<schema.Customer>) {
  return db.update(schema.customers).set({ ...data, updatedAt: new Date() }).where(eq(schema.customers.id, id)).returning();
}

export async function deleteCustomer(id: string) {
  return db.delete(schema.customers).where(eq(schema.customers.id, id));
}

// ========================
// VENDORS
// ========================
export async function getVendors(companyId?: string) {
  if (companyId) {
    return db.select().from(schema.vendors).where(eq(schema.vendors.companyId, companyId)).orderBy(desc(schema.vendors.createdAt));
  }
  return db.select().from(schema.vendors).orderBy(desc(schema.vendors.createdAt));
}

export async function createVendor(data: { name: string; companyId?: string; email?: string; phone?: string; address?: string; taxId?: string; isActive?: boolean; paymentTerms?: number }) {
  const id = `vend_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const result = await db.insert(schema.vendors).values({
    id,
    name: data.name,
    companyId: data.companyId || "default_company",
    email: data.email,
    phone: data.phone,
    address: data.address,
    taxId: data.taxId,
    isActive: data.isActive ?? true,
    paymentTerms: data.paymentTerms ?? 30,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning();
  return result;
}

export async function updateVendor(id: string, data: Partial<schema.Vendor>) {
  return db.update(schema.vendors).set({ ...data, updatedAt: new Date() }).where(eq(schema.vendors.id, id)).returning();
}

export async function deleteVendor(id: string) {
  return db.delete(schema.vendors).where(eq(schema.vendors.id, id));
}

// ========================
// CATEGORIES
// ========================
export async function getCategories(companyId?: string) {
  if (companyId) {
    return db.select().from(schema.categories).where(eq(schema.categories.companyId, companyId));
  }
  return db.select().from(schema.categories);
}

export async function createCategory(data: { name: string; type: "income" | "expense" | "both"; companyId?: string; color?: string; icon?: string }) {
  const id = `cat_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const result = await db.insert(schema.categories).values({
    id,
    name: data.name,
    type: data.type,
    companyId: data.companyId || "default_company",
    color: data.color,
    icon: data.icon,
    createdAt: new Date(),
  }).returning();
  return result;
}

// ========================
// TRANSACTIONS
// ========================
export async function getTransactions(companyId?: string) {
  if (companyId) {
    return db.select().from(schema.transactions).where(eq(schema.transactions.companyId, companyId)).orderBy(desc(schema.transactions.date));
  }
  return db.select().from(schema.transactions).orderBy(desc(schema.transactions.date));
}

export async function createTransaction(data: { type: "income" | "expense" | "transfer"; amount: number; date: Date; companyId?: string; categoryId?: string; description?: string }) {
  const id = `txn_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const result = await db.insert(schema.transactions).values({
    id,
    type: data.type,
    amount: data.amount,
    date: data.date,
    companyId: data.companyId || "default_company",
    categoryId: data.categoryId,
    description: data.description,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning();
  return result;
}

export async function updateTransaction(id: string, data: Partial<schema.Transaction>) {
  return db.update(schema.transactions).set({ ...data, updatedAt: new Date() }).where(eq(schema.transactions.id, id)).returning();
}

export async function deleteTransaction(id: string) {
  return db.delete(schema.transactions).where(eq(schema.transactions.id, id));
}

// ========================
// INVOICES
// ========================
export async function getInvoices(companyId?: string) {
  if (companyId) {
    return db.select().from(schema.invoices).where(eq(schema.invoices.companyId, companyId)).orderBy(desc(schema.invoices.createdAt));
  }
  return db.select().from(schema.invoices).orderBy(desc(schema.invoices.createdAt));
}

export async function createInvoice(data: { invoiceNumber: string; customerId: string; companyId?: string; subtotal: number; totalAmount: number; issueDate: Date; dueDate: Date }) {
  const id = `inv_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const result = await db.insert(schema.invoices).values({
    id,
    invoiceNumber: data.invoiceNumber,
    customerId: data.customerId,
    companyId: data.companyId || "default_company",
    subtotal: data.subtotal,
    totalAmount: data.totalAmount,
    taxAmount: 0,
    discountAmount: 0,
    amountPaid: 0,
    issueDate: data.issueDate,
    dueDate: data.dueDate,
    status: "draft",
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning();
  return result;
}

export async function updateInvoice(id: string, data: Partial<schema.Invoice>) {
  return db.update(schema.invoices).set({ ...data, updatedAt: new Date() }).where(eq(schema.invoices.id, id)).returning();
}

export async function deleteInvoice(id: string) {
  return db.delete(schema.invoices).where(eq(schema.invoices.id, id));
}

// ========================
// BILLS
// ========================
export async function getBills(companyId?: string) {
  if (companyId) {
    return db.select().from(schema.bills).where(eq(schema.bills.companyId, companyId)).orderBy(desc(schema.bills.createdAt));
  }
  return db.select().from(schema.bills).orderBy(desc(schema.bills.createdAt));
}

export async function createBill(data: { billNumber: string; vendorId: string; companyId?: string; subtotal: number; totalAmount: number; issueDate: Date; dueDate: Date }) {
  const id = `bill_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const result = await db.insert(schema.bills).values({
    id,
    billNumber: data.billNumber,
    vendorId: data.vendorId,
    companyId: data.companyId || "default_company",
    subtotal: data.subtotal,
    totalAmount: data.totalAmount,
    taxAmount: 0,
    amountPaid: 0,
    issueDate: data.issueDate,
    dueDate: data.dueDate,
    status: "draft",
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning();
  return result;
}

export async function updateBill(id: string, data: Partial<schema.Bill>) {
  return db.update(schema.bills).set({ ...data, updatedAt: new Date() }).where(eq(schema.bills.id, id)).returning();
}

export async function deleteBill(id: string) {
  return db.delete(schema.bills).where(eq(schema.bills.id, id));
}

// ========================
// STOP ORDERS
// ========================
export async function getStopOrders(companyId?: string) {
  if (companyId) {
    return db.select().from(schema.stopOrders).where(eq(schema.stopOrders.companyId, companyId)).orderBy(desc(schema.stopOrders.createdAt));
  }
  return db.select().from(schema.stopOrders).orderBy(desc(schema.stopOrders.createdAt));
}

export async function createStopOrder(data: Partial<schema.StopOrder>) {
  const id = `stop_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  return db.insert(schema.stopOrders).values({
    ...data,
    id,
    companyId: data.companyId || "default_company",
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning();
}

export async function updateStopOrder(id: string, data: Partial<schema.StopOrder>) {
  return db.update(schema.stopOrders).set({ ...data, updatedAt: new Date() }).where(eq(schema.stopOrders.id, id)).returning();
}

export async function deleteStopOrder(id: string) {
  return db.delete(schema.stopOrders).where(eq(schema.stopOrders.id, id));
}

// ========================
// BUDGETS
// ========================
export async function getBudgets(companyId?: string) {
  if (companyId) {
    return db.select().from(schema.budgets).where(eq(schema.budgets.companyId, companyId)).orderBy(desc(schema.budgets.createdAt));
  }
  return db.select().from(schema.budgets).orderBy(desc(schema.budgets.createdAt));
}

export async function createBudget(data: { name: string; period: "monthly" | "quarterly" | "annual"; startDate: Date; endDate: Date; totalAllocated: number; companyId?: string }) {
  const id = `budget_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const result = await db.insert(schema.budgets).values({
    id,
    name: data.name,
    period: data.period,
    startDate: data.startDate,
    endDate: data.endDate,
    totalAllocated: data.totalAllocated,
    totalSpent: 0,
    companyId: data.companyId || "default_company",
    status: "draft",
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning();
  return result;
}

export async function updateBudget(id: string, data: Partial<schema.Budget>) {
  return db.update(schema.budgets).set({ ...data, updatedAt: new Date() }).where(eq(schema.budgets.id, id)).returning();
}

export async function deleteBudget(id: string) {
  return db.delete(schema.budgets).where(eq(schema.budgets.id, id));
}

// ========================
// COMPANIES
// ========================
export async function getCompanies() {
  return db.select().from(schema.companies);
}

export async function createCompany(data: { name: string; code: string; currency?: string; fiscalYearStart?: number }) {
  const id = `comp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const result = await db.insert(schema.companies).values({
    id,
    name: data.name,
    code: data.code,
    currency: data.currency || "USD",
    fiscalYearStart: data.fiscalYearStart ?? 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning();
  return result;
}

// ========================
// USERS
// ========================
export async function getUsers(companyId?: string) {
  if (companyId) {
    return db.select().from(schema.users).where(eq(schema.users.companyId, companyId));
  }
  return db.select().from(schema.users);
}

export async function getUserByEmail(email: string) {
  return db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
}

export async function createUser(data: { email: string; passwordHash: string; firstName: string; lastName: string; role?: string; companyId?: string }) {
  const id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const result = await db.insert(schema.users).values({
    id,
    email: data.email,
    passwordHash: data.passwordHash,
    firstName: data.firstName,
    lastName: data.lastName,
    role: (data.role as any) || "clerk",
    companyId: data.companyId || "default_company",
    isActive: true,
    failedLoginAttempts: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning();
  return result;
}

export async function updateUser(id: string, data: Partial<schema.User>) {
  return db.update(schema.users).set({ ...data, updatedAt: new Date() }).where(eq(schema.users.id, id)).returning();
}

// ========================
// AUDIT LOGS
// ========================
export async function getAuditLogs(companyId?: string, limit = 100) {
  if (companyId) {
    return db.select().from(schema.auditLog).where(eq(schema.auditLog.companyId, companyId)).orderBy(desc(schema.auditLog.createdAt)).limit(limit);
  }
  return db.select().from(schema.auditLog).orderBy(desc(schema.auditLog.createdAt)).limit(limit);
}

export async function createAuditLog(data: { action: string; entityType: string; entityId?: string; companyId?: string; userId?: string; oldValue?: string; newValue?: string }) {
  const id = `audit_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  return db.insert(schema.auditLog).values({
    id,
    action: data.action,
    entityType: data.entityType,
    entityId: data.entityId,
    companyId: data.companyId,
    userId: data.userId,
    oldValue: data.oldValue,
    newValue: data.newValue,
    createdAt: new Date(),
  }).returning();
}

// ========================
// NOTIFICATIONS
// ========================
export async function getNotifications(userId: string) {
  return db.select().from(schema.notifications).where(eq(schema.notifications.userId, userId)).orderBy(desc(schema.notifications.createdAt));
}

export async function createNotification(data: { userId: string; type: "info" | "warning" | "error" | "success"; title: string; message: string; link?: string }) {
  const id = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  return db.insert(schema.notifications).values({
    id,
    userId: data.userId,
    type: data.type,
    title: data.title,
    message: data.message,
    link: data.link,
    isRead: false,
    createdAt: new Date(),
  }).returning();
}

export async function markNotificationRead(id: string) {
  return db.update(schema.notifications).set({ isRead: true }).where(eq(schema.notifications.id, id)).returning();
}

// ========================
// INITIALIZATION / SEED
// ========================
export async function initializeDatabase() {
  // Create default company if not exists
  const existingCompanies = await getCompanies();
  if (existingCompanies.length === 0) {
    await createCompany({
      name: "Demo Company",
      code: "DEMO001",
      currency: "USD",
      fiscalYearStart: 1,
    });
  }

  // Create default categories if not exists
  const existingCategories = await getCategories();
  if (existingCategories.length === 0) {
    const categories = [
      { name: "Sales Revenue", type: "income" as const, color: "#10B981" },
      { name: "Service Income", type: "income" as const, color: "#3B82F6" },
      { name: "Investment Income", type: "income" as const, color: "#8B5CF6" },
      { name: "Office Supplies", type: "expense" as const, color: "#F59E0B" },
      { name: "Utilities", type: "expense" as const, color: "#EF4444" },
      { name: "Marketing", type: "expense" as const, color: "#EC4899" },
      { name: "Payroll", type: "expense" as const, color: "#6366F1" },
      { name: "Rent", type: "expense" as const, color: "#14B8A6" },
      { name: "Insurance", type: "expense" as const, color: "#F97316" },
      { name: "Professional Services", type: "expense" as const, color: "#84CC16" },
    ];

    for (const cat of categories) {
      await createCategory(cat);
    }
  }

  console.log("Database initialized successfully");
}

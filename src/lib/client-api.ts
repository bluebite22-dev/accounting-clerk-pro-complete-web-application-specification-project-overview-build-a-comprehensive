// Client-safe API wrapper for data fetching
// This file can be imported on both client and server - no native modules

const API_BASE = '/api';

// Helper function for API calls
async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}

// ========================
// TRANSACTIONS
// ========================
export interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  date: string;
  category: string;
  categoryId: string;
  customer?: string;
  customerId?: string;
  vendor?: string;
  vendorId?: string;
  paymentMethod: string;
  reference?: string;
  description: string;
  notes?: string;
  status: 'pending' | 'completed' | 'cancelled';
  isReconciled: boolean;
  isTaxable: boolean;
  taxAmount?: number;
}

export interface TransactionFilters {
  type?: string;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  isReconciled?: boolean;
  limit?: number;
  offset?: number;
}

export async function getTransactions(filters?: TransactionFilters): Promise<{
  data: Transaction[];
  totals: { income: number; expense: number; net: number };
}> {
  const params = new URLSearchParams();
  if (filters?.type) params.set('type', filters.type);
  if (filters?.categoryId) params.set('categoryId', filters.categoryId);
  if (filters?.startDate) params.set('startDate', filters.startDate);
  if (filters?.endDate) params.set('endDate', filters.endDate);
  if (filters?.isReconciled !== undefined) params.set('isReconciled', String(filters.isReconciled));
  if (filters?.limit) params.set('limit', String(filters.limit));
  if (filters?.offset) params.set('offset', String(filters.offset));

  return apiFetch(`/transactions?${params.toString()}`);
}

export async function createTransaction(data: Partial<Transaction>): Promise<Transaction> {
  return apiFetch('/transactions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTransaction(id: string, data: Partial<Transaction>): Promise<Transaction> {
  return apiFetch(`/transactions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteTransaction(id: string): Promise<void> {
  await fetch(`${API_BASE}/transactions/${id}`, { method: 'DELETE' });
}

// ========================
// CUSTOMERS
// ========================
export interface Customer {
  id: string;
  companyId?: string;
  name: string;
  email?: string;
  phone?: string;
  phone2?: string;
  address?: string;
  contactPerson?: string;
  tin?: string;
  bankName?: string;
  bankAccount?: string;
  paymentTerms?: string | number;
  creditLimit?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export async function getCustomers(companyId?: string): Promise<Customer[]> {
  const params = companyId ? `?companyId=${companyId}` : '';
  const response = await apiFetch<{ data: Customer[] }>(`/customers${params}`);
  return response.data;
}

export async function createCustomer(data: Partial<Customer>): Promise<Customer> {
  return apiFetch('/customers', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCustomer(id: string, data: Partial<Customer>): Promise<Customer> {
  return apiFetch(`/customers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteCustomer(id: string): Promise<void> {
  await fetch(`${API_BASE}/customers/${id}`, { method: 'DELETE' });
}

// ========================
// VENDORS
// ========================
export interface Vendor {
  id: string;
  companyId?: string;
  name: string;
  email?: string;
  phone?: string;
  phone2?: string;
  address?: string;
  contactPerson?: string;
  tin?: string;
  bankName?: string;
  bankAccount?: string;
  paymentTerms?: string | number;
  paymentTermsNum?: number;
  balance?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export async function getVendors(companyId?: string): Promise<Vendor[]> {
  const params = companyId ? `?companyId=${companyId}` : '';
  const response = await apiFetch<{ data: Vendor[] }>(`/vendors${params}`);
  return response.data;
}

export async function createVendor(data: Partial<Vendor>): Promise<Vendor> {
  return apiFetch('/vendors', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateVendor(id: string, data: Partial<Vendor>): Promise<Vendor> {
  return apiFetch(`/vendors/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteVendor(id: string): Promise<void> {
  await fetch(`${API_BASE}/vendors/${id}`, { method: 'DELETE' });
}

// ========================
// INVOICES
// ========================
export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  status: 'draft' | 'sent' | 'viewed' | 'partial' | 'paid' | 'overdue' | 'cancelled';
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  paidAt?: string;
  lineItems: {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
}

export async function getInvoices(companyId?: string): Promise<Invoice[]> {
  const params = companyId ? `?companyId=${companyId}` : '';
  const response = await apiFetch<{ data: Invoice[] }>(`/invoices${params}`);
  return response.data;
}

export async function createInvoice(data: Partial<Invoice>): Promise<Invoice> {
  return apiFetch('/invoices', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateInvoice(id: string, data: Partial<Invoice>): Promise<Invoice> {
  return apiFetch(`/invoices/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteInvoice(id: string): Promise<void> {
  await fetch(`${API_BASE}/invoices/${id}`, { method: 'DELETE' });
}

// ========================
// BILLS
// ========================
export interface Bill {
  id: string;
  billNumber: string;
  vendorId: string;
  vendorName: string;
  status: 'draft' | 'pending' | 'approved' | 'partial' | 'paid' | 'overdue' | 'cancelled';
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  notes?: string;
  approvedAt?: string;
  paidAt?: string;
}

export async function getBills(companyId?: string): Promise<Bill[]> {
  const params = companyId ? `?companyId=${companyId}` : '';
  const response = await apiFetch<{ data: Bill[] }>(`/bills${params}`);
  return response.data;
}

export async function createBill(data: Partial<Bill>): Promise<Bill> {
  return apiFetch('/bills', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateBill(id: string, data: Partial<Bill>): Promise<Bill> {
  return apiFetch(`/bills/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteBill(id: string): Promise<void> {
  await fetch(`${API_BASE}/bills/${id}`, { method: 'DELETE' });
}

// ========================
// STOP ORDERS
// ========================
export interface StopOrder {
  id: string;
  form_number?: string;
  form_date?: string;
  status?: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'active' | 'completed' | 'cancelled';
  type: 'amount' | 'vendor' | 'category' | 'recurring' | 'date' | 'payroll';
  isActive: boolean;
  full_name?: string;
  sex?: 'M' | 'F';
  nrc_no?: string;
  man_no?: string;
  rank?: string;
  barrack?: string;
  district?: string;
  province?: string;
  mobile?: string;
  email?: string;
  deduction_amount?: number;
  duration_months?: number;
  start_date?: string;
  monthly_deduction_from?: string;
  monthly_deduction_to?: string;
  amount_in_words?: string;
  authorized_by?: string;
  account_number?: string;
  company_name?: string;
  submittedBy?: string;
  submittedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  approvalNotes?: string;
  verification_hash?: string;
  client_name?: string;
  delivery_date?: string;
  delivered_by?: string;
  product_no?: string;
  target?: string;
  conditions?: Record<string, unknown>;
  reason?: string;
  effectiveFrom?: string;
  expiresAt?: string;
  notifyOnTrigger: boolean;
  requireOverride: boolean;
  triggeredCount: number;
  blockedAmount: number;
}

export async function getStopOrders(companyId?: string): Promise<StopOrder[]> {
  const params = companyId ? `?companyId=${companyId}` : '';
  const response = await apiFetch<{ data: StopOrder[] }>(`/stop-orders${params}`);
  return response.data;
}

export async function createStopOrder(data: Partial<StopOrder>): Promise<StopOrder> {
  return apiFetch('/stop-orders', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateStopOrder(id: string, data: Partial<StopOrder>): Promise<StopOrder> {
  return apiFetch(`/stop-orders/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteStopOrder(id: string): Promise<void> {
  await fetch(`${API_BASE}/stop-orders/${id}`, { method: 'DELETE' });
}

// ========================
// BUDGETS
// ========================
export interface Budget {
  id: string;
  name: string;
  period: 'monthly' | 'quarterly' | 'annual';
  startDate: string;
  endDate: string;
  totalAllocated: number;
  totalSpent: number;
  status: 'draft' | 'active' | 'closed';
  lineItems: {
    id: string;
    categoryId: string;
    categoryName: string;
    allocated: number;
    spent: number;
    alertThreshold: number;
  }[];
}

export async function getBudgets(companyId?: string): Promise<Budget[]> {
  const params = companyId ? `?companyId=${companyId}` : '';
  const response = await apiFetch<{ data: Budget[] }>(`/budgets${params}`);
  return response.data;
}

export async function createBudget(data: Partial<Budget>): Promise<Budget> {
  return apiFetch('/budgets', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateBudget(id: string, data: Partial<Budget>): Promise<Budget> {
  return apiFetch(`/budgets/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteBudget(id: string): Promise<void> {
  await fetch(`${API_BASE}/budgets/${id}`, { method: 'DELETE' });
}

// ========================
// USERS
// ========================
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'manager' | 'clerk';
  isActive: boolean;
  lastLoginAt?: string;
  createdAt?: string;
  company?: string;
}

export async function getUsers(companyId?: string): Promise<User[]> {
  const params = companyId ? `?companyId=${companyId}` : '';
  const response = await apiFetch<{ data: User[] }>(`/users${params}`);
  return response.data;
}

export async function createUser(data: Partial<User> & { password: string }): Promise<User> {
  return apiFetch('/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateUser(id: string, data: Partial<User>): Promise<User> {
  return apiFetch(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// ========================
// AUDIT LOGS
// ========================
export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

export async function getAuditLogs(filters?: { userId?: string; action?: string; startDate?: string; endDate?: string; limit?: number }): Promise<AuditLog[]> {
  const params = new URLSearchParams();
  if (filters?.userId) params.set('userId', filters.userId);
  if (filters?.action) params.set('action', filters.action);
  if (filters?.startDate) params.set('startDate', filters.startDate);
  if (filters?.endDate) params.set('endDate', filters.endDate);
  if (filters?.limit) params.set('limit', String(filters.limit));

  const response = await apiFetch<{ data: AuditLog[] }>(`/audit-logs?${params.toString()}`);
  return response.data;
}

// ========================
// CATEGORIES (Helper)
// ========================
export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense' | 'both';
  color: string;
  icon?: string;
}

// Categories are typically static, but we can fetch them if needed
export function getDefaultCategories(): Category[] {
  return [
    { id: 'cat_1', name: 'Sales Revenue', type: 'income', color: '#10B981' },
    { id: 'cat_2', name: 'Service Income', type: 'income', color: '#3B82F6' },
    { id: 'cat_3', name: 'Investment Income', type: 'income', color: '#8B5CF6' },
    { id: 'cat_4', name: 'Office Supplies', type: 'expense', color: '#F59E0B' },
    { id: 'cat_5', name: 'Utilities', type: 'expense', color: '#EF4444' },
    { id: 'cat_6', name: 'Marketing', type: 'expense', color: '#EC4899' },
    { id: 'cat_7', name: 'Payroll', type: 'expense', color: '#6366F1' },
    { id: 'cat_8', name: 'Rent', type: 'expense', color: '#14B8A6' },
    { id: 'cat_9', name: 'Insurance', type: 'expense', color: '#F97316' },
    { id: 'cat_10', name: 'Professional Services', type: 'expense', color: '#84CC16' },
  ];
}

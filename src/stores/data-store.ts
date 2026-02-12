import { create } from "zustand";

export interface Transaction {
  id: string;
  type: "income" | "expense" | "transfer";
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
  status: "pending" | "completed" | "cancelled";
  isReconciled: boolean;
  isTaxable: boolean;
  taxAmount?: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  status: "draft" | "sent" | "viewed" | "partial" | "paid" | "overdue" | "cancelled";
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

export interface Bill {
  id: string;
  billNumber: string;
  vendorId: string;
  vendorName: string;
  status: "draft" | "pending" | "approved" | "partial" | "paid" | "overdue" | "cancelled";
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

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  creditLimit: number;
  paymentTerms: number;
  balance: number;
}

export interface Vendor {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  paymentTerms: number;
  balance: number;
}

export interface Category {
  id: string;
  name: string;
  type: "income" | "expense" | "both";
  color: string;
  icon?: string;
}

export interface StopOrder {
  id: string;
  
  // Form metadata
  formDate?: string;
  type: "amount" | "vendor" | "category" | "recurring" | "date" | "payroll";
  isActive: boolean;
  
  // Employee details (for payroll)
  fullName?: string;
  sex?: "M" | "F";
  nrcNo?: string;
  manNo?: string;
  rank?: "officer" | "soldier" | "civilian";
  barrack?: string;
  district?: string;
  province?: string;
  mobile?: string;
  email?: string;
  
  // Deduction details (for payroll)
  deductionAmount?: number;
  durationMonths?: number;
  startMonth?: string;
  monthlyDeductionFrom?: string;
  monthlyDeductionTo?: string;
  amountInWords?: string;
  authorizedBy?: string;
  
  // Remittance details
  accountNumber?: string;
  companyName?: string;
  
  // Legacy fields (for backward compatibility)
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

export interface Budget {
  id: string;
  name: string;
  period: "monthly" | "quarterly" | "annual";
  startDate: string;
  endDate: string;
  totalAllocated: number;
  totalSpent: number;
  status: "draft" | "active" | "closed";
  lineItems: {
    id: string;
    categoryId: string;
    categoryName: string;
    allocated: number;
    spent: number;
    alertThreshold: number;
  }[];
}

interface DataState {
  // Data
  transactions: Transaction[];
  invoices: Invoice[];
  bills: Bill[];
  customers: Customer[];
  vendors: Vendor[];
  categories: Category[];
  stopOrders: StopOrder[];
  budgets: Budget[];
  
  // UI State
  isLoading: boolean;
  
  // Actions - Transactions
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  
  // Actions - Invoices
  addInvoice: (invoice: Invoice) => void;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  
  // Actions - Bills
  addBill: (bill: Bill) => void;
  updateBill: (id: string, updates: Partial<Bill>) => void;
  deleteBill: (id: string) => void;
  
  // Actions - Customers
  addCustomer: (customer: Customer) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  
  // Actions - Vendors
  addVendor: (vendor: Vendor) => void;
  updateVendor: (id: string, updates: Partial<Vendor>) => void;
  
  // Actions - Stop Orders
  addStopOrder: (stopOrder: StopOrder) => void;
  updateStopOrder: (id: string, updates: Partial<StopOrder>) => void;
  deleteStopOrder: (id: string) => void;
  
  // Actions - Budgets
  addBudget: (budget: Budget) => void;
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;
  
  // Initialize with mock data
  initializeMockData: () => void;
}

// Generate mock data
const generateMockTransactions = (): Transaction[] => {
  const categories = [
    { id: "cat_1", name: "Sales Revenue", type: "income" as const },
    { id: "cat_2", name: "Service Income", type: "income" as const },
    { id: "cat_3", name: "Office Supplies", type: "expense" as const },
    { id: "cat_4", name: "Utilities", type: "expense" as const },
    { id: "cat_5", name: "Marketing", type: "expense" as const },
    { id: "cat_6", name: "Payroll", type: "expense" as const },
  ];
  
  const transactions: Transaction[] = [];
  const paymentMethods = ["bank_transfer", "credit_card", "check", "cash"];
  
  for (let i = 0; i < 50; i++) {
    const isIncome = Math.random() > 0.5;
    const category = isIncome 
      ? categories.filter(c => c.type === "income")[Math.floor(Math.random() * 2)]
      : categories.filter(c => c.type === "expense")[Math.floor(Math.random() * 4)];
    
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 90));
    
    transactions.push({
      id: `txn_${i + 1}`,
      type: isIncome ? "income" : "expense",
      amount: Math.floor(Math.random() * 10000) + 100,
      date: date.toISOString(),
      category: category.name,
      categoryId: category.id,
      customer: isIncome ? `Customer ${Math.floor(Math.random() * 10) + 1}` : undefined,
      vendor: !isIncome ? `Vendor ${Math.floor(Math.random() * 10) + 1}` : undefined,
      paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
      description: `${category.name} - ${isIncome ? "Payment received" : "Payment made"}`,
      status: Math.random() > 0.2 ? "completed" : "pending",
      isReconciled: Math.random() > 0.3,
      isTaxable: true,
    });
  }
  
  return transactions;
};

const generateMockInvoices = (): Invoice[] => {
  const customers = ["Acme Corp", "XYZ Ltd", "Smith & Co", "Johnson Inc", "Tech Solutions"];
  const invoices: Invoice[] = [];
  const statuses: Invoice["status"][] = ["draft", "sent", "viewed", "partial", "paid", "overdue"];
  
  for (let i = 0; i < 20; i++) {
    const subtotal = Math.floor(Math.random() * 5000) + 500;
    const taxAmount = subtotal * 0.1;
    const totalAmount = subtotal + taxAmount;
    const amountPaid = Math.random() > 0.5 ? totalAmount : Math.floor(Math.random() * totalAmount);
    
    const issueDate = new Date();
    issueDate.setDate(issueDate.getDate() - Math.floor(Math.random() * 60));
    
    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + 30);
    
    invoices.push({
      id: `inv_${i + 1}`,
      invoiceNumber: `INV-2024-${String(1000 + i).padStart(4, "0")}`,
      customerId: `cust_${Math.floor(Math.random() * 5) + 1}`,
      customerName: customers[Math.floor(Math.random() * customers.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      issueDate: issueDate.toISOString(),
      dueDate: dueDate.toISOString(),
      subtotal,
      taxAmount,
      totalAmount,
      amountPaid,
      lineItems: [
        {
          id: `li_${i}_1`,
          description: "Professional Services",
          quantity: Math.floor(Math.random() * 10) + 1,
          unitPrice: Math.floor(Math.random() * 200) + 50,
          total: subtotal,
        },
      ],
    });
  }
  
  return invoices;
};

const generateMockBills = (): Bill[] => {
  const vendors = ["Office Supplies Co", "Utility Provider", "Marketing Agency", "IT Services", "Insurance Co"];
  const bills: Bill[] = [];
  const statuses: Bill["status"][] = ["draft", "pending", "approved", "partial", "paid", "overdue"];
  
  for (let i = 0; i < 15; i++) {
    const subtotal = Math.floor(Math.random() * 3000) + 200;
    const taxAmount = subtotal * 0.1;
    const totalAmount = subtotal + taxAmount;
    
    const issueDate = new Date();
    issueDate.setDate(issueDate.getDate() - Math.floor(Math.random() * 45));
    
    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + 30);
    
    bills.push({
      id: `bill_${i + 1}`,
      billNumber: `BILL-2024-${String(1000 + i).padStart(4, "0")}`,
      vendorId: `vend_${Math.floor(Math.random() * 5) + 1}`,
      vendorName: vendors[Math.floor(Math.random() * vendors.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      issueDate: issueDate.toISOString(),
      dueDate: dueDate.toISOString(),
      subtotal,
      taxAmount,
      totalAmount,
      amountPaid: Math.random() > 0.6 ? totalAmount : Math.floor(Math.random() * totalAmount * 0.5),
    });
  }
  
  return bills;
};

const generateMockCustomers = (): Customer[] => {
  return [
    { id: "cust_1", name: "Acme Corp", email: "billing@acme.com", phone: "555-0101", creditLimit: 50000, paymentTerms: 30, balance: 12500 },
    { id: "cust_2", name: "XYZ Ltd", email: "accounts@xyz.com", phone: "555-0102", creditLimit: 30000, paymentTerms: 30, balance: 8500 },
    { id: "cust_3", name: "Smith & Co", email: "finance@smith.com", phone: "555-0103", creditLimit: 20000, paymentTerms: 45, balance: 3200 },
    { id: "cust_4", name: "Johnson Inc", email: "pay@johnson.com", phone: "555-0104", creditLimit: 40000, paymentTerms: 30, balance: 0 },
    { id: "cust_5", name: "Tech Solutions", email: "ar@techsol.com", phone: "555-0105", creditLimit: 25000, paymentTerms: 60, balance: 15800 },
  ];
};

const generateMockVendors = (): Vendor[] => {
  return [
    { id: "vend_1", name: "Office Supplies Co", email: "billing@officesupplies.com", phone: "555-1001", paymentTerms: 30, balance: 2500 },
    { id: "vend_2", name: "Utility Provider", email: "payments@utility.com", phone: "555-1002", paymentTerms: 15, balance: 1200 },
    { id: "vend_3", name: "Marketing Agency", email: "invoices@marketing.com", phone: "555-1003", paymentTerms: 30, balance: 5000 },
    { id: "vend_4", name: "IT Services", email: "billing@itservices.com", phone: "555-1004", paymentTerms: 45, balance: 3500 },
    { id: "vend_5", name: "Insurance Co", email: "premiums@insurance.com", phone: "555-1005", paymentTerms: 30, balance: 800 },
  ];
};

const generateMockCategories = (): Category[] => {
  return [
    { id: "cat_1", name: "Sales Revenue", type: "income", color: "#10B981" },
    { id: "cat_2", name: "Service Income", type: "income", color: "#3B82F6" },
    { id: "cat_3", name: "Investment Income", type: "income", color: "#8B5CF6" },
    { id: "cat_4", name: "Office Supplies", type: "expense", color: "#F59E0B" },
    { id: "cat_5", name: "Utilities", type: "expense", color: "#EF4444" },
    { id: "cat_6", name: "Marketing", type: "expense", color: "#EC4899" },
    { id: "cat_7", name: "Payroll", type: "expense", color: "#6366F1" },
    { id: "cat_8", name: "Rent", type: "expense", color: "#14B8A6" },
    { id: "cat_9", name: "Insurance", type: "expense", color: "#F97316" },
    { id: "cat_10", name: "Professional Services", type: "expense", color: "#84CC16" },
  ];
};

const generateMockStopOrders = (): StopOrder[] => {
  return [
    {
      id: "stop_1",
      type: "payroll",
      fullName: "CHIPOTA JAMES",
      sex: "M",
      nrcNo: "123456/78/1",
      manNo: "ARMY/2019/045",
      rank: "officer",
      barrack: "Lusaka Barracks",
      district: "Lusaka",
      province: "Lusaka",
      mobile: "+260 97X XXX XXX",
      deductionAmount: 2500,
      durationMonths: 6,
      startMonth: "2024-01",
      monthlyDeductionFrom: "2024-01-01",
      monthlyDeductionTo: "2024-06-30",
      amountInWords: "Two Thousand Five Hundred Kwacha Only",
      authorizedBy: "Col. M. Banda",
      accountNumber: "9060160002109",
      companyName: "Petrichor Five General Dealers",
      formDate: "2024-01-15",
      isActive: true,
      notifyOnTrigger: true,
      requireOverride: true,
      triggeredCount: 2,
      blockedAmount: 5000,
      reason: "Salary deduction authorization",
    },
    {
      id: "stop_2",
      type: "payroll",
      fullName: "MULENGA PRECIOUS",
      sex: "F",
      nrcNo: "234567/89/2",
      manNo: "ARMY/2020/112",
      rank: "soldier",
      barrack: "Kabwe Barracks",
      district: "Central",
      province: "Central",
      mobile: "+260 96X XXX XXX",
      deductionAmount: 1500,
      durationMonths: 12,
      startMonth: "2024-02",
      monthlyDeductionFrom: "2024-02-01",
      monthlyDeductionTo: "2025-01-31",
      amountInWords: "One Thousand Five Hundred Kwacha Only",
      authorizedBy: "Lt. Col. S. Mwansa",
      accountNumber: "9060160002109",
      companyName: "Petrichor Five General Dealers",
      formDate: "2024-02-01",
      isActive: true,
      notifyOnTrigger: true,
      requireOverride: true,
      triggeredCount: 5,
      blockedAmount: 7500,
      reason: "Salary deduction authorization",
    },
    {
      id: "stop_3",
      type: "payroll",
      fullName: "CHANDA ROBERT",
      sex: "M",
      nrcNo: "345678/90/3",
      manNo: "ARMY/2018/089",
      rank: "civilian",
      barrack: "Nairobi Camp",
      district: "Livingstone",
      province: "Southern",
      mobile: "+260 95X XXX XXX",
      deductionAmount: 3000,
      durationMonths: 3,
      startMonth: "2024-03",
      monthlyDeductionFrom: "2024-03-01",
      monthlyDeductionTo: "2024-05-31",
      amountInWords: "Three Thousand Kwacha Only",
      authorizedBy: "Maj. T. Phiri",
      accountNumber: "9060160002109",
      companyName: "Petrichor Five General Dealers",
      formDate: "2024-03-10",
      isActive: true,
      notifyOnTrigger: true,
      requireOverride: true,
      triggeredCount: 1,
      blockedAmount: 3000,
      reason: "Salary deduction authorization",
    },
  ];
};

const generateMockBudgets = (): Budget[] => {
  return [
    {
      id: "budget_1",
      name: "Q1 2024 Marketing Budget",
      period: "quarterly",
      startDate: "2024-01-01",
      endDate: "2024-03-31",
      totalAllocated: 50000,
      totalSpent: 37500,
      status: "active",
      lineItems: [
        { id: "bl_1", categoryId: "cat_6", categoryName: "Marketing", allocated: 25000, spent: 18750, alertThreshold: 80 },
        { id: "bl_2", categoryId: "cat_10", categoryName: "Professional Services", allocated: 15000, spent: 12000, alertThreshold: 80 },
        { id: "bl_3", categoryId: "cat_4", categoryName: "Office Supplies", allocated: 10000, spent: 6750, alertThreshold: 80 },
      ],
    },
    {
      id: "budget_2",
      name: "2024 Annual Operating Budget",
      period: "annual",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      totalAllocated: 500000,
      totalSpent: 125000,
      status: "active",
      lineItems: [
        { id: "bl_4", categoryId: "cat_7", categoryName: "Payroll", allocated: 300000, spent: 75000, alertThreshold: 80 },
        { id: "bl_5", categoryId: "cat_8", categoryName: "Rent", allocated: 48000, spent: 12000, alertThreshold: 80 },
        { id: "bl_6", categoryId: "cat_5", categoryName: "Utilities", allocated: 24000, spent: 6000, alertThreshold: 80 },
        { id: "bl_7", categoryId: "cat_9", categoryName: "Insurance", allocated: 18000, spent: 4500, alertThreshold: 80 },
      ],
    },
  ];
};

export const useDataStore = create<DataState>((set) => ({
  transactions: [],
  invoices: [],
  bills: [],
  customers: [],
  vendors: [],
  categories: [],
  stopOrders: [],
  budgets: [],
  isLoading: false,

  addTransaction: (transaction) =>
    set((state) => ({ transactions: [transaction, ...state.transactions] })),

  updateTransaction: (id, updates) =>
    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    })),

  deleteTransaction: (id) =>
    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
    })),

  addInvoice: (invoice) =>
    set((state) => ({ invoices: [invoice, ...state.invoices] })),

  updateInvoice: (id, updates) =>
    set((state) => ({
      invoices: state.invoices.map((i) =>
        i.id === id ? { ...i, ...updates } : i
      ),
    })),

  deleteInvoice: (id) =>
    set((state) => ({
      invoices: state.invoices.filter((i) => i.id !== id),
    })),

  addBill: (bill) =>
    set((state) => ({ bills: [bill, ...state.bills] })),

  updateBill: (id, updates) =>
    set((state) => ({
      bills: state.bills.map((b) =>
        b.id === id ? { ...b, ...updates } : b
      ),
    })),

  deleteBill: (id) =>
    set((state) => ({
      bills: state.bills.filter((b) => b.id !== id),
    })),

  addCustomer: (customer) =>
    set((state) => ({ customers: [...state.customers, customer] })),

  updateCustomer: (id, updates) =>
    set((state) => ({
      customers: state.customers.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),

  addVendor: (vendor) =>
    set((state) => ({ vendors: [...state.vendors, vendor] })),

  updateVendor: (id, updates) =>
    set((state) => ({
      vendors: state.vendors.map((v) =>
        v.id === id ? { ...v, ...updates } : v
      ),
    })),

  addStopOrder: (stopOrder) =>
    set((state) => ({ stopOrders: [stopOrder, ...state.stopOrders] })),

  updateStopOrder: (id, updates) =>
    set((state) => ({
      stopOrders: state.stopOrders.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      ),
    })),

  deleteStopOrder: (id) =>
    set((state) => ({
      stopOrders: state.stopOrders.filter((s) => s.id !== id),
    })),

  addBudget: (budget) =>
    set((state) => ({ budgets: [budget, ...state.budgets] })),

  updateBudget: (id, updates) =>
    set((state) => ({
      budgets: state.budgets.map((b) =>
        b.id === id ? { ...b, ...updates } : b
      ),
    })),

  deleteBudget: (id) =>
    set((state) => ({
      budgets: state.budgets.filter((b) => b.id !== id),
    })),

  initializeMockData: () =>
    set({
      transactions: generateMockTransactions(),
      invoices: generateMockInvoices(),
      bills: generateMockBills(),
      customers: generateMockCustomers(),
      vendors: generateMockVendors(),
      categories: generateMockCategories(),
      stopOrders: generateMockStopOrders(),
      budgets: generateMockBudgets(),
    }),
}));

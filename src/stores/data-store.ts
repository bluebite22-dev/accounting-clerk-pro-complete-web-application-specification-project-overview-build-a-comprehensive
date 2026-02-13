import { create } from "zustand";
import * as db from "@/db/queries";

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
  phone2?: string;
  address?: string;
  contactPerson?: string;
  tin?: string;
  bankName?: string;
  bankAccount?: string;
  paymentTerms?: string;
  creditLimit: number;
  paymentTermsNum: number;
  balance: number;
  status: "active" | "inactive";
  createdAt?: string;
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
  
  // Form metadata (snake_case for Petrichor5 compatibility)
  form_number?: string;
  form_date?: string;
  status?: "draft" | "pending_approval" | "approved" | "rejected" | "active" | "completed" | "cancelled";
  type: "amount" | "vendor" | "category" | "recurring" | "date" | "payroll";
  isActive: boolean;
  
  // Employee details (for payroll)
  full_name?: string;
  sex?: "M" | "F";
  nrc_no?: string;
  man_no?: string;
  rank?: string;
  barrack?: string;
  district?: string;
  province?: string;
  mobile?: string;
  email?: string;
  
  // Deduction details (for payroll)
  deduction_amount?: number;
  duration_months?: number;
  start_date?: string;
  monthly_deduction_from?: string;
  monthly_deduction_to?: string;
  amount_in_words?: string;
  authorized_by?: string;
  
  // Remittance details
  account_number?: string;
  company_name?: string;
  
  // Approval workflow
  submittedBy?: string;
  submittedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  approvalNotes?: string;
  
  // Internal fields
  verification_hash?: string;
  client_name?: string;
  delivery_date?: string;
  delivered_by?: string;
  product_no?: string;
  
  // Legacy fields (for backward compatibility)
  fullName?: string;
  nrcNo?: string;
  manNo?: string;
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
  isDbConnected: boolean;
  
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
  
  // Database initialization
  initializeFromDatabase: () => Promise<void>;
  
  // Fallback to mock data
  initializeMockData: () => void;
}

// Generate mock data for fallback
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
    { id: "cust_1", name: "Acme Corp", email: "billing@acme.com", phone: "555-0101", creditLimit: 50000, paymentTermsNum: 30, balance: 12500, status: "active", paymentTerms: "30 days" },
    { id: "cust_2", name: "XYZ Ltd", email: "accounts@xyz.com", phone: "555-0102", creditLimit: 30000, paymentTermsNum: 30, balance: 8500, status: "active", paymentTerms: "30 days" },
    { id: "cust_3", name: "Smith & Co", email: "finance@smith.com", phone: "555-0103", creditLimit: 20000, paymentTermsNum: 45, balance: 3200, status: "active", paymentTerms: "45 days" },
    { id: "cust_4", name: "Johnson Inc", email: "pay@johnson.com", phone: "555-0104", creditLimit: 40000, paymentTermsNum: 30, balance: 0, status: "active", paymentTerms: "30 days" },
    { id: "cust_5", name: "Tech Solutions", email: "ar@techsol.com", phone: "555-0105", creditLimit: 25000, paymentTermsNum: 60, balance: 15800, status: "active", paymentTerms: "60 days" },
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
      full_name: "CHIPOTA JAMES",
      sex: "M",
      nrc_no: "123456/78/1",
      man_no: "ARMY/2019/045",
      rank: "Officer",
      barrack: "Lusaka Barracks",
      district: "Lusaka",
      province: "Lusaka",
      mobile: "+260 97X XXX XXX",
      deduction_amount: 2500,
      duration_months: 6,
      start_date: "2024-01",
      monthly_deduction_from: "2024-01-01",
      monthly_deduction_to: "2024-06-30",
      amount_in_words: "Two Thousand Five Hundred Kwacha Only",
      authorized_by: "Col. M. Banda",
      account_number: "9060160002109",
      company_name: "Petrichor Five General Dealers",
      form_date: "2024-01-15",
      status: "active",
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
      full_name: "MULENGA PRECIOUS",
      sex: "F",
      nrc_no: "234567/89/2",
      man_no: "ARMY/2020/112",
      rank: "Soldier",
      barrack: "Kabwe Barracks",
      district: "Central",
      province: "Central",
      mobile: "+260 96X XXX XXX",
      deduction_amount: 1500,
      duration_months: 12,
      start_date: "2024-02",
      monthly_deduction_from: "2024-02-01",
      monthly_deduction_to: "2025-01-31",
      amount_in_words: "One Thousand Five Hundred Kwacha Only",
      authorized_by: "Lt. Col. S. Mwansa",
      account_number: "9060160002109",
      company_name: "Petrichor Five General Dealers",
      form_date: "2024-02-01",
      status: "active",
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
      full_name: "CHANDA ROBERT",
      sex: "M",
      nrc_no: "345678/90/3",
      man_no: "ARMY/2018/089",
      rank: "Civilian",
      barrack: "Nairobi Camp",
      district: "Livingstone",
      province: "Southern",
      mobile: "+260 95X XXX XXX",
      deduction_amount: 3000,
      duration_months: 3,
      start_date: "2024-03",
      monthly_deduction_from: "2024-03-01",
      monthly_deduction_to: "2024-05-31",
      amount_in_words: "Three Thousand Kwacha Only",
      authorized_by: "Maj. T. Phiri",
      account_number: "9060160002109",
      company_name: "Petrichor Five General Dealers",
      form_date: "2024-03-10",
      status: "active",
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

export const useDataStore = create<DataState>((set, get) => ({
  transactions: [],
  invoices: [],
  bills: [],
  customers: [],
  vendors: [],
  categories: [],
  stopOrders: [],
  budgets: [],
  isLoading: false,
  isDbConnected: false,

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

  // Try to load from database, fallback to mock data
  initializeFromDatabase: async () => {
    set({ isLoading: true });
    
    try {
      // Initialize the database (create tables and seed if needed)
      await db.initializeDatabase();
      
      // Try to fetch data from database
      const [customers, vendors, categories, stopOrders, budgets] = await Promise.all([
        db.getCustomers(),
        db.getVendors(),
        db.getCategories(),
        db.getStopOrders(),
        db.getBudgets(),
      ]);
      
      // Map database records to store interfaces
      const mappedCustomers: Customer[] = customers.map(c => ({
        id: c.id,
        name: c.name,
        email: c.email || "",
        phone: c.phone || undefined,
        address: c.address || undefined,
        creditLimit: c.creditLimit || 0,
        paymentTermsNum: c.paymentTerms || 30,
        balance: 0,
        status: c.isActive ? "active" : "inactive",
        createdAt: c.createdAt?.toISOString(),
      }));
      
      const mappedVendors: Vendor[] = vendors.map(v => ({
        id: v.id,
        name: v.name,
        email: v.email || undefined,
        phone: v.phone || undefined,
        paymentTerms: v.paymentTerms || 30,
        balance: 0,
      }));
      
      const mappedCategories: Category[] = categories.map(c => ({
        id: c.id,
        name: c.name,
        type: c.type as "income" | "expense" | "both",
        color: c.color || "#6B7280",
        icon: c.icon || undefined,
      }));
      
      const mappedStopOrders: StopOrder[] = stopOrders.map(s => ({
        id: s.id,
        type: s.type as StopOrder["type"],
        isActive: s.isActive,
        full_name: s.fullName || undefined,
        sex: s.sex as StopOrder["sex"],
        nrc_no: s.nrcNo || undefined,
        man_no: s.manNo || undefined,
        rank: s.rank as StopOrder["rank"],
        barrack: s.barrack || undefined,
        district: s.district || undefined,
        province: s.province || undefined,
        mobile: s.mobile || undefined,
        email: s.email || undefined,
        deduction_amount: s.deductionAmount || undefined,
        duration_months: s.durationMonths || undefined,
        start_date: s.startMonth || undefined,
        monthly_deduction_from: s.monthlyDeductionFrom?.toISOString(),
        monthly_deduction_to: s.monthlyDeductionTo?.toISOString(),
        amount_in_words: s.amountInWords || undefined,
        authorized_by: s.authorizedBy || undefined,
        account_number: s.accountNumber || undefined,
        company_name: s.companyName || undefined,
        notifyOnTrigger: s.notifyOnTrigger || false,
        requireOverride: s.requireOverride || false,
        triggeredCount: s.triggeredCount || 0,
        blockedAmount: s.blockedAmount || 0,
        reason: s.reason || undefined,
      }));
      
      const mappedBudgets: Budget[] = budgets.map(b => ({
        id: b.id,
        name: b.name,
        period: b.period as Budget["period"],
        startDate: b.startDate?.toISOString() || "",
        endDate: b.endDate?.toISOString() || "",
        totalAllocated: b.totalAllocated,
        totalSpent: b.totalSpent || 0,
        status: b.status as Budget["status"],
        lineItems: [],
      }));
      
      // If we have database data, use it
      if (customers.length > 0 || vendors.length > 0 || categories.length > 0 || stopOrders.length > 0 || budgets.length > 0) {
        set({
          customers: mappedCustomers,
          vendors: mappedVendors,
          categories: mappedCategories,
          stopOrders: mappedStopOrders,
          budgets: mappedBudgets,
          isDbConnected: true,
          isLoading: false,
        });
        console.log("Database connected - loaded from SQLite");
        return;
      }
      
      // If no data in database, use mock data
      console.log("Database connected but empty - using mock data");
      get().initializeMockData();
      set({ isDbConnected: true, isLoading: false });
      
    } catch (error) {
      console.error("Database connection failed, using mock data:", error);
      get().initializeMockData();
      set({ isDbConnected: false, isLoading: false });
    }
  },

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

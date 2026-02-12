"use client";

import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { useDataStore } from "@/stores/data-store";
import { formatCurrency, formatDate, generateId } from "@/lib/utils";
import {
  Plus,
  Search,
  Filter,
  Download,
  TrendingUp,
  Calendar,
  DollarSign,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";

const incomeCategories = [
  { value: "sales", label: "Sales Revenue" },
  { value: "service", label: "Service Income" },
  { value: "investment", label: "Investment Income" },
  { value: "loan", label: "Loan Proceeds" },
  { value: "other", label: "Other Income" },
];

const paymentMethods = [
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "credit_card", label: "Credit Card" },
  { value: "check", label: "Check" },
  { value: "cash", label: "Cash" },
  { value: "other", label: "Other" },
];

export default function IncomePage() {
  const { transactions, customers, addTransaction, deleteTransaction } = useDataStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  
  // Form state
  const [formData, setFormData] = useState({
    amount: "",
    date: new Date().toISOString().split("T")[0],
    category: "",
    customer: "",
    paymentMethod: "",
    reference: "",
    description: "",
    notes: "",
    isTaxable: true,
  });

  const incomeTransactions = transactions.filter((t) => t.type === "income");

  const filteredTransactions = incomeTransactions.filter((t) => {
    const matchesSearch =
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.customer && t.customer.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = !selectedCategory || t.categoryId === selectedCategory;
    const matchesPaymentMethod = !selectedPaymentMethod || t.paymentMethod === selectedPaymentMethod;
    return matchesSearch && matchesCategory && matchesPaymentMethod;
  });

  const totalIncome = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newTransaction = {
      id: generateId(),
      type: "income" as const,
      amount: parseFloat(formData.amount),
      date: new Date(formData.date).toISOString(),
      category: incomeCategories.find((c) => c.value === formData.category)?.label || "",
      categoryId: formData.category,
      customer: formData.customer,
      paymentMethod: formData.paymentMethod,
      reference: formData.reference,
      description: formData.description,
      notes: formData.notes,
      status: "completed" as const,
      isReconciled: false,
      isTaxable: formData.isTaxable,
    };

    addTransaction(newTransaction);
    setShowAddModal(false);
    setFormData({
      amount: "",
      date: new Date().toISOString().split("T")[0],
      category: "",
      customer: "",
      paymentMethod: "",
      reference: "",
      description: "",
      notes: "",
      isTaxable: true,
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Income</h1>
            <p className="text-neutral-400">Track and manage your income transactions</p>
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Income
          </Button>
        </div>

        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-green-500/20 p-3">
                  <TrendingUp className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-neutral-400">Total Income</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(totalIncome)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-blue-500/20 p-3">
                  <Calendar className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-neutral-400">This Month</p>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(incomeTransactions.filter((t) => {
                      const txnDate = new Date(t.date);
                      const now = new Date();
                      return txnDate.getMonth() === now.getMonth() && txnDate.getFullYear() === now.getFullYear();
                    }).reduce((sum, t) => sum + t.amount, 0))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-purple-500/20 p-3">
                  <DollarSign className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-neutral-400">Transactions</p>
                  <p className="text-2xl font-bold text-white">{filteredTransactions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                <Input
                  type="search"
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                options={[{ value: "", label: "All Categories" }, ...incomeCategories]}
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full sm:w-48"
              />
              <Select
                options={[{ value: "", label: "All Payment Methods" }, ...paymentMethods]}
                value={selectedPaymentMethod}
                onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                className="w-full sm:w-48"
              />
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transactions table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="text-neutral-300">
                    {formatDate(transaction.date)}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-neutral-100">{transaction.description}</p>
                      {transaction.reference && (
                        <p className="text-xs text-neutral-500">Ref: {transaction.reference}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{transaction.category}</Badge>
                  </TableCell>
                  <TableCell className="text-neutral-300">
                    {transaction.customer || "-"}
                  </TableCell>
                  <TableCell className="text-neutral-300 capitalize">
                    {transaction.paymentMethod?.replace("_", " ")}
                  </TableCell>
                  <TableCell className="text-right font-medium text-green-400">
                    +{formatCurrency(transaction.amount)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={transaction.status === "completed" ? "success" : "warning"}>
                      {transaction.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-400 hover:text-red-300"
                        onClick={() => deleteTransaction(transaction.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredTransactions.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-neutral-500">No income transactions found</p>
            </div>
          )}
        </Card>
      </div>

      {/* Add Income Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Income"
        description="Record a new income transaction"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-200">Date</label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-200">Amount</label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-200">Category</label>
              <Select
                options={[{ value: "", label: "Select category" }, ...incomeCategories]}
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Select category"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-200">Customer</label>
              <Input
                type="text"
                placeholder="Customer name"
                value={formData.customer}
                onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-200">Payment Method</label>
              <Select
                options={[{ value: "", label: "Select payment method" }, ...paymentMethods]}
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                placeholder="Select payment method"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-200">Reference</label>
              <Input
                type="text"
                placeholder="Invoice #, Transaction ID, etc."
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-200">Description</label>
            <Input
              type="text"
              placeholder="Brief description of the income"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-200">Notes</label>
            <textarea
              className="flex min-h-[80px] w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Additional notes..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="taxable"
              checked={formData.isTaxable}
              onChange={(e) => setFormData({ ...formData, isTaxable: e.target.checked })}
              className="h-4 w-4 rounded border-neutral-700 bg-neutral-800 text-blue-500 focus:ring-blue-500"
            />
            <label htmlFor="taxable" className="text-sm text-neutral-300">
              This income is taxable
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Income</Button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}

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
import { formatCurrency, formatDate, generateId, calculateDaysUntil } from "@/lib/utils";
import {
  Plus,
  Search,
  Download,
  FileText,
  Clock,
  AlertTriangle,
  DollarSign,
  Eye,
  Edit,
  Trash2,
  Send,
  CheckCircle,
} from "lucide-react";

const statusOptions = [
  { value: "", label: "All Status" },
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "viewed", label: "Viewed" },
  { value: "partial", label: "Partial Payment" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
  { value: "cancelled", label: "Cancelled" },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "paid":
      return <Badge variant="success">Paid</Badge>;
    case "overdue":
      return <Badge variant="destructive">Overdue</Badge>;
    case "partial":
      return <Badge variant="warning">Partial</Badge>;
    case "sent":
    case "viewed":
      return <Badge variant="default">{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
    case "cancelled":
      return <Badge variant="outline">Cancelled</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

export default function InvoicesPage() {
  const { invoices, customers, addInvoice, updateInvoice, deleteInvoice } = useDataStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  
  // Form state
  const [formData, setFormData] = useState({
    customerId: "",
    issueDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    lineItems: [{ description: "", quantity: "1", unitPrice: "" }],
    notes: "",
    terms: "Payment is due within 30 days.",
  });

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !selectedStatus || inv.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const totalReceivables = invoices
    .filter((i) => i.status !== "paid" && i.status !== "cancelled")
    .reduce((sum, i) => sum + (i.totalAmount - i.amountPaid), 0);

  const overdueAmount = invoices
    .filter((i) => i.status === "overdue" || (i.status !== "paid" && i.status !== "cancelled" && calculateDaysUntil(i.dueDate) < 0))
    .reduce((sum, i) => sum + (i.totalAmount - i.amountPaid), 0);

  const addLineItem = () => {
    setFormData({
      ...formData,
      lineItems: [...formData.lineItems, { description: "", quantity: "1", unitPrice: "" }],
    });
  };

  const removeLineItem = (index: number) => {
    setFormData({
      ...formData,
      lineItems: formData.lineItems.filter((_, i) => i !== index),
    });
  };

  const updateLineItem = (index: number, field: string, value: string) => {
    const updated = [...formData.lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, lineItems: updated });
  };

  const calculateSubtotal = () => {
    return formData.lineItems.reduce((sum, item) => {
      return sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0);
    }, 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const subtotal = calculateSubtotal();
    const taxAmount = subtotal * 0.1; // 10% tax
    const totalAmount = subtotal + taxAmount;
    const customer = customers.find((c) => c.id === formData.customerId);
    
    const newInvoice = {
      id: generateId(),
      invoiceNumber: `INV-2024-${String(1000 + invoices.length).padStart(4, "0")}`,
      customerId: formData.customerId,
      customerName: customer?.name || "Unknown",
      status: "draft" as const,
      issueDate: new Date(formData.issueDate).toISOString(),
      dueDate: new Date(formData.dueDate).toISOString(),
      subtotal,
      taxAmount,
      totalAmount,
      amountPaid: 0,
      lineItems: formData.lineItems.map((item, index) => ({
        id: `li_${index}`,
        description: item.description,
        quantity: parseFloat(item.quantity) || 1,
        unitPrice: parseFloat(item.unitPrice) || 0,
        total: (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0),
      })),
      notes: formData.notes,
      terms: formData.terms,
    };

    addInvoice(newInvoice);
    setShowAddModal(false);
    setFormData({
      customerId: "",
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: "",
      lineItems: [{ description: "", quantity: "1", unitPrice: "" }],
      notes: "",
      terms: "Payment is due within 30 days.",
    });
  };

  const handleSendInvoice = (invoiceId: string) => {
    updateInvoice(invoiceId, { status: "sent" });
  };

  const handleMarkAsPaid = (invoiceId: string) => {
    const invoice = invoices.find((i) => i.id === invoiceId);
    if (invoice) {
      updateInvoice(invoiceId, { 
        status: "paid", 
        amountPaid: invoice.totalAmount,
        paidAt: new Date().toISOString(),
      });
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Invoices</h1>
            <p className="text-neutral-400">Manage your accounts receivable</p>
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Invoice
          </Button>
        </div>

        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-blue-500/20 p-3">
                  <FileText className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-neutral-400">Total Invoices</p>
                  <p className="text-2xl font-bold text-white">{invoices.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-green-500/20 p-3">
                  <DollarSign className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-neutral-400">Total Receivables</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(totalReceivables)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-red-500/20 p-3">
                  <AlertTriangle className="h-6 w-6 text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-neutral-400">Overdue</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(overdueAmount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-purple-500/20 p-3">
                  <Clock className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-neutral-400">Pending</p>
                  <p className="text-2xl font-bold text-white">
                    {invoices.filter((i) => i.status !== "paid" && i.status !== "cancelled").length}
                  </p>
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
                  placeholder="Search invoices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                options={statusOptions}
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full sm:w-48"
              />
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Invoices table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => {
                const daysUntil = calculateDaysUntil(invoice.dueDate);
                const isOverdue = daysUntil < 0 && invoice.status !== "paid";
                
                return (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium text-blue-400">
                      {invoice.invoiceNumber}
                    </TableCell>
                    <TableCell className="text-neutral-100">{invoice.customerName}</TableCell>
                    <TableCell className="text-neutral-300">{formatDate(invoice.issueDate)}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-neutral-300">{formatDate(invoice.dueDate)}</p>
                        {isOverdue && (
                          <p className="text-xs text-red-400">{Math.abs(daysUntil)} days overdue</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium text-neutral-100">
                      {formatCurrency(invoice.totalAmount)}
                    </TableCell>
                    <TableCell className="text-right text-green-400">
                      {formatCurrency(invoice.amountPaid)}
                    </TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setSelectedInvoice(invoice.id);
                            setShowViewModal(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {invoice.status === "draft" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-400"
                            onClick={() => handleSendInvoice(invoice.id)}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                        {invoice.status !== "paid" && invoice.status !== "cancelled" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-green-400"
                            onClick={() => handleMarkAsPaid(invoice.id)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          {filteredInvoices.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-neutral-500">No invoices found</p>
            </div>
          )}
        </Card>
      </div>

      {/* Create Invoice Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Create Invoice"
        description="Create a new invoice for a customer"
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-200">Customer</label>
              <Select
                options={[
                  { value: "", label: "Select customer" },
                  ...customers.map((c) => ({ value: c.id, label: c.name })),
                ]}
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                placeholder="Select customer"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-200">Issue Date</label>
              <Input
                type="date"
                value={formData.issueDate}
                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-200">Due Date</label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-neutral-200">Line Items</label>
              <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                <Plus className="mr-1 h-4 w-4" />
                Add Item
              </Button>
            </div>
            
            {formData.lineItems.map((item, index) => (
              <div key={index} className="grid gap-2 sm:grid-cols-12 items-start">
                <div className="sm:col-span-6">
                  <Input
                    type="text"
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateLineItem(index, "description", e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Input
                    type="number"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateLineItem(index, "quantity", e.target.value)}
                  />
                </div>
                <div className="sm:col-span-3">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Price"
                    value={item.unitPrice}
                    onChange={(e) => updateLineItem(index, "unitPrice", e.target.value)}
                  />
                </div>
                <div className="sm:col-span-1">
                  {formData.lineItems.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 text-red-400"
                      onClick={() => removeLineItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="rounded-lg bg-neutral-800/50 p-4">
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">Subtotal:</span>
                  <span className="text-neutral-100">{formatCurrency(calculateSubtotal())}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">Tax (10%):</span>
                  <span className="text-neutral-100">{formatCurrency(calculateSubtotal() * 0.1)}</span>
                </div>
                <div className="flex justify-between border-t border-neutral-700 pt-2 font-medium">
                  <span className="text-neutral-200">Total:</span>
                  <span className="text-white">{formatCurrency(calculateSubtotal() * 1.1)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-200">Notes</label>
            <textarea
              className="flex min-h-[60px] w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Notes visible to customer..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-200">Terms & Conditions</label>
            <textarea
              className="flex min-h-[60px] w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.terms}
              onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Invoice</Button>
          </div>
        </form>
      </Modal>

      {/* View Invoice Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Invoice Details"
        size="lg"
      >
        {selectedInvoice && (() => {
          const invoice = invoices.find((i) => i.id === selectedInvoice);
          if (!invoice) return null;
          
          return (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-neutral-400">Invoice Number</p>
                  <p className="font-medium text-neutral-100">{invoice.invoiceNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-400">Status</p>
                  {getStatusBadge(invoice.status)}
                </div>
                <div>
                  <p className="text-sm text-neutral-400">Customer</p>
                  <p className="font-medium text-neutral-100">{invoice.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-400">Due Date</p>
                  <p className="font-medium text-neutral-100">{formatDate(invoice.dueDate)}</p>
                </div>
              </div>
              
              <div className="rounded-lg border border-neutral-800 p-4">
                <p className="mb-3 text-sm font-medium text-neutral-200">Line Items</p>
                <div className="space-y-2">
                  {invoice.lineItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-neutral-300">
                        {item.description} x {item.quantity}
                      </span>
                      <span className="text-neutral-100">{formatCurrency(item.total)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 border-t border-neutral-700 pt-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-400">Subtotal</span>
                    <span className="text-neutral-100">{formatCurrency(invoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-400">Tax</span>
                    <span className="text-neutral-100">{formatCurrency(invoice.taxAmount)}</span>
                  </div>
                  <div className="mt-2 flex justify-between font-medium">
                    <span className="text-neutral-200">Total</span>
                    <span className="text-white">{formatCurrency(invoice.totalAmount)}</span>
                  </div>
                  {invoice.amountPaid > 0 && (
                    <div className="mt-2 flex justify-between text-green-400">
                      <span>Amount Paid</span>
                      <span>{formatCurrency(invoice.amountPaid)}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowViewModal(false)}>
                  Close
                </Button>
                {invoice.status !== "paid" && (
                  <Button onClick={() => {
                    handleMarkAsPaid(invoice.id);
                    setShowViewModal(false);
                  }}>
                    Mark as Paid
                  </Button>
                )}
              </div>
            </div>
          );
        })()}
      </Modal>
    </AppLayout>
  );
}

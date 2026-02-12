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
  Building2,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
} from "lucide-react";

const statusOptions = [
  { value: "", label: "All Status" },
  { value: "draft", label: "Draft" },
  { value: "pending", label: "Pending Approval" },
  { value: "approved", label: "Approved" },
  { value: "partial", label: "Partial Payment" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
  { value: "cancelled", label: "Cancelled" },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "paid":
      return <Badge variant="success">Paid</Badge>;
    case "approved":
      return <Badge variant="success">Approved</Badge>;
    case "overdue":
      return <Badge variant="destructive">Overdue</Badge>;
    case "partial":
      return <Badge variant="warning">Partial</Badge>;
    case "pending":
      return <Badge variant="warning">Pending</Badge>;
    case "cancelled":
      return <Badge variant="outline">Cancelled</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

export default function BillsPage() {
  const { bills, vendors, addBill, updateBill, deleteBill } = useDataStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  
  // Form state
  const [formData, setFormData] = useState({
    vendorId: "",
    billNumber: "",
    issueDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    amount: "",
    notes: "",
  });

  const filteredBills = bills.filter((bill) => {
    const matchesSearch =
      bill.billNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.vendorName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !selectedStatus || bill.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const totalPayables = bills
    .filter((b) => b.status !== "paid" && b.status !== "cancelled")
    .reduce((sum, b) => sum + (b.totalAmount - b.amountPaid), 0);

  const overdueAmount = bills
    .filter((b) => b.status === "overdue" || (b.status !== "paid" && b.status !== "cancelled" && calculateDaysUntil(b.dueDate) < 0))
    .reduce((sum, b) => sum + (b.totalAmount - b.amountPaid), 0);

  const pendingApproval = bills.filter((b) => b.status === "pending").length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(formData.amount);
    const taxAmount = amount * 0.1;
    const totalAmount = amount + taxAmount;
    const vendor = vendors.find((v) => v.id === formData.vendorId);
    
    const newBill = {
      id: generateId(),
      billNumber: formData.billNumber || `BILL-2024-${String(1000 + bills.length).padStart(4, "0")}`,
      vendorId: formData.vendorId,
      vendorName: vendor?.name || "Unknown",
      status: "pending" as const,
      issueDate: new Date(formData.issueDate).toISOString(),
      dueDate: new Date(formData.dueDate).toISOString(),
      subtotal: amount,
      taxAmount,
      totalAmount,
      amountPaid: 0,
      notes: formData.notes,
    };

    addBill(newBill);
    setShowAddModal(false);
    setFormData({
      vendorId: "",
      billNumber: "",
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: "",
      amount: "",
      notes: "",
    });
  };

  const handleApprove = (billId: string) => {
    updateBill(billId, { 
      status: "approved",
      approvedAt: new Date().toISOString(),
    });
  };

  const handleMarkAsPaid = (billId: string) => {
    const bill = bills.find((b) => b.id === billId);
    if (bill) {
      updateBill(billId, { 
        status: "paid", 
        amountPaid: bill.totalAmount,
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
            <h1 className="text-2xl font-bold text-white">Bills</h1>
            <p className="text-neutral-400">Manage your accounts payable</p>
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Bill
          </Button>
        </div>

        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-purple-500/20 p-3">
                  <FileText className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-neutral-400">Total Bills</p>
                  <p className="text-2xl font-bold text-white">{bills.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-orange-500/20 p-3">
                  <Building2 className="h-6 w-6 text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-neutral-400">Total Payables</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(totalPayables)}</p>
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
                <div className="rounded-xl bg-yellow-500/20 p-3">
                  <Clock className="h-6 w-6 text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-neutral-400">Pending Approval</p>
                  <p className="text-2xl font-bold text-white">{pendingApproval}</p>
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
                  placeholder="Search bills..."
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

        {/* Bills table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bill #</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBills.map((bill) => {
                const daysUntil = calculateDaysUntil(bill.dueDate);
                const isOverdue = daysUntil < 0 && bill.status !== "paid";
                
                return (
                  <TableRow key={bill.id}>
                    <TableCell className="font-medium text-purple-400">
                      {bill.billNumber}
                    </TableCell>
                    <TableCell className="text-neutral-100">{bill.vendorName}</TableCell>
                    <TableCell className="text-neutral-300">{formatDate(bill.issueDate)}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-neutral-300">{formatDate(bill.dueDate)}</p>
                        {isOverdue && (
                          <p className="text-xs text-red-400">{Math.abs(daysUntil)} days overdue</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium text-neutral-100">
                      {formatCurrency(bill.totalAmount)}
                    </TableCell>
                    <TableCell className="text-right text-green-400">
                      {formatCurrency(bill.amountPaid)}
                    </TableCell>
                    <TableCell>{getStatusBadge(bill.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setSelectedBill(bill.id);
                            setShowViewModal(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {bill.status === "pending" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-green-400"
                            onClick={() => handleApprove(bill.id)}
                            title="Approve"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {bill.status === "approved" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-400"
                            onClick={() => handleMarkAsPaid(bill.id)}
                            title="Mark as Paid"
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
          
          {filteredBills.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-neutral-500">No bills found</p>
            </div>
          )}
        </Card>
      </div>

      {/* Add Bill Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Bill"
        description="Record a new bill from a vendor"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-200">Vendor</label>
              <Select
                options={[
                  { value: "", label: "Select vendor" },
                  ...vendors.map((v) => ({ value: v.id, label: v.name })),
                ]}
                value={formData.vendorId}
                onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
                placeholder="Select vendor"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-200">Bill Number</label>
              <Input
                type="text"
                placeholder="Vendor's invoice number"
                value={formData.billNumber}
                onChange={(e) => setFormData({ ...formData, billNumber: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
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

          <div className="rounded-lg bg-neutral-800/50 p-4">
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">Subtotal:</span>
                  <span className="text-neutral-100">{formatCurrency(parseFloat(formData.amount) || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">Tax (10%):</span>
                  <span className="text-neutral-100">{formatCurrency((parseFloat(formData.amount) || 0) * 0.1)}</span>
                </div>
                <div className="flex justify-between border-t border-neutral-700 pt-2 font-medium">
                  <span className="text-neutral-200">Total:</span>
                  <span className="text-white">{formatCurrency((parseFloat(formData.amount) || 0) * 1.1)}</span>
                </div>
              </div>
            </div>
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

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Bill</Button>
          </div>
        </form>
      </Modal>

      {/* View Bill Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Bill Details"
        size="lg"
      >
        {selectedBill && (() => {
          const bill = bills.find((b) => b.id === selectedBill);
          if (!bill) return null;
          
          return (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-neutral-400">Bill Number</p>
                  <p className="font-medium text-neutral-100">{bill.billNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-400">Status</p>
                  {getStatusBadge(bill.status)}
                </div>
                <div>
                  <p className="text-sm text-neutral-400">Vendor</p>
                  <p className="font-medium text-neutral-100">{bill.vendorName}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-400">Due Date</p>
                  <p className="font-medium text-neutral-100">{formatDate(bill.dueDate)}</p>
                </div>
              </div>
              
              <div className="rounded-lg border border-neutral-800 p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-400">Subtotal</span>
                    <span className="text-neutral-100">{formatCurrency(bill.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-400">Tax</span>
                    <span className="text-neutral-100">{formatCurrency(bill.taxAmount)}</span>
                  </div>
                  <div className="mt-2 flex justify-between font-medium">
                    <span className="text-neutral-200">Total</span>
                    <span className="text-white">{formatCurrency(bill.totalAmount)}</span>
                  </div>
                  {bill.amountPaid > 0 && (
                    <div className="flex justify-between text-green-400">
                      <span>Amount Paid</span>
                      <span>{formatCurrency(bill.amountPaid)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-neutral-700 pt-2 font-medium">
                    <span className="text-neutral-200">Balance Due</span>
                    <span className="text-white">{formatCurrency(bill.totalAmount - bill.amountPaid)}</span>
                  </div>
                </div>
              </div>
              
              {bill.notes && (
                <div>
                  <p className="text-sm text-neutral-400">Notes</p>
                  <p className="text-neutral-300">{bill.notes}</p>
                </div>
              )}
              
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowViewModal(false)}>
                  Close
                </Button>
                {bill.status === "pending" && (
                  <Button onClick={() => {
                    handleApprove(bill.id);
                    setShowViewModal(false);
                  }}>
                    Approve
                  </Button>
                )}
                {bill.status === "approved" && (
                  <Button onClick={() => {
                    handleMarkAsPaid(bill.id);
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

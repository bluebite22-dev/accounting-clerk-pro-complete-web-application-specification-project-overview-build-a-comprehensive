"use client";

import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Avatar } from "@/components/ui/avatar";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { useDataStore, Customer } from "@/stores/data-store";
import { formatCurrency, generateId } from "@/lib/utils";
import {
  Plus,
  Search,
  Users,
  DollarSign,
  FileText,
  Mail,
  Phone,
  Eye,
  Edit,
} from "lucide-react";

export default function CustomersPage() {
  const { customers, invoices, addCustomer, updateCustomer } = useDataStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    creditLimit: "",
    paymentTerms: "30",
  });

  const filteredCustomers = customers.filter((customer) => {
    return (
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const totalReceivables = customers.reduce((sum, c) => sum + c.balance, 0);
  const activeCustomers = customers.filter((c) => c.balance > 0).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newCustomer: Customer = {
      id: generateId(),
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      creditLimit: parseFloat(formData.creditLimit) || 0,
      paymentTermsNum: parseInt(formData.paymentTerms) || 30,
      balance: 0,
      status: "active",
      paymentTerms: `${parseInt(formData.paymentTerms) || 30} days`,
    };

    addCustomer(newCustomer);
    setShowAddModal(false);
    setFormData({
      name: "",
      email: "",
      phone: "",
      creditLimit: "",
      paymentTerms: "30",
    });
  };

  const getCustomerInvoices = (customerId: string) => {
    return invoices.filter((inv) => inv.customerId === customerId);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Customers</h1>
            <p className="text-neutral-400">Manage your customer database</p>
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        </div>

        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-blue-500/20 p-3">
                  <Users className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-neutral-400">Total Customers</p>
                  <p className="text-2xl font-bold text-white">{customers.length}</p>
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
                <div className="rounded-xl bg-purple-500/20 p-3">
                  <FileText className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-neutral-400">Active Accounts</p>
                  <p className="text-2xl font-bold text-white">{activeCustomers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
              <Input
                type="search"
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Customers table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Credit Limit</TableHead>
                <TableHead>Payment Terms</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar name={customer.name} size="sm" />
                      <div>
                        <p className="font-medium text-neutral-100">{customer.name}</p>
                        <p className="text-xs text-neutral-500">{customer.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm text-neutral-400">
                        <Mail className="h-3 w-3" />
                        {customer.email}
                      </div>
                      {customer.phone && (
                        <div className="flex items-center gap-1 text-sm text-neutral-400">
                          <Phone className="h-3 w-3" />
                          {customer.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-neutral-300">
                    {formatCurrency(customer.creditLimit)}
                  </TableCell>
                  <TableCell className="text-neutral-300">
                    Net {customer.paymentTerms}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={`font-medium ${customer.balance > 0 ? "text-yellow-400" : "text-green-400"}`}>
                      {formatCurrency(customer.balance)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setSelectedCustomer(customer.id);
                          setShowViewModal(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredCustomers.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-neutral-500">No customers found</p>
            </div>
          )}
        </Card>
      </div>

      {/* Add Customer Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Customer"
        description="Add a new customer to your database"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-200">Customer Name</label>
            <Input
              type="text"
              placeholder="Company or individual name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-200">Email</label>
              <Input
                type="email"
                placeholder="email@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-200">Phone</label>
              <Input
                type="tel"
                placeholder="Phone number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-200">Credit Limit</label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.creditLimit}
                onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-200">Payment Terms</label>
              <select
                className="flex h-10 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.paymentTerms}
                onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
              >
                <option value="15">Net 15</option>
                <option value="30">Net 30</option>
                <option value="45">Net 45</option>
                <option value="60">Net 60</option>
                <option value="90">Net 90</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Customer</Button>
          </div>
        </form>
      </Modal>

      {/* View Customer Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Customer Details"
        size="lg"
      >
        {selectedCustomer && (() => {
          const customer = customers.find((c) => c.id === selectedCustomer);
          if (!customer) return null;
          
          const customerInvoices = getCustomerInvoices(customer.id);
          const paidInvoices = customerInvoices.filter((i) => i.status === "paid").length;
          const pendingInvoices = customerInvoices.filter((i) => i.status !== "paid" && i.status !== "cancelled").length;
          
          return (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar name={customer.name} size="lg" />
                <div>
                  <h3 className="text-lg font-semibold text-neutral-100">{customer.name}</h3>
                  <p className="text-neutral-400">{customer.email}</p>
                </div>
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-neutral-800 p-4">
                  <p className="text-sm text-neutral-400">Phone</p>
                  <p className="font-medium text-neutral-100">{customer.phone || "Not provided"}</p>
                </div>
                <div className="rounded-lg border border-neutral-800 p-4">
                  <p className="text-sm text-neutral-400">Payment Terms</p>
                  <p className="font-medium text-neutral-100">Net {customer.paymentTerms}</p>
                </div>
                <div className="rounded-lg border border-neutral-800 p-4">
                  <p className="text-sm text-neutral-400">Credit Limit</p>
                  <p className="font-medium text-neutral-100">{formatCurrency(customer.creditLimit)}</p>
                </div>
                <div className="rounded-lg border border-neutral-800 p-4">
                  <p className="text-sm text-neutral-400">Current Balance</p>
                  <p className={`font-medium ${customer.balance > 0 ? "text-yellow-400" : "text-green-400"}`}>
                    {formatCurrency(customer.balance)}
                  </p>
                </div>
              </div>
              
              <div>
                <h4 className="mb-3 text-sm font-medium text-neutral-200">Invoice Summary</h4>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg bg-neutral-800/50 p-3 text-center">
                    <p className="text-2xl font-bold text-white">{customerInvoices.length}</p>
                    <p className="text-xs text-neutral-400">Total Invoices</p>
                  </div>
                  <div className="rounded-lg bg-neutral-800/50 p-3 text-center">
                    <p className="text-2xl font-bold text-green-400">{paidInvoices}</p>
                    <p className="text-xs text-neutral-400">Paid</p>
                  </div>
                  <div className="rounded-lg bg-neutral-800/50 p-3 text-center">
                    <p className="text-2xl font-bold text-yellow-400">{pendingInvoices}</p>
                    <p className="text-xs text-neutral-400">Pending</p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowViewModal(false)}>
                  Close
                </Button>
                <Button>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Statement
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </AppLayout>
  );
}

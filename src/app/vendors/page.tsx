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
import { useDataStore } from "@/stores/data-store";
import { formatCurrency, generateId } from "@/lib/utils";
import {
  Plus,
  Search,
  Building2,
  DollarSign,
  FileText,
  Mail,
  Phone,
  Eye,
  Edit,
} from "lucide-react";

export default function VendorsPage() {
  const { vendors, bills, addVendor, updateVendor } = useDataStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    paymentTerms: "30",
  });

  const filteredVendors = vendors.filter((vendor) => {
    return (
      vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (vendor.email && vendor.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const totalPayables = vendors.reduce((sum, v) => sum + v.balance, 0);
  const activeVendors = vendors.filter((v) => v.balance > 0).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newVendor = {
      id: generateId(),
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      paymentTerms: parseInt(formData.paymentTerms) || 30,
      balance: 0,
    };

    addVendor(newVendor);
    setShowAddModal(false);
    setFormData({
      name: "",
      email: "",
      phone: "",
      paymentTerms: "30",
    });
  };

  const getVendorBills = (vendorId: string) => {
    return bills.filter((b) => b.vendorId === vendorId);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Vendors</h1>
            <p className="text-neutral-400">Manage your vendor database</p>
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Vendor
          </Button>
        </div>

        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-purple-500/20 p-3">
                  <Building2 className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-neutral-400">Total Vendors</p>
                  <p className="text-2xl font-bold text-white">{vendors.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-orange-500/20 p-3">
                  <DollarSign className="h-6 w-6 text-orange-400" />
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
                <div className="rounded-xl bg-blue-500/20 p-3">
                  <FileText className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-neutral-400">Active Accounts</p>
                  <p className="text-2xl font-bold text-white">{activeVendors}</p>
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
                placeholder="Search vendors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Vendors table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Payment Terms</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVendors.map((vendor) => (
                <TableRow key={vendor.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-600">
                        <Building2 className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-neutral-100">{vendor.name}</p>
                        {vendor.email && (
                          <p className="text-xs text-neutral-500">{vendor.email}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {vendor.email && (
                        <div className="flex items-center gap-1 text-sm text-neutral-400">
                          <Mail className="h-3 w-3" />
                          {vendor.email}
                        </div>
                      )}
                      {vendor.phone && (
                        <div className="flex items-center gap-1 text-sm text-neutral-400">
                          <Phone className="h-3 w-3" />
                          {vendor.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-neutral-300">
                    Net {vendor.paymentTerms}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={`font-medium ${vendor.balance > 0 ? "text-orange-400" : "text-green-400"}`}>
                      {formatCurrency(vendor.balance)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setSelectedVendor(vendor.id);
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
          
          {filteredVendors.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-neutral-500">No vendors found</p>
            </div>
          )}
        </Card>
      </div>

      {/* Add Vendor Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Vendor"
        description="Add a new vendor to your database"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-200">Vendor Name</label>
            <Input
              type="text"
              placeholder="Company name"
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

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Vendor</Button>
          </div>
        </form>
      </Modal>

      {/* View Vendor Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Vendor Details"
        size="lg"
      >
        {selectedVendor && (() => {
          const vendor = vendors.find((v) => v.id === selectedVendor);
          if (!vendor) return null;
          
          const vendorBills = getVendorBills(vendor.id);
          const paidBills = vendorBills.filter((b) => b.status === "paid").length;
          const pendingBills = vendorBills.filter((b) => b.status !== "paid" && b.status !== "cancelled").length;
          
          return (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-600">
                  <Building2 className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-neutral-100">{vendor.name}</h3>
                  {vendor.email && <p className="text-neutral-400">{vendor.email}</p>}
                </div>
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-neutral-800 p-4">
                  <p className="text-sm text-neutral-400">Phone</p>
                  <p className="font-medium text-neutral-100">{vendor.phone || "Not provided"}</p>
                </div>
                <div className="rounded-lg border border-neutral-800 p-4">
                  <p className="text-sm text-neutral-400">Payment Terms</p>
                  <p className="font-medium text-neutral-100">Net {vendor.paymentTerms}</p>
                </div>
                <div className="rounded-lg border border-neutral-800 p-4 sm:col-span-2">
                  <p className="text-sm text-neutral-400">Current Balance</p>
                  <p className={`text-2xl font-bold ${vendor.balance > 0 ? "text-orange-400" : "text-green-400"}`}>
                    {formatCurrency(vendor.balance)}
                  </p>
                </div>
              </div>
              
              <div>
                <h4 className="mb-3 text-sm font-medium text-neutral-200">Bill Summary</h4>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg bg-neutral-800/50 p-3 text-center">
                    <p className="text-2xl font-bold text-white">{vendorBills.length}</p>
                    <p className="text-xs text-neutral-400">Total Bills</p>
                  </div>
                  <div className="rounded-lg bg-neutral-800/50 p-3 text-center">
                    <p className="text-2xl font-bold text-green-400">{paidBills}</p>
                    <p className="text-xs text-neutral-400">Paid</p>
                  </div>
                  <div className="rounded-lg bg-neutral-800/50 p-3 text-center">
                    <p className="text-2xl font-bold text-yellow-400">{pendingBills}</p>
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
                  Contact Vendor
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </AppLayout>
  );
}

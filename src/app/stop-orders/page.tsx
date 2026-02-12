"use client";

import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";
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
import { useDataStore, StopOrder } from "@/stores/data-store";
import { formatCurrency, formatDate, generateId } from "@/lib/utils";
import {
  Plus,
  Search,
  Target,
  AlertTriangle,
  Ban,
  DollarSign,
  Building2,
  Calendar,
  ToggleLeft,
  ToggleRight,
  Trash2,
  User,
  FileText,
  Phone,
  Mail,
  MapPin,
  CheckSquare,
  Signature,
} from "lucide-react";

const rankOptions = [
  { value: "officer", label: "Officer" },
  { value: "soldier", label: "Soldier" },
  { value: "civilian", label: "Civilian" },
];

const sexOptions = [
  { value: "M", label: "Male" },
  { value: "F", label: "Female" },
];

export default function StopOrdersPage() {
  const { stopOrders, addStopOrder, updateStopOrder, deleteStopOrder } = useDataStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Form state matching Petrichor5 form fields
  const [formData, setFormData] = useState({
    // Employee details
    fullName: "",
    sex: "M" as "M" | "F",
    nrcNo: "",
    manNo: "",
    rank: "",
    barrack: "",
    district: "",
    province: "",
    mobile: "",
    email: "",
    
    // Deduction details
    deductionAmount: "",
    durationMonths: "",
    startMonth: "",
    monthlyDeductionFrom: "",
    monthlyDeductionTo: "",
    amountInWords: "",
    authorizedBy: "",
    
    // Remittance details
    accountNumber: "9060160002109",
    companyName: "Petrichor Five General Dealers",
    
    // Form date
    formDate: new Date().toISOString().split("T")[0],
  });

  const filteredStopOrders = stopOrders.filter((order) => {
    const matchesSearch =
      order.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.manNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.nrcNo?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const activeStops = stopOrders.filter((s) => s.isActive);
  const totalBlocked = activeStops.reduce((sum, s) => sum + s.blockedAmount, 0);
  const totalTriggers = activeStops.reduce((sum, s) => sum + s.triggeredCount, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const amountNum = parseFloat(formData.deductionAmount);
    const monthsNum = parseInt(formData.durationMonths) || 1;
    
    const newStopOrder: StopOrder = {
      id: generateId(),
      type: "payroll" as const,
      
      // Employee details
      fullName: formData.fullName.toUpperCase(),
      sex: formData.sex,
      nrcNo: formData.nrcNo,
      manNo: formData.manNo,
      rank: (formData.rank as "officer" | "soldier" | "civilian") || undefined,
      barrack: formData.barrack,
      district: formData.district,
      province: formData.province,
      mobile: formData.mobile,
      email: formData.email,
      
      // Deduction details
      deductionAmount: amountNum,
      durationMonths: monthsNum,
      startMonth: formData.startMonth,
      monthlyDeductionFrom: formData.monthlyDeductionFrom ? new Date(formData.monthlyDeductionFrom).toISOString() : undefined,
      monthlyDeductionTo: formData.monthlyDeductionTo ? new Date(formData.monthlyDeductionTo).toISOString() : undefined,
      amountInWords: formData.amountInWords,
      authorizedBy: formData.authorizedBy,
      
      // Remittance details
      accountNumber: formData.accountNumber,
      companyName: formData.companyName,
      
      // Form metadata
      formDate: new Date(formData.formDate).toISOString(),
      
      // Status
      isActive: true,
      notifyOnTrigger: true,
      requireOverride: true,
      triggeredCount: 0,
      blockedAmount: 0,
      reason: `Salary deduction for ${formData.fullName.toUpperCase()} - K${amountNum} for ${monthsNum} month(s)`,
    };

    addStopOrder(newStopOrder);
    setShowAddModal(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      fullName: "",
      sex: "M",
      nrcNo: "",
      manNo: "",
      rank: "",
      barrack: "",
      district: "",
      province: "",
      mobile: "",
      email: "",
      deductionAmount: "",
      durationMonths: "",
      startMonth: "",
      monthlyDeductionFrom: "",
      monthlyDeductionTo: "",
      amountInWords: "",
      authorizedBy: "",
      accountNumber: "9060160002109",
      companyName: "Petrichor Five General Dealers",
      formDate: new Date().toISOString().split("T")[0],
    });
  };

  const handleToggle = (id: string, currentStatus: boolean) => {
    updateStopOrder(id, { isActive: !currentStatus });
  };

  const getRankIcon = (rank: string) => {
    switch (rank) {
      case "officer":
        return <User className="h-4 w-4" />;
      case "soldier":
        return <Target className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Stop Orders</h1>
            <p className="text-neutral-400">Manage salary deduction authorizations</p>
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Stop Order
          </Button>
        </div>

        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-orange-500/20 p-3">
                  <FileText className="h-6 w-6 text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-neutral-400">Total Orders</p>
                  <p className="text-2xl font-bold text-white">{stopOrders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-green-500/20 p-3">
                  <CheckSquare className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-neutral-400">Active</p>
                  <p className="text-2xl font-bold text-white">{activeStops.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-red-500/20 p-3">
                  <Ban className="h-6 w-6 text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-neutral-400">Total Deducted</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(totalBlocked)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-neutral-700/50 p-3">
                  <AlertTriangle className="h-6 w-6 text-neutral-400" />
                </div>
                <div>
                  <p className="text-sm text-neutral-400">Pending</p>
                  <p className="text-2xl font-bold text-white">{stopOrders.filter((s) => !s.isActive).length}</p>
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
                  placeholder="Search by name, NRC, or Man No..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stop Orders table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Rank</TableHead>
                <TableHead>Man No</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Period</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStopOrders.map((order) => (
                <TableRow key={order.id} className={!order.isActive ? "opacity-50" : ""}>
                  <TableCell>
                    <Badge variant={order.isActive ? "success" : "outline"}>
                      {order.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-white">{order.fullName}</p>
                      <p className="text-xs text-neutral-400">{order.nrcNo}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 capitalize">
                      {getRankIcon(order.rank || "")}
                      <span>{order.rank || "-"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-neutral-300">{order.manNo || "-"}</TableCell>
                  <TableCell className="font-medium text-green-400">
                    {formatCurrency(order.deductionAmount || 0)}
                  </TableCell>
                  <TableCell className="text-neutral-300">
                    {order.durationMonths ? `${order.durationMonths} month(s)` : "-"}
                  </TableCell>
                  <TableCell className="text-neutral-300">
                    <div>
                      <p className="text-sm">{order.monthlyDeductionFrom ? formatDate(order.monthlyDeductionFrom) : "-"}</p>
                      {order.monthlyDeductionTo && (
                        <p className="text-xs text-neutral-500">to {formatDate(order.monthlyDeductionTo)}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleToggle(order.id, order.isActive)}
                        title={order.isActive ? "Deactivate" : "Activate"}
                      >
                        {order.isActive ? (
                          <ToggleRight className="h-5 w-5 text-green-400" />
                        ) : (
                          <ToggleLeft className="h-5 w-5 text-neutral-400" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-400 hover:text-red-300"
                        onClick={() => deleteStopOrder(order.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredStopOrders.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-neutral-500">No stop orders found</p>
            </div>
          )}
        </Card>

        {/* Info card */}
        <Card className="border-orange-500/30 bg-orange-500/5">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <AlertTriangle className="h-6 w-6 text-orange-400 shrink-0" />
              <div>
                <h3 className="font-medium text-neutral-100">Salary Deduction Authorization</h3>
                <p className="mt-1 text-sm text-neutral-400">
                  This form authorizes payroll deductions from Zambia Army personnel. 
                  Completed forms are processed through the respective unit adjutants.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Stop Order Modal - Petrichor5 Style Form */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Stop Order Authorization"
        description="Salary deduction authorization form"
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Company Header */}
          <div className="bg-neutral-900 text-white p-4 rounded-lg mb-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-serif tracking-wider uppercase">Petrichor5 Limited</h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Farm 2919M Ferngrove Lusaka West, Zambia<br />
                  Tel: +260 972 968 998, +260 970 764 131<br />
                  Email: petrichor5ltd@gmail.com
                </p>
              </div>
              <div className="text-right">
                <h2 className="text-xl font-serif italic text-neutral-500">Petrichor5</h2>
                <span className="text-[10px] tracking-[0.2em] uppercase text-neutral-500">Way to Grow</span>
              </div>
            </div>
          </div>

          {/* Form Title */}
          <div className="text-center -mt-2 mb-4">
            <span className="bg-neutral-700 text-white px-6 py-1 text-sm font-bold uppercase inline-block">
              Stop Order Form
            </span>
          </div>

          {/* Recipient and Date */}
          <div className="grid gap-4 sm:grid-cols-2 mb-4">
            <div className="border-2 border-neutral-700 p-3 bg-neutral-50 dark:bg-neutral-800/50">
              <p className="text-xs font-bold mb-1 bg-black text-white inline-block px-1">TO:</p>
              <p className="text-sm font-bold uppercase">
                The Adjutant General<br />
                Zambia Army Headquarters<br />
                Lusaka, Zambia
              </p>
            </div>
            <div className="flex flex-col justify-between">
              <div className="text-right text-sm text-neutral-500">
                Form No. <span className="text-red-500 font-bold">AUTO-GEN</span>
              </div>
              <div className="flex items-center border border-neutral-700 p-2">
                <span className="bg-black text-white px-2 py-1 text-xs font-bold mr-2">Date:</span>
                <Input
                  type="date"
                  value={formData.formDate}
                  onChange={(e) => setFormData({ ...formData, formDate: e.target.value })}
                  className="border-none shadow-none p-0 h-auto"
                />
              </div>
            </div>
          </div>

          {/* Authorization Text */}
          <div className="text-sm mb-4">
            <p>
              I the undersigned employee of <strong>ZAMBIA ARMY</strong> do hereby authorize 
              Petrichor5 Limited to deduct K
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.deductionAmount}
                onChange={(e) => setFormData({ ...formData, deductionAmount: e.target.value })}
                className="w-24 mx-1 inline-block text-center font-bold"
                required
              />
              from my salary for
              <Input
                type="number"
                placeholder="#"
                value={formData.durationMonths}
                onChange={(e) => setFormData({ ...formData, durationMonths: e.target.value })}
                className="w-16 mx-1 inline-block text-center"
                required
              />
              month(s) starting from
              <Input
                type="month"
                value={formData.startMonth}
                onChange={(e) => setFormData({ ...formData, startMonth: e.target.value })}
                className="w-36 mx-1 inline-block"
                required
              />
              & shall be remitted to Petrichor Five General Dealers Account Number
              <span className="font-mono font-bold italic mx-1">9060160002109</span>
            </p>
          </div>

          {/* Employee Details Section */}
          <div className="border border-neutral-300 dark:border-neutral-600 p-4 rounded-lg space-y-3">
            <h4 className="font-bold text-sm uppercase border-b border-neutral-300 dark:border-neutral-600 pb-1 mb-3">
              Employee Details
            </h4>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-xs font-bold mb-1 block">Name (In Capital Letters)</label>
                <Input
                  type="text"
                  placeholder="FULL NAME IN CAPITAL LETTERS"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="uppercase font-bold"
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="text-xs font-bold mb-1 block">Sex</label>
                <Select
                  options={sexOptions}
                  value={formData.sex}
                  onChange={(e) => setFormData({ ...formData, sex: e.target.value as "M" | "F" })}
                />
              </div>
              <div>
                <label className="text-xs font-bold mb-1 block">NRC No.</label>
                <Input
                  type="text"
                  placeholder="NRC Number"
                  value={formData.nrcNo}
                  onChange={(e) => setFormData({ ...formData, nrcNo: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold mb-1 block">Man No.</label>
                <Input
                  type="text"
                  placeholder="Man Number"
                  value={formData.manNo}
                  onChange={(e) => setFormData({ ...formData, manNo: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Rank Checkboxes */}
            <div className="flex gap-6 py-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="rank"
                  value="officer"
                  checked={formData.rank === "officer"}
                  onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
                  className="w-4 h-4"
                />
                <span className="text-sm">Officer</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="rank"
                  value="soldier"
                  checked={formData.rank === "soldier"}
                  onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
                  className="w-4 h-4"
                />
                <span className="text-sm">Soldier</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="rank"
                  value="civilian"
                  checked={formData.rank === "civilian"}
                  onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
                  className="w-4 h-4"
                />
                <span className="text-sm">Civilian</span>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="text-xs font-bold mb-1 block">Barrack</label>
                <Input
                  type="text"
                  placeholder="Barrack"
                  value={formData.barrack}
                  onChange={(e) => setFormData({ ...formData, barrack: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-bold mb-1 block">District</label>
                <Input
                  type="text"
                  placeholder="District"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-bold mb-1 block">Province</label>
                <Input
                  type="text"
                  placeholder="Province"
                  value={formData.province}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold mb-1 block">Mobile</label>
                <Input
                  type="text"
                  placeholder="Mobile Number"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-bold mb-1 block">E-mail</label>
                <Input
                  type="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Deduction Period */}
          <div className="border border-neutral-300 dark:border-neutral-600 p-4 rounded-lg space-y-3">
            <h4 className="font-bold text-sm uppercase border-b border-neutral-300 dark:border-neutral-600 pb-1 mb-3">
              Deduction Period
            </h4>
            
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold">Monthly deduction from</span>
              <Input
                type="date"
                value={formData.monthlyDeductionFrom}
                onChange={(e) => setFormData({ ...formData, monthlyDeductionFrom: e.target.value })}
                className="w-40"
              />
              <span className="text-sm font-bold">to</span>
              <Input
                type="date"
                value={formData.monthlyDeductionTo}
                onChange={(e) => setFormData({ ...formData, monthlyDeductionTo: e.target.value })}
                className="w-40"
              />
            </div>

            <div>
              <label className="text-xs font-bold mb-1 block">Amount in words</label>
              <textarea
                className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Amount in words (e.g., One Thousand Five Hundred Kwacha Only)"
                value={formData.amountInWords}
                onChange={(e) => setFormData({ ...formData, amountInWords: e.target.value })}
                rows={2}
              />
            </div>

            <div>
              <label className="text-xs font-bold mb-1 block">Authorized by</label>
              <Input
                type="text"
                placeholder="Authorizing Signature / Name"
                value={formData.authorizedBy}
                onChange={(e) => setFormData({ ...formData, authorizedBy: e.target.value })}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit">
              <FileText className="mr-2 h-4 w-4" />
              Create Stop Order
            </Button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}

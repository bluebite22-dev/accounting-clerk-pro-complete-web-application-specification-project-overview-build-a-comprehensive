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
  Target,
  AlertTriangle,
  Ban,
  DollarSign,
  Building2,
  Calendar,
  ToggleLeft,
  ToggleRight,
  Eye,
  Trash2,
} from "lucide-react";

const stopOrderTypes = [
  { value: "amount", label: "Amount-Based" },
  { value: "vendor", label: "Vendor-Based" },
  { value: "category", label: "Category-Based" },
  { value: "recurring", label: "Recurring Payment" },
  { value: "date", label: "Date-Based" },
];

export default function StopOrdersPage() {
  const { stopOrders, vendors, categories, addStopOrder, updateStopOrder, deleteStopOrder } = useDataStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("");
  
  // Form state
  const [formData, setFormData] = useState({
    type: "",
    target: "",
    amountLimit: "",
    reason: "",
    effectiveFrom: new Date().toISOString().split("T")[0],
    expiresAt: "",
    notifyOnTrigger: true,
    requireOverride: true,
  });

  const filteredStopOrders = stopOrders.filter((order) => {
    const matchesSearch =
      order.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !selectedType || order.type === selectedType;
    return matchesSearch && matchesType;
  });

  const activeStops = stopOrders.filter((s) => s.isActive);
  const totalBlocked = activeStops.reduce((sum, s) => sum + s.blockedAmount, 0);
  const totalTriggers = activeStops.reduce((sum, s) => sum + s.triggeredCount, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newStopOrder = {
      id: generateId(),
      type: formData.type as "amount" | "vendor" | "category" | "recurring" | "date",
      target: formData.target,
      conditions: formData.amountLimit ? { amountLimit: parseFloat(formData.amountLimit) } : undefined,
      reason: formData.reason,
      isActive: true,
      effectiveFrom: new Date(formData.effectiveFrom).toISOString(),
      expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : undefined,
      notifyOnTrigger: formData.notifyOnTrigger,
      requireOverride: formData.requireOverride,
      triggeredCount: 0,
      blockedAmount: 0,
    };

    addStopOrder(newStopOrder);
    setShowAddModal(false);
    setFormData({
      type: "",
      target: "",
      amountLimit: "",
      reason: "",
      effectiveFrom: new Date().toISOString().split("T")[0],
      expiresAt: "",
      notifyOnTrigger: true,
      requireOverride: true,
    });
  };

  const handleToggle = (id: string, currentStatus: boolean) => {
    updateStopOrder(id, { isActive: !currentStatus });
  };

  const getTargetLabel = (order: typeof stopOrders[0]) => {
    switch (order.type) {
      case "vendor":
        const vendor = vendors.find((v) => v.id === order.target);
        return vendor?.name || order.target;
      case "category":
        const category = categories.find((c) => c.id === order.target);
        return category?.name || order.target;
      case "amount":
        return `> ${formatCurrency(parseFloat(order.target))}`;
      default:
        return order.target;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Stop Orders</h1>
            <p className="text-neutral-400">Manage payment blocks and approval rules</p>
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Stop Order
          </Button>
        </div>

        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-orange-500/20 p-3">
                  <Target className="h-6 w-6 text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-neutral-400">Active Stops</p>
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
                  <p className="text-sm text-neutral-400">Total Blocked</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(totalBlocked)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-yellow-500/20 p-3">
                  <AlertTriangle className="h-6 w-6 text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-neutral-400">Total Triggers</p>
                  <p className="text-2xl font-bold text-white">{totalTriggers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-neutral-700/50 p-3">
                  <Target className="h-6 w-6 text-neutral-400" />
                </div>
                <div>
                  <p className="text-sm text-neutral-400">Inactive Stops</p>
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
                  placeholder="Search stop orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                options={[{ value: "", label: "All Types" }, ...stopOrderTypes]}
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full sm:w-48"
              />
            </div>
          </CardContent>
        </Card>

        {/* Stop Orders table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="text-right">Blocked Amount</TableHead>
                <TableHead className="text-center">Triggers</TableHead>
                <TableHead>Effective</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStopOrders.map((order) => (
                <TableRow key={order.id} className={!order.isActive ? "opacity-50" : ""}>
                  <TableCell>
                    <Badge variant={order.isActive ? "destructive" : "outline"}>
                      {order.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {order.type === "vendor" && <Building2 className="h-4 w-4 text-neutral-400" />}
                      {order.type === "amount" && <DollarSign className="h-4 w-4 text-neutral-400" />}
                      {order.type === "category" && <Target className="h-4 w-4 text-neutral-400" />}
                      {order.type === "date" && <Calendar className="h-4 w-4 text-neutral-400" />}
                      <span className="capitalize">{order.type}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-neutral-300">
                    {getTargetLabel(order)}
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-neutral-300">
                    {order.reason}
                  </TableCell>
                  <TableCell className="text-right font-medium text-red-400">
                    {formatCurrency(order.blockedAmount)}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`font-medium ${order.triggeredCount > 0 ? "text-yellow-400" : "text-neutral-400"}`}>
                      {order.triggeredCount}
                    </span>
                  </TableCell>
                  <TableCell className="text-neutral-300">
                    <div>
                      <p className="text-sm">{formatDate(order.effectiveFrom)}</p>
                      {order.expiresAt && (
                        <p className="text-xs text-neutral-500">until {formatDate(order.expiresAt)}</p>
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
                <h3 className="font-medium text-neutral-100">How Stop Orders Work</h3>
                <p className="mt-1 text-sm text-neutral-400">
                  Stop orders automatically block payments that match your criteria. When triggered, 
                  the payment will be held for manual review and approval. This helps prevent 
                  unauthorized transactions, fraud, and budget overruns.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Stop Order Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Create Stop Order"
        description="Set up a new payment block rule"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-200">Stop Type</label>
              <Select
                options={[{ value: "", label: "Select type" }, ...stopOrderTypes]}
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                placeholder="Select type"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-200">
                {formData.type === "vendor" ? "Select Vendor" : 
                 formData.type === "category" ? "Select Category" :
                 formData.type === "amount" ? "Amount Threshold" : "Target"}
              </label>
              {formData.type === "vendor" ? (
                <Select
                  options={[
                    { value: "", label: "Select vendor" },
                    ...vendors.map((v) => ({ value: v.id, label: v.name })),
                  ]}
                  value={formData.target}
                  onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                  placeholder="Select vendor"
                />
              ) : formData.type === "category" ? (
                <Select
                  options={[
                    { value: "", label: "Select category" },
                    ...categories.map((c) => ({ value: c.id, label: c.name })),
                  ]}
                  value={formData.target}
                  onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                  placeholder="Select category"
                />
              ) : (
                <Input
                  type={formData.type === "amount" ? "number" : "text"}
                  step="0.01"
                  placeholder={formData.type === "amount" ? "0.00" : "Enter target"}
                  value={formData.target}
                  onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                />
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-200">Effective From</label>
              <Input
                type="date"
                value={formData.effectiveFrom}
                onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-200">Expires At (Optional)</label>
              <Input
                type="date"
                value={formData.expiresAt}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-200">Reason</label>
            <textarea
              className="flex min-h-[80px] w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Explain why this stop order is needed..."
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              required
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-neutral-200">Options</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.notifyOnTrigger}
                  onChange={(e) => setFormData({ ...formData, notifyOnTrigger: e.target.checked })}
                  className="h-4 w-4 rounded border-neutral-700 bg-neutral-800 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm text-neutral-300">
                  Send email notification when triggered
                </span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.requireOverride}
                  onChange={(e) => setFormData({ ...formData, requireOverride: e.target.checked })}
                  className="h-4 w-4 rounded border-neutral-700 bg-neutral-800 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm text-neutral-300">
                  Require manager override to proceed
                </span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive">
              Create Stop Order
            </Button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}

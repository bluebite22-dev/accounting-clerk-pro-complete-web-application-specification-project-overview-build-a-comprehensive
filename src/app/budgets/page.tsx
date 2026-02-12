"use client";

import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { useDataStore } from "@/stores/data-store";
import { formatCurrency, formatDate, generateId } from "@/lib/utils";
import {
  Plus,
  Search,
  PieChart,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";

const periodOptions = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annual", label: "Annual" },
];

export default function BudgetsPage() {
  const { budgets, categories, addBudget, updateBudget, deleteBudget } = useDataStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("");
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    period: "monthly",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    lineItems: [{ categoryId: "", allocated: "" }],
  });

  const filteredBudgets = budgets.filter((budget) => {
    const matchesSearch = budget.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPeriod = !selectedPeriod || budget.period === selectedPeriod;
    return matchesSearch && matchesPeriod;
  });

  const activeBudgets = budgets.filter((b) => b.status === "active");
  const totalAllocated = activeBudgets.reduce((sum, b) => sum + b.totalAllocated, 0);
  const totalSpent = activeBudgets.reduce((sum, b) => sum + b.totalSpent, 0);
  const overallUtilization = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;

  const addLineItem = () => {
    setFormData({
      ...formData,
      lineItems: [...formData.lineItems, { categoryId: "", allocated: "" }],
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

  const calculateTotalAllocated = () => {
    return formData.lineItems.reduce((sum, item) => sum + (parseFloat(item.allocated) || 0), 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const totalAllocated = calculateTotalAllocated();
    
    const newBudget = {
      id: generateId(),
      name: formData.name,
      description: formData.description,
      period: formData.period as "monthly" | "quarterly" | "annual",
      startDate: new Date(formData.startDate).toISOString(),
      endDate: new Date(formData.endDate).toISOString(),
      totalAllocated,
      totalSpent: 0,
      status: "active" as const,
      lineItems: formData.lineItems
        .filter((item) => item.categoryId && item.allocated)
        .map((item, index) => {
          const category = categories.find((c) => c.id === item.categoryId);
          return {
            id: `bl_${index}`,
            categoryId: item.categoryId,
            categoryName: category?.name || "Unknown",
            allocated: parseFloat(item.allocated) || 0,
            spent: 0,
            alertThreshold: 80,
          };
        }),
    };

    addBudget(newBudget);
    setShowAddModal(false);
    setFormData({
      name: "",
      description: "",
      period: "monthly",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      lineItems: [{ categoryId: "", allocated: "" }],
    });
  };

  const getUtilizationColor = (percent: number) => {
    if (percent >= 100) return "text-red-400";
    if (percent >= 90) return "text-yellow-400";
    if (percent >= 80) return "text-orange-400";
    return "text-green-400";
  };

  const getProgressColor = (percent: number) => {
    if (percent >= 100) return "bg-red-500";
    if (percent >= 90) return "bg-yellow-500";
    if (percent >= 80) return "bg-orange-500";
    return "bg-green-500";
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Budgets</h1>
            <p className="text-neutral-400">Plan and track your financial budgets</p>
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Budget
          </Button>
        </div>

        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-blue-500/20 p-3">
                  <PieChart className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-neutral-400">Active Budgets</p>
                  <p className="text-2xl font-bold text-white">{activeBudgets.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-green-500/20 p-3">
                  <TrendingUp className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-neutral-400">Total Allocated</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(totalAllocated)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-red-500/20 p-3">
                  <TrendingDown className="h-6 w-6 text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-neutral-400">Total Spent</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(totalSpent)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-purple-500/20 p-3">
                  <Target className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-neutral-400">Utilization</p>
                  <p className={`text-2xl font-bold ${getUtilizationColor(overallUtilization)}`}>
                    {overallUtilization.toFixed(1)}%
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
                  placeholder="Search budgets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                options={[{ value: "", label: "All Periods" }, ...periodOptions]}
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full sm:w-48"
              />
            </div>
          </CardContent>
        </Card>

        {/* Budget cards */}
        <div className="grid gap-6 lg:grid-cols-2">
          {filteredBudgets.map((budget) => {
            const utilizationPercent = (budget.totalSpent / budget.totalAllocated) * 100;
            
            return (
              <Card key={budget.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{budget.name}</CardTitle>
                      <p className="text-sm text-neutral-400 mt-1">
                        {formatDate(budget.startDate)} - {formatDate(budget.endDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={budget.status === "active" ? "success" : "secondary"}>
                        {budget.status}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {budget.period}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-400">Spent</span>
                      <span className="text-neutral-100">
                        {formatCurrency(budget.totalSpent)} / {formatCurrency(budget.totalAllocated)}
                      </span>
                    </div>
                    <div className="h-3 rounded-full bg-neutral-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${getProgressColor(utilizationPercent)}`}
                        style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className={getUtilizationColor(utilizationPercent)}>
                        {utilizationPercent.toFixed(1)}% utilized
                      </span>
                      <span className="text-neutral-500">
                        {formatCurrency(budget.totalAllocated - budget.totalSpent)} remaining
                      </span>
                    </div>
                  </div>

                  {/* Line items */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-neutral-300">Categories</p>
                    {budget.lineItems.slice(0, 3).map((item) => {
                      const itemPercent = (item.spent / item.allocated) * 100;
                      return (
                        <div key={item.id} className="flex items-center justify-between text-sm">
                          <span className="text-neutral-400">{item.categoryName}</span>
                          <div className="flex items-center gap-2">
                            <span className={getUtilizationColor(itemPercent)}>
                              {itemPercent.toFixed(0)}%
                            </span>
                            {itemPercent > item.alertThreshold && (
                              <AlertTriangle className="h-4 w-4 text-yellow-400" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {budget.lineItems.length > 3 && (
                      <p className="text-xs text-neutral-500">
                        +{budget.lineItems.length - 3} more categories
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedBudget(budget.id);
                        setShowViewModal(true);
                      }}
                    >
                      <Eye className="mr-1 h-4 w-4" />
                      View Details
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300"
                      onClick={() => deleteBudget(budget.id)}
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredBudgets.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-neutral-500">No budgets found</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Budget Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Create Budget"
        description="Set up a new budget for tracking expenses"
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-200">Budget Name</label>
              <Input
                type="text"
                placeholder="e.g., Q1 2024 Marketing Budget"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-200">Period</label>
              <Select
                options={periodOptions}
                value={formData.period}
                onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                placeholder="Select period"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-200">Start Date</label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-200">End Date</label>
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-200">Description</label>
            <Input
              type="text"
              placeholder="Brief description of this budget"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Line Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-neutral-200">Budget Allocations</label>
              <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                <Plus className="mr-1 h-4 w-4" />
                Add Category
              </Button>
            </div>
            
            {formData.lineItems.map((item, index) => (
              <div key={index} className="grid gap-2 sm:grid-cols-12 items-start">
                <div className="sm:col-span-7">
                  <Select
                    options={[
                      { value: "", label: "Select category" },
                      ...categories.filter((c) => c.type === "expense" || c.type === "both").map((c) => ({ value: c.id, label: c.name })),
                    ]}
                    value={item.categoryId}
                    onChange={(e) => updateLineItem(index, "categoryId", e.target.value)}
                    placeholder="Select category"
                  />
                </div>
                <div className="sm:col-span-4">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Allocated amount"
                    value={item.allocated}
                    onChange={(e) => updateLineItem(index, "allocated", e.target.value)}
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

          {/* Total */}
          <div className="rounded-lg bg-neutral-800/50 p-4">
            <div className="flex justify-between">
              <span className="font-medium text-neutral-200">Total Budget</span>
              <span className="text-xl font-bold text-white">
                {formatCurrency(calculateTotalAllocated())}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Budget</Button>
          </div>
        </form>
      </Modal>

      {/* View Budget Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Budget Details"
        size="lg"
      >
        {selectedBudget && (() => {
          const budget = budgets.find((b) => b.id === selectedBudget);
          if (!budget) return null;
          
          const utilizationPercent = (budget.totalSpent / budget.totalAllocated) * 100;
          
          return (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-neutral-400">Budget Name</p>
                  <p className="font-medium text-neutral-100">{budget.name}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-400">Period</p>
                  <p className="font-medium text-neutral-100 capitalize">{budget.period}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-400">Start Date</p>
                  <p className="font-medium text-neutral-100">{formatDate(budget.startDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-400">End Date</p>
                  <p className="font-medium text-neutral-100">{formatDate(budget.endDate)}</p>
                </div>
              </div>
              
              {/* Progress */}
              <div className="rounded-lg border border-neutral-800 p-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Overall Progress</span>
                    <span className={getUtilizationColor(utilizationPercent)}>
                      {utilizationPercent.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-neutral-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${getProgressColor(utilizationPercent)}`}
                      style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-400">Spent: <span className="text-neutral-100">{formatCurrency(budget.totalSpent)}</span></span>
                    <span className="text-neutral-400">Remaining: <span className="text-neutral-100">{formatCurrency(budget.totalAllocated - budget.totalSpent)}</span></span>
                  </div>
                </div>
              </div>
              
              {/* Line items */}
              <div>
                <p className="text-sm font-medium text-neutral-200 mb-3">Category Breakdown</p>
                <div className="space-y-3">
                  {budget.lineItems.map((item) => {
                    const itemPercent = (item.spent / item.allocated) * 100;
                    return (
                      <div key={item.id} className="rounded-lg border border-neutral-800 p-3">
                        <div className="flex justify-between mb-2">
                          <span className="text-neutral-100">{item.categoryName}</span>
                          <div className="flex items-center gap-2">
                            <span className={getUtilizationColor(itemPercent)}>
                              {itemPercent.toFixed(0)}%
                            </span>
                            {itemPercent > item.alertThreshold && (
                              <AlertTriangle className="h-4 w-4 text-yellow-400" />
                            )}
                          </div>
                        </div>
                        <div className="h-2 rounded-full bg-neutral-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${getProgressColor(itemPercent)}`}
                            style={{ width: `${Math.min(itemPercent, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs mt-1">
                          <span className="text-neutral-500">{formatCurrency(item.spent)} spent</span>
                          <span className="text-neutral-500">{formatCurrency(item.allocated)} allocated</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowViewModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </AppLayout>
  );
}

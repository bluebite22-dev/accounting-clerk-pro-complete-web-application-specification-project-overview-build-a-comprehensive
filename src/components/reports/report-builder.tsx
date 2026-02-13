"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  GripVertical,
  Trash2,
  Plus,
  Save,
  Eye,
  Download,
  Settings,
  BarChart3,
  TrendingUp,
  DollarSign,
  Calendar,
} from "lucide-react";

interface ReportColumn {
  id: string;
  field: string;
  label: string;
  type: "text" | "number" | "currency" | "date" | "calculate";
  width: number;
  visible: boolean;
  calculations?: string[];
}

interface ReportFilter {
  id: string;
  field: string;
  operator: "equals" | "contains" | "gt" | "lt" | "between" | "in";
  value: string;
}

interface ReportLayout {
  columns: ReportColumn[];
  filters: ReportFilter[];
  sortBy?: string;
  sortDir?: "asc" | "desc";
  groupBy?: string;
  calculations: {
    field: string;
    type: "sum" | "avg" | "count" | "min" | "max";
    label: string;
  }[];
}

const AVAILABLE_FIELDS = [
  { field: "date", label: "Date", type: "date" as const },
  { field: "description", label: "Description", type: "text" as const },
  { field: "amount", label: "Amount", type: "currency" as const },
  { field: "type", label: "Type", type: "text" as const },
  { field: "category", label: "Category", type: "text" as const },
  { field: "customer", label: "Customer", type: "text" as const },
  { field: "vendor", label: "Vendor", type: "text" as const },
  { field: "reference", label: "Reference", type: "text" as const },
  { field: "status", label: "Status", type: "text" as const },
];

export function ReportBuilder() {
  const [reportName, setReportName] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [columns, setColumns] = useState<ReportColumn[]>([
    { id: "1", field: "date", label: "Date", type: "date", width: 120, visible: true },
    { id: "2", field: "description", label: "Description", type: "text", width: 200, visible: true },
    { id: "3", field: "amount", label: "Amount", type: "currency", width: 120, visible: true },
    { id: "4", field: "type", label: "Type", type: "text", width: 100, visible: true },
  ]);
  const [filters, setFilters] = useState<ReportFilter[]>([]);
  const [calculations, setCalculations] = useState<ReportLayout["calculations"]>([
    { field: "amount", type: "sum", label: "Total" },
    { field: "amount", type: "avg", label: "Average" },
    { field: "amount", type: "count", label: "Count" },
  ]);
  const [sortBy, setSortBy] = useState("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [activeTab, setActiveTab] = useState<"columns" | "filters" | "calculations" | "settings">("columns");
  const [isSaving, setIsSaving] = useState(false);
  const [isPreview, setIsPreview] = useState(false);

  const addColumn = (field: string) => {
    const fieldInfo = AVAILABLE_FIELDS.find((f) => f.field === field);
    if (!fieldInfo) return;

    const newColumn: ReportColumn = {
      id: Date.now().toString(),
      field,
      label: fieldInfo.label,
      type: fieldInfo.type,
      width: 150,
      visible: true,
    };

    setColumns([...columns, newColumn]);
  };

  const removeColumn = (id: string) => {
    setColumns(columns.filter((c) => c.id !== id));
  };

  const toggleColumnVisibility = (id: string) => {
    setColumns(columns.map((c) => c.id === id ? { ...c, visible: !c.visible } : c));
  };

  const addFilter = () => {
    const newFilter: ReportFilter = {
      id: Date.now().toString(),
      field: "amount",
      operator: "gt",
      value: "",
    };
    setFilters([...filters, newFilter]);
  };

  const removeFilter = (id: string) => {
    setFilters(filters.filter((f) => f.id !== id));
  };

  const updateFilter = (id: string, updates: Partial<ReportFilter>) => {
    setFilters(filters.map((f) => f.id === id ? { ...f, ...updates } : f));
  };

  const moveColumn = useCallback((dragIndex: number, hoverIndex: number) => {
    setColumns((prevColumns) => {
      const newColumns = [...prevColumns];
      const [removed] = newColumns.splice(dragIndex, 1);
      newColumns.splice(hoverIndex, 0, removed);
      return newColumns;
    });
  }, []);

  const handleSave = async () => {
    if (!reportName.trim()) {
      alert("Please enter a report name");
      return;
    }

    setIsSaving(true);
    try {
      const layout: ReportLayout = {
        columns,
        filters,
        sortBy,
        sortDir,
        calculations,
      };

      const response = await fetch("/api/reports/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: reportName,
          description: reportDescription,
          layout,
        }),
      });

      if (response.ok) {
        alert("Report saved successfully!");
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      console.error("Error saving report:", error);
      alert("Failed to save report");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = async () => {
    setIsPreview(true);
    // In production, fetch data based on layout
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Custom Report Builder</h1>
          <p className="text-gray-600">Create custom reports with drag-and-drop</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePreview} disabled={isPreview}>
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Saving..." : "Save Report"}
          </Button>
        </div>
      </div>

      {/* Report Info */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Report Name</label>
              <Input
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                placeholder="Enter report name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Input
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Optional description"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Builder Interface */}
      <div className="grid grid-cols-4 gap-6">
        {/* Field Palette */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-sm">Available Fields</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {AVAILABLE_FIELDS.map((field) => (
                <div
                  key={field.field}
                  className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 cursor-pointer"
                  onClick={() => addColumn(field.field)}
                >
                  <GripVertical className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{field.label}</span>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {field.type}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Report Canvas */}
        <Card className="col-span-3">
          <CardHeader>
            <div className="flex gap-2 border-b pb-2">
              {[
                { id: "columns", label: "Columns", icon: BarChart3 },
                { id: "filters", label: "Filters", icon: Settings },
                { id: "calculations", label: "Calculations", icon: TrendingUp },
                { id: "settings", label: "Settings", icon: DollarSign },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1 px-3 py-2 rounded text-sm ${
                    activeTab === tab.id
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {/* Columns Tab */}
            {activeTab === "columns" && (
              <div className="space-y-2">
                {columns.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Drag fields here or click from the palette</p>
                  </div>
                ) : (
                  columns.map((column, index) => (
                    <div
                      key={column.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                      draggable
                    >
                      <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                      <span className="w-32 text-sm font-medium">{column.label}</span>
                      <Badge variant="secondary" className="text-xs">
                        {column.type}
                      </Badge>
                      <Input
                        type="number"
                        value={column.width}
                        onChange={(e) =>
                          setColumns(
                            columns.map((c) =>
                              c.id === column.id ? { ...c, width: parseInt(e.target.value) } : c
                            )
                          )
                        }
                        className="w-20"
                        placeholder="Width"
                      />
                      <label className="flex items-center gap-1 text-sm">
                        <input
                          type="checkbox"
                          checked={column.visible}
                          onChange={() => toggleColumnVisibility(column.id)}
                          className="rounded"
                        />
                        Visible
                      </label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeColumn(column.id)}
                        className="ml-auto text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Filters Tab */}
            {activeTab === "filters" && (
              <div className="space-y-4">
                {filters.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Settings className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No filters applied</p>
                  </div>
                ) : (
                  filters.map((filter) => (
                    <div key={filter.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <select
                        value={filter.field}
                        onChange={(e) => updateFilter(filter.id, { field: e.target.value })}
                        className="px-2 py-1 border rounded text-sm"
                      >
                        {AVAILABLE_FIELDS.map((f) => (
                          <option key={f.field} value={f.field}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                      <select
                        value={filter.operator}
                        onChange={(e) =>
                          updateFilter(filter.id, { operator: e.target.value as any })
                        }
                        className="px-2 py-1 border rounded text-sm"
                      >
                        <option value="equals">Equals</option>
                        <option value="contains">Contains</option>
                        <option value="gt">Greater than</option>
                        <option value="lt">Less than</option>
                        <option value="between">Between</option>
                      </select>
                      <Input
                        value={filter.value}
                        onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                        placeholder="Value"
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFilter(filter.id)}
                        className="text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
                <Button variant="outline" onClick={addFilter}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Filter
                </Button>
              </div>
            )}

            {/* Calculations Tab */}
            {activeTab === "calculations" && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  {calculations.map((calc, index) => (
                    <div key={index} className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">{calc.type}</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setCalculations(calculations.filter((_, i) => i !== index))
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <Input
                        value={calc.label}
                        onChange={(e) =>
                          setCalculations(
                            calculations.map((c, i) =>
                              i === index ? { ...c, label: e.target.value } : c
                            )
                          )
                        }
                        placeholder="Label"
                        className="mb-2"
                      />
                      <select
                        value={calc.field}
                        onChange={(e) =>
                          setCalculations(
                            calculations.map((c, i) =>
                              i === index ? { ...c, field: e.target.value } : c
                            )
                          )
                        }
                        className="w-full px-2 py-1 border rounded text-sm"
                      >
                        {columns.map((c) => (
                          <option key={c.field} value={c.field}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  onClick={() =>
                    setCalculations([
                      ...calculations,
                      { field: "amount", type: "sum", label: "New Total" },
                    ])
                  }
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Calculation
                </Button>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Sort By</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full px-3 py-2 border rounded"
                    >
                      <option value="">None</option>
                      {columns.map((c) => (
                        <option key={c.field} value={c.field}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Sort Direction</label>
                    <select
                      value={sortDir}
                      onChange={(e) => setSortDir(e.target.value as "asc" | "desc")}
                      className="w-full px-3 py-2 border rounded"
                    >
                      <option value="asc">Ascending</option>
                      <option value="desc">Descending</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Preview Modal */}
      {isPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-4xl max-h-[80vh] overflow-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Report Preview: {reportName || "Untitled"}</CardTitle>
              <Button variant="ghost" onClick={() => setIsPreview(false)}>
                ✕
              </Button>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      {columns.filter((c) => c.visible).map((column) => (
                        <th
                          key={column.id}
                          className="px-4 py-2 text-left font-medium"
                          style={{ width: column.width }}
                        >
                          {column.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t">
                      <td
                        colSpan={columns.filter((c) => c.visible).length}
                        className="px-4 py-8 text-center text-gray-500"
                      >
                        Preview data will appear here
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsPreview(false)}>
                  Close
                </Button>
                <Button onClick={handleSave}>Save Report</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

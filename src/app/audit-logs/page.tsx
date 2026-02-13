"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import { format } from "date-fns";

// Action types for display
const ACTION_TYPES = [
  { value: "", label: "All Actions" },
  { value: "create", label: "Create" },
  { value: "read", label: "Read" },
  { value: "update", label: "Update" },
  { value: "delete", label: "Delete" },
  { value: "login", label: "Login" },
  { value: "logout", label: "Logout" },
  { value: "approve", label: "Approve" },
  { value: "reject", label: "Reject" },
  { value: "cancel", label: "Cancel" },
  { value: "export", label: "Export" },
  { value: "import", label: "Import" },
  { value: "print", label: "Print" },
  { value: "send", label: "Send" },
  { value: "receive", label: "Receive" },
  { value: "upload", label: "Upload" },
  { value: "download", label: "Download" },
  { value: "sync", label: "Sync" },
];

const ENTITY_TYPES = [
  { value: "", label: "All Entities" },
  { value: "user", label: "User" },
  { value: "company", label: "Company" },
  { value: "customer", label: "Customer" },
  { value: "vendor", label: "Vendor" },
  { value: "invoice", label: "Invoice" },
  { value: "bill", label: "Bill" },
  { value: "transaction", label: "Transaction" },
  { value: "stop_order", label: "Stop Order" },
  { value: "budget", label: "Budget" },
  { value: "category", label: "Category" },
  { value: "account", label: "Account" },
  { value: "report", label: "Report" },
  { value: "webhook", label: "Webhook" },
  { value: "integration", label: "Integration" },
  { value: "settings", label: "Settings" },
];

interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string | null;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: number;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AuditLogsPage() {
  const { user } = useAuthStore();
  
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: "",
    entityType: "",
    userId: "",
    startDate: "",
    endDate: "",
  });
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Check if user can view audit logs
  const canView = user && ["admin", "auditor"].includes(user.role);

  // Fetch audit logs
  const fetchLogs = async () => {
    if (!canView) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      
      if (filters.action) params.append("action", filters.action);
      if (filters.entityType) params.append("entityType", filters.entityType);
      if (filters.userId) params.append("userId", filters.userId);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);

      const response = await fetch(`/api/audit-logs?${params}`);
      const data = await response.json();
      
      setLogs(data.logs || []);
      setPagination(data.pagination || pagination);
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [pagination.page, canView]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSearch = () => {
    fetchLogs();
  };

  const handleExport = async () => {
    const params = new URLSearchParams({
      export: "csv",
    });
    
    if (filters.action) params.append("action", filters.action);
    if (filters.entityType) params.append("entityType", filters.entityType);
    if (filters.userId) params.append("userId", filters.userId);
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);

    window.open(`/api/audit-logs?${params}`, "_blank");
  };

  const getActionBadgeColor = (action: string) => {
    const colors: Record<string, string> = {
      create: "bg-green-100 text-green-800",
      update: "bg-blue-100 text-blue-800",
      delete: "bg-red-100 text-red-800",
      login: "bg-green-100 text-green-800",
      logout: "bg-gray-100 text-gray-800",
      approve: "bg-green-100 text-green-800",
      reject: "bg-red-100 text-red-800",
      export: "bg-purple-100 text-purple-800",
      import: "bg-purple-100 text-purple-800",
    };
    return colors[action] || "bg-gray-100 text-gray-800";
  };

  if (!canView) {
    return (
      <div className="container mx-auto py-8">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold text-red-600">Access Denied</h2>
          <p className="text-gray-600 mt-2">You do not have permission to view audit logs.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <Button onClick={handleExport} variant="outline">
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Action</label>
            <Select
              value={filters.action}
              onChange={(e) => handleFilterChange("action", e.target.value)}
              options={ACTION_TYPES}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Entity Type</label>
            <Select
              value={filters.entityType}
              onChange={(e) => handleFilterChange("entityType", e.target.value)}
              options={ENTITY_TYPES}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">User ID</label>
            <Input
              type="text"
              value={filters.userId}
              onChange={(e) => handleFilterChange("userId", e.target.value)}
              placeholder="Filter by user ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Start Date</label>
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">End Date</label>
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={handleSearch}>Apply Filters</Button>
        </div>
      </Card>

      {/* Results */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Entity ID</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  No audit logs found.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{format(new Date(log.createdAt), "MMM d, yyyy HH:mm:ss")}</TableCell>
                  <TableCell className="font-mono text-xs">{log.userId}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${getActionBadgeColor(log.action)}`}>
                      {log.action}
                    </span>
                  </TableCell>
                  <TableCell>{log.entityType}</TableCell>
                  <TableCell className="font-mono text-xs">{log.entityId || "-"}</TableCell>
                  <TableCell className="font-mono text-xs">{log.ipAddress || "-"}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedLog(log);
                        setIsModalOpen(true);
                      }}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="flex justify-between items-center p-4 border-t">
          <span className="text-sm text-gray-600">
            Showing {logs.length} of {pagination.total} logs
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === 1}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
            >
              Previous
            </Button>
            <span className="text-sm py-2">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === pagination.totalPages}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* Details Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Audit Log Details">
        {selectedLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">ID</label>
                <p className="font-mono text-xs">{selectedLog.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Timestamp</label>
                <p>{format(new Date(selectedLog.createdAt), "PPpp")}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">User ID</label>
                <p className="font-mono text-xs">{selectedLog.userId}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">IP Address</label>
                <p className="font-mono text-xs">{selectedLog.ipAddress || "N/A"}</p>
              </div>
            </div>

            {selectedLog.oldValue && (
              <div>
                <label className="text-sm font-medium text-gray-500">Old Value</label>
                <pre className="bg-gray-100 p-2 rounded text-xs mt-1 overflow-auto">
                  {JSON.stringify(selectedLog.oldValue, null, 2)}
                </pre>
              </div>
            )}

            {selectedLog.newValue && (
              <div>
                <label className="text-sm font-medium text-gray-500">New Value</label>
                <pre className="bg-gray-100 p-2 rounded text-xs mt-1 overflow-auto">
                  {JSON.stringify(selectedLog.newValue, null, 2)}
                </pre>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

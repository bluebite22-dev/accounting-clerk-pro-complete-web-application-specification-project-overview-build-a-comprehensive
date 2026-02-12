"use client";

import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useAuthStore } from "@/stores/auth-store";
import { formatCurrency, formatDate, generateId } from "@/lib/utils";
import StopOrderForm from "@/components/stop-orders/stop-order-form";
import {
  Plus,
  Search,
  Target,
  AlertTriangle,
  Ban,
  CheckSquare,
  User,
  FileText,
  Trash2,
  Edit,
  Send,
  Check,
  X,
  Clock,
  Eye,
} from "lucide-react";

type FilterTab = "all" | "draft" | "pending_approval" | "approved" | "rejected" | "active" | "completed";

export default function StopOrdersPage() {
  const { stopOrders, addStopOrder, updateStopOrder, deleteStopOrder } = useDataStore();
  const { user } = useAuthStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<StopOrder | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvingOrder, setApprovingOrder] = useState<StopOrder | null>(null);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [approvalAction, setApprovalAction] = useState<"approve" | "reject">("approve");

  const canApprove = user && ["admin", "accountant"].includes(user.role);

  const filteredStopOrders = stopOrders.filter((order) => {
    const matchesSearch =
      order.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.man_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.nrc_no?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "all" || order.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const activeStops = stopOrders.filter((s) => s.isActive && s.status === "active");
  const totalBlocked = activeStops.reduce((sum, s) => sum + (s.blockedAmount || 0), 0);
  const pendingCount = stopOrders.filter((s) => s.status === "pending_approval").length;

  const handleAddOrder = (orderData: StopOrder) => {
    addStopOrder(orderData);
    setShowAddModal(false);
  };

  const handleEditOrder = (orderData: StopOrder) => {
    updateStopOrder(orderData.id, orderData);
    setEditingOrder(null);
  };

  const handleSubmitForApproval = (id: string) => {
    updateStopOrder(id, {
      status: "pending_approval",
      submittedBy: user?.email,
      submittedAt: new Date().toISOString(),
    });
  };

  const handleApprove = () => {
    if (!approvingOrder) return;
    updateStopOrder(approvingOrder.id, {
      status: "approved",
      approvedBy: user?.email,
      approvedAt: new Date().toISOString(),
      approvalNotes,
      isActive: true,
    });
    setShowApprovalModal(false);
    setApprovingOrder(null);
    setApprovalNotes("");
  };

  const handleReject = () => {
    if (!approvingOrder) return;
    updateStopOrder(approvingOrder.id, {
      status: "rejected",
      rejectedBy: user?.email,
      rejectedAt: new Date().toISOString(),
      approvalNotes,
    });
    setShowApprovalModal(false);
    setApprovingOrder(null);
    setApprovalNotes("");
  };

  const handleActivate = (id: string) => {
    updateStopOrder(id, { isActive: true, status: "active" });
  };

  const handleDeactivate = (id: string) => {
    updateStopOrder(id, { isActive: false, status: "completed" });
  };

  const getStatusBadge = (status: string | undefined) => {
    const statusColors: Record<string, string> = {
      draft: "bg-neutral-500",
      pending_approval: "bg-yellow-500",
      approved: "bg-blue-500",
      rejected: "bg-red-500",
      active: "bg-green-500",
      completed: "bg-purple-500",
      cancelled: "bg-red-700",
    };
    return statusColors[status || "draft"] || "bg-neutral-500";
  };

  const getStatusLabel = (status: string | undefined) => {
    const labels: Record<string, string> = {
      draft: "Draft",
      pending_approval: "Pending Approval",
      approved: "Approved",
      rejected: "Rejected",
      active: "Active",
      completed: "Completed",
      cancelled: "Cancelled",
    };
    return labels[status || "draft"] || status;
  };

  const getRankIcon = (rank: string | undefined) => {
    switch (rank?.toLowerCase()) {
      case "officer":
        return <User className="h-4 w-4" />;
      case "soldier":
        return <Target className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const tabs: { id: FilterTab; label: string; count: number }[] = [
    { id: "all", label: "All", count: stopOrders.length },
    { id: "draft", label: "Draft", count: stopOrders.filter((s) => s.status === "draft").length },
    { id: "pending_approval", label: "Pending", count: stopOrders.filter((s) => s.status === "pending_approval").length },
    { id: "approved", label: "Approved", count: stopOrders.filter((s) => s.status === "approved").length },
    { id: "rejected", label: "Rejected", count: stopOrders.filter((s) => s.status === "rejected").length },
    { id: "active", label: "Active", count: stopOrders.filter((s) => s.status === "active" && s.isActive).length },
    { id: "completed", label: "Completed", count: stopOrders.filter((s) => s.status === "completed").length },
  ];

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
                <div className="rounded-xl bg-yellow-500/20 p-3">
                  <Clock className="h-6 w-6 text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-neutral-400">Pending Approval</p>
                  <p className="text-2xl font-bold text-white">{pendingCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab(tab.id)}
                  className="gap-2"
                >
                  {tab.label}
                  <Badge variant="secondary" className="text-xs">
                    {tab.count}
                  </Badge>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

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
                <TableHead className="w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStopOrders.map((order) => (
                <TableRow key={order.id} className={!order.isActive && order.status !== "draft" ? "opacity-50" : ""}>
                  <TableCell>
                    <Badge className={getStatusBadge(order.status)}>
                      {getStatusLabel(order.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-white">{order.full_name}</p>
                      <p className="text-sm text-neutral-400">{order.nrc_no}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getRankIcon(order.rank)}
                      <span className="capitalize">{order.rank}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">{order.man_no}</TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(order.deduction_amount || 0)}
                  </TableCell>
                  <TableCell>{order.duration_months} months</TableCell>
                  <TableCell className="text-sm">
                    {order.monthly_deduction_from 
                      ? formatDate(order.monthly_deduction_from)
                      : "-"} to {order.monthly_deduction_to 
                      ? formatDate(order.monthly_deduction_to)
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {/* View Details */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setApprovingOrder(order);
                          setApprovalAction("approve");
                          setShowApprovalModal(true);
                        }}
                        title="View Details"
                      >
                        <Eye className="h-4 w-4 text-neutral-400" />
                      </Button>

                      {/* Draft actions */}
                      {order.status === "draft" && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleSubmitForApproval(order.id)}
                            title="Submit for Approval"
                          >
                            <Send className="h-4 w-4 text-yellow-400" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingOrder(order)}
                            title="Edit"
                          >
                            <Edit className="h-4 w-4 text-blue-400" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteStopOrder(order.id)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </Button>
                        </>
                      )}

                      {/* Pending approval - Admin/Accountant actions */}
                      {order.status === "pending_approval" && canApprove && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setApprovingOrder(order);
                              setApprovalAction("approve");
                              setShowApprovalModal(true);
                            }}
                            title="Approve"
                          >
                            <Check className="h-4 w-4 text-green-400" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setApprovingOrder(order);
                              setApprovalAction("reject");
                              setShowApprovalModal(true);
                            }}
                            title="Reject"
                          >
                            <X className="h-4 w-4 text-red-400" />
                          </Button>
                        </>
                      )}

                      {/* Approved - Activate */}
                      {order.status === "approved" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleActivate(order.id)}
                          title="Activate"
                        >
                          <CheckSquare className="h-4 w-4 text-green-400" />
                        </Button>
                      )}

                      {/* Active - Deactivate */}
                      {order.status === "active" && order.isActive && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeactivate(order.id)}
                          title="Deactivate"
                        >
                          <Ban className="h-4 w-4 text-yellow-400" />
                        </Button>
                      )}

                      {/* Edit approved/active orders */}
                      {(order.status === "approved" || order.status === "active") && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingOrder(order)}
                          title="Edit"
                        >
                          <Edit className="h-4 w-4 text-blue-400" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredStopOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-neutral-400">
                    No stop orders found. Create one to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Add Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="New Stop Order"
        className="max-w-6xl"
      >
        <StopOrderForm
          onSave={handleAddOrder}
          onCancel={() => setShowAddModal(false)}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingOrder}
        onClose={() => setEditingOrder(null)}
        title="Edit Stop Order"
        className="max-w-6xl"
      >
        {editingOrder && (
          <StopOrderForm
            order={editingOrder}
            onSave={handleEditOrder}
            onCancel={() => setEditingOrder(null)}
          />
        )}
      </Modal>

      {/* Approval Modal */}
      <Modal
        isOpen={showApprovalModal}
        onClose={() => {
          setShowApprovalModal(false);
          setApprovingOrder(null);
          setApprovalNotes("");
        }}
        title={approvalAction === "approve" ? "Approve Stop Order" : "Reject Stop Order"}
        className="max-w-2xl"
      >
        {approvingOrder && (
          <div className="space-y-6">
            {/* Order Details */}
            <div className="bg-neutral-800 rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-white">Stop Order Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-neutral-400">Form No:</span>
                  <span className="ml-2 text-white">{approvingOrder.form_number}</span>
                </div>
                <div>
                  <span className="text-neutral-400">Employee:</span>
                  <span className="ml-2 text-white">{approvingOrder.full_name}</span>
                </div>
                <div>
                  <span className="text-neutral-400">NRC:</span>
                  <span className="ml-2 text-white">{approvingOrder.nrc_no}</span>
                </div>
                <div>
                  <span className="text-neutral-400">Amount:</span>
                  <span className="ml-2 text-white">{formatCurrency(approvingOrder.deduction_amount || 0)}</span>
                </div>
                <div>
                  <span className="text-neutral-400">Duration:</span>
                  <span className="ml-2 text-white">{approvingOrder.duration_months} months</span>
                </div>
                <div>
                  <span className="text-neutral-400">Rank:</span>
                  <span className="ml-2 text-white">{approvingOrder.rank}</span>
                </div>
              </div>
            </div>

            {/* Submission Info */}
            {approvingOrder.submittedBy && (
              <div className="text-sm text-neutral-400">
                Submitted by {approvingOrder.submittedBy} on {formatDate(approvingOrder.submittedAt || "")}
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="text-sm font-medium text-neutral-200">
                {approvalAction === "approve" ? "Approval Notes (Optional)" : "Rejection Reason (Required)"}
              </label>
              <textarea
                className="mt-2 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder={approvalAction === "approve" ? "Add any notes..." : "Please provide a reason for rejection..."}
                required={approvalAction === "reject"}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowApprovalModal(false);
                  setApprovingOrder(null);
                  setApprovalNotes("");
                }}
              >
                Cancel
              </Button>
              {approvalAction === "reject" ? (
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={!approvalNotes.trim()}
                >
                  <X className="mr-2 h-4 w-4" />
                  Reject
                </Button>
              ) : (
                <Button
                  variant="default"
                  onClick={handleApprove}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Approve
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}

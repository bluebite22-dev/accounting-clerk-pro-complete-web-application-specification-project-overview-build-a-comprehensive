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
} from "lucide-react";

export default function StopOrdersPage() {
  const { stopOrders, addStopOrder, updateStopOrder, deleteStopOrder } = useDataStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<StopOrder | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredStopOrders = stopOrders.filter((order) => {
    const matchesSearch =
      order.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.man_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.nrc_no?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const activeStops = stopOrders.filter((s) => s.isActive);
  const totalBlocked = activeStops.reduce((sum, s) => sum + (s.blockedAmount || 0), 0);

  const handleAddOrder = (orderData: StopOrder) => {
    addStopOrder(orderData);
    setShowAddModal(false);
  };

  const handleEditOrder = (orderData: StopOrder) => {
    updateStopOrder(orderData.id, orderData);
    setEditingOrder(null);
  };

  const handleToggle = (id: string, currentStatus: boolean) => {
    updateStopOrder(id, { isActive: !currentStatus });
  };

  const getStatusBadge = (status: string | undefined) => {
    const statusColors: Record<string, string> = {
      draft: "bg-neutral-500",
      pending_approval: "bg-yellow-500",
      active: "bg-green-500",
      completed: "bg-blue-500",
      cancelled: "bg-red-500",
      rejected: "bg-red-700",
    };
    return statusColors[status || "draft"] || "bg-neutral-500";
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
                    <Badge className={getStatusBadge(order.status)}>
                      {order.status || "draft"}
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
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggle(order.id, order.isActive)}
                        title={order.isActive ? "Deactivate" : "Activate"}
                      >
                        {order.isActive ? (
                          <CheckSquare className="h-4 w-4 text-green-400" />
                        ) : (
                          <Ban className="h-4 w-4 text-neutral-400" />
                        )}
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
    </AppLayout>
  );
}

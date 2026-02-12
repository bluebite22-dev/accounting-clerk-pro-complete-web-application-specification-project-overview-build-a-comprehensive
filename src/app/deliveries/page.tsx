"use client";

import { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { useDataStore } from "@/stores/data-store";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Truck,
  Package,
  Calendar,
  Download,
  FileText,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function DeliveriesPage() {
  const { stopOrders } = useDataStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Calculate deliveries from stop orders
  const deliveries = useMemo(() => {
    const deliveryList: Array<{
      id: string;
      formNumber: string;
      employeeName: string;
      deductionAmount: number;
      deliveriesCount: number;
      amountPerDelivery: number;
      fromDate: string;
      toDate: string;
      status: string;
      clientName: string;
      productNo: string;
    }> = [];

    stopOrders.forEach((order) => {
      if (order.type === "payroll" && order.deduction_amount && order.monthly_deduction_from && order.monthly_deduction_to) {
        // Calculate deliveries: deduction_amount / 150
        const deductionAmount = order.deduction_amount || 0;
        const deliveriesCount = Math.floor(deductionAmount / 150);
        
        if (deliveriesCount > 0) {
          const amountPerDelivery = deductionAmount / deliveriesCount;
          
          // Generate delivery dates
          const fromDate = new Date(order.monthly_deduction_from);
          const toDate = new Date(order.monthly_deduction_to);
          
          // Calculate months difference
          const monthsDiff = (toDate.getFullYear() - fromDate.getFullYear()) * 12 + (toDate.getMonth() - fromDate.getMonth());
          const expectedDeliveries = Math.min(deliveriesCount, monthsDiff + 1);

          deliveryList.push({
            id: order.id,
            formNumber: order.form_number || order.id,
            employeeName: order.full_name || "Unknown",
            deductionAmount,
            deliveriesCount: expectedDeliveries,
            amountPerDelivery,
            fromDate: order.monthly_deduction_from,
            toDate: order.monthly_deduction_to,
            status: order.status || "active",
            clientName: order.client_name || "",
            productNo: order.product_no || "",
          });
        }
      }
    });

    return deliveryList;
  }, [stopOrders]);

  // Filter deliveries
  const filteredDeliveries = deliveries.filter((delivery) => {
    const matchesSearch =
      delivery.employeeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delivery.formNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delivery.clientName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredDeliveries.length / itemsPerPage);
  const paginatedDeliveries = filteredDeliveries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Summary stats
  const totalDeliveries = deliveries.reduce((sum, d) => sum + d.deliveriesCount, 0);
  const totalAmount = deliveries.reduce((sum, d) => sum + d.deductionAmount, 0);
  const activeDeliveries = deliveries.filter((d) => d.status === "active").length;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Deliveries Tracking</h1>
            <p className="text-neutral-400">
              Track deliveries based on stop order deductions (K150 per delivery)
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="bg-neutral-900 border-neutral-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <Truck className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-neutral-400">Total Deliveries</p>
                  <p className="text-2xl font-bold text-white">{totalDeliveries}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <Package className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-neutral-400">Active Stop Orders</p>
                  <p className="text-2xl font-bold text-white">{activeDeliveries}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500/20 rounded-lg">
                  <FileText className="h-6 w-6 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm text-neutral-400">Total Deduction Amount</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(totalAmount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Deliveries Table */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-white">Delivery Schedule</CardTitle>
                <CardDescription>
                  Based on deduction amount ÷ K150 per delivery
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {paginatedDeliveries.length === 0 ? (
              <div className="text-center py-8 text-neutral-400">
                {searchQuery
                  ? "No deliveries match your search"
                  : "No stop orders with delivery calculations found"}
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="border-neutral-800">
                      <TableHead className="text-neutral-400">Form No</TableHead>
                      <TableHead className="text-neutral-400">Employee</TableHead>
                      <TableHead className="text-neutral-400">Deduction (K)</TableHead>
                      <TableHead className="text-neutral-400">Deliveries</TableHead>
                      <TableHead className="text-neutral-400">Per Delivery</TableHead>
                      <TableHead className="text-neutral-400">Period</TableHead>
                      <TableHead className="text-neutral-400">Client</TableHead>
                      <TableHead className="text-neutral-400">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedDeliveries.map((delivery) => (
                      <TableRow key={delivery.id} className="border-neutral-800">
                        <TableCell className="text-white font-medium">
                          {delivery.formNumber}
                        </TableCell>
                        <TableCell className="text-white">{delivery.employeeName}</TableCell>
                        <TableCell className="text-white">
                          {formatCurrency(delivery.deductionAmount)}
                        </TableCell>
                        <TableCell className="text-white">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-500/20 text-blue-400">
                            {delivery.deliveriesCount} deliveries
                          </span>
                        </TableCell>
                        <TableCell className="text-neutral-300">
                          {formatCurrency(delivery.amountPerDelivery)}
                        </TableCell>
                        <TableCell className="text-neutral-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(delivery.fromDate)} - {formatDate(delivery.toDate)}
                          </div>
                        </TableCell>
                        <TableCell className="text-neutral-400">
                          {delivery.clientName || "-"}
                        </TableCell>
                        <TableCell className="text-neutral-400">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              delivery.status === "active"
                                ? "bg-green-500/20 text-green-400"
                                : delivery.status === "completed"
                                ? "bg-blue-500/20 text-blue-400"
                                : "bg-neutral-500/20 text-neutral-400"
                            }`}
                          >
                            {delivery.status.charAt(0).toUpperCase() + delivery.status.slice(1)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-800">
                    <p className="text-sm text-neutral-400">
                      Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                      {Math.min(currentPage * itemsPerPage, filteredDeliveries.length)} of{" "}
                      {filteredDeliveries.length} deliveries
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <span className="text-sm text-neutral-400">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Calculation Info */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">Delivery Calculation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-neutral-800 rounded-lg p-4">
              <p className="text-neutral-300 mb-2">
                <strong>Formula:</strong> Number of Deliveries = Deduction Amount ÷ K150
              </p>
              <p className="text-neutral-400 text-sm">
                Example: K3,000 deduction = <strong>20 deliveries</strong>
              </p>
              <p className="text-neutral-400 text-sm mt-2">
                Each delivery amount is calculated as: Deduction Amount ÷ Number of Deliveries
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

"use client";

import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Edit3,
  Plus,
  Search,
  ChevronRight,
  Users,
  DollarSign,
  Receipt,
  Building2,
  Target,
} from "lucide-react";
import Link from "next/link";

interface FormTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  href: string;
  color: string;
  lastUpdated?: string;
}

const formTemplates: FormTemplate[] = [
  {
    id: "stop-order",
    name: "Stop Order Form",
    description: "Edit salary deduction authorizations for employees",
    category: "Payroll",
    icon: <Target className="h-6 w-6" />,
    href: "/stop-orders",
    color: "bg-red-500/20 text-red-400",
    lastUpdated: "2024-01-15",
  },
  {
    id: "invoice",
    name: "Invoice Form",
    description: "Create and edit customer invoices",
    category: "Accounts Receivable",
    icon: <FileText className="h-6 w-6" />,
    href: "/invoices",
    color: "bg-blue-500/20 text-blue-400",
    lastUpdated: "2024-01-14",
  },
  {
    id: "bill",
    name: "Bill Form",
    description: "Create and edit vendor bills",
    category: "Accounts Payable",
    icon: <Receipt className="h-6 w-6" />,
    href: "/bills",
    color: "bg-green-500/20 text-green-400",
    lastUpdated: "2024-01-13",
  },
  {
    id: "customer",
    name: "Customer Form",
    description: "Manage customer information and details",
    category: "Customers",
    icon: <Users className="h-6 w-6" />,
    href: "/customers",
    color: "bg-purple-500/20 text-purple-400",
    lastUpdated: "2024-01-12",
  },
  {
    id: "vendor",
    name: "Vendor Form",
    description: "Manage vendor information and details",
    category: "Vendors",
    icon: <Building2 className="h-6 w-6" />,
    href: "/vendors",
    color: "bg-amber-500/20 text-amber-400",
    lastUpdated: "2024-01-11",
  },
  {
    id: "income",
    name: "Income Entry Form",
    description: "Record income transactions",
    category: "Income",
    icon: <DollarSign className="h-6 w-6" />,
    href: "/income",
    color: "bg-emerald-500/20 text-emerald-400",
    lastUpdated: "2024-01-10",
  },
  {
    id: "expense",
    name: "Expense Entry Form",
    description: "Record expense transactions",
    category: "Expenses",
    icon: <Receipt className="h-6 w-6" />,
    href: "/expenses",
    color: "bg-orange-500/20 text-orange-400",
    lastUpdated: "2024-01-09",
  },
];

const categories = ["All", "Payroll", "Accounts Receivable", "Accounts Payable", "Customers", "Vendors", "Income", "Expenses"];

export default function FormsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredForms = formTemplates.filter((form) => {
    const matchesSearch =
      form.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      form.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || form.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Edit Forms</h1>
          <p className="text-neutral-400">Access and edit all forms in the system</p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              placeholder="Search forms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Forms Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredForms.map((form) => (
            <Card key={form.id} className="bg-neutral-900 border-neutral-800 hover:border-neutral-700 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-lg ${form.color}`}>
                    {form.icon}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {form.category}
                  </Badge>
                </div>
                <CardTitle className="text-lg mt-4">{form.name}</CardTitle>
                <CardDescription className="text-sm">
                  {form.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mt-4">
                  {form.lastUpdated && (
                    <span className="text-xs text-neutral-500">
                      Updated: {new Date(form.lastUpdated).toLocaleDateString()}
                    </span>
                  )}
                  <Link href={form.href}>
                    <Button variant="ghost" size="sm">
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredForms.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-neutral-600 mb-4" />
            <p className="text-neutral-400">No forms match your search</p>
            <p className="text-sm text-neutral-500 mt-1">Try adjusting your search or filter criteria</p>
          </div>
        )}

        {/* Quick Actions */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white">Quick Actions</CardTitle>
            <CardDescription>Common form operations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Link href="/stop-orders">
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="h-4 w-4 mr-2" />
                  New Stop Order
                </Button>
              </Link>
              <Link href="/invoices">
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="h-4 w-4 mr-2" />
                  New Invoice
                </Button>
              </Link>
              <Link href="/bills">
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="h-4 w-4 mr-2" />
                  New Bill
                </Button>
              </Link>
              <Link href="/customers">
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="h-4 w-4 mr-2" />
                  New Customer
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

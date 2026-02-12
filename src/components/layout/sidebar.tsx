"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import {
  LayoutDashboard,
  DollarSign,
  FileText,
  Receipt,
  Users,
  Building2,
  Ban,
  PieChart,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/income", label: "Income", icon: DollarSign },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/invoices", label: "Invoices", icon: FileText, roles: ["admin", "accountant", "clerk"] },
  { href: "/bills", label: "Bills", icon: FileText },
  { href: "/customers", label: "Customers", icon: Users, roles: ["admin", "accountant", "clerk"] },
  { href: "/vendors", label: "Vendors", icon: Building2, roles: ["admin", "accountant", "clerk"] },
  { href: "/stop-orders", label: "Stop Orders", icon: Ban, roles: ["admin", "accountant"] },
  { href: "/budgets", label: "Budgets", icon: PieChart },
  { href: "/reports", label: "Reports", icon: PieChart },
  { href: "/settings", label: "Settings", icon: Settings, roles: ["admin"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  const filteredMenuItems = menuItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r border-neutral-800 bg-neutral-900 transition-all duration-300",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-neutral-800 px-4">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">AccountingPro</span>
          </Link>
        )}
        {collapsed && (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
            <DollarSign className="h-5 w-5 text-white" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {filteredMenuItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-600/20 text-blue-400"
                  : "text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-neutral-800 p-3">
        {!collapsed && user && (
          <div className="mb-3 flex items-center gap-3 rounded-lg bg-neutral-800/50 p-3">
            <Avatar name={`${user.firstName} ${user.lastName}`} size="sm" />
            <div className="flex-1 truncate">
              <p className="truncate text-sm font-medium text-neutral-100">
                {user.firstName} {user.lastName}
              </p>
              <p className="truncate text-xs text-neutral-400 capitalize">{user.role}</p>
            </div>
          </div>
        )}
        
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="mb-2 flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
        
        <button
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-red-600/20"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}

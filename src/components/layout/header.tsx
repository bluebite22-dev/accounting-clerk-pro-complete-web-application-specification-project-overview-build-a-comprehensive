"use client";

import { Bell, Search, Menu } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user } = useAuthStore();
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, title: "Invoice #1001 due today", time: "2 hours ago", unread: true },
    { id: 2, title: "Payment received from Acme Corp", time: "5 hours ago", unread: true },
    { id: 3, title: "Budget alert: Marketing at 90%", time: "1 day ago", unread: false },
  ];

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-neutral-800 bg-neutral-900/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-neutral-900/80 lg:px-6">
      {/* Left section */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          <Input
            type="search"
            placeholder="Search transactions, invoices..."
            className="w-80 pl-10"
          />
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                {unreadCount}
              </span>
            )}
          </Button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-neutral-800 bg-neutral-900 p-2 shadow-xl">
              <div className="mb-2 flex items-center justify-between px-2">
                <h3 className="font-semibold text-neutral-100">Notifications</h3>
                <button className="text-xs text-blue-400 hover:underline">
                  Mark all read
                </button>
              </div>
              <div className="space-y-1">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`rounded-lg p-3 transition-colors hover:bg-neutral-800 ${
                      notification.unread ? "bg-neutral-800/50" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {notification.unread && (
                        <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                      )}
                      <div className={notification.unread ? "" : "ml-5"}>
                        <p className="text-sm text-neutral-100">{notification.title}</p>
                        <p className="text-xs text-neutral-500">{notification.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="mt-2 w-full rounded-lg py-2 text-center text-sm text-blue-400 hover:bg-neutral-800">
                View all notifications
              </button>
            </div>
          )}
        </div>

        {/* User menu */}
        {user && (
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-neutral-100">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-neutral-400 capitalize">{user.role}</p>
            </div>
            <Avatar name={`${user.firstName} ${user.lastName}`} size="sm" />
          </div>
        )}
      </div>
    </header>
  );
}

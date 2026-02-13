"use client";

import { Bell, Search, Menu, Sun, Moon, Monitor } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useNotificationStore, showToast } from "@/stores/notification-store";
import { useThemeStore } from "@/stores/theme-store";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user } = useAuthStore();
  const { notifications, markAsRead, markAllAsRead } = useNotificationStore();
  const { theme, setTheme } = useThemeStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const unreadCount = useMemo(() => 
    notifications.filter((n) => !n.isRead).length, 
  [notifications]);

  // Format relative time
  const formatTime = useMemo(() => (createdAt: string) => {
    const createdDate = new Date(createdAt).getTime();
    const diff = Date.now() - createdDate;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }, []);

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
        {/* Theme toggle */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowThemeMenu(!showThemeMenu)}
          >
            {theme === "dark" ? (
              <Moon className="h-5 w-5" />
            ) : theme === "light" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Monitor className="h-5 w-5" />
            )}
          </Button>

          {showThemeMenu && (
            <div className="absolute right-0 top-full mt-2 w-40 rounded-xl border border-neutral-800 bg-neutral-900 p-1 shadow-xl">
              <button
                onClick={() => {
                  setTheme("dark");
                  setShowThemeMenu(false);
                  showToast("info", "Theme Changed", "Dark mode enabled");
                }}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                  theme === "dark" ? "bg-blue-500/20 text-blue-400" : "text-neutral-300 hover:bg-neutral-800"
                }`}
              >
                <Moon className="h-4 w-4" />
                Dark
              </button>
              <button
                onClick={() => {
                  setTheme("light");
                  setShowThemeMenu(false);
                  showToast("info", "Theme Changed", "Light mode enabled");
                }}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                  theme === "light" ? "bg-blue-500/20 text-blue-400" : "text-neutral-300 hover:bg-neutral-800"
                }`}
              >
                <Sun className="h-4 w-4" />
                Light
              </button>
              <button
                onClick={() => {
                  setTheme("system");
                  setShowThemeMenu(false);
                  showToast("info", "Theme Changed", "System theme enabled");
                }}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                  theme === "system" ? "bg-blue-500/20 text-blue-400" : "text-neutral-300 hover:bg-neutral-800"
                }`}
              >
                <Monitor className="h-4 w-4" />
                System
              </button>
            </div>
          )}
        </div>

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
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-blue-400 hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-neutral-500">
                    <Bell className="mx-auto h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">No notifications</p>
                  </div>
                ) : (
                  notifications.slice(0, 10).map((notification) => (
                    <div
                      key={notification.id}
                      className={`rounded-lg p-3 transition-colors hover:bg-neutral-800 cursor-pointer ${
                        !notification.isRead ? "bg-neutral-800/50" : ""
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        {!notification.isRead && (
                          <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                        )}
                        <div className={!notification.isRead ? "" : "ml-5 flex-1"}>
                          <p className="text-sm text-neutral-100">{notification.title}</p>
                          <p className="text-xs text-neutral-400">{notification.message}</p>
                          <p className="text-xs text-neutral-500 mt-1">{formatTime(notification.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {notifications.length > 0 && (
                <button className="mt-2 w-full rounded-lg py-2 text-center text-sm text-blue-400 hover:bg-neutral-800">
                  View all notifications
                </button>
              )}
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

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { useDataStore } from "@/stores/data-store";
import { useSyncStore } from "@/stores/sync-store";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const initializeMockData = useDataStore((state) => state.initializeMockData);
  const initializeSync = useSyncStore((state) => state.initializeSync);
  const saveToOffline = useSyncStore((state) => state.saveToOffline);
  const loadFromOffline = useSyncStore((state) => state.loadFromOffline);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    } else {
      // Initialize sync system
      initializeSync();
      // Load offline data first
      loadFromOffline();
      // Then initialize mock data
      initializeMockData();
    }
  }, [isAuthenticated, router, initializeMockData, initializeSync, loadFromOffline]);

  // Auto-save to offline storage on data changes
  useEffect(() => {
    if (isAuthenticated) {
      saveToOffline();
    }
  }, [isAuthenticated, saveToOffline]);

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Sidebar - Desktop */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div className="h-full w-64" onClick={(e) => e.stopPropagation()}>
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className={cn("transition-all duration-300 lg:ml-64")}>
        <Header onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}

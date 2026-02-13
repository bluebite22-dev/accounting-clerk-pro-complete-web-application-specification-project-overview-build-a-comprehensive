/**
 * Offline Data Hook - Provides easy-to-use hooks for offline operations
 */

import { useEffect, useCallback } from "react";
import { useSyncStore, type EntityType } from "@/stores/sync-store";
import { useDataStore } from "@/stores/data-store";

/**
 * Hook to initialize offline sync on component mount
 */
export function useOfflineSync() {
  const initializeSync = useSyncStore((state) => state.initializeSync);
  const saveToOffline = useSyncStore((state) => state.saveToOffline);
  const loadFromOffline = useSyncStore((state) => state.loadFromOffline);
  const syncPendingItems = useSyncStore((state) => state.syncPendingItems);

  useEffect(() => {
    initializeSync();
    loadFromOffline();
  }, [initializeSync, loadFromOffline]);

  return { saveToOffline, syncPendingItems };
}

/**
 * Hook to queue operations for offline sync
 */
export function useOfflineQueue() {
  const queueOperation = useSyncStore((state) => state.queueOperation);

  return {
    queueCreate: useCallback(
      (entityType: EntityType, data: Record<string, unknown>) =>
        queueOperation(entityType, "create", data),
      [queueOperation]
    ),
    queueUpdate: useCallback(
      (entityType: EntityType, data: Record<string, unknown>) =>
        queueOperation(entityType, "update", data),
      [queueOperation]
    ),
    queueDelete: useCallback(
      (entityType: EntityType, data: { id: string }) =>
        queueOperation(entityType, "delete", data),
      [queueOperation]
    ),
  };
}

/**
 * Hook for offline-aware data store operations
 */
export function useOfflineData() {
  const { queueCreate, queueUpdate, queueDelete } = useOfflineQueue();
  const isOnline = useSyncStore((state) => state.isOnline);

  const dataStore = useDataStore();

  return {
    // Transaction operations
    addTransaction: useCallback(
      (transaction: Parameters<typeof dataStore.addTransaction>[0]) => {
        dataStore.addTransaction(transaction);
        if (!isOnline) {
          queueCreate("transaction", transaction as unknown as Record<string, unknown>);
        }
      },
      [dataStore, isOnline, queueCreate]
    ),
    updateTransaction: useCallback(
      (id: string, updates: Parameters<typeof dataStore.updateTransaction>[1]) => {
        dataStore.updateTransaction(id, updates);
        if (!isOnline) {
          queueUpdate("transaction", { id, ...updates });
        }
      },
      [dataStore, isOnline, queueUpdate]
    ),
    deleteTransaction: useCallback(
      (id: string) => {
        dataStore.deleteTransaction(id);
        if (!isOnline) {
          queueDelete("transaction", { id });
        }
      },
      [dataStore, isOnline, queueDelete]
    ),

    // Invoice operations
    addInvoice: useCallback(
      (invoice: Parameters<typeof dataStore.addInvoice>[0]) => {
        dataStore.addInvoice(invoice);
        if (!isOnline) {
          queueCreate("invoice", invoice as unknown as Record<string, unknown>);
        }
      },
      [dataStore, isOnline, queueCreate]
    ),
    updateInvoice: useCallback(
      (id: string, updates: Parameters<typeof dataStore.updateInvoice>[1]) => {
        dataStore.updateInvoice(id, updates);
        if (!isOnline) {
          queueUpdate("invoice", { id, ...updates });
        }
      },
      [dataStore, isOnline, queueUpdate]
    ),
    deleteInvoice: useCallback(
      (id: string) => {
        dataStore.deleteInvoice(id);
        if (!isOnline) {
          queueDelete("invoice", { id });
        }
      },
      [dataStore, isOnline, queueDelete]
    ),

    // Bill operations
    addBill: useCallback(
      (bill: Parameters<typeof dataStore.addBill>[0]) => {
        dataStore.addBill(bill);
        if (!isOnline) {
          queueCreate("bill", bill as unknown as Record<string, unknown>);
        }
      },
      [dataStore, isOnline, queueCreate]
    ),
    updateBill: useCallback(
      (id: string, updates: Parameters<typeof dataStore.updateBill>[1]) => {
        dataStore.updateBill(id, updates);
        if (!isOnline) {
          queueUpdate("bill", { id, ...updates });
        }
      },
      [dataStore, isOnline, queueUpdate]
    ),
    deleteBill: useCallback(
      (id: string) => {
        dataStore.deleteBill(id);
        if (!isOnline) {
          queueDelete("bill", { id });
        }
      },
      [dataStore, isOnline, queueDelete]
    ),

    // Customer operations
    addCustomer: useCallback(
      (customer: Parameters<typeof dataStore.addCustomer>[0]) => {
        dataStore.addCustomer(customer);
        if (!isOnline) {
          queueCreate("customer", customer as unknown as Record<string, unknown>);
        }
      },
      [dataStore, isOnline, queueCreate]
    ),
    updateCustomer: useCallback(
      (id: string, updates: Parameters<typeof dataStore.updateCustomer>[1]) => {
        dataStore.updateCustomer(id, updates);
        if (!isOnline) {
          queueUpdate("customer", { id, ...updates });
        }
      },
      [dataStore, isOnline, queueUpdate]
    ),

    // Vendor operations
    addVendor: useCallback(
      (vendor: Parameters<typeof dataStore.addVendor>[0]) => {
        dataStore.addVendor(vendor);
        if (!isOnline) {
          queueCreate("vendor", vendor as unknown as Record<string, unknown>);
        }
      },
      [dataStore, isOnline, queueCreate]
    ),
    updateVendor: useCallback(
      (id: string, updates: Parameters<typeof dataStore.updateVendor>[1]) => {
        dataStore.updateVendor(id, updates);
        if (!isOnline) {
          queueUpdate("vendor", { id, ...updates });
        }
      },
      [dataStore, isOnline, queueUpdate]
    ),

    // Stop Order operations
    addStopOrder: useCallback(
      (stopOrder: Parameters<typeof dataStore.addStopOrder>[0]) => {
        dataStore.addStopOrder(stopOrder);
        if (!isOnline) {
          queueCreate("stopOrder", stopOrder as unknown as Record<string, unknown>);
        }
      },
      [dataStore, isOnline, queueCreate]
    ),
    updateStopOrder: useCallback(
      (id: string, updates: Parameters<typeof dataStore.updateStopOrder>[1]) => {
        dataStore.updateStopOrder(id, updates);
        if (!isOnline) {
          queueUpdate("stopOrder", { id, ...updates });
        }
      },
      [dataStore, isOnline, queueUpdate]
    ),
    deleteStopOrder: useCallback(
      (id: string) => {
        dataStore.deleteStopOrder(id);
        if (!isOnline) {
          queueDelete("stopOrder", { id });
        }
      },
      [dataStore, isOnline, queueDelete]
    ),

    // Budget operations
    addBudget: useCallback(
      (budget: Parameters<typeof dataStore.addBudget>[0]) => {
        dataStore.addBudget(budget);
        if (!isOnline) {
          queueCreate("budget", budget as unknown as Record<string, unknown>);
        }
      },
      [dataStore, isOnline, queueCreate]
    ),
    updateBudget: useCallback(
      (id: string, updates: Parameters<typeof dataStore.updateBudget>[1]) => {
        dataStore.updateBudget(id, updates);
        if (!isOnline) {
          queueUpdate("budget", { id, ...updates });
        }
      },
      [dataStore, isOnline, queueUpdate]
    ),
    deleteBudget: useCallback(
      (id: string) => {
        dataStore.deleteBudget(id);
        if (!isOnline) {
          queueDelete("budget", { id });
        }
      },
      [dataStore, isOnline, queueDelete]
    ),
  };
}

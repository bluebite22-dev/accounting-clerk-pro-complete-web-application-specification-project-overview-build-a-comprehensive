/**
 * Sync Store - Manages offline sync state and operations
 * Uses Zustand for state management
 */

import { create } from "zustand";
import {
  initOfflineDB,
  saveOfflineData,
  loadOfflineData,
  addToSyncQueue,
  getPendingSyncItems,
  removeSyncItem,
  updateSyncItemError,
  getSyncQueueCount,
  getLastSyncTime,
  setLastSyncTime,
  getAllSyncQueueItems,
  type SyncQueueItem,
} from "@/lib/offline-storage";
import { useDataStore, type Transaction, type Invoice, type Bill, type Customer, type Vendor, type StopOrder, type Budget } from "./data-store";

export type SyncStatus = "idle" | "syncing" | "error" | "offline";

export type EntityType = "transaction" | "invoice" | "bill" | "customer" | "vendor" | "stopOrder" | "budget";

interface SyncState {
  // Status
  isOnline: boolean;
  syncStatus: SyncStatus;
  pendingCount: number;
  lastSyncTime: number | null;
  
  // Actions
  initializeSync: () => Promise<void>;
  setOnlineStatus: (online: boolean) => void;
  queueOperation: (entityType: EntityType, action: "create" | "update" | "delete", data: Record<string, unknown>) => Promise<void>;
  syncPendingItems: () => Promise<void>;
  clearSyncQueue: () => Promise<void>;
  getSyncQueueItems: () => Promise<SyncQueueItem[]>;
  
  // Offline data persistence
  saveToOffline: () => Promise<void>;
  loadFromOffline: () => Promise<void>;
}

export const useSyncStore = create<SyncState>((set, get) => ({
  isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
  syncStatus: "idle",
  pendingCount: 0,
  lastSyncTime: null,

  initializeSync: async () => {
    try {
      await initOfflineDB();
      const count = await getSyncQueueCount();
      const lastSync = await getLastSyncTime();
      
      set({ pendingCount: count, lastSyncTime: lastSync || null });
      
      // Load offline data
      await get().loadFromOffline();
      
      // Set up online/offline listeners
      if (typeof window !== "undefined") {
        window.addEventListener("online", () => {
          set({ isOnline: true });
          // Auto-sync when coming back online
          get().syncPendingItems();
        });
        
        window.addEventListener("offline", () => {
          set({ isOnline: false, syncStatus: "offline" });
        });
      }
    } catch (error) {
      console.error("Failed to initialize sync:", error);
      set({ syncStatus: "error" });
    }
  },

  setOnlineStatus: (online: boolean) => {
    set({ isOnline: online });
    if (!online) {
      set({ syncStatus: "offline" });
    }
  },

  queueOperation: async (entityType, action, data) => {
    try {
      // Add to IndexedDB sync queue
      await addToSyncQueue(entityType, action, data);
      
      // Update pending count
      const count = await getSyncQueueCount();
      set({ pendingCount: count });
      
      // If online, try to sync immediately
      if (get().isOnline) {
        await get().syncPendingItems();
      }
    } catch (error) {
      console.error("Failed to queue operation:", error);
      set({ syncStatus: "error" });
    }
  },

  syncPendingItems: async () => {
    const { isOnline, pendingCount } = get();
    
    if (!isOnline || pendingCount === 0) return;
    
    set({ syncStatus: "syncing" });
    
    try {
      const items = await getPendingSyncItems();
      
      for (const item of items) {
        try {
          // Determine the API endpoint based on entity type
          const endpoint = getEndpointForEntity(item.entityType);
          
          // Perform the appropriate HTTP operation
          let response: Response;
          
          switch (item.action) {
            case "create":
              response = await fetch(`/api/${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(item.data),
              });
              break;
            case "update":
              response = await fetch(`/api/${endpoint}/${item.data.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(item.data),
              });
              break;
            case "delete":
              response = await fetch(`/api/${endpoint}/${item.data.id}`, {
                method: "DELETE",
              });
              break;
          }
          
          if (response.ok) {
            // Remove from sync queue on success
            await removeSyncItem(item.id);
          } else {
            // Update retry count on failure
            const newRetryCount = item.retryCount + 1;
            await updateSyncItemError(item.id, `HTTP ${response.status}`, newRetryCount);
          }
        } catch (error) {
          const newRetryCount = item.retryCount + 1;
          await updateSyncItemError(
            item.id,
            error instanceof Error ? error.message : "Unknown error",
            newRetryCount
          );
        }
      }
      
      // Update state after sync
      const newCount = await getSyncQueueCount();
      await setLastSyncTime(Date.now());
      
      set({
        pendingCount: newCount,
        syncStatus: "idle",
        lastSyncTime: Date.now(),
      });
      
      // Reload data from server to get latest state
      await get().loadFromOffline();
    } catch (error) {
      console.error("Sync failed:", error);
      set({ syncStatus: "error" });
    }
  },

  clearSyncQueue: async () => {
    const { clearSyncQueue } = await import("@/lib/offline-storage");
    await clearSyncQueue();
    set({ pendingCount: 0 });
  },

  getSyncQueueItems: async () => {
    return getAllSyncQueueItems();
  },

  saveToOffline: async () => {
    try {
      const dataStore = useDataStore.getState();
      
      const offlineData = {
        transactions: dataStore.transactions,
        invoices: dataStore.invoices,
        bills: dataStore.bills,
        customers: dataStore.customers,
        vendors: dataStore.vendors,
        stopOrders: dataStore.stopOrders,
        budgets: dataStore.budgets,
        categories: dataStore.categories,
        lastSyncAt: Date.now(),
      };
      
      await saveOfflineData(offlineData);
    } catch (error) {
      console.error("Failed to save to offline storage:", error);
    }
  },

  loadFromOffline: async () => {
    try {
      const offlineData = await loadOfflineData();
      
      if (offlineData) {
        const dataStore = useDataStore.getState();
        
        // Update data store with offline data (cast from unknown)
        if (offlineData.transactions.length > 0) {
          dataStore.transactions = offlineData.transactions as Transaction[];
        }
        if (offlineData.invoices.length > 0) {
          dataStore.invoices = offlineData.invoices as Invoice[];
        }
        if (offlineData.bills.length > 0) {
          dataStore.bills = offlineData.bills as Bill[];
        }
        if (offlineData.customers.length > 0) {
          dataStore.customers = offlineData.customers as Customer[];
        }
        if (offlineData.vendors.length > 0) {
          dataStore.vendors = offlineData.vendors as Vendor[];
        }
        if (offlineData.stopOrders.length > 0) {
          dataStore.stopOrders = offlineData.stopOrders as StopOrder[];
        }
        if (offlineData.budgets.length > 0) {
          dataStore.budgets = offlineData.budgets as Budget[];
        }
      }
    } catch (error) {
      console.error("Failed to load from offline storage:", error);
    }
  },
}));

/**
 * Get API endpoint for entity type
 */
function getEndpointForEntity(entityType: EntityType): string {
  const endpoints: Record<EntityType, string> = {
    transaction: "transactions",
    invoice: "invoices",
    bill: "bills",
    customer: "customers",
    vendor: "vendors",
    stopOrder: "stop-orders",
    budget: "budgets",
  };
  return endpoints[entityType];
}

/**
 * Hook to use sync operations in components
 */
export function useSync() {
  const syncStore = useSyncStore();
  
  return {
    isOnline: syncStore.isOnline,
    syncStatus: syncStore.syncStatus,
    pendingCount: syncStore.pendingCount,
    lastSyncTime: syncStore.lastSyncTime,
    initializeSync: syncStore.initializeSync,
    setOnlineStatus: syncStore.setOnlineStatus,
    queueOperation: syncStore.queueOperation,
    syncPendingItems: syncStore.syncPendingItems,
    saveToOffline: syncStore.saveToOffline,
    loadFromOffline: syncStore.loadFromOffline,
  };
}

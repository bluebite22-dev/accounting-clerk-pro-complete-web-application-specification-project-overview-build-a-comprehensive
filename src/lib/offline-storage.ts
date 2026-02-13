/**
 * Offline Storage Service using IndexedDB
 * Provides persistent offline storage for all application data
 */

import { openDB, DBSchema, IDBPDatabase } from "idb";

interface SyncQueueItem {
  id: string;
  entityType: "transaction" | "invoice" | "bill" | "customer" | "vendor" | "stopOrder" | "budget";
  action: "create" | "update" | "delete";
  data: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
  lastError?: string;
}

// Export SyncQueueItem type
export type { SyncQueueItem };

interface OfflineData {
  transactions: unknown[];
  invoices: unknown[];
  bills: unknown[];
  customers: unknown[];
  vendors: unknown[];
  stopOrders: unknown[];
  budgets: unknown[];
  categories: unknown[];
  lastSyncAt?: number;
}

interface AccountingClerkDB extends DBSchema {
  offlineData: {
    key: string;
    value: OfflineData;
  };
  syncQueue: {
    key: string;
    value: SyncQueueItem;
    indexes: { "by-timestamp": number; "by-entity": string };
  };
  metadata: {
    key: string;
    value: { key: string; value: unknown; updatedAt: number };
  };
}

const DB_NAME = "accounting-clerk-offline";
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<AccountingClerkDB> | null = null;

/**
 * Initialize IndexedDB database
 */
export async function initOfflineDB(): Promise<IDBPDatabase<AccountingClerkDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<AccountingClerkDB>(DB_NAME, DB_VERSION, {
    upgrade(db: IDBPDatabase<AccountingClerkDB>) {
      // Offline data store
      if (!db.objectStoreNames.contains("offlineData")) {
        db.createObjectStore("offlineData");
      }

      // Sync queue store
      if (!db.objectStoreNames.contains("syncQueue")) {
        const syncStore = db.createObjectStore("syncQueue", { keyPath: "id" });
        syncStore.createIndex("by-timestamp", "timestamp");
        syncStore.createIndex("by-entity", "entityType");
      }

      // Metadata store
      if (!db.objectStoreNames.contains("metadata")) {
        db.createObjectStore("metadata", { keyPath: "key" });
      }
    },
  });

  return dbInstance;
}

/**
 * Save all offline data
 */
export async function saveOfflineData(data: OfflineData): Promise<void> {
  const db = await initOfflineDB();
  const value = { ...data, lastSyncAt: Date.now() };
  await db.put("offlineData", value, "main");
}

/**
 * Load all offline data
 */
export async function loadOfflineData(): Promise<OfflineData | null> {
  const db = await initOfflineDB();
  const result = await db.get("offlineData", "main");
  return result ?? null;
}

/**
 * Clear all offline data
 */
export async function clearOfflineData(): Promise<void> {
  const db = await initOfflineDB();
  await db.delete("offlineData", "main");
}

/**
 * Add item to sync queue
 */
export async function addToSyncQueue(
  entityType: SyncQueueItem["entityType"],
  action: SyncQueueItem["action"],
  data: Record<string, unknown>
): Promise<void> {
  const db = await initOfflineDB();
  const item: SyncQueueItem = {
    id: `${entityType}-${action}-${data.id || crypto.randomUUID()}`,
    entityType,
    action,
    data,
    timestamp: Date.now(),
    retryCount: 0,
  };
  await db.put("syncQueue", item);
}

/**
 * Get all pending sync items
 */
export async function getPendingSyncItems(): Promise<SyncQueueItem[]> {
  const db = await initOfflineDB();
  return db.getAllFromIndex("syncQueue", "by-timestamp");
}

/**
 * Get sync items by entity type
 */
export async function getSyncItemsByEntity(
  entityType: SyncQueueItem["entityType"]
): Promise<SyncQueueItem[]> {
  const db = await initOfflineDB();
  return db.getAllFromIndex("syncQueue", "by-entity", entityType);
}

/**
 * Remove item from sync queue after successful sync
 */
export async function removeSyncItem(id: string): Promise<void> {
  const db = await initOfflineDB();
  await db.delete("syncQueue", id);
}

/**
 * Update sync item retry count and error
 */
export async function updateSyncItemError(
  id: string,
  error: string,
  retryCount: number
): Promise<void> {
  const db = await initOfflineDB();
  const item = await db.get("syncQueue", id);
  if (item) {
    item.lastError = error;
    item.retryCount = retryCount;
    await db.put("syncQueue", item);
  }
}

/**
 * Clear all completed/failed sync items
 */
export async function clearSyncQueue(): Promise<void> {
  const db = await initOfflineDB();
  await db.clear("syncQueue");
}

/**
 * Get sync queue count
 */
export async function getSyncQueueCount(): Promise<number> {
  const db = await initOfflineDB();
  return db.count("syncQueue");
}

/**
 * Get last sync timestamp
 */
export async function getLastSyncTime(): Promise<number | null> {
  const db = await initOfflineDB();
  const data = await db.get("offlineData", "main");
  return data?.lastSyncAt || null;
}

/**
 * Set last sync timestamp
 */
export async function setLastSyncTime(timestamp: number): Promise<void> {
  const db = await initOfflineDB();
  const data = await db.get("offlineData", "main");
  if (data) {
    data.lastSyncAt = timestamp;
    await db.put("offlineData", data, "main");
  }
}

/**
 * Save metadata
 */
export async function saveMetadata(key: string, value: unknown): Promise<void> {
  const db = await initOfflineDB();
  await db.put("metadata", { key, value, updatedAt: Date.now() });
}

/**
 * Load metadata
 */
export async function loadMetadata<T>(key: string): Promise<T | null> {
  const db = await initOfflineDB();
  const result = await db.get("metadata", key);
  return (result?.value as T) || null;
}

/**
 * Get all sync queue items (for debugging/display)
 */
export async function getAllSyncQueueItems(): Promise<SyncQueueItem[]> {
  const db = await initOfflineDB();
  return db.getAll("syncQueue");
}

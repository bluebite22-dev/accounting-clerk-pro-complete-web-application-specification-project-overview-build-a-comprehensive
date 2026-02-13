import { db } from "@/db";
import { eq, and } from "drizzle-orm";

// Generic CRUD operations - using explicit types to avoid drizzle-orm complexity
export async function getAll(table: any, filters?: Record<string, any>, options?: { limit?: number; offset?: number }) {
  const { limit = 50, offset = 0 } = options || {};
  
  let conditions: any[] = [];
  if (filters) {
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null) {
        conditions.push(eq((table as any)[key], value));
      }
    }
  }
  
  const query = db.select()
    .from(table)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .limit(limit)
    .offset(offset);
    
  return query;
}

export async function getById(table: any, id: string) {
  const query = db.select()
    .from(table)
    .where(eq(table.id, id))
    .limit(1);
  return query;
}

export async function create(table: any, data: any) {
  return db.insert(table).values(data).returning();
}

export async function updateRecord(table: any, id: string, data: any) {
  return db.update(table)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(table.id, id))
    .returning();
}

export async function removeRecord(table: any, id: string) {
  return db.delete(table)
    .where(eq(table.id, id))
    .returning();
}

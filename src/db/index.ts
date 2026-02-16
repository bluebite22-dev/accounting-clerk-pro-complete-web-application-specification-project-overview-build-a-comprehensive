import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

// Create a SQL client using neon serverless driver
// This connects to Supabase's PostgreSQL database
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn("⚠️  DATABASE_URL not set. Database features will be unavailable at runtime.");
  console.warn("⚠️  Set DATABASE_URL in .env.local for database connectivity.");
}

// Create the database connection - may be null if DATABASE_URL not set
const _db = databaseUrl ? drizzle(neon(databaseUrl), { schema }) : null;

// Use non-null assertion - db is guaranteed to be initialized when DATABASE_URL is set
// API routes will fail gracefully if db is accessed without DATABASE_URL being set
export const db = _db!;

export * from "./schema";

// Helper function to get database with proper error handling
export function getDb() {
  if (!_db) {
    throw new Error(
      "Database not initialized. Please set DATABASE_URL environment variable in .env.local\n" +
      "Example: postgresql://postgres:[password]@db.xxxxxx.supabase.co:5432/postgres"
    );
  }
  return _db;
}

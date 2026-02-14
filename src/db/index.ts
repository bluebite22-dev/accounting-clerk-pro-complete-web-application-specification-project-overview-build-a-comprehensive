import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

// Create a SQL client using neon serverless driver
// This connects to Supabase's PostgreSQL database
const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle(sql, { schema });

export * from "./schema";

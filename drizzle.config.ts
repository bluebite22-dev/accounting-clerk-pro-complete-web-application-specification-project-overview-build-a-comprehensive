import { defineConfig } from "drizzle-kit";
import "dotenv/config";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || `postgresql://postgres:${process.env.SUPABASE_SERVICE_ROLE_KEY}@${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '')}:5432/postgres`,
  },
});

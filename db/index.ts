import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

// Validate DATABASE_URL exists
if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is not defined. Please add it to your .env.local file.\n' +
      'Example: DATABASE_URL="postgresql://username:password@host.neon.tech/database?sslmode=require"'
  );
}

// Create Neon HTTP client
const sql = neon(process.env.DATABASE_URL);

// Create Drizzle instance with schema (singleton pattern)
export const db = drizzle(sql, { schema });

// Re-export all table definitions and types for convenience
export * from './schema';


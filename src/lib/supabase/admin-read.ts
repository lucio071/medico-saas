import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Read-only admin client for resolving cross-table data
 * (e.g., getting user names when RLS blocks the join).
 * Only use for SELECT queries, never for mutations.
 */
export function createAdminReadClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

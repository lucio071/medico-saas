import { createAdminReadClient } from "@/lib/supabase/admin-read";

export async function GET() {
  const admin = createAdminReadClient();
  const { data } = await admin
    .from("departments")
    .select("id, name")
    .order("name", { ascending: true });

  return Response.json(data ?? []);
}

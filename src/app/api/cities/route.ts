import { createAdminReadClient } from "@/lib/supabase/admin-read";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const departmentId = request.nextUrl.searchParams.get("department_id");

  if (!departmentId) {
    return Response.json([]);
  }

  const admin = createAdminReadClient();
  const { data } = await admin
    .from("cities")
    .select("id, name")
    .eq("department_id", parseInt(departmentId, 10))
    .order("name", { ascending: true });

  return Response.json(data ?? []);
}

import { createClient } from "@/lib/supabase/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const departmentId = request.nextUrl.searchParams.get("department_id");

  if (!departmentId) {
    return Response.json([]);
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("cities")
    .select("id, name")
    .eq("department_id", parseInt(departmentId, 10))
    .order("name", { ascending: true });

  return Response.json(data ?? []);
}

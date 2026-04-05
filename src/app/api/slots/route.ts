import { createAdminClient } from "@/lib/supabase/admin";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const doctorId = request.nextUrl.searchParams.get("doctor_id");
  const month = request.nextUrl.searchParams.get("month"); // YYYY-MM

  if (!doctorId || !month) {
    return Response.json([]);
  }

  const startDate = `${month}-01`;
  const endDate = new Date(
    parseInt(month.split("-")[0]),
    parseInt(month.split("-")[1]),
    0,
  ).toISOString().slice(0, 10);

  const admin = createAdminClient();
  const { data } = await admin
    .from("appointment_slots")
    .select("id, slot_date, start_time, end_time, status, office_id")
    .eq("doctor_id", doctorId)
    .eq("status", "available")
    .gte("slot_date", startDate)
    .lte("slot_date", endDate)
    .order("slot_date", { ascending: true })
    .order("start_time", { ascending: true });

  return Response.json(data ?? []);
}

import { createAdminClient } from "@/lib/supabase/admin";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const specialty = request.nextUrl.searchParams.get("specialty") ?? "";
  const departmentId = request.nextUrl.searchParams.get("department_id") ?? "";
  const cityId = request.nextUrl.searchParams.get("city_id") ?? "";

  const admin = createAdminClient();

  let query = admin.from("doctors").select("id, user_id, specialty, consultation_duration, department_id, city_id");

  if (specialty) {
    query = query.ilike("specialty", `%${specialty}%`);
  }
  if (departmentId) {
    query = query.or(`department_id.eq.${parseInt(departmentId, 10)},department_id.is.null`);
  }
  if (cityId) {
    query = query.or(`city_id.eq.${parseInt(cityId, 10)},city_id.is.null`);
  }

  const { data: doctors } = await query.limit(50);
  if (!doctors || doctors.length === 0) return Response.json([]);

  // Resolve user names
  const userIds = doctors.map((d) => d.user_id);
  const { data: users } = await admin
    .from("users")
    .select("id, full_name")
    .in("id", userIds);
  const nameMap = new Map((users ?? []).map((u) => [u.id, u.full_name?.trim() || "Médico"]));

  // Resolve offices
  const doctorIds = doctors.map((d) => d.id);
  const { data: offices } = await admin
    .from("offices")
    .select("id, doctor_id, name, address")
    .in("doctor_id", doctorIds)
    .eq("is_active", true);

  const officesByDoctor = new Map<string, { name: string; address: string | null }[]>();
  for (const o of offices ?? []) {
    const arr = officesByDoctor.get(o.doctor_id) ?? [];
    arr.push({ name: o.name, address: o.address });
    officesByDoctor.set(o.doctor_id, arr);
  }

  // Get next available slots per doctor (next 7 days)
  const today = new Date().toISOString().slice(0, 10);
  const weekLater = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  const { data: slots } = await admin
    .from("appointment_slots")
    .select("doctor_id, slot_date, start_time")
    .in("doctor_id", doctorIds)
    .eq("status", "available")
    .gte("slot_date", today)
    .lte("slot_date", weekLater)
    .order("slot_date", { ascending: true })
    .order("start_time", { ascending: true })
    .limit(200);

  const nextSlotsByDoctor = new Map<string, { date: string; time: string }[]>();
  for (const s of slots ?? []) {
    const arr = nextSlotsByDoctor.get(s.doctor_id) ?? [];
    if (arr.length < 5) {
      arr.push({ date: s.slot_date, time: s.start_time.slice(0, 5) });
    }
    nextSlotsByDoctor.set(s.doctor_id, arr);
  }

  const results = doctors.map((d) => ({
    id: d.id,
    name: nameMap.get(d.user_id) ?? "Médico",
    specialty: d.specialty,
    offices: officesByDoctor.get(d.id) ?? [],
    nextSlots: nextSlotsByDoctor.get(d.id) ?? [],
  }));

  return Response.json(results);
}

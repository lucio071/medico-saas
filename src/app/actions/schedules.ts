"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function upsertSchedule(formData: FormData) {
  const scheduleId =
    (formData.get("scheduleId") as string | null)?.trim() || null;
  const officeId = (formData.get("officeId") as string | null)?.trim() ?? "";
  const dayOfWeek = parseInt(
    (formData.get("dayOfWeek") as string | null) ?? "-1",
    10,
  );
  const startTime =
    (formData.get("startTime") as string | null)?.trim() ?? "";
  const endTime = (formData.get("endTime") as string | null)?.trim() ?? "";

  if (!officeId || dayOfWeek < 0 || !startTime || !endTime) {
    return { error: "Consultorio, día, hora inicio y hora fin son obligatorios." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { data: currentUser } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("id", user.id)
    .single();
  if (!currentUser?.tenant_id) return { error: "Sin consultorio." };

  const { data: doctor } = await supabase
    .from("doctors")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!doctor) return { error: "Perfil de médico no encontrado." };

  if (scheduleId) {
    const { error } = await supabase
      .from("doctor_schedules")
      .update({
        office_id: officeId,
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
        is_active: true,
      })
      .eq("id", scheduleId);
    if (error) return { error: error.message };
  } else {
    // Check for overlapping schedules on the same day
    const { data: existing } = await supabase
      .from("doctor_schedules")
      .select("id, start_time, end_time")
      .eq("doctor_id", doctor.id)
      .eq("day_of_week", dayOfWeek);

    const overlaps = (existing ?? []).some(
      (s) => startTime < s.end_time && endTime > s.start_time,
    );

    if (overlaps) {
      return {
        error:
          "El médico ya tiene un horario en ese día y horario en otro consultorio.",
      };
    }

    const { error } = await supabase.from("doctor_schedules").insert({
      doctor_id: doctor.id,
      office_id: officeId,
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
      is_active: true,
    });
    if (error) return { error: error.message };
  }

  revalidatePath("/doctor");
  return { error: null };
}

export async function deleteSchedule(scheduleId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  // Get schedule details to check for active appointments
  const { data: schedule } = await supabase
    .from("doctor_schedules")
    .select("doctor_id, office_id, day_of_week, start_time, end_time")
    .eq("id", scheduleId)
    .single();

  if (!schedule) return { error: "Horario no encontrado." };

  // Check for future non-cancelled appointments on this day/time/office
  if (schedule.office_id) {
    const now = new Date();
    const { count } = await supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("doctor_id", schedule.doctor_id)
      .eq("office_id", schedule.office_id)
      .gte("starts_at", now.toISOString())
      .in("status", ["scheduled", "confirmed"]);

    if (count && count > 0) {
      return {
        error: "Cancela las citas activas primero. Hay " + count + " cita(s) programada(s) en este consultorio.",
      };
    }
  }

  const { error } = await supabase
    .from("doctor_schedules")
    .delete()
    .eq("id", scheduleId);

  if (error) return { error: error.message };

  revalidatePath("/doctor");
  return { error: null };
}

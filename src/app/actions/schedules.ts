"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// ─── helpers ───
function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60).toString().padStart(2, "0");
  const m = (mins % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

function getNextNWeekdates(dayOfWeek: number, weeks: number): string[] {
  const dates: string[] = [];
  const today = new Date();
  // Find next occurrence of dayOfWeek
  const todayDow = today.getDay();
  let daysUntil = dayOfWeek - todayDow;
  if (daysUntil < 0) daysUntil += 7;
  if (daysUntil === 0) daysUntil = 0; // include today

  for (let w = 0; w < weeks; w++) {
    const d = new Date(today);
    d.setDate(today.getDate() + daysUntil + w * 7);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

// ─── Generate slots for a schedule across N weeks ───
async function generateSlots(
  supabase: Awaited<ReturnType<typeof createClient>>,
  doctorId: string,
  officeId: string,
  tenantId: string,
  dayOfWeek: number,
  startTime: string,
  endTime: string,
  durationMin: number,
) {
  const dates = getNextNWeekdates(dayOfWeek, 4);
  const startMins = timeToMinutes(startTime);
  const endMins = timeToMinutes(endTime);

  const slotsToInsert: {
    doctor_id: string;
    office_id: string;
    tenant_id: string;
    slot_date: string;
    start_time: string;
    end_time: string;
    status: "available";
  }[] = [];

  for (const date of dates) {
    let cursor = startMins;
    while (cursor + durationMin <= endMins) {
      slotsToInsert.push({
        doctor_id: doctorId,
        office_id: officeId,
        tenant_id: tenantId,
        slot_date: date,
        start_time: minutesToTime(cursor),
        end_time: minutesToTime(cursor + durationMin),
        status: "available",
      });
      cursor += durationMin;
    }
  }

  if (slotsToInsert.length === 0) return;

  // Avoid duplicates: check existing slots for these dates+office
  for (const date of dates) {
    const batch = slotsToInsert.filter((s) => s.slot_date === date);
    if (batch.length === 0) continue;

    const { data: existing } = await supabase
      .from("appointment_slots")
      .select("start_time")
      .eq("doctor_id", doctorId)
      .eq("office_id", officeId)
      .eq("slot_date", date);

    const existingTimes = new Set((existing ?? []).map((e) => e.start_time));
    const newSlots = batch.filter((s) => !existingTimes.has(s.start_time));

    if (newSlots.length > 0) {
      await supabase.from("appointment_slots").insert(newSlots);
    }
  }
}

// ─── UPDATE CONSULTATION DURATION ───
export async function updateConsultationDuration(durationMin: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { data: doctor } = await supabase
    .from("doctors")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!doctor) return { error: "Perfil de médico no encontrado." };

  const { error } = await supabase
    .from("doctors")
    .update({ consultation_duration: durationMin })
    .eq("id", doctor.id);

  if (error) return { error: error.message };

  revalidatePath("/doctor");
  return { error: null };
}

// ─── UPSERT SCHEDULE ───
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
    .select("id, consultation_duration")
    .eq("user_id", user.id)
    .single();
  if (!doctor) return { error: "Perfil de médico no encontrado." };

  const duration = doctor.consultation_duration || 30;

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

  // Auto-generate slots for the next 4 weeks
  await generateSlots(
    supabase,
    doctor.id,
    officeId,
    currentUser.tenant_id,
    dayOfWeek,
    startTime,
    endTime,
    duration,
  );

  revalidatePath("/doctor");
  revalidatePath("/secretary");
  return { error: null };
}

// ─── DELETE SCHEDULE ───
export async function deleteSchedule(scheduleId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

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
        error:
          "Cancela las citas activas primero. Hay " +
          count +
          " cita(s) programada(s) en este consultorio.",
      };
    }
  }

  const { error } = await supabase
    .from("doctor_schedules")
    .delete()
    .eq("id", scheduleId);

  if (error) return { error: error.message };

  revalidatePath("/doctor");
  revalidatePath("/secretary");
  return { error: null };
}

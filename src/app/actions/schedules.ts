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
        is_available: true,
      })
      .eq("id", scheduleId);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("doctor_schedules").insert({
      tenant_id: currentUser.tenant_id,
      doctor_id: doctor.id,
      office_id: officeId,
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
      is_available: true,
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

  const { error } = await supabase
    .from("doctor_schedules")
    .delete()
    .eq("id", scheduleId);

  if (error) return { error: error.message };

  revalidatePath("/doctor");
  return { error: null };
}

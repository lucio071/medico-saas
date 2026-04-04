"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function createAppointment(formData: FormData) {
  const doctorId = (formData.get("doctorId") as string | null)?.trim() ?? "";
  const patientId = (formData.get("patientId") as string | null)?.trim() ?? "";
  const startsAt = (formData.get("startsAt") as string | null)?.trim() ?? "";
  const durationMin = parseInt(
    (formData.get("durationMin") as string | null) ?? "30",
    10,
  );
  const notes = (formData.get("notes") as string | null)?.trim() ?? "";

  if (!doctorId || !patientId || !startsAt) {
    return { error: "Médico, paciente y fecha son obligatorios." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const admin = createAdminClient();

  const { data: currentUser } = await admin
    .from("users")
    .select("tenant_id, role")
    .eq("id", user.id)
    .single();

  if (
    !currentUser?.tenant_id ||
    !["doctor", "secretary"].includes(currentUser.role)
  ) {
    return { error: "Sin permisos para crear citas." };
  }

  const start = new Date(startsAt);
  const end = new Date(start.getTime() + durationMin * 60_000);
  const startIso = start.toISOString();
  const endIso = end.toISOString();

  // Check if patient already has appointment at this time
  const { data: patientConflict } = await admin
    .from("appointments")
    .select("id")
    .eq("patient_id", patientId)
    .in("status", ["scheduled", "confirmed"])
    .lt("starts_at", endIso)
    .gt("ends_at", startIso)
    .limit(1);

  if (patientConflict && patientConflict.length > 0) {
    return { error: "Este paciente ya tiene una cita en ese horario." };
  }

  // Check if doctor already has another patient at this time
  const { data: doctorConflict } = await admin
    .from("appointments")
    .select("id")
    .eq("doctor_id", doctorId)
    .in("status", ["scheduled", "confirmed"])
    .lt("starts_at", endIso)
    .gt("ends_at", startIso)
    .limit(1);

  if (doctorConflict && doctorConflict.length > 0) {
    return { error: "El médico ya tiene otro paciente en ese horario." };
  }

  const { error } = await admin.from("appointments").insert({
    tenant_id: currentUser.tenant_id,
    doctor_id: doctorId,
    patient_id: patientId,
    starts_at: startIso,
    ends_at: endIso,
    notes: notes || null,
    status: "scheduled",
  });

  if (error) return { error: error.message };

  revalidatePath("/secretary");
  revalidatePath("/doctor");
  return { error: null };
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: "scheduled" | "confirmed" | "attended" | "cancelled" | "no_show",
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const admin = createAdminClient();

  const { error } = await admin
    .from("appointments")
    .update({ status })
    .eq("id", appointmentId);

  if (error) return { error: error.message };

  revalidatePath("/secretary");
  revalidatePath("/doctor");
  return { error: null };
}

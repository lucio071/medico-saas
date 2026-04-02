"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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

  const { data: currentUser } = await supabase
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

  const { error } = await supabase.from("appointments").insert({
    tenant_id: currentUser.tenant_id,
    doctor_id: doctorId,
    patient_id: patientId,
    starts_at: start.toISOString(),
    ends_at: end.toISOString(),
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
  status: "scheduled" | "confirmed" | "cancelled" | "completed",
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autenticado." };

  const { error } = await supabase
    .from("appointments")
    .update({ status })
    .eq("id", appointmentId);

  if (error) return { error: error.message };

  revalidatePath("/secretary");
  revalidatePath("/doctor");
  return { error: null };
}

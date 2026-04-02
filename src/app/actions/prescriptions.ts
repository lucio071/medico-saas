"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

export async function createPrescription(formData: FormData) {
  const appointmentId =
    (formData.get("appointmentId") as string | null)?.trim() ?? "";
  const instructions =
    (formData.get("instructions") as string | null)?.trim() ?? "";
  const medicationsRaw =
    (formData.get("medications") as string | null)?.trim() ?? "";

  if (!appointmentId || !instructions) {
    return { error: "Cita e instrucciones son obligatorias." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autenticado." };

  const { data: appt } = await supabase
    .from("appointments")
    .select("id, tenant_id, doctor_id, patient_id")
    .eq("id", appointmentId)
    .single();

  if (!appt) return { error: "Cita no encontrada." };

  let medications: Json;
  try {
    medications = medicationsRaw ? (JSON.parse(medicationsRaw) as Json) : [];
  } catch {
    medications = medicationsRaw
      ? (medicationsRaw
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean) as Json)
      : [];
  }

  const { error } = await supabase.from("prescriptions").insert({
    tenant_id: appt.tenant_id,
    appointment_id: appt.id,
    doctor_id: appt.doctor_id,
    patient_id: appt.patient_id,
    instructions,
    medications,
  });

  if (error) return { error: error.message };

  revalidatePath("/doctor");
  redirect("/doctor");
}

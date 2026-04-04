"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function bookSlot(formData: FormData) {
  const slotId = ((formData.get("slotId") as string) ?? "").trim();
  const patientId = ((formData.get("patientId") as string) ?? "").trim();
  const notes = ((formData.get("notes") as string) ?? "").trim();

  if (!slotId || !patientId) {
    return { error: "Slot y paciente son obligatorios." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  // Get slot details
  const { data: slot } = await supabase
    .from("appointment_slots")
    .select("id, doctor_id, office_id, tenant_id, slot_date, start_time, end_time, status")
    .eq("id", slotId)
    .single();

  if (!slot) return { error: "Slot no encontrado." };
  if (slot.status !== "available") return { error: "Este horario ya no está disponible." };

  // Create appointment
  const startDt = new Date(`${slot.slot_date}T${slot.start_time}`);
  const endDt = new Date(`${slot.slot_date}T${slot.end_time}`);

  const { data: appt, error: apptErr } = await supabase
    .from("appointments")
    .insert({
      tenant_id: slot.tenant_id,
      doctor_id: slot.doctor_id,
      patient_id: patientId,
      office_id: slot.office_id,
      slot_id: slot.id,
      status: "scheduled",
      starts_at: startDt.toISOString(),
      ends_at: endDt.toISOString(),
      notes: notes || null,
    })
    .select("id")
    .single();

  if (apptErr) return { error: apptErr.message };

  // Mark slot as booked
  await supabase
    .from("appointment_slots")
    .update({ status: "booked", appointment_id: appt.id })
    .eq("id", slotId);

  revalidatePath("/secretary");
  revalidatePath("/doctor");
  return { error: null };
}

export async function addToWaitlist(formData: FormData) {
  const patientId = ((formData.get("patientId") as string) ?? "").trim();
  const doctorId = ((formData.get("doctorId") as string) ?? "").trim();
  const requestedDate = ((formData.get("requestedDate") as string) ?? "").trim();
  const notes = ((formData.get("notes") as string) ?? "").trim();

  if (!patientId || !doctorId || !requestedDate) {
    return { error: "Paciente, médico y fecha son obligatorios." };
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
  if (!currentUser?.tenant_id) return { error: "Sin tenant." };

  const { error } = await supabase.from("waitlist").insert({
    tenant_id: currentUser.tenant_id,
    patient_id: patientId,
    doctor_id: doctorId,
    requested_date: requestedDate,
    notes: notes || null,
  });

  if (error) return { error: error.message };

  revalidatePath("/secretary");
  return { error: null };
}

export async function cancelWaitlistItem(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("waitlist")
    .update({ status: "cancelled" })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/secretary");
  return { error: null };
}

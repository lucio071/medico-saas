"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ─── CANCEL APPOINTMENT ───
export async function cancelAppointment(appointmentId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const admin = createAdminClient();

  // Verify the appointment belongs to this patient
  const { data: patient } = await admin
    .from("patients")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!patient) return { error: "Perfil de paciente no encontrado." };

  const { data: appt } = await admin
    .from("appointments")
    .select("id, patient_id, slot_id, status")
    .eq("id", appointmentId)
    .single();

  if (!appt) return { error: "Cita no encontrada." };
  if (appt.patient_id !== patient.id) return { error: "Esta cita no te pertenece." };
  if (!["scheduled", "confirmed"].includes(appt.status)) {
    return { error: "Solo se pueden cancelar citas programadas o confirmadas." };
  }

  // Cancel appointment
  await admin
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", appointmentId);

  // Free the slot if linked
  if (appt.slot_id) {
    await admin
      .from("appointment_slots")
      .update({ status: "available", appointment_id: null })
      .eq("id", appt.slot_id);
  }

  revalidatePath("/patient");
  return { error: null };
}

// ─── UPDATE PATIENT PROFILE ───
export async function updatePatientProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const admin = createAdminClient();

  const fullName = ((formData.get("fullName") as string) ?? "").trim();
  const phone = ((formData.get("phone") as string) ?? "").trim();
  const birthDate = ((formData.get("birthDate") as string) ?? "").trim();
  const bloodType = ((formData.get("bloodType") as string) ?? "").trim();
  const allergiesRaw = ((formData.get("allergies") as string) ?? "").trim();
  const allergies = allergiesRaw
    ? allergiesRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : null;
  const emergencyContact = ((formData.get("emergencyContact") as string) ?? "").trim();
  const departmentId = ((formData.get("departmentId") as string) ?? "").trim();
  const cityId = ((formData.get("cityId") as string) ?? "").trim();
  const neighborhood = ((formData.get("neighborhood") as string) ?? "").trim();
  const address = ((formData.get("address") as string) ?? "").trim();

  if (!fullName) return { error: "Nombre es obligatorio." };

  // Update users table
  await admin
    .from("users")
    .update({ full_name: fullName, phone: phone || null })
    .eq("id", user.id);

  // Update patients table
  const { data: patient } = await admin
    .from("patients")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (patient) {
    await admin
      .from("patients")
      .update({
        phone: phone || null,
        birth_date: birthDate || null,
        blood_type: bloodType || null,
        allergies,
        emergency_contact: emergencyContact || null,
        department_id: departmentId ? parseInt(departmentId, 10) : null,
        city_id: cityId ? parseInt(cityId, 10) : null,
        neighborhood: neighborhood || null,
        address: address || null,
      })
      .eq("id", patient.id);
  }

  revalidatePath("/patient");
  return { error: null };
}

// ─── BOOK SLOT AS PATIENT ───
export async function bookSlotAsPatient(slotId: string, doctorId: string, notes: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const admin = createAdminClient();

  const { data: patient } = await admin
    .from("patients")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!patient) return { error: "Perfil de paciente no encontrado." };

  // Get slot
  const { data: slot } = await admin
    .from("appointment_slots")
    .select("id, doctor_id, office_id, tenant_id, slot_date, start_time, end_time, status")
    .eq("id", slotId)
    .single();

  if (!slot) return { error: "Slot no encontrado." };
  if (slot.status !== "available") return { error: "Este horario ya no está disponible." };

  const startIso = new Date(`${slot.slot_date}T${slot.start_time}`).toISOString();
  const endIso = new Date(`${slot.slot_date}T${slot.end_time}`).toISOString();

  // Conflict checks
  const { data: patConflict } = await admin
    .from("appointments")
    .select("id")
    .eq("patient_id", patient.id)
    .in("status", ["scheduled", "confirmed"])
    .lt("starts_at", endIso)
    .gt("ends_at", startIso)
    .limit(1);

  if (patConflict && patConflict.length > 0) {
    return { error: "Ya tenés una cita en ese horario." };
  }

  // Create appointment
  const { data: appt, error: apptErr } = await admin
    .from("appointments")
    .insert({
      tenant_id: slot.tenant_id,
      doctor_id: slot.doctor_id,
      patient_id: patient.id,
      office_id: slot.office_id,
      slot_id: slot.id,
      status: "scheduled",
      scheduled_at: startIso,
      starts_at: startIso,
      ends_at: endIso,
      notes: notes || null,
    })
    .select("id")
    .single();

  if (apptErr) return { error: apptErr.message };

  // Mark slot booked
  await admin
    .from("appointment_slots")
    .update({ status: "booked", appointment_id: appt.id })
    .eq("id", slotId);

  // Link patient to doctor if not already
  const { data: existingLink } = await admin
    .from("patient_doctors")
    .select("id")
    .eq("patient_id", patient.id)
    .eq("doctor_id", slot.doctor_id)
    .limit(1);

  if (!existingLink || existingLink.length === 0) {
    await admin.from("patient_doctors").insert({
      patient_id: patient.id,
      doctor_id: slot.doctor_id,
      is_primary: false,
    });
  }

  revalidatePath("/patient");
  return { error: null };
}

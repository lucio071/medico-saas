"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";

export interface MedicationItem {
  name: string;
  dose: string;
  frequency: string;
  duration: string;
}

export interface PrescriptionFromRecordInput {
  clinical_record_id: string;
  diagnosis?: string | null;
  medications: MedicationItem[];
  instructions?: string | null;
}

export interface VitalSignsInput {
  weight?: number | null;
  height?: number | null;
  blood_pressure_sys?: number | null;
  blood_pressure_dia?: number | null;
  heart_rate?: number | null;
  temperature?: number | null;
  oxygen_saturation?: number | null;
}

export interface ClinicalRecordInput {
  patient_id: string;
  appointment_id?: string | null;
  chief_complaint?: string | null;
  anamnesis?: string | null;
  physical_exam?: string | null;
  diagnosis?: string | null;
  cie10_code?: string | null;
  treatment?: string | null;
  notes?: string | null;
  next_visit_date?: string | null;
  vital_signs?: VitalSignsInput;
}

export async function createClinicalRecord(
  input: ClinicalRecordInput,
): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "No autenticado" };

  const admin = createAdminClient();

  const { data: doctorRow } = await admin
    .from("doctors")
    .select("id, tenant_id")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (!doctorRow || !doctorRow.tenant_id) {
    return { error: "No se encontró perfil de médico" };
  }

  const { data: patientRow } = await admin
    .from("patients")
    .select("id")
    .eq("id", input.patient_id)
    .maybeSingle();

  if (!patientRow) return { error: "Paciente no encontrado" };

  const { data: recordRow, error: recordErr } = await admin
    .from("clinical_records")
    .insert({
      tenant_id: doctorRow.tenant_id,
      doctor_id: doctorRow.id,
      patient_id: input.patient_id,
      appointment_id: input.appointment_id ?? null,
      chief_complaint: input.chief_complaint ?? null,
      anamnesis: input.anamnesis ?? null,
      physical_exam: input.physical_exam ?? null,
      diagnosis: input.diagnosis ?? null,
      cie10_code: input.cie10_code ?? null,
      treatment: input.treatment ?? null,
      notes: input.notes ?? null,
      next_visit_date: input.next_visit_date ?? null,
    })
    .select("id")
    .single();

  if (recordErr || !recordRow) {
    return { error: recordErr?.message ?? "Error al guardar historia" };
  }

  const v = input.vital_signs;
  const hasVitals =
    v &&
    (v.weight != null ||
      v.height != null ||
      v.blood_pressure_sys != null ||
      v.blood_pressure_dia != null ||
      v.heart_rate != null ||
      v.temperature != null ||
      v.oxygen_saturation != null);

  if (hasVitals && v) {
    const { error: vErr } = await admin.from("vital_signs").insert({
      clinical_record_id: recordRow.id,
      weight: v.weight ?? null,
      height: v.height ?? null,
      blood_pressure_sys: v.blood_pressure_sys ?? null,
      blood_pressure_dia: v.blood_pressure_dia ?? null,
      heart_rate: v.heart_rate ?? null,
      temperature: v.temperature ?? null,
      oxygen_saturation: v.oxygen_saturation ?? null,
    });
    if (vErr) return { error: `Historia guardada, pero falló signos vitales: ${vErr.message}` };
  }

  revalidatePath("/doctor");
  return { id: recordRow.id };
}

export async function createPrescriptionFromRecord(
  input: PrescriptionFromRecordInput,
): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "No autenticado" };

  const cleanMeds = input.medications
    .map((m) => ({
      name: m.name.trim(),
      dose: m.dose.trim(),
      frequency: m.frequency.trim(),
      duration: m.duration.trim(),
    }))
    .filter((m) => m.name.length > 0);

  if (cleanMeds.length === 0) {
    return { error: "Agregá al menos un medicamento con nombre" };
  }

  const admin = createAdminClient();

  const { data: record } = await admin
    .from("clinical_records")
    .select("id, tenant_id, doctor_id, patient_id, appointment_id")
    .eq("id", input.clinical_record_id)
    .maybeSingle();

  if (!record) return { error: "Consulta no encontrada" };

  const { data: doctorRow } = await admin
    .from("doctors")
    .select("id")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (!doctorRow || doctorRow.id !== record.doctor_id) {
    return { error: "No autorizado" };
  }

  const { data: rxRow, error: rxErr } = await admin
    .from("prescriptions")
    .insert({
      tenant_id: record.tenant_id,
      doctor_id: record.doctor_id,
      patient_id: record.patient_id,
      appointment_id: record.appointment_id ?? null,
      clinical_record_id: record.id,
      diagnosis: input.diagnosis?.trim() || null,
      medications: cleanMeds as unknown as Json,
      instructions: input.instructions?.trim() || "",
    })
    .select("id")
    .single();

  if (rxErr || !rxRow) return { error: rxErr?.message ?? "Error al crear receta" };

  revalidatePath("/doctor");
  return { id: rxRow.id };
}

"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// --------------- helpers ---------------
function str(fd: FormData, key: string): string {
  return ((fd.get(key) as string | null) ?? "").trim();
}
function intOrNull(fd: FormData, key: string): number | null {
  const v = str(fd, key);
  return v ? parseInt(v, 10) : null;
}
function parseAllergies(raw: string): string[] | null {
  if (!raw) return null;
  const arr = raw.split(",").map((s) => s.trim()).filter(Boolean);
  return arr.length > 0 ? arr : null;
}

// --------------- CREATE ---------------
export async function createPatient(formData: FormData) {
  const fullName = str(formData, "fullName");
  const email = str(formData, "email");
  const phone = str(formData, "phone");
  const birthDate = str(formData, "birthDate");
  const bloodType = str(formData, "bloodType");
  const allergies = parseAllergies(str(formData, "allergies"));
  const emergencyContact = str(formData, "emergencyContact");
  const departmentId = intOrNull(formData, "departmentId");
  const cityId = intOrNull(formData, "cityId");
  const address = str(formData, "address");
  const neighborhood = str(formData, "neighborhood");

  if (!fullName || !email) {
    return { error: "Nombre y email son obligatorios." };
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
    return { error: "Sin permisos para crear pacientes." };
  }

  const tenantId = currentUser.tenant_id;
  const admin = createAdminClient();

  const { data: authData, error: authError } =
    await admin.auth.admin.createUser({
      email,
      password: "12345678",
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

  if (authError || !authData.user) {
    return { error: authError?.message ?? "Error creando usuario." };
  }

  const patientUserId = authData.user.id;

  const { error: userError } = await admin.from("users").insert({
    id: patientUserId,
    tenant_id: tenantId,
    email,
    full_name: fullName,
    phone: phone || null,
    role: "patient",
    is_active: true,
  });

  if (userError) return { error: userError.message };

  const { error: patientError } = await admin.from("patients").insert({
    tenant_id: tenantId,
    user_id: patientUserId,
    birth_date: birthDate || null,
    phone: phone || null,
    blood_type: bloodType || null,
    allergies,
    emergency_contact: emergencyContact || null,
    department_id: departmentId,
    city_id: cityId,
    address: address || null,
    neighborhood: neighborhood || null,
  });

  if (patientError) return { error: patientError.message };

  revalidatePath("/secretary");
  revalidatePath("/doctor");
  return { error: null };
}

// --------------- UPDATE ---------------
export async function updatePatient(formData: FormData) {
  const patientId = str(formData, "patientId");
  const fullName = str(formData, "fullName");
  const phone = str(formData, "phone");
  const birthDate = str(formData, "birthDate");
  const bloodType = str(formData, "bloodType");
  const allergies = parseAllergies(str(formData, "allergies"));
  const emergencyContact = str(formData, "emergencyContact");
  const departmentId = intOrNull(formData, "departmentId");
  const cityId = intOrNull(formData, "cityId");
  const address = str(formData, "address");
  const neighborhood = str(formData, "neighborhood");

  if (!patientId || !fullName) {
    return { error: "ID y nombre son obligatorios." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  // Get patient's user_id
  const { data: patient } = await supabase
    .from("patients")
    .select("user_id")
    .eq("id", patientId)
    .single();
  if (!patient) return { error: "Paciente no encontrado." };

  // Update users table (full_name, phone)
  const { error: userError } = await supabase
    .from("users")
    .update({ full_name: fullName, phone: phone || null })
    .eq("id", patient.user_id);
  if (userError) return { error: userError.message };

  // Update patients table
  const { error: patientError } = await supabase
    .from("patients")
    .update({
      phone: phone || null,
      birth_date: birthDate || null,
      blood_type: bloodType || null,
      allergies,
      emergency_contact: emergencyContact || null,
      department_id: departmentId,
      city_id: cityId,
      address: address || null,
      neighborhood: neighborhood || null,
    })
    .eq("id", patientId);
  if (patientError) return { error: patientError.message };

  revalidatePath("/doctor");
  revalidatePath("/secretary");
  return { error: null };
}

// --------------- TOGGLE ACTIVE ---------------
export async function togglePatientActive(patientId: string, isActive: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { data: patient } = await supabase
    .from("patients")
    .select("user_id")
    .eq("id", patientId)
    .single();
  if (!patient) return { error: "Paciente no encontrado." };

  const { error } = await supabase
    .from("users")
    .update({ is_active: isActive })
    .eq("id", patient.user_id);
  if (error) return { error: error.message };

  revalidatePath("/doctor");
  revalidatePath("/secretary");
  return { error: null };
}

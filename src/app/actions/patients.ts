"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function createPatient(formData: FormData) {
  const fullName = (formData.get("fullName") as string | null)?.trim() ?? "";
  const email = (formData.get("email") as string | null)?.trim() ?? "";
  const phone = (formData.get("phone") as string | null)?.trim() ?? "";
  const birthDate = (formData.get("birthDate") as string | null)?.trim() ?? "";

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

  // Create auth user for the patient via admin API
  const { data: authData, error: authError } =
    await admin.auth.admin.createUser({
      email,
      password: crypto.randomUUID(),
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

  if (userError) {
    return { error: userError.message };
  }

  const { error: patientError } = await admin.from("patients").insert({
    tenant_id: tenantId,
    user_id: patientUserId,
    birth_date: birthDate || null,
    phone: phone || null,
  });

  if (patientError) {
    return { error: patientError.message };
  }

  revalidatePath("/secretary");
  revalidatePath("/doctor");
  return { error: null };
}

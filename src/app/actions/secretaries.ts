"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function createSecretary(formData: FormData) {
  const fullName = ((formData.get("fullName") as string) ?? "").trim();
  const email = ((formData.get("email") as string) ?? "").trim();
  const phone = ((formData.get("phone") as string) ?? "").trim();
  const password = ((formData.get("password") as string) ?? "").trim();

  if (!fullName || !email || !password) {
    return { error: "Nombre, email y contraseña son obligatorios." };
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

  if (!currentUser?.tenant_id || currentUser.role !== "doctor") {
    return { error: "Solo médicos pueden crear secretarias." };
  }

  const { data: doctor } = await supabase
    .from("doctors")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!doctor) return { error: "Perfil de médico no encontrado." };

  const admin = createAdminClient();

  // Check if user already exists (might be secretary for another doctor)
  const { data: existingUsers } = await admin
    .from("users")
    .select("id, role")
    .eq("email", email)
    .limit(1);

  let secretaryUserId: string;

  if (existingUsers && existingUsers.length > 0) {
    // User exists — just link via secretary_doctors
    const existingUser = existingUsers[0];
    if (existingUser.role !== "secretary") {
      return { error: "Ese email ya está registrado con otro rol." };
    }
    secretaryUserId = existingUser.id;
  } else {
    // Create new auth user + users record
    const { data: authData, error: authError } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });

    if (authError || !authData.user) {
      return { error: authError?.message ?? "Error creando usuario." };
    }

    secretaryUserId = authData.user.id;

    const { error: userError } = await admin.from("users").insert({
      id: secretaryUserId,
      tenant_id: currentUser.tenant_id,
      email,
      full_name: fullName,
      phone: phone || null,
      role: "secretary",
      is_active: true,
    });

    if (userError) return { error: userError.message };
  }

  // Check if relationship already exists
  const { data: existingRel } = await admin
    .from("secretary_doctors")
    .select("id")
    .eq("secretary_id", secretaryUserId)
    .eq("doctor_id", doctor.id)
    .limit(1);

  if (existingRel && existingRel.length > 0) {
    return { error: "Esta secretaria ya está asignada a este médico." };
  }

  // Insert into secretary_doctors
  const { error: relError } = await admin.from("secretary_doctors").insert({
    secretary_id: secretaryUserId,
    doctor_id: doctor.id,
    tenant_id: currentUser.tenant_id,
  });

  if (relError) return { error: relError.message };

  revalidatePath("/doctor");
  return { error: null };
}

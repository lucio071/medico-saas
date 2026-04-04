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

  const { error: userError } = await admin.from("users").insert({
    id: authData.user.id,
    tenant_id: currentUser.tenant_id,
    email,
    full_name: fullName,
    phone: phone || null,
    role: "secretary",
    assigned_doctor_id: doctor.id,
    is_active: true,
  });

  if (userError) return { error: userError.message };

  revalidatePath("/doctor");
  return { error: null };
}

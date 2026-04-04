"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createOffice(formData: FormData) {
  const name = (formData.get("name") as string | null)?.trim() ?? "";
  const address = (formData.get("address") as string | null)?.trim() ?? "";
  const phone = (formData.get("phone") as string | null)?.trim() ?? "";

  if (!name) return { error: "El nombre es obligatorio." };

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
  if (!currentUser?.tenant_id) return { error: "Sin consultorio." };

  const { data: doctor } = await supabase
    .from("doctors")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!doctor) return { error: "Perfil de médico no encontrado." };

  const { error } = await supabase.from("offices").insert({
    doctor_id: doctor.id,
    tenant_id: currentUser.tenant_id,
    name,
    address: address || null,
    phone: phone || null,
  });

  if (error) return { error: error.message };

  revalidatePath("/doctor");
  return { error: null };
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SPECIALTIES, MAX_SPECIALTIES_PER_DOCTOR } from "@/lib/specialties";

export async function updateDoctorSpecialties(
  specialties: string[],
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "No autenticado" };

  if (specialties.length === 0) return { error: "Seleccioná al menos una especialidad" };
  if (specialties.length > MAX_SPECIALTIES_PER_DOCTOR) {
    return { error: `Máximo ${MAX_SPECIALTIES_PER_DOCTOR} especialidades` };
  }

  const valid = new Set<string>(SPECIALTIES);
  for (const s of specialties) {
    if (!valid.has(s)) return { error: `Especialidad inválida: ${s}` };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("doctors")
    .update({ specialties, specialty: specialties[0] })
    .eq("user_id", auth.user.id);

  if (error) return { error: error.message };
  revalidatePath("/doctor");
  return {};
}

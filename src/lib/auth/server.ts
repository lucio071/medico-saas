import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRolePath, type AppRole } from "@/lib/auth/roles";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function getCurrentUserRole(): Promise<AppRole | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  return data?.role ?? null;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(allowedRoles: AppRole[]) {
  const role = await getCurrentUserRole();
  const rolePath = getRolePath(role);

  if (!role || !allowedRoles.includes(role)) {
    redirect(rolePath);
  }

  return role;
}

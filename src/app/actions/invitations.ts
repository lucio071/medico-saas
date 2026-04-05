"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendInvitationEmail } from "@/lib/email";
import { headers } from "next/headers";

function generateToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 32; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

// ─── CREATE INVITATION ───
export async function createInvitation(formData: FormData) {
  const email = ((formData.get("email") as string) ?? "").trim().toLowerCase();

  if (!email) return { error: "Email es obligatorio." };

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
    return { error: "Solo médicos pueden invitar secretarias." };
  }

  const { data: doctor } = await supabase
    .from("doctors")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!doctor) return { error: "Perfil de médico no encontrado." };

  const admin = createAdminClient();

  // Validate email role
  const { data: emailUser } = await admin
    .from("users")
    .select("id, role")
    .eq("email", email)
    .limit(1);

  if (emailUser && emailUser.length > 0) {
    const role = emailUser[0].role;
    if (role === "doctor") {
      return { error: "Este email pertenece a un médico registrado. No puedes invitar a un médico como secretaria." };
    }
    if (role === "patient") {
      return { error: "Este email pertenece a un paciente registrado." };
    }
    if (role === "admin") {
      return { error: "Este email pertenece a un administrador." };
    }
  }

  // Check if already invited and pending
  const { data: existing } = await admin
    .from("invitations")
    .select("id, status")
    .eq("doctor_id", doctor.id)
    .eq("invited_email", email)
    .eq("status", "pending");

  if (existing && existing.length > 0) {
    return { error: "Ya hay una invitación pendiente para este email." };
  }

  // Check if already linked as secretary
  const existingUser = emailUser?.filter((u) => u.role === "secretary") ?? [];

  if (existingUser.length > 0) {
    const { data: existingRel } = await admin
      .from("secretary_doctors")
      .select("id")
      .eq("secretary_id", existingUser[0].id)
      .eq("doctor_id", doctor.id)
      .limit(1);

    if (existingRel && existingRel.length > 0) {
      return { error: "Esta persona ya es tu secretaria." };
    }
  }

  // Create invitation
  const token = generateToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const { error: insertError } = await admin.from("invitations").insert({
    token,
    doctor_id: doctor.id,
    invited_email: email,
    status: "pending",
    expires_at: expiresAt.toISOString(),
  });

  if (insertError) return { error: insertError.message };

  // Get doctor name for email
  const { data: doctorProfile } = await admin
    .from("users")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const doctorName = doctorProfile?.full_name?.trim() || "Tu médico";

  // Build invite URL
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const inviteUrl = `${protocol}://${host}/invite/${token}`;

  // Send email
  const emailResult = await sendInvitationEmail(email, doctorName, inviteUrl);
  if (emailResult.error) {
    // Invitation created but email failed — don't block
    console.error("[createInvitation] Email failed:", emailResult.error);
  }

  revalidatePath("/doctor");
  return { error: null, inviteUrl };
}

// ─── RESEND INVITATION ───
export async function resendInvitation(invitationId: string) {
  const admin = createAdminClient();

  const { data: inv } = await admin
    .from("invitations")
    .select("id, token, doctor_id, invited_email, status, expires_at")
    .eq("id", invitationId)
    .single();

  if (!inv) return { error: "Invitación no encontrada." };

  // If expired, create a new token and extend
  const isExpired = new Date(inv.expires_at) < new Date();
  let token = inv.token;

  if (isExpired || inv.status === "expired") {
    token = generateToken();
    const newExpiry = new Date();
    newExpiry.setDate(newExpiry.getDate() + 7);

    await admin
      .from("invitations")
      .update({
        token,
        status: "pending",
        expires_at: newExpiry.toISOString(),
      })
      .eq("id", inv.id);
  }

  // Get doctor name
  const { data: doctor } = await admin
    .from("doctors")
    .select("user_id")
    .eq("id", inv.doctor_id)
    .single();

  const { data: doctorUser } = await admin
    .from("users")
    .select("full_name")
    .eq("id", doctor?.user_id ?? "")
    .single();

  const doctorName = doctorUser?.full_name?.trim() || "Tu médico";

  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const inviteUrl = `${protocol}://${host}/invite/${token}`;

  const emailResult = await sendInvitationEmail(inv.invited_email, doctorName, inviteUrl);
  if (emailResult.error) {
    return { error: "No se pudo enviar el email: " + emailResult.error };
  }

  revalidatePath("/doctor");
  return { error: null };
}

// ─── ACCEPT INVITATION (called from invite page) ───
export async function getInvitationData(token: string) {
  const admin = createAdminClient();

  const { data: inv } = await admin
    .from("invitations")
    .select("id, token, doctor_id, invited_email, status, expires_at")
    .eq("token", token)
    .single();

  if (!inv) return { error: "Invitación no encontrada.", data: null };

  if (inv.status === "accepted") {
    return { error: "Esta invitación ya fue aceptada.", data: null };
  }

  if (inv.status === "expired" || new Date(inv.expires_at) < new Date()) {
    if (inv.status !== "expired") {
      await admin.from("invitations").update({ status: "expired" }).eq("id", inv.id);
    }
    return { error: "Esta invitación ha expirado. Pedí al médico que te envíe una nueva.", data: null };
  }

  // Get doctor name
  const { data: doctor } = await admin
    .from("doctors")
    .select("user_id")
    .eq("id", inv.doctor_id)
    .single();

  const { data: doctorUser } = await admin
    .from("users")
    .select("full_name")
    .eq("id", doctor?.user_id ?? "")
    .single();

  // Check if email already has account
  const { data: existingUser } = await admin
    .from("users")
    .select("id")
    .eq("email", inv.invited_email)
    .limit(1);

  return {
    error: null,
    data: {
      invitationId: inv.id,
      email: inv.invited_email,
      doctorId: inv.doctor_id,
      doctorName: doctorUser?.full_name?.trim() || "Médico",
      hasAccount: (existingUser ?? []).length > 0,
    },
  };
}

export async function acceptInvitationLogin(
  invitationId: string,
  email: string,
  password: string,
) {
  const admin = createAdminClient();

  // Verify invitation
  const { data: inv } = await admin
    .from("invitations")
    .select("id, doctor_id, invited_email")
    .eq("id", invitationId)
    .eq("status", "pending")
    .single();

  if (!inv) return { error: "Invitación inválida." };

  // Sign in to verify credentials
  const { data: authData, error: authError } =
    await admin.auth.admin.listUsers();

  // Find user by email
  const authUser = (authData?.users ?? []).find(
    (u) => u.email === email,
  );
  if (!authUser) return { error: "No se encontró la cuenta." };

  // Get user record
  const { data: userRow } = await admin
    .from("users")
    .select("id, tenant_id")
    .eq("id", authUser.id)
    .single();

  if (!userRow) return { error: "Perfil de usuario no encontrado." };

  // Get doctor's tenant
  const { data: doctor } = await admin
    .from("doctors")
    .select("id, tenant_id")
    .eq("id", inv.doctor_id)
    .single();

  // Link secretary to doctor
  const { data: existingRel } = await admin
    .from("secretary_doctors")
    .select("id")
    .eq("secretary_id", userRow.id)
    .eq("doctor_id", inv.doctor_id)
    .limit(1);

  if (!existingRel || existingRel.length === 0) {
    await admin.from("secretary_doctors").insert({
      secretary_id: userRow.id,
      doctor_id: inv.doctor_id,
      tenant_id: doctor?.tenant_id ?? userRow.tenant_id ?? "",
    });
  }

  // Update role to secretary if not already
  await admin
    .from("users")
    .update({ role: "secretary" })
    .eq("id", userRow.id);

  // Mark invitation as accepted
  await admin
    .from("invitations")
    .update({ status: "accepted" })
    .eq("id", inv.id);

  return { error: null };
}

export async function acceptInvitationRegister(
  invitationId: string,
  fullName: string,
  phone: string,
  password: string,
) {
  const admin = createAdminClient();

  const { data: inv } = await admin
    .from("invitations")
    .select("id, doctor_id, invited_email")
    .eq("id", invitationId)
    .eq("status", "pending")
    .single();

  if (!inv) return { error: "Invitación inválida." };

  // Get doctor's tenant
  const { data: doctor } = await admin
    .from("doctors")
    .select("id, tenant_id")
    .eq("id", inv.doctor_id)
    .single();

  if (!doctor) return { error: "Médico no encontrado." };

  // Create auth user
  const { data: authData, error: authError } =
    await admin.auth.admin.createUser({
      email: inv.invited_email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

  if (authError || !authData.user) {
    return { error: authError?.message ?? "Error creando cuenta." };
  }

  // Create users record
  const { error: userError } = await admin.from("users").insert({
    id: authData.user.id,
    tenant_id: doctor.tenant_id,
    email: inv.invited_email,
    full_name: fullName,
    phone: phone || null,
    role: "secretary",
    is_active: true,
  });

  if (userError) return { error: userError.message };

  // Link to doctor
  await admin.from("secretary_doctors").insert({
    secretary_id: authData.user.id,
    doctor_id: inv.doctor_id,
    tenant_id: doctor.tenant_id ?? "",
  });

  // Mark invitation as accepted
  await admin
    .from("invitations")
    .update({ status: "accepted" })
    .eq("id", inv.id);

  return { error: null };
}

// ─── DELETE INVITATION ───
export async function deleteInvitation(invitationId: string) {
  const admin = createAdminClient();

  const { error } = await admin
    .from("invitations")
    .delete()
    .eq("id", invitationId);

  if (error) return { error: error.message };

  revalidatePath("/doctor");
  return { error: null };
}

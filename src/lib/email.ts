import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendInvitationEmail(
  to: string,
  doctorName: string,
  inviteUrl: string,
) {
  console.log("[sendInvitationEmail] Sending to:", to);
  console.log("[sendInvitationEmail] RESEND_API_KEY exists:", !!process.env.RESEND_API_KEY);
  console.log("[sendInvitationEmail] Invite URL:", inviteUrl);

  const { data, error } = await resend.emails.send({
    from: "MedicoSaaS <onboarding@resend.dev>",
    to,
    subject: `El Dr. ${doctorName} te invitó a MedicoSaaS`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <h2 style="color: #18181b; margin-bottom: 8px;">Invitación a MedicoSaaS</h2>
        <p style="color: #52525b; font-size: 15px; line-height: 1.6;">
          El Dr. <strong>${doctorName}</strong> te invitó a gestionar su agenda en MedicoSaaS.
        </p>
        <a href="${inviteUrl}" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background-color: #18181b; color: #fff; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500;">
          Aceptar invitación
        </a>
        <p style="color: #a1a1aa; font-size: 13px; margin-top: 24px;">
          Este enlace expira en 7 días. Si no solicitaste esta invitación, ignorá este email.
        </p>
      </div>
    `,
  });

  console.log("[sendInvitationEmail] Resend response data:", JSON.stringify(data));
  console.log("[sendInvitationEmail] Resend response error:", JSON.stringify(error));

  if (error) {
    console.error("[sendInvitationEmail] FAILED:", error.name, error.message);
    return { error: error.message };
  }

  console.log("[sendInvitationEmail] SUCCESS — email id:", data?.id);
  return { error: null };
}

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendInvitationEmail(
  to: string,
  doctorName: string,
  inviteUrl: string,
) {
  const { error } = await resend.emails.send({
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

  if (error) {
    console.error("[sendInvitationEmail]", error);
    return { error: error.message };
  }
  return { error: null };
}

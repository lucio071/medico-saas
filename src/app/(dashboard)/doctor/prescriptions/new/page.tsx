import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUserRole, requireAuth } from "@/lib/auth/server";
import { getRolePath } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { PrescriptionForm } from "@/components/doctor/prescription-form";

function formatApptLabel(startsAt: string, patientName: string): string {
  const dt = new Intl.DateTimeFormat("es", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(startsAt));
  return `${dt} — ${patientName}`;
}

export default async function NewPrescriptionPage() {
  const user = await requireAuth();
  const role = await getCurrentUserRole();
  if (role !== "doctor") redirect(getRolePath(role));

  const supabase = await createClient();

  // Get doctor record
  const { data: doctorRow } = await supabase
    .from("doctors")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const doctorId = doctorRow?.id ?? null;

  type Appointment = {
    id: string;
    label: string;
    patientName: string;
  };

  let appointments: Appointment[] = [];

  if (doctorId) {
    // Fetch recent & upcoming appointments (last 7 days + next 30 days)
    const since = new Date();
    since.setDate(since.getDate() - 7);
    const until = new Date();
    until.setDate(until.getDate() + 30);

    const { data: appts } = await supabase
      .from("appointments")
      .select("id, starts_at, patient_id, status")
      .eq("doctor_id", doctorId)
      .neq("status", "cancelled")
      .gte("starts_at", since.toISOString())
      .lte("starts_at", until.toISOString())
      .order("starts_at", { ascending: false });

    if (appts && appts.length > 0) {
      const patientIds = [...new Set(appts.map((a) => a.patient_id))];

      const { data: patientRows } = await supabase
        .from("patients")
        .select("id, user_id")
        .in("id", patientIds);

      const userIds = [...new Set((patientRows ?? []).map((p) => p.user_id))];
      const { data: userRows } =
        userIds.length > 0
          ? await supabase
              .from("users")
              .select("id, full_name, email")
              .in("id", userIds)
          : { data: [] as { id: string; full_name: string | null; email: string }[] };

      const uidToName = new Map(
        (userRows ?? []).map((u) => [
          u.id,
          u.full_name?.trim() || u.email || "Paciente",
        ]),
      );

      const patientIdToName = new Map(
        (patientRows ?? []).map((p) => [
          p.id,
          uidToName.get(p.user_id) ?? "Paciente",
        ]),
      );

      appointments = appts.map((a) => {
        const patientName = patientIdToName.get(a.patient_id) ?? "Paciente";
        return {
          id: a.id,
          patientName,
          label: formatApptLabel(a.starts_at, patientName),
        };
      });
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center gap-4">
          <Link
            href="/doctor"
            className="text-sm text-slate-500 underline underline-offset-4 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            ← Volver al panel
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h1 className="mb-2 text-xl font-semibold text-slate-900 dark:text-slate-50">
            Nueva receta
          </h1>
          <p className="mb-8 text-sm text-slate-500 dark:text-slate-400">
            Seleccioná la cita y completá los datos de la receta.
          </p>

          {!doctorId ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
              No hay perfil de médico vinculado a tu cuenta.
            </p>
          ) : appointments.length === 0 ? (
            <p className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              No hay citas recientes disponibles para emitir una receta. Las
              citas de los últimos 7 días y próximos 30 días aparecerán aquí.
            </p>
          ) : (
            <PrescriptionForm appointments={appointments} />
          )}
        </div>
      </div>
    </div>
  );
}

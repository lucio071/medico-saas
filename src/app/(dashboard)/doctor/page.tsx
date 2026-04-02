import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/auth/logout-button";
import { getCurrentUserRole, requireAuth } from "@/lib/auth/server";
import { getRolePath } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type AppointmentRow = Database["public"]["Tables"]["appointments"]["Row"];

function getTodayBoundsIso() {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("es", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function formatTodayHeading() {
  return new Intl.DateTimeFormat("es", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

export default async function DoctorPage() {
  const user = await requireAuth();
  const role = await getCurrentUserRole();
  if (role !== "doctor") redirect(getRolePath(role));

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, email")
    .eq("id", user.id)
    .single();

  const displayName =
    profile?.full_name?.trim() || profile?.email || user.email || "Médico";

  const { data: doctorRow } = await supabase
    .from("doctors")
    .select("id, specialty")
    .eq("user_id", user.id)
    .maybeSingle();

  const specialty = doctorRow?.specialty?.trim() || null;
  const doctorId = doctorRow?.id ?? null;

  let todayAppointments: AppointmentRow[] = [];
  const patientNames = new Map<string, string>();

  if (doctorId) {
    const { start, end } = getTodayBoundsIso();

    const { data: appts } = await supabase
      .from("appointments")
      .select("*")
      .eq("doctor_id", doctorId)
      .gte("starts_at", start)
      .lte("starts_at", end)
      .neq("status", "cancelled")
      .order("starts_at", { ascending: true });

    todayAppointments = appts ?? [];

    const patientIds = [...new Set(todayAppointments.map((a) => a.patient_id))];
    if (patientIds.length > 0) {
      const { data: patients } = await supabase
        .from("patients")
        .select("id, user_id")
        .in("id", patientIds);

      const userIds = [...new Set((patients ?? []).map((p) => p.user_id))];
      const { data: patientUsers } =
        userIds.length > 0
          ? await supabase
              .from("users")
              .select("id, full_name, email")
              .in("id", userIds)
          : { data: [] as { id: string; full_name: string | null; email: string }[] };

      const userIdToLabel = new Map(
        (patientUsers ?? []).map((u) => [
          u.id,
          u.full_name?.trim() || u.email || "Paciente",
        ]),
      );

      for (const p of patients ?? []) {
        patientNames.set(
          p.id,
          userIdToLabel.get(p.user_id) ?? "Paciente",
        );
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Panel del médico
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
              {displayName}
            </h1>
            {specialty ? (
              <p className="mt-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {specialty}
              </p>
            ) : (
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Especialidad no indicada
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/doctor/prescriptions/new"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              Nueva receta
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {!doctorId ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
            No hay un perfil de médico vinculado a tu cuenta. Cuando exista en el
            sistema, verás aquí tu agenda y especialidad.
          </div>
        ) : (
          <section>
            <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Citas de hoy
              </h2>
              <p className="text-sm capitalize text-slate-500 dark:text-slate-400">
                {formatTodayHeading()}
              </p>
            </div>

            {todayAppointments.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  No tienes citas programadas para hoy.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {todayAppointments.map((a) => (
                  <li
                    key={a.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                          <span className="text-lg font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                            {formatTime(a.starts_at)}
                          </span>
                          <span className="text-base font-medium text-slate-800 dark:text-slate-200">
                            {patientNames.get(a.patient_id) ?? "Paciente"}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            Motivo:{" "}
                          </span>
                          {a.notes?.trim() || "Sin motivo registrado."}
                        </p>
                      </div>
                      <span className="shrink-0 self-start rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {a.status === "scheduled"
                          ? "Programada"
                          : a.status === "confirmed"
                            ? "Confirmada"
                            : a.status === "completed"
                              ? "Completada"
                              : a.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

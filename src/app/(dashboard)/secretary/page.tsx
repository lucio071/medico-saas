import { redirect } from "next/navigation";
import { getCurrentUserRole, requireAuth } from "@/lib/auth/server";
import { getRolePath } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/auth/logout-button";
import { NewPatientForm } from "@/components/secretary/new-patient-form";
import { NewAppointmentForm } from "@/components/secretary/new-appointment-form";

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
  }).format(new Date());
}

export default async function SecretaryPage() {
  const user = await requireAuth();
  const role = await getCurrentUserRole();
  if (role !== "secretary") redirect(getRolePath(role));

  const supabase = await createClient();

  const { data: secretaryUser } = await supabase
    .from("users")
    .select("full_name, email, tenant_id")
    .eq("id", user.id)
    .single();

  const displayName =
    secretaryUser?.full_name?.trim() ||
    secretaryUser?.email ||
    user.email ||
    "Secretaria";
  const tenantId = secretaryUser?.tenant_id ?? null;

  // --- Doctors in tenant ---
  type DoctorWithUser = {
    id: string;
    user_id: string;
    users: { full_name: string | null; email: string } | null;
  };

  let doctors: DoctorWithUser[] = [];
  if (tenantId) {
    const { data } = await supabase
      .from("doctors")
      .select("id, user_id, users(full_name, email)")
      .eq("tenant_id", tenantId);
    doctors = (data ?? []) as unknown as DoctorWithUser[];
  }

  const doctorOptions = doctors.map((d) => ({
    id: d.id,
    name:
      d.users?.full_name?.trim() ||
      d.users?.email ||
      "Médico",
  }));

  // --- Today's appointments ---
  type ApptWithNames = {
    id: string;
    starts_at: string;
    ends_at: string;
    status: "scheduled" | "confirmed" | "cancelled" | "completed";
    notes: string | null;
    doctor_id: string;
    patient_id: string;
  };

  let todayAppointments: ApptWithNames[] = [];
  const patientNames = new Map<string, string>();
  const doctorNames = new Map<string, string>();

  if (tenantId) {
    const { start, end } = getTodayBoundsIso();
    const { data: appts } = await supabase
      .from("appointments")
      .select("id, starts_at, ends_at, status, notes, doctor_id, patient_id")
      .eq("tenant_id", tenantId)
      .gte("starts_at", start)
      .lte("starts_at", end)
      .neq("status", "cancelled")
      .order("starts_at", { ascending: true });

    todayAppointments = (appts ?? []) as ApptWithNames[];

    // Resolve patient names
    const patientIds = [
      ...new Set(todayAppointments.map((a) => a.patient_id)),
    ];
    if (patientIds.length > 0) {
      const { data: pRows } = await supabase
        .from("patients")
        .select("id, user_id")
        .in("id", patientIds);

      const puIds = [...new Set((pRows ?? []).map((p) => p.user_id))];
      const { data: puRows } =
        puIds.length > 0
          ? await supabase
              .from("users")
              .select("id, full_name, email")
              .in("id", puIds)
          : { data: [] as { id: string; full_name: string | null; email: string }[] };

      const uidToLabel = new Map(
        (puRows ?? []).map((u) => [
          u.id,
          u.full_name?.trim() || u.email || "Paciente",
        ]),
      );
      for (const p of pRows ?? []) {
        patientNames.set(p.id, uidToLabel.get(p.user_id) ?? "Paciente");
      }
    }

    // Resolve doctor names from already-fetched doctors
    for (const d of doctors) {
      doctorNames.set(
        d.id,
        d.users?.full_name?.trim() || d.users?.email || "Médico",
      );
    }
  }

  // --- Patient list for tenant ---
  type PatientRow = {
    id: string;
    user_id: string;
    phone: string | null;
    birth_date: string | null;
  };
  type PatientWithUser = PatientRow & {
    users: { full_name: string | null; email: string } | null;
  };

  let patients: PatientWithUser[] = [];
  if (tenantId) {
    const { data } = await supabase
      .from("patients")
      .select("id, user_id, phone, birth_date, users(full_name, email)")
      .eq("tenant_id", tenantId)
      .order("user_id", { ascending: false })
      .limit(100);
    patients = (data ?? []) as unknown as PatientWithUser[];
  }

  const patientOptions = patients.map((p) => ({
    id: p.id,
    name:
      p.users?.full_name?.trim() ||
      p.users?.email ||
      "Paciente",
  }));

  const statusLabel: Record<string, string> = {
    scheduled: "Programada",
    confirmed: "Confirmada",
    completed: "Completada",
    cancelled: "Cancelada",
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Panel de secretaria
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {displayName}
            </h1>
          </div>
          <LogoutButton />
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-10 px-4 py-8">
        {!tenantId ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
            No hay un consultorio vinculado a tu cuenta. Contacta al
            administrador.
          </div>
        ) : (
          <>
            {/* Today's appointments */}
            <section>
              <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Agenda de hoy
                </h2>
                <p className="text-sm capitalize text-zinc-500 dark:text-zinc-400">
                  {formatTodayHeading()}
                </p>
              </div>

              {todayAppointments.length === 0 ? (
                <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                  No hay citas para hoy.
                </div>
              ) : (
                <ul className="space-y-3">
                  {todayAppointments.map((a) => (
                    <li
                      key={a.id}
                      className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                            <span className="text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                              {formatTime(a.starts_at)}
                            </span>
                            <span className="font-medium text-zinc-800 dark:text-zinc-200">
                              {patientNames.get(a.patient_id) ?? "Paciente"}
                            </span>
                            <span className="text-sm text-zinc-500 dark:text-zinc-400">
                              — {doctorNames.get(a.doctor_id) ?? "Médico"}
                            </span>
                          </div>
                          {a.notes ? (
                            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                              {a.notes}
                            </p>
                          ) : null}
                        </div>
                        <span className="shrink-0 self-start rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                          {statusLabel[a.status] ?? a.status}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Schedule new appointment */}
            <section>
              <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Agendar cita
              </h2>
              {doctors.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  No hay médicos en el consultorio.
                </p>
              ) : patients.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Primero agrega pacientes para poder agendar citas.
                </p>
              ) : (
                <NewAppointmentForm
                  doctors={doctorOptions}
                  patients={patientOptions}
                />
              )}
            </section>

            {/* Patient management */}
            <section>
              <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Pacientes ({patients.length})
                </h2>
                <NewPatientForm />
              </div>

              {patients.length === 0 ? (
                <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                  Aún no hay pacientes registrados.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-800">
                        <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">
                          Nombre
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">
                          Email
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">
                          Teléfono
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {patients.map((p) => (
                        <tr key={p.id}>
                          <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                            {p.users?.full_name?.trim() || "—"}
                          </td>
                          <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                            {p.users?.email || "—"}
                          </td>
                          <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                            {p.phone || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

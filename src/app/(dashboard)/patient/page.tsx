import { getCurrentUserRole, requireAuth } from "@/lib/auth/server";
import { getRolePath } from "@/lib/auth/roles";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/types/database";
import { LogoutButton } from "@/components/auth/logout-button";

type AppointmentRow = Database["public"]["Tables"]["appointments"]["Row"];
type PrescriptionRow = Database["public"]["Tables"]["prescriptions"]["Row"];

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("es", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function formatMedications(medications: Json): string {
  if (medications === null || medications === undefined) return "—";
  if (Array.isArray(medications)) {
    return medications
      .map((item) =>
        typeof item === "object" && item !== null
          ? JSON.stringify(item)
          : String(item),
      )
      .join("; ");
  }
  if (typeof medications === "object") {
    return JSON.stringify(medications);
  }
  return String(medications);
}

export default async function PatientPage() {
  const user = await requireAuth();
  const role = await getCurrentUserRole();
  if (role !== "patient") redirect(getRolePath(role));
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, email")
    .eq("id", user.id)
    .single();

  const displayName =
    profile?.full_name?.trim() || profile?.email || user.email || "Paciente";

  const { data: patientRow } = await supabase
    .from("patients")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const patientId = patientRow?.id ?? null;

  let upcomingAppointments: AppointmentRow[] = [];
  const doctorNames = new Map<string, string>();

  if (patientId) {
    const now = new Date().toISOString();

    const { data: appts } = await supabase
      .from("appointments")
      .select("*")
      .eq("patient_id", patientId)
      .gte("starts_at", now)
      .in("status", ["scheduled", "confirmed"])
      .order("starts_at", { ascending: true })
      .limit(25);

    upcomingAppointments = appts ?? [];

    const doctorIds = [
      ...new Set(upcomingAppointments.map((a) => a.doctor_id)),
    ];
    if (doctorIds.length > 0) {
      const { data: doctors } = await supabase
        .from("doctors")
        .select("id, user_id")
        .in("id", doctorIds);

      const userIds = [...new Set((doctors ?? []).map((d) => d.user_id))];
      const { data: doctorUsers } =
        userIds.length > 0
          ? await supabase
              .from("users")
              .select("id, full_name")
              .in("id", userIds)
          : { data: [] as { id: string; full_name: string | null }[] };

      const userIdToName = new Map(
        (doctorUsers ?? []).map((u) => [
          u.id,
          u.full_name?.trim() || "Profesional",
        ]),
      );

      for (const d of doctors ?? []) {
        doctorNames.set(
          d.id,
          userIdToName.get(d.user_id) ?? "Profesional asignado",
        );
      }
    }
  }

  let prescriptions: PrescriptionRow[] = [];
  if (patientId) {
    const { data: rx } = await supabase
      .from("prescriptions")
      .select("*")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false })
      .limit(25);

    prescriptions = rx ?? [];
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Panel del paciente
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Hola, {displayName}
            </h1>
          </div>
          <LogoutButton />
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-10 px-4 py-8">
        <section>
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Próximas citas
          </h2>
          {!patientId ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
              Aún no hay un perfil de paciente vinculado. Cuando exista en el
              sistema, verás aquí tus citas.
            </p>
          ) : upcomingAppointments.length === 0 ? (
            <p className="rounded-xl border border-zinc-200 bg-white px-4 py-8 text-center text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              No tienes citas próximas programadas.
            </p>
          ) : (
            <ul className="space-y-3">
              {upcomingAppointments.map((a) => (
                <li
                  key={a.id}
                  className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {formatDateTime(a.starts_at)}
                      </p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {doctorNames.get(a.doctor_id) ?? "Profesional"}
                      </p>
                      {a.notes ? (
                        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">
                          {a.notes}
                        </p>
                      ) : null}
                    </div>
                    <span className="inline-flex w-fit shrink-0 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium capitalize text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      {a.status === "scheduled"
                        ? "Programada"
                        : a.status === "confirmed"
                          ? "Confirmada"
                          : a.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Recetas
          </h2>
          {!patientId ? (
            <p className="rounded-xl border border-zinc-200 bg-white px-4 py-8 text-center text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              Sin recetas para mostrar.
            </p>
          ) : prescriptions.length === 0 ? (
            <p className="rounded-xl border border-zinc-200 bg-white px-4 py-8 text-center text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              No hay recetas registradas.
            </p>
          ) : (
            <ul className="space-y-3">
              {prescriptions.map((p) => (
                <li
                  key={p.id}
                  className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {formatDateTime(p.created_at)}
                  </p>
                  <p className="mt-2 text-sm text-zinc-800 dark:text-zinc-200">
                    {p.instructions}
                  </p>
                  <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-500">
                    <span className="font-medium text-zinc-700 dark:text-zinc-400">
                      Medicación:{" "}
                    </span>
                    {formatMedications(p.medications)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

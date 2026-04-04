import { redirect } from "next/navigation";
import { requireAuth, getCurrentUserRole } from "@/lib/auth/server";
import { getRolePath } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { createAdminReadClient } from "@/lib/supabase/admin-read";
import { LogoutButton } from "@/components/auth/logout-button";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("es", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export default async function AdminPage() {
  const user = await requireAuth();
  const role = await getCurrentUserRole();
  if (role !== "admin") redirect(getRolePath(role));

  const supabase = await createClient();
  const adminDb = createAdminReadClient();

  const { data: adminUser } = await adminDb
    .from("users")
    .select("full_name, email")
    .eq("id", user.id)
    .single();

  const displayName =
    adminUser?.full_name?.trim() ||
    adminUser?.email ||
    user.email ||
    "Administrador";

  // --- Stats ---
  const [
    { count: totalTenants },
    { count: totalDoctors },
    { count: totalSecretaries },
    { count: totalPatients },
    { count: totalAppointments },
  ] = await Promise.all([
    supabase.from("tenants").select("id", { count: "exact", head: true }),
    supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "doctor"),
    supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "secretary"),
    supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "patient"),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true }),
  ]);

  const stats = [
    { label: "Consultorios", value: totalTenants ?? 0 },
    { label: "Médicos", value: totalDoctors ?? 0 },
    { label: "Secretarias", value: totalSecretaries ?? 0 },
    { label: "Pacientes", value: totalPatients ?? 0 },
    { label: "Citas totales", value: totalAppointments ?? 0 },
  ];

  // --- Tenants with doctor names ---
  type TenantRow = {
    id: string;
    name: string;
    slug: string;
    created_at: string;
  };
  type DoctorRow = {
    id: string;
    tenant_id: string | null;
    users: { full_name: string | null; email: string } | null;
  };

  const { data: tenants } = await supabase
    .from("tenants")
    .select("id, name, slug, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: allDoctors } = await supabase
    .from("doctors")
    .select("id, tenant_id, users(full_name, email)")
    .limit(200);

  const doctorsByTenant = new Map<string, string[]>();
  for (const d of (allDoctors ?? []) as unknown as DoctorRow[]) {
    if (!d.tenant_id) continue;
    const name =
      d.users?.full_name?.trim() || d.users?.email || "Médico sin nombre";
    const existing = doctorsByTenant.get(d.tenant_id) ?? [];
    existing.push(name);
    doctorsByTenant.set(d.tenant_id, existing);
  }

  // --- Recent users ---
  const { data: recentUsers } = await adminDb
    .from("users")
    .select("id, full_name, email, role, created_at, is_active")
    .order("created_at", { ascending: false })
    .limit(20);

  const roleLabel: Record<string, string> = {
    admin: "Admin",
    doctor: "Médico",
    secretary: "Secretaria",
    patient: "Paciente",
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Panel de administración
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {displayName}
            </h1>
          </div>
          <LogoutButton />
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-10 px-4 py-8">
        {/* Stats */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Resumen global
          </h2>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-zinc-200 bg-white p-4 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  {s.label}
                </dt>
                <dd className="mt-1 text-3xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
                  {s.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Tenants */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Consultorios ({(tenants ?? []).length})
          </h2>
          {(tenants ?? []).length === 0 ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              No hay consultorios registrados.
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
                      Médicos
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">
                      Registrado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {(tenants as TenantRow[]).map((t) => (
                    <tr key={t.id}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">
                          {t.name}
                        </p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500">
                          {t.slug}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {(doctorsByTenant.get(t.id) ?? []).join(", ") || "—"}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {formatDate(t.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Recent users */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Usuarios recientes
          </h2>
          {(recentUsers ?? []).length === 0 ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              No hay usuarios.
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
                      Rol
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">
                      Registro
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {(recentUsers ?? []).map((u) => (
                    <tr key={u.id}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">
                          {u.full_name?.trim() || "—"}
                        </p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500">
                          {u.email}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                          {roleLabel[u.role] ?? u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            u.is_active
                              ? "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300"
                              : "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300"
                          }`}
                        >
                          {u.is_active ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {formatDate(u.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

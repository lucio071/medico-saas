import { redirect } from "next/navigation";
import { requireAuth, getCurrentUserRole } from "@/lib/auth/server";
import { getRolePath } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { createAdminReadClient } from "@/lib/supabase/admin-read";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { NavIcons } from "@/components/layout/nav-icons";

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

  const { data: tenants } = await adminDb
    .from("tenants")
    .select("id, name, slug, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: allDoctors } = await adminDb
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

  const metrics = [
    { label: "Consultorios", value: totalTenants ?? 0, icon: NavIcons.office, tone: "brand" as const },
    { label: "Médicos", value: totalDoctors ?? 0, icon: NavIcons.stethoscope, tone: "default" as const },
    { label: "Pacientes", value: totalPatients ?? 0, icon: NavIcons.users, tone: "default" as const },
    { label: "Citas totales", value: totalAppointments ?? 0, icon: NavIcons.calendar, tone: "success" as const },
  ];

  const tenantsContent = (tenants ?? []).length === 0 ? (
    <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
      No hay consultorios registrados.
    </div>
  ) : (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800">
            <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Nombre</th>
            <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Médicos</th>
            <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Registrado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {(tenants as TenantRow[]).map((t) => (
            <tr key={t.id}>
              <td className="px-4 py-3">
                <p className="font-medium text-slate-900 dark:text-slate-100">{t.name}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">{t.slug}</p>
              </td>
              <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                {(doctorsByTenant.get(t.id) ?? []).join(", ") || "—"}
              </td>
              <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{formatDate(t.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const usersContent = (recentUsers ?? []).length === 0 ? (
    <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
      No hay usuarios.
    </div>
  ) : (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800">
            <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Nombre</th>
            <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Rol</th>
            <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Estado</th>
            <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Registro</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {(recentUsers ?? []).map((u) => (
            <tr key={u.id}>
              <td className="px-4 py-3">
                <p className="font-medium text-slate-900 dark:text-slate-100">{u.full_name?.trim() || "—"}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">{u.email}</p>
              </td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {roleLabel[u.role] ?? u.role}
                </span>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    u.is_active
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                      : "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300"
                  }`}
                >
                  {u.is_active ? "Activo" : "Inactivo"}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{formatDate(u.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const overviewContent = (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Actividad global
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Secretarias registradas: {totalSecretaries ?? 0}
        </p>
      </div>
      {tenantsContent}
    </div>
  );

  const nav = [
    { id: "overview", label: "Resumen", icon: NavIcons.chart, content: overviewContent },
    { id: "tenants", label: "Consultorios", icon: NavIcons.office, content: tenantsContent },
    { id: "users", label: "Usuarios", icon: NavIcons.users, content: usersContent },
  ];

  return (
    <DashboardShell
      brand="Médico SaaS"
      roleLabel="Administrador"
      userName={displayName}
      userEmail={adminUser?.email ?? undefined}
      nav={nav}
      metrics={metrics}
    />
  );
}

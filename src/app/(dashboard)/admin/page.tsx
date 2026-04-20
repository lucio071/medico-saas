import { redirect } from "next/navigation";
import { requireAuth, getCurrentUserRole } from "@/lib/auth/server";
import { getRolePath } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { createAdminReadClient } from "@/lib/supabase/admin-read";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { NavIcons } from "@/components/layout/nav-icons";
import { StatCard } from "@/components/ui/stat-card";
import { DataTable, type Column } from "@/components/ui/data-table";

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

  // ================================================================
  // Dashboard content
  // ================================================================
  const dashboardContent = (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Médicos"
          value={totalDoctors ?? 0}
          icon={NavIcons.stethoscope}
          tone="brand"
        />
        <StatCard
          label="Pacientes"
          value={totalPatients ?? 0}
          icon={NavIcons.users}
          tone="default"
        />
        <StatCard
          label="Consultorios"
          value={totalTenants ?? 0}
          icon={NavIcons.office}
          tone="default"
        />
        <StatCard
          label="Citas totales"
          value={totalAppointments ?? 0}
          icon={NavIcons.calendar}
          tone="success"
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <h2 className="text-sm font-semibold text-[#1E293B]">Actividad global</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-[#64748B]">Secretarias</p>
            <p className="mt-1 text-lg font-semibold text-[#1E293B]">{totalSecretaries ?? 0}</p>
          </div>
          <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-[#64748B]">Total usuarios</p>
            <p className="mt-1 text-lg font-semibold text-[#1E293B]">
              {(totalDoctors ?? 0) + (totalPatients ?? 0) + (totalSecretaries ?? 0)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // ================================================================
  // Doctors / Patients / Users tables
  // ================================================================
  type UserRow = {
    id: string;
    full_name: string | null;
    email: string;
    role: string;
    is_active: boolean;
    created_at: string;
  };

  const allUsers = (recentUsers ?? []) as UserRow[];
  const doctorsList = allUsers.filter((u) => u.role === "doctor");
  const patientsList = allUsers.filter((u) => u.role === "patient");

  const userCols: Column<UserRow>[] = [
    {
      key: "name",
      header: "Nombre",
      sortable: true,
      accessor: (u) => u.full_name ?? "",
      render: (u) => (
        <div>
          <p className="font-medium text-[#1E293B]">{u.full_name?.trim() || "—"}</p>
          <p className="text-xs text-[#64748B]">{u.email}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Estado",
      render: (u) => (
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            u.is_active
              ? "bg-[#ECFDF5] text-[#10B981]"
              : "bg-[#FEE2E2] text-[#EF4444]"
          }`}
        >
          {u.is_active ? "Activo" : "Inactivo"}
        </span>
      ),
    },
    {
      key: "created",
      header: "Registrado",
      sortable: true,
      accessor: (u) => u.created_at,
      render: (u) => formatDate(u.created_at),
    },
  ];

  const statsContent = (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Médicos" value={totalDoctors ?? 0} icon={NavIcons.stethoscope} tone="brand" />
        <StatCard label="Secretarias" value={totalSecretaries ?? 0} icon={NavIcons.briefcase} tone="default" />
        <StatCard label="Pacientes" value={totalPatients ?? 0} icon={NavIcons.users} tone="default" />
        <StatCard label="Citas totales" value={totalAppointments ?? 0} icon={NavIcons.calendar} tone="success" />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <h2 className="text-sm font-semibold text-[#1E293B]">Consultorios ({(tenants ?? []).length})</h2>
        <ul className="mt-4 divide-y divide-slate-100">
          {(tenants as TenantRow[]).map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <div>
                <p className="font-medium text-[#1E293B]">{t.name}</p>
                <p className="text-xs text-[#64748B]">{(doctorsByTenant.get(t.id) ?? []).join(", ") || "—"}</p>
              </div>
              <span className="text-xs text-[#64748B]">{formatDate(t.created_at)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  const configContent = (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      <h2 className="text-base font-semibold text-[#1E293B]">Configuración</h2>
      <p className="mt-1 text-sm text-[#64748B]">
        La configuración global del sistema estará disponible próximamente.
      </p>
      <dl className="mt-5 space-y-3 text-sm">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-[#64748B]">Administrador</dt>
          <dd className="mt-0.5 text-[#1E293B]">{displayName}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-[#64748B]">Email</dt>
          <dd className="mt-0.5 text-[#1E293B]">{adminUser?.email ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-[#64748B]">Rol</dt>
          <dd className="mt-0.5 text-[#1E293B]">{roleLabel.admin}</dd>
        </div>
      </dl>
    </div>
  );

  const nav = [
    { id: "dashboard", label: "Dashboard", icon: NavIcons.chart, content: dashboardContent },
    {
      id: "doctors",
      label: "Médicos",
      icon: NavIcons.stethoscope,
      content: (
        <DataTable
          rows={doctorsList}
          rowKey={(u) => u.id}
          columns={userCols}
          emptyMessage="No hay médicos registrados."
          pageSize={15}
        />
      ),
    },
    {
      id: "patients",
      label: "Pacientes",
      icon: NavIcons.users,
      content: (
        <DataTable
          rows={patientsList}
          rowKey={(u) => u.id}
          columns={userCols}
          emptyMessage="No hay pacientes registrados."
          pageSize={15}
        />
      ),
    },
    { id: "stats", label: "Estadísticas", icon: NavIcons.chart, content: statsContent },
    { id: "config", label: "Configuración", icon: NavIcons.settings, content: configContent },
  ];

  return (
    <DashboardLayout
      roleLabel="Administrador"
      userName={displayName}
      userSubtitle={adminUser?.email ?? undefined}
      nav={nav}
    />
  );
}

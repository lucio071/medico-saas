import { redirect } from "next/navigation";
import { getCurrentUserRole, requireAuth } from "@/lib/auth/server";
import { getRolePath } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/auth/logout-button";
import { DoctorTabs } from "@/components/doctor/doctor-tabs";
import { KanbanBoard } from "@/components/doctor/kanban-board";
import { PatientsList } from "@/components/doctor/patients-list";
import { OfficesList } from "@/components/doctor/offices-list";
import { SchedulesManager } from "@/components/doctor/schedules-manager";
import { PrescriptionTab } from "@/components/doctor/prescription-tab";

function getTodayBoundsIso() {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

function formatTodayHeading() {
  return new Intl.DateTimeFormat("es", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

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

export default async function DoctorPage() {
  const user = await requireAuth();
  const role = await getCurrentUserRole();
  if (role !== "doctor") redirect(getRolePath(role));

  const supabase = await createClient();

  // --- Profile ---
  const { data: profile } = await supabase
    .from("users")
    .select("full_name, email, tenant_id")
    .eq("id", user.id)
    .single();

  const displayName =
    profile?.full_name?.trim() || profile?.email || user.email || "Médico";
  const tenantId = profile?.tenant_id ?? null;

  const { data: doctorRow } = await supabase
    .from("doctors")
    .select("id, specialty")
    .eq("user_id", user.id)
    .maybeSingle();

  const specialty = doctorRow?.specialty?.trim() || null;
  const doctorId = doctorRow?.id ?? null;

  // ================================================================
  // TAB 1: Kanban — Today's appointments
  // ================================================================
  type KanbanCard = {
    id: string;
    startsAt: string;
    patientName: string;
    officeName: string;
    notes: string | null;
    status: "scheduled" | "confirmed" | "attended" | "cancelled" | "no_show";
  };

  let kanbanCards: KanbanCard[] = [];

  if (doctorId) {
    const { start, end } = getTodayBoundsIso();

    const { data: appts } = await supabase
      .from("appointments")
      .select("id, starts_at, status, notes, patient_id, office_id")
      .eq("doctor_id", doctorId)
      .gte("starts_at", start)
      .lte("starts_at", end)
      .order("starts_at", { ascending: true });

    const allAppts = appts ?? [];

    // Resolve patient names
    const patientIds = [...new Set(allAppts.map((a) => a.patient_id))];
    const patientNameMap = new Map<string, string>();
    if (patientIds.length > 0) {
      const { data: pRows } = await supabase
        .from("patients")
        .select("id, user_id")
        .in("id", patientIds);
      const uIds = [...new Set((pRows ?? []).map((p) => p.user_id))];
      if (uIds.length > 0) {
        const { data: uRows } = await supabase
          .from("users")
          .select("id, full_name, email")
          .in("id", uIds);
        const uidMap = new Map(
          (uRows ?? []).map((u) => [u.id, u.full_name?.trim() || u.email]),
        );
        for (const p of pRows ?? []) {
          patientNameMap.set(p.id, uidMap.get(p.user_id) ?? "Paciente");
        }
      }
    }

    // Resolve office names
    const officeIds = [
      ...new Set(allAppts.map((a) => a.office_id).filter(Boolean) as string[]),
    ];
    const officeNameMap = new Map<string, string>();
    if (officeIds.length > 0) {
      const { data: oRows } = await supabase
        .from("offices")
        .select("id, name")
        .in("id", officeIds);
      for (const o of oRows ?? []) {
        officeNameMap.set(o.id, o.name);
      }
    }

    kanbanCards = allAppts.map((a) => ({
      id: a.id,
      startsAt: a.starts_at,
      patientName: patientNameMap.get(a.patient_id) ?? "Paciente",
      officeName: a.office_id ? (officeNameMap.get(a.office_id) ?? "") : "",
      notes: a.notes,
      status: a.status,
    }));
  }

  // ================================================================
  // TAB 2: Patients
  // ================================================================
  type PatientItem = {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    birthDate: string | null;
    bloodType: string | null;
    allergies: string[] | null;
    departmentName: string | null;
    cityName: string | null;
  };

  let patientItems: PatientItem[] = [];
  if (tenantId) {
    const { data } = await supabase
      .from("patients")
      .select("id, user_id, phone, birth_date, blood_type, allergies, department_id, city_id, users(full_name, email)")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(200);

    type PRow = {
      id: string;
      user_id: string;
      phone: string | null;
      birth_date: string | null;
      blood_type: string | null;
      allergies: string[] | null;
      department_id: number | null;
      city_id: number | null;
      users: { full_name: string; email: string } | null;
    };

    const rows = (data ?? []) as unknown as PRow[];

    // Resolve department & city names
    const deptIds = [...new Set(rows.map((p) => p.department_id).filter(Boolean))] as number[];
    const cityIds = [...new Set(rows.map((p) => p.city_id).filter(Boolean))] as number[];

    const deptNameMap = new Map<number, string>();
    const cityNameMap = new Map<number, string>();

    if (deptIds.length > 0) {
      const { data: depts } = await supabase
        .from("departments")
        .select("id, name")
        .in("id", deptIds);
      for (const d of depts ?? []) deptNameMap.set(d.id, d.name);
    }
    if (cityIds.length > 0) {
      const { data: cts } = await supabase
        .from("cities")
        .select("id, name")
        .in("id", cityIds);
      for (const c of cts ?? []) cityNameMap.set(c.id, c.name);
    }

    patientItems = rows.map((p) => ({
      id: p.id,
      fullName: p.users?.full_name?.trim() || "Sin nombre",
      email: p.users?.email || "",
      phone: p.phone,
      birthDate: p.birth_date,
      bloodType: p.blood_type,
      allergies: p.allergies,
      departmentName: p.department_id ? (deptNameMap.get(p.department_id) ?? null) : null,
      cityName: p.city_id ? (cityNameMap.get(p.city_id) ?? null) : null,
    }));
  }

  // Departments list for the patient form
  const { data: departmentsList } = await supabase
    .from("departments")
    .select("id, name")
    .order("name", { ascending: true });

  // ================================================================
  // TAB 3: Offices
  // ================================================================
  type OfficeItem = {
    id: string;
    name: string;
    address: string | null;
    phone: string | null;
    isActive: boolean;
  };

  let officeItems: OfficeItem[] = [];
  if (doctorId) {
    const { data } = await supabase
      .from("offices")
      .select("id, name, address, phone, is_active")
      .eq("doctor_id", doctorId)
      .order("created_at", { ascending: false });

    officeItems = (data ?? []).map((o) => ({
      id: o.id,
      name: o.name,
      address: o.address,
      phone: o.phone,
      isActive: o.is_active,
    }));
  }

  // ================================================================
  // TAB 4: Schedules
  // ================================================================
  type ScheduleItem = {
    id: string;
    officeId: string | null;
    officeName: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  };

  let scheduleItems: ScheduleItem[] = [];
  if (doctorId) {
    const { data } = await supabase
      .from("doctor_schedules")
      .select("id, office_id, day_of_week, start_time, end_time")
      .eq("doctor_id", doctorId)
      .order("day_of_week", { ascending: true });

    const officeMap = new Map(officeItems.map((o) => [o.id, o.name]));

    scheduleItems = (data ?? []).map((s) => ({
      id: s.id,
      officeId: s.office_id,
      officeName: s.office_id ? (officeMap.get(s.office_id) ?? "Consultorio") : "Sin consultorio",
      dayOfWeek: s.day_of_week,
      startTime: s.start_time,
      endTime: s.end_time,
    }));
  }

  // ================================================================
  // TAB 5: Prescription — need appointments + patient list for selects
  // ================================================================
  type RxAppt = { id: string; label: string; patientId: string };
  let rxAppointments: RxAppt[] = [];

  if (doctorId) {
    const since = new Date();
    since.setDate(since.getDate() - 7);
    const until = new Date();
    until.setDate(until.getDate() + 30);

    const { data: appts } = await supabase
      .from("appointments")
      .select("id, starts_at, patient_id")
      .eq("doctor_id", doctorId)
      .neq("status", "cancelled")
      .gte("starts_at", since.toISOString())
      .lte("starts_at", until.toISOString())
      .order("starts_at", { ascending: false });

    rxAppointments = (appts ?? []).map((a) => {
      const pName =
        patientItems.find(
          (p) => p.id === a.patient_id,
        )?.fullName ?? "Paciente";
      return {
        id: a.id,
        label: formatApptLabel(a.starts_at, pName),
        patientId: a.patient_id,
      };
    });
  }

  const rxPatients = patientItems.map((p) => ({
    id: p.id,
    name: p.fullName,
  }));

  // ================================================================
  // Build tabs
  // ================================================================
  const tabs = [
    {
      id: "agenda",
      label: "Agenda de hoy",
      content: <KanbanBoard appointments={kanbanCards} />,
    },
    {
      id: "pacientes",
      label: "Pacientes",
      content: <PatientsList patients={patientItems} departments={(departmentsList ?? []).map((d) => ({ id: d.id, name: d.name }))} />,
    },
    {
      id: "consultorios",
      label: "Consultorios",
      content: <OfficesList offices={officeItems} />,
    },
    {
      id: "horarios",
      label: "Horarios",
      content: (
        <SchedulesManager
          offices={officeItems.map((o) => ({ id: o.id, name: o.name }))}
          schedules={scheduleItems}
        />
      ),
    },
    {
      id: "receta",
      label: "Nueva receta",
      content: (
        <PrescriptionTab
          patients={rxPatients}
          appointments={rxAppointments}
        />
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Panel del médico
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {displayName}
            </h1>
            {specialty ? (
              <p className="mt-1 inline-flex rounded-full bg-zinc-100 px-3 py-0.5 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                {specialty}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            <p className="text-sm capitalize text-zinc-500 dark:text-zinc-400">
              {formatTodayHeading()}
            </p>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {!doctorId ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
            No hay un perfil de médico vinculado a tu cuenta.
          </div>
        ) : (
          <DoctorTabs tabs={tabs} />
        )}
      </main>
    </div>
  );
}

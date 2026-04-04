import { redirect } from "next/navigation";
import { getCurrentUserRole, requireAuth } from "@/lib/auth/server";
import { getRolePath } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/auth/logout-button";
import { DoctorTabs } from "@/components/doctor/doctor-tabs";
import { KanbanBoard } from "@/components/doctor/kanban-board";
import { PatientsList } from "@/components/doctor/patients-list";
import { NewAppointmentForm } from "@/components/secretary/new-appointment-form";
import { SchedulesManager } from "@/components/doctor/schedules-manager";
import { DoctorSelector } from "@/components/secretary/doctor-selector";

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

interface PageProps {
  searchParams: Promise<{ doctor?: string }>;
}

export default async function SecretaryPage({ searchParams }: PageProps) {
  const user = await requireAuth();
  const role = await getCurrentUserRole();
  if (role !== "secretary") redirect(getRolePath(role));

  const supabase = await createClient();
  const resolvedParams = await searchParams;

  // --- Secretary profile ---
  const { data: secUser } = await supabase
    .from("users")
    .select("full_name, email, tenant_id")
    .eq("id", user.id)
    .single();

  const displayName =
    secUser?.full_name?.trim() || secUser?.email || user.email || "Secretaria";
  const tenantId = secUser?.tenant_id ?? null;

  // --- Load assigned doctors via secretary_doctors ---
  type AssignedDoctor = { doctorId: string; doctorName: string };
  let assignedDoctors: AssignedDoctor[] = [];

  if (tenantId) {
    const { data: rels } = await supabase
      .from("secretary_doctors")
      .select("doctor_id")
      .eq("secretary_id", user.id);

    const doctorIds = (rels ?? []).map((r) => r.doctor_id);

    if (doctorIds.length > 0) {
      const { data: docRows } = await supabase
        .from("doctors")
        .select("id, user_id")
        .in("id", doctorIds);

      const docUserIds = (docRows ?? []).map((d) => d.user_id);
      const { data: docUsers } = await supabase
        .from("users")
        .select("id, full_name")
        .in("id", docUserIds);

      const nameMap = new Map(
        (docUsers ?? []).map((u) => [u.id, u.full_name?.trim() || "Médico"]),
      );

      assignedDoctors = (docRows ?? []).map((d) => ({
        doctorId: d.id,
        doctorName: nameMap.get(d.user_id) ?? "Médico",
      }));
    }
  }

  if (!tenantId || assignedDoctors.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6">
            <div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Panel de secretaria</p>
              <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{displayName}</h1>
            </div>
            <LogoutButton />
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
            No estás asignada a ningún médico. Contacta al administrador.
          </div>
        </main>
      </div>
    );
  }

  // --- Select active doctor (from URL param or first) ---
  const selectedDoctorId =
    resolvedParams.doctor && assignedDoctors.some((d) => d.doctorId === resolvedParams.doctor)
      ? resolvedParams.doctor
      : assignedDoctors[0].doctorId;

  const selectedDoctorName =
    assignedDoctors.find((d) => d.doctorId === selectedDoctorId)?.doctorName ?? "Médico";

  const doctorSelectorOptions = assignedDoctors.map((d) => ({
    id: d.doctorId,
    name: d.doctorName,
  }));

  // ================================================================
  // TAB 1: Kanban — Today's appointments for selected doctor
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
  {
    const { start, end } = getTodayBoundsIso();
    const { data: appts } = await supabase
      .from("appointments")
      .select("id, starts_at, status, notes, patient_id, office_id")
      .eq("doctor_id", selectedDoctorId)
      .gte("starts_at", start)
      .lte("starts_at", end)
      .order("starts_at", { ascending: true });

    const allAppts = appts ?? [];

    const patientIds = [...new Set(allAppts.map((a) => a.patient_id))];
    const patientNameMap = new Map<string, string>();
    if (patientIds.length > 0) {
      const { data: pRows } = await supabase.from("patients").select("id, user_id").in("id", patientIds);
      const uIds = [...new Set((pRows ?? []).map((p) => p.user_id))];
      if (uIds.length > 0) {
        const { data: uRows } = await supabase.from("users").select("id, full_name, email").in("id", uIds);
        const uidMap = new Map((uRows ?? []).map((u) => [u.id, u.full_name?.trim() || u.email]));
        for (const p of pRows ?? []) patientNameMap.set(p.id, uidMap.get(p.user_id) ?? "Paciente");
      }
    }

    const officeIds = [...new Set(allAppts.map((a) => a.office_id).filter(Boolean) as string[])];
    const officeNameMap = new Map<string, string>();
    if (officeIds.length > 0) {
      const { data: oRows } = await supabase.from("offices").select("id, name").in("id", officeIds);
      for (const o of oRows ?? []) officeNameMap.set(o.id, o.name);
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
    userId: string;
    fullName: string;
    email: string;
    phone: string | null;
    birthDate: string | null;
    bloodType: string | null;
    allergies: string[] | null;
    emergencyContact: string | null;
    departmentId: number | null;
    cityId: number | null;
    departmentName: string | null;
    cityName: string | null;
    address: string | null;
    neighborhood: string | null;
    isActive: boolean;
  };

  let patientItems: PatientItem[] = [];
  {
    const { data } = await supabase
      .from("patients")
      .select("id, user_id, phone, birth_date, blood_type, allergies, emergency_contact, department_id, city_id, address, neighborhood")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(200);

    const rows = data ?? [];
    const userIds = [...new Set(rows.map((p) => p.user_id))];
    const userMap = new Map<string, { full_name: string; email: string; is_active: boolean }>();
    if (userIds.length > 0) {
      const { data: uRows } = await supabase.from("users").select("id, full_name, email, is_active").in("id", userIds);
      for (const u of uRows ?? []) userMap.set(u.id, { full_name: u.full_name, email: u.email, is_active: u.is_active });
    }

    const deptIds = [...new Set(rows.map((p) => p.department_id).filter(Boolean))] as number[];
    const cityIds = [...new Set(rows.map((p) => p.city_id).filter(Boolean))] as number[];
    const deptNameMap = new Map<number, string>();
    const cityNameMap = new Map<number, string>();
    if (deptIds.length > 0) {
      const { data: depts } = await supabase.from("departments").select("id, name").in("id", deptIds);
      for (const d of depts ?? []) deptNameMap.set(d.id, d.name);
    }
    if (cityIds.length > 0) {
      const { data: cts } = await supabase.from("cities").select("id, name").in("id", cityIds);
      for (const c of cts ?? []) cityNameMap.set(c.id, c.name);
    }

    patientItems = rows.map((p) => {
      const u = userMap.get(p.user_id);
      return {
        id: p.id,
        userId: p.user_id,
        fullName: u?.full_name?.trim() || "Sin nombre",
        email: u?.email || "",
        phone: p.phone,
        birthDate: p.birth_date,
        bloodType: p.blood_type,
        allergies: p.allergies,
        emergencyContact: p.emergency_contact,
        departmentId: p.department_id,
        cityId: p.city_id,
        departmentName: p.department_id ? (deptNameMap.get(p.department_id) ?? null) : null,
        cityName: p.city_id ? (cityNameMap.get(p.city_id) ?? null) : null,
        address: p.address,
        neighborhood: p.neighborhood,
        isActive: u?.is_active ?? true,
      };
    });
  }

  const { data: departmentsList } = await supabase
    .from("departments")
    .select("id, name")
    .order("name", { ascending: true });

  // ================================================================
  // TAB 3: New appointment
  // ================================================================
  const doctorOptions = [{ id: selectedDoctorId, name: selectedDoctorName }];
  const patientOptions = patientItems.filter((p) => p.isActive).map((p) => ({ id: p.id, name: p.fullName }));

  // ================================================================
  // TAB 4: Schedules for selected doctor
  // ================================================================
  let officeItems: { id: string; name: string }[] = [];
  {
    const { data } = await supabase.from("offices").select("id, name").eq("doctor_id", selectedDoctorId);
    officeItems = (data ?? []).map((o) => ({ id: o.id, name: o.name }));
  }

  type ScheduleItem = { id: string; officeId: string | null; officeName: string; dayOfWeek: number; startTime: string; endTime: string };
  let scheduleItems: ScheduleItem[] = [];
  {
    const { data } = await supabase
      .from("doctor_schedules")
      .select("id, office_id, day_of_week, start_time, end_time")
      .eq("doctor_id", selectedDoctorId)
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
      content: (
        <PatientsList
          patients={patientItems}
          departments={(departmentsList ?? []).map((d) => ({ id: d.id, name: d.name }))}
        />
      ),
    },
    {
      id: "cita",
      label: "Nueva cita",
      content: <NewAppointmentForm doctors={doctorOptions} patients={patientOptions} />,
    },
    {
      id: "horarios",
      label: "Horarios",
      content: <SchedulesManager offices={officeItems} schedules={scheduleItems} />,
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Panel de secretaria
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {displayName}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <DoctorSelector doctors={doctorSelectorOptions} selectedId={selectedDoctorId} />
            <p className="text-sm capitalize text-zinc-500 dark:text-zinc-400">
              {formatTodayHeading()}
            </p>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <DoctorTabs tabs={tabs} />
      </main>
    </div>
  );
}

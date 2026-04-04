import { redirect } from "next/navigation";
import { getCurrentUserRole, requireAuth } from "@/lib/auth/server";
import { getRolePath } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { createAdminReadClient } from "@/lib/supabase/admin-read";
import { LogoutButton } from "@/components/auth/logout-button";
import { DoctorTabs } from "@/components/doctor/doctor-tabs";
import { PatientsList } from "@/components/doctor/patients-list";
import { ScheduleGrid } from "@/components/secretary/schedule-grid";
import { SlotBookingForm } from "@/components/secretary/slot-booking-form";
import { WaitlistTable } from "@/components/secretary/waitlist-table";
import { DateNav } from "@/components/secretary/date-nav";

const DOCTOR_COLORS = ["#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EC4899", "#14B8A6"];

interface PageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function SecretaryPage({ searchParams }: PageProps) {
  const user = await requireAuth();
  const role = await getCurrentUserRole();
  if (role !== "secretary") redirect(getRolePath(role));

  const supabase = await createClient();
  const adminDb = createAdminReadClient();
  const resolvedParams = await searchParams;

  // ─── Secretary profile ───
  const { data: secUser } = await adminDb
    .from("users")
    .select("full_name, email, tenant_id")
    .eq("id", user.id)
    .single();

  const displayName = secUser?.full_name?.trim() || secUser?.email || "Secretaria";
  const tenantId = secUser?.tenant_id ?? null;

  // ─── Assigned doctors via secretary_doctors ───
  type DoctorInfo = { id: string; name: string; color: string };
  let assignedDoctors: DoctorInfo[] = [];

  if (tenantId) {
    const { data: rels } = await adminDb
      .from("secretary_doctors")
      .select("doctor_id")
      .eq("secretary_id", user.id);

    const doctorIds = (rels ?? []).map((r) => r.doctor_id);

    if (doctorIds.length > 0) {
      const { data: docRows } = await adminDb
        .from("doctors")
        .select("id, user_id")
        .in("id", doctorIds);

      const docUserIds = (docRows ?? []).map((d) => d.user_id);
      const { data: docUsers } = await adminDb
        .from("users")
        .select("id, full_name")
        .in("id", docUserIds);

      const nameMap = new Map(
        (docUsers ?? []).map((u) => [u.id, u.full_name?.trim() || "Médico"]),
      );

      assignedDoctors = (docRows ?? []).map((d, i) => ({
        id: d.id,
        name: nameMap.get(d.user_id) ?? "Médico",
        color: DOCTOR_COLORS[i % DOCTOR_COLORS.length],
      }));
    }
  }

  if (!tenantId || assignedDoctors.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6">
            <div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Panel de secretaria</p>
              <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{displayName}</h1>
            </div>
            <LogoutButton />
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
            No estás asignada a ningún médico. Contacta al administrador.
          </div>
        </main>
      </div>
    );
  }

  // ─── Date ───
  const today = new Date().toISOString().slice(0, 10);
  const currentDate = resolvedParams.date || today;
  const dateBoundsStart = `${currentDate}T00:00:00.000Z`;
  const dateBoundsEnd = `${currentDate}T23:59:59.999Z`;

  const doctorIds = assignedDoctors.map((d) => d.id);
  const doctorColorMap = new Map(assignedDoctors.map((d) => [d.id, d.color]));

  // ================================================================
  // TAB 1: Schedule Grid — appointments + available slots
  // ================================================================
  type AppointmentCell = {
    id: string;
    slotId: string | null;
    patientName: string;
    status: "scheduled" | "confirmed" | "attended" | "cancelled" | "no_show";
    notes: string | null;
    startTime: string;
    endTime: string;
    doctorId: string;
  };

  let gridAppointments: AppointmentCell[] = [];

  const { data: appts } = await adminDb
    .from("appointments")
    .select("id, slot_id, patient_id, status, notes, starts_at, ends_at, doctor_id")
    .in("doctor_id", doctorIds)
    .gte("starts_at", dateBoundsStart)
    .lte("starts_at", dateBoundsEnd)
    .order("starts_at", { ascending: true });

  const allAppts = appts ?? [];

  // Resolve patient names
  const patientIdsFromAppts = [...new Set(allAppts.map((a) => a.patient_id))];
  const patientNameMap = new Map<string, string>();
  const patientPhoneMap = new Map<string, string | null>();

  if (patientIdsFromAppts.length > 0) {
    const { data: pRows } = await adminDb.from("patients").select("id, user_id, phone").in("id", patientIdsFromAppts);
    const uIds = [...new Set((pRows ?? []).map((p) => p.user_id))];
    if (uIds.length > 0) {
      const { data: uRows } = await adminDb.from("users").select("id, full_name, email").in("id", uIds);
      const uidMap = new Map((uRows ?? []).map((u) => [u.id, u.full_name?.trim() || u.email]));
      for (const p of pRows ?? []) {
        patientNameMap.set(p.id, uidMap.get(p.user_id) ?? "Paciente");
        patientPhoneMap.set(p.id, p.phone);
      }
    }
  }

  function extractTime(iso: string): string {
    return iso.slice(11, 19); // HH:MM:SS
  }

  gridAppointments = allAppts.map((a) => ({
    id: a.id,
    slotId: a.slot_id,
    patientName: patientNameMap.get(a.patient_id) ?? "Paciente",
    status: a.status,
    notes: a.notes,
    startTime: extractTime(a.starts_at),
    endTime: extractTime(a.ends_at),
    doctorId: a.doctor_id,
  }));

  // Available slots for this date
  type SlotCell = { id: string; startTime: string; endTime: string; doctorId: string; officeId: string };
  const { data: slotsData } = await adminDb
    .from("appointment_slots")
    .select("id, start_time, end_time, doctor_id, office_id")
    .in("doctor_id", doctorIds)
    .eq("slot_date", currentDate)
    .eq("status", "available");

  const availableSlots: SlotCell[] = (slotsData ?? []).map((s) => ({
    id: s.id,
    startTime: s.start_time,
    endTime: s.end_time,
    doctorId: s.doctor_id,
    officeId: s.office_id,
  }));

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
    const { data } = await adminDb
      .from("patients")
      .select("id, user_id, phone, birth_date, blood_type, allergies, emergency_contact, department_id, city_id, address, neighborhood")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(200);

    const rows = data ?? [];
    const userIds = [...new Set(rows.map((p) => p.user_id))];
    const userMap = new Map<string, { full_name: string; email: string; is_active: boolean }>();
    if (userIds.length > 0) {
      const { data: uRows } = await adminDb.from("users").select("id, full_name, email, is_active").in("id", userIds);
      for (const u of uRows ?? []) userMap.set(u.id, { full_name: u.full_name, email: u.email, is_active: u.is_active });
    }

    const deptIds = [...new Set(rows.map((p) => p.department_id).filter(Boolean))] as number[];
    const cityIds = [...new Set(rows.map((p) => p.city_id).filter(Boolean))] as number[];
    const deptNameMap = new Map<number, string>();
    const cityNameMap = new Map<number, string>();
    if (deptIds.length > 0) {
      const { data: depts } = await adminDb.from("departments").select("id, name").in("id", deptIds);
      for (const d of depts ?? []) deptNameMap.set(d.id, d.name);
    }
    if (cityIds.length > 0) {
      const { data: cts } = await adminDb.from("cities").select("id, name").in("id", cityIds);
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

  const { data: departmentsList } = await adminDb
    .from("departments")
    .select("id, name")
    .order("name", { ascending: true });

  const activePatients = patientItems.filter((p) => p.isActive).map((p) => ({ id: p.id, name: p.fullName }));

  // ================================================================
  // TAB 3: Slot booking — group slots by doctor
  // ================================================================
  const slotsByDoctor: Record<string, SlotCell[]> = {};
  for (const s of availableSlots) {
    const arr = slotsByDoctor[s.doctorId] ?? [];
    arr.push(s);
    slotsByDoctor[s.doctorId] = arr;
  }

  // ================================================================
  // TAB 4: Waitlist
  // ================================================================
  type WaitlistItem = {
    id: string;
    patientName: string;
    patientPhone: string | null;
    doctorName: string;
    doctorColor: string;
    requestedDate: string;
    notes: string | null;
  };

  let waitlistItems: WaitlistItem[] = [];
  {
    const { data } = await adminDb
      .from("waitlist")
      .select("id, patient_id, doctor_id, requested_date, notes")
      .eq("status", "waiting")
      .in("doctor_id", doctorIds)
      .order("requested_date", { ascending: true });

    const doctorNameMap = new Map(assignedDoctors.map((d) => [d.id, d.name]));

    // Resolve patient names for waitlist items
    const wlPatIds = [...new Set((data ?? []).map((w) => w.patient_id))];
    const wlPatNameMap = new Map<string, string>();
    const wlPatPhoneMap = new Map<string, string | null>();
    if (wlPatIds.length > 0) {
      const { data: pRows } = await adminDb.from("patients").select("id, user_id, phone").in("id", wlPatIds);
      const wlUids = [...new Set((pRows ?? []).map((p) => p.user_id))];
      if (wlUids.length > 0) {
        const { data: uRows } = await adminDb.from("users").select("id, full_name").in("id", wlUids);
        const uidMap = new Map((uRows ?? []).map((u) => [u.id, u.full_name?.trim() || "Paciente"]));
        for (const p of pRows ?? []) {
          wlPatNameMap.set(p.id, uidMap.get(p.user_id) ?? "Paciente");
          wlPatPhoneMap.set(p.id, p.phone);
        }
      }
    }

    waitlistItems = (data ?? []).map((w) => ({
      id: w.id,
      patientName: wlPatNameMap.get(w.patient_id) ?? "Paciente",
      patientPhone: wlPatPhoneMap.get(w.patient_id) ?? null,
      doctorName: doctorNameMap.get(w.doctor_id) ?? "Médico",
      doctorColor: doctorColorMap.get(w.doctor_id) ?? "#6B7280",
      requestedDate: w.requested_date,
      notes: w.notes,
    }));
  }

  // ================================================================
  // Build tabs
  // ================================================================
  const tabs = [
    {
      id: "agenda",
      label: "Agenda del día",
      content: (
        <div className="space-y-4">
          <DateNav currentDate={currentDate} />
          <ScheduleGrid
            doctors={assignedDoctors}
            appointments={gridAppointments}
            availableSlots={availableSlots}
            patients={activePatients}
            currentDate={currentDate}
          />
        </div>
      ),
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
      content: (
        <SlotBookingForm
          doctors={assignedDoctors}
          patients={activePatients}
          slotsByDoctor={slotsByDoctor}
          currentDate={currentDate}
        />
      ),
    },
    {
      id: "espera",
      label: `Lista de espera (${waitlistItems.length})`,
      content: (
        <WaitlistTable
          items={waitlistItems}
          doctors={assignedDoctors}
          patients={activePatients}
        />
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Panel de secretaria</p>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {displayName}
            </h1>
            <div className="mt-1 flex flex-wrap gap-2">
              {assignedDoctors.map((d) => (
                <span
                  key={d.id}
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
                  style={{ backgroundColor: `${d.color}15`, color: d.color }}
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                  Dr. {d.name}
                </span>
              ))}
            </div>
          </div>
          <LogoutButton />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <DoctorTabs tabs={tabs} />
      </main>
    </div>
  );
}

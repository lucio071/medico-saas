import { redirect } from "next/navigation";
import { getCurrentUserRole, requireAuth } from "@/lib/auth/server";
import { getRolePath } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { createAdminReadClient } from "@/lib/supabase/admin-read";
import { SecretariesList } from "@/components/doctor/secretaries-list";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { NavIcons } from "@/components/layout/nav-icons";
import { KanbanBoard } from "@/components/doctor/kanban-board";
import { PatientsList } from "@/components/doctor/patients-list";
import { OfficesList } from "@/components/doctor/offices-list";
import { SchedulesManager } from "@/components/doctor/schedules-manager";
import { PrescriptionTab } from "@/components/doctor/prescription-tab";
import { DoctorProfileForm } from "@/components/doctor/doctor-profile-form";
import {
  ClinicalRecordsTab,
  type ClinicalVisit,
  type PatientSummary,
} from "@/components/doctor/clinical-records-tab";

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
  const adminDb = createAdminReadClient();

  // --- Profile ---
  const { data: profile } = await adminDb
    .from("users")
    .select("full_name, email, tenant_id")
    .eq("id", user.id)
    .single();

  const displayName =
    profile?.full_name?.trim() || profile?.email || user.email || "Médico";
  const tenantId = profile?.tenant_id ?? null;

  const { data: doctorRow } = await adminDb
    .from("doctors")
    .select("id, specialty, specialties, consultation_duration")
    .eq("user_id", user.id)
    .maybeSingle();

  const specialty = doctorRow?.specialty?.trim() || null;
  const doctorSpecialties = doctorRow?.specialties ?? (specialty ? [specialty] : []);
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

    const { data: appts } = await adminDb
      .from("appointments")
      .select("id, starts_at, scheduled_at, status, notes, patient_id, office_id")
      .eq("doctor_id", doctorId)
      .gte("starts_at", start)
      .lte("starts_at", end)
      .order("starts_at", { ascending: true });

    const allAppts = appts ?? [];

    // Resolve patient names
    const patientIds = [...new Set(allAppts.map((a) => a.patient_id))];
    const patientNameMap = new Map<string, string>();
    if (patientIds.length > 0) {
      const { data: pRows } = await adminDb
        .from("patients")
        .select("id, user_id")
        .in("id", patientIds);
      const uIds = [...new Set((pRows ?? []).map((p) => p.user_id))];
      if (uIds.length > 0) {
        const { data: uRows } = await adminDb
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
      const { data: oRows } = await adminDb
        .from("offices")
        .select("id, name")
        .in("id", officeIds);
      for (const o of oRows ?? []) {
        officeNameMap.set(o.id, o.name);
      }
    }

    kanbanCards = allAppts.map((a) => ({
      id: a.id,
      startsAt: a.starts_at ?? a.scheduled_at ?? "",
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
  if (tenantId) {
    // Query patients (without join — RLS can block the users join)
    const { data } = await adminDb
      .from("patients")
      .select("id, user_id, phone, birth_date, blood_type, allergies, emergency_contact, department_id, city_id, address, neighborhood")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(200);

    const rows = data ?? [];

    // Resolve user info separately (same session, direct query)
    const userIds = [...new Set(rows.map((p) => p.user_id))];
    const userMap = new Map<string, { full_name: string; email: string; is_active: boolean }>();
    if (userIds.length > 0) {
      const { data: uRows } = await adminDb
        .from("users")
        .select("id, full_name, email, is_active")
        .in("id", userIds);
      for (const u of uRows ?? []) {
        userMap.set(u.id, { full_name: u.full_name, email: u.email, is_active: u.is_active });
      }
    }

    // Resolve department & city names
    const deptIds = [...new Set(rows.map((p) => p.department_id).filter(Boolean))] as number[];
    const cityIds = [...new Set(rows.map((p) => p.city_id).filter(Boolean))] as number[];

    const deptNameMap = new Map<number, string>();
    const cityNameMap = new Map<number, string>();

    if (deptIds.length > 0) {
      const { data: depts } = await adminDb
        .from("departments")
        .select("id, name")
        .in("id", deptIds);
      for (const d of depts ?? []) deptNameMap.set(d.id, d.name);
    }
    if (cityIds.length > 0) {
      const { data: cts } = await adminDb
        .from("cities")
        .select("id, name")
        .in("id", cityIds);
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

  // Departments list for the patient form
  const { data: departmentsList } = await adminDb
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
    const { data } = await adminDb
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
    const { data } = await adminDb
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

    const { data: appts } = await adminDb
      .from("appointments")
      .select("id, starts_at, scheduled_at, patient_id")
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
        label: formatApptLabel(a.starts_at ?? a.scheduled_at ?? "", pName),
        patientId: a.patient_id,
      };
    });
  }

  const rxPatients = patientItems.map((p) => ({
    id: p.id,
    name: p.fullName,
  }));

  // ================================================================
  // TAB 6: Secretaries
  // ================================================================
  type SecretaryItem = {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    isActive: boolean;
  };

  let secretaryItems: SecretaryItem[] = [];
  if (doctorId) {
    // Get secretary IDs from junction table
    const { data: rels } = await adminDb
      .from("secretary_doctors")
      .select("secretary_id")
      .eq("doctor_id", doctorId);

    const secIds = (rels ?? []).map((r) => r.secretary_id);

    if (secIds.length > 0) {
      const { data: secRows } = await adminDb
        .from("users")
        .select("id, full_name, email, phone, is_active")
        .in("id", secIds);

      secretaryItems = (secRows ?? []).map((s) => ({
        id: s.id,
        fullName: s.full_name?.trim() || "Sin nombre",
        email: s.email,
        phone: s.phone,
        isActive: s.is_active,
      }));
    }
  }

  // ================================================================
  // Invitations for this doctor
  // ================================================================
  type InvitationItem = {
    id: string;
    email: string;
    status: "pending" | "accepted" | "expired";
    expiresAt: string;
    createdAt: string;
  };

  let invitationItems: InvitationItem[] = [];
  if (doctorId) {
    const { data: invRows } = await adminDb
      .from("invitations")
      .select("id, invited_email, status, expires_at, created_at")
      .eq("doctor_id", doctorId)
      .order("created_at", { ascending: false });

    invitationItems = (invRows ?? []).map((i) => ({
      id: i.id,
      email: i.invited_email,
      status: i.status,
      expiresAt: i.expires_at,
      createdAt: i.created_at,
    }));
  }

  // ================================================================
  // TAB 7: Historia Clínica
  // ================================================================
  let chPatients: PatientSummary[] = [];
  const chHistoryByPatientId: Record<string, ClinicalVisit[]> = {};

  if (doctorId) {
    const { data: records } = await adminDb
      .from("clinical_records")
      .select(
        "id, patient_id, created_at, chief_complaint, anamnesis, physical_exam, diagnosis, cie10_code, treatment, notes, next_visit_date",
      )
      .eq("doctor_id", doctorId)
      .order("created_at", { ascending: false });

    const recordList = records ?? [];
    const recordIds = recordList.map((r) => r.id);

    // Resolve vitals
    const vitalsByRecordId = new Map<
      string,
      {
        id: string;
        weight: number | null;
        height: number | null;
        blood_pressure_sys: number | null;
        blood_pressure_dia: number | null;
        heart_rate: number | null;
        temperature: number | null;
        oxygen_saturation: number | null;
      }
    >();
    if (recordIds.length > 0) {
      const { data: vitals } = await adminDb
        .from("vital_signs")
        .select(
          "id, clinical_record_id, weight, height, blood_pressure_sys, blood_pressure_dia, heart_rate, temperature, oxygen_saturation",
        )
        .in("clinical_record_id", recordIds);
      for (const v of vitals ?? []) {
        vitalsByRecordId.set(v.clinical_record_id, {
          id: v.id,
          weight: v.weight,
          height: v.height,
          blood_pressure_sys: v.blood_pressure_sys,
          blood_pressure_dia: v.blood_pressure_dia,
          heart_rate: v.heart_rate,
          temperature: v.temperature,
          oxygen_saturation: v.oxygen_saturation,
        });
      }
    }

    // Group visits by patient
    const visitsByPatient = new Map<string, ClinicalVisit[]>();
    for (const r of recordList) {
      const arr = visitsByPatient.get(r.patient_id) ?? [];
      arr.push({
        id: r.id,
        createdAt: r.created_at,
        chiefComplaint: r.chief_complaint,
        anamnesis: r.anamnesis,
        physicalExam: r.physical_exam,
        diagnosis: r.diagnosis,
        cie10Code: r.cie10_code,
        treatment: r.treatment,
        notes: r.notes,
        nextVisitDate: r.next_visit_date,
        vitals: vitalsByRecordId.get(r.id) ?? null,
      });
      visitsByPatient.set(r.patient_id, arr);
    }

    for (const [pid, visits] of visitsByPatient.entries()) {
      chHistoryByPatientId[pid] = visits;
    }

    // Build patient summary list (every patient the doctor has — not only those with visits)
    chPatients = patientItems
      .map<PatientSummary>((p) => {
        const visits = visitsByPatient.get(p.id) ?? [];
        return {
          id: p.id,
          fullName: p.fullName,
          lastVisitAt: visits[0]?.createdAt ?? null,
          visitCount: visits.length,
        };
      })
      .sort((a, b) => {
        const ta = a.lastVisitAt ? new Date(a.lastVisitAt).getTime() : 0;
        const tb = b.lastVisitAt ? new Date(b.lastVisitAt).getTime() : 0;
        return tb - ta;
      });
  }

  // ================================================================
  // Metrics
  // ================================================================
  const pendingToday = kanbanCards.filter(
    (c) => c.status === "scheduled" || c.status === "confirmed",
  ).length;
  const attendedToday = kanbanCards.filter((c) => c.status === "attended").length;
  const metrics = [
    {
      label: "Citas hoy",
      value: kanbanCards.length,
      hint: `${pendingToday} pendientes`,
      icon: NavIcons.calendar,
      tone: "brand" as const,
    },
    {
      label: "Atendidas hoy",
      value: attendedToday,
      icon: NavIcons.heart,
      tone: "success" as const,
    },
    {
      label: "Pacientes totales",
      value: patientItems.length,
      icon: NavIcons.users,
      tone: "default" as const,
    },
    {
      label: "Historias clínicas",
      value: Object.values(chHistoryByPatientId).reduce((a, b) => a + b.length, 0),
      hint: "total registradas",
      icon: NavIcons.history,
      tone: "default" as const,
    },
  ];

  // ================================================================
  // Build nav
  // ================================================================
  const nav = [
    {
      id: "agenda",
      label: "Agenda de hoy",
      icon: NavIcons.calendar,
      content: <KanbanBoard appointments={kanbanCards} />,
    },
    {
      id: "pacientes",
      label: "Pacientes",
      icon: NavIcons.users,
      content: <PatientsList patients={patientItems} departments={(departmentsList ?? []).map((d) => ({ id: d.id, name: d.name }))} />,
    },
    {
      id: "historia",
      label: "Historia Clínica",
      icon: NavIcons.history,
      content: (
        <ClinicalRecordsTab
          patients={chPatients}
          historyByPatientId={chHistoryByPatientId}
        />
      ),
    },
    {
      id: "consultorios",
      label: "Consultorios",
      icon: NavIcons.office,
      content: <OfficesList offices={officeItems} />,
    },
    {
      id: "horarios",
      label: "Horarios",
      icon: NavIcons.clock,
      content: (
        <SchedulesManager
          offices={officeItems.map((o) => ({ id: o.id, name: o.name }))}
          schedules={scheduleItems}
          consultationDuration={doctorRow?.consultation_duration ?? 30}
          showDurationConfig
        />
      ),
    },
    {
      id: "receta",
      label: "Nueva receta",
      icon: NavIcons.prescription,
      content: (
        <PrescriptionTab
          patients={rxPatients}
          appointments={rxAppointments}
        />
      ),
    },
    {
      id: "secretarias",
      label: "Secretarias",
      icon: NavIcons.briefcase,
      content: <SecretariesList secretaries={secretaryItems} invitations={invitationItems} />,
    },
    {
      id: "perfil",
      label: "Mi perfil",
      icon: NavIcons.settings,
      content: <DoctorProfileForm initialSpecialties={doctorSpecialties} />,
    },
  ];

  if (!doctorId) {
    return (
      <DashboardShell
        brand="Médico SaaS"
        roleLabel="Médico"
        userName={displayName}
        userEmail={profile?.email ?? undefined}
        userSubtitle={specialty}
        nav={[
          {
            id: "missing",
            label: "Perfil pendiente",
            icon: NavIcons.settings,
            content: (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
                No hay un perfil de médico vinculado a tu cuenta.
              </div>
            ),
          },
        ]}
      />
    );
  }

  const subtitle =
    doctorSpecialties.length > 0
      ? doctorSpecialties.join(" · ")
      : specialty ?? formatTodayHeading();

  return (
    <DashboardShell
      brand="Médico SaaS"
      roleLabel="Médico"
      userName={displayName}
      userEmail={profile?.email ?? undefined}
      userSubtitle={subtitle}
      nav={nav}
      metrics={metrics}
    />
  );
}

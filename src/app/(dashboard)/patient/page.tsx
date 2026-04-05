import { redirect } from "next/navigation";
import { getCurrentUserRole, requireAuth } from "@/lib/auth/server";
import { getRolePath } from "@/lib/auth/roles";
import { createAdminReadClient } from "@/lib/supabase/admin-read";
import { LogoutButton } from "@/components/auth/logout-button";
import { DoctorTabs } from "@/components/doctor/doctor-tabs";
import { AppointmentsList } from "@/components/patient/appointments-list";
import { ProfileForm } from "@/components/patient/profile-form";
import { DoctorSearch } from "@/components/patient/doctor-search";
import type { Json } from "@/types/database";

function formatMeds(meds: Json): string {
  if (!meds) return "—";
  if (Array.isArray(meds)) {
    return meds
      .map((m) => (typeof m === "object" && m !== null ? JSON.stringify(m) : String(m)))
      .join("; ");
  }
  return String(meds);
}

export default async function PatientPage() {
  const user = await requireAuth();
  const role = await getCurrentUserRole();
  if (role !== "patient") redirect(getRolePath(role));

  const adminDb = createAdminReadClient();

  // ─── Profile ───
  const { data: userProfile } = await adminDb
    .from("users")
    .select("full_name, email, phone")
    .eq("id", user.id)
    .single();

  const displayName = userProfile?.full_name?.trim() || userProfile?.email || "Paciente";

  const { data: patientRow } = await adminDb
    .from("patients")
    .select("id, phone, birth_date, blood_type, allergies, emergency_contact, department_id, city_id, neighborhood, address")
    .eq("user_id", user.id)
    .maybeSingle();

  const patientId = patientRow?.id ?? null;

  // ================================================================
  // TAB 1: Mis citas
  // ================================================================
  type ApptItem = {
    id: string;
    doctorName: string;
    officeName: string | null;
    startsAt: string;
    notes: string | null;
    status: string;
    isFuture: boolean;
  };

  let apptItems: ApptItem[] = [];
  if (patientId) {
    const { data: appts } = await adminDb
      .from("appointments")
      .select("id, doctor_id, office_id, starts_at, scheduled_at, notes, status")
      .eq("patient_id", patientId)
      .order("starts_at", { ascending: false })
      .limit(100);

    const allAppts = appts ?? [];
    const now = new Date().toISOString();

    // Resolve doctor names
    const docIds = [...new Set(allAppts.map((a) => a.doctor_id))];
    const docNameMap = new Map<string, string>();
    if (docIds.length > 0) {
      const { data: docRows } = await adminDb.from("doctors").select("id, user_id").in("id", docIds);
      const docUserIds = (docRows ?? []).map((d) => d.user_id);
      if (docUserIds.length > 0) {
        const { data: docUsers } = await adminDb.from("users").select("id, full_name").in("id", docUserIds);
        const uidMap = new Map((docUsers ?? []).map((u) => [u.id, u.full_name?.trim() || "Médico"]));
        for (const d of docRows ?? []) docNameMap.set(d.id, uidMap.get(d.user_id) ?? "Médico");
      }
    }

    // Resolve office names
    const officeIds = [...new Set(allAppts.map((a) => a.office_id).filter(Boolean) as string[])];
    const officeNameMap = new Map<string, string>();
    if (officeIds.length > 0) {
      const { data: oRows } = await adminDb.from("offices").select("id, name").in("id", officeIds);
      for (const o of oRows ?? []) officeNameMap.set(o.id, o.name);
    }

    // Sort: future first, then past
    const future = allAppts.filter((a) => (a.starts_at ?? a.scheduled_at ?? "") >= now);
    const past = allAppts.filter((a) => (a.starts_at ?? a.scheduled_at ?? "") < now);
    future.sort((a, b) => (a.starts_at ?? "").localeCompare(b.starts_at ?? ""));
    const sorted = [...future, ...past];

    apptItems = sorted.map((a) => ({
      id: a.id,
      doctorName: docNameMap.get(a.doctor_id) ?? "Médico",
      officeName: a.office_id ? (officeNameMap.get(a.office_id) ?? null) : null,
      startsAt: a.starts_at ?? a.scheduled_at ?? "",
      notes: a.notes,
      status: a.status,
      isFuture: (a.starts_at ?? a.scheduled_at ?? "") >= now,
    }));
  }

  // ================================================================
  // TAB 2: Mis recetas
  // ================================================================
  type RxItem = {
    id: string;
    doctorName: string;
    createdAt: string;
    diagnosis: string | null;
    instructions: string;
    medications: string;
    status: string;
  };

  let rxItems: RxItem[] = [];
  if (patientId) {
    const { data: prescriptions } = await adminDb
      .from("prescriptions")
      .select("id, doctor_id, created_at, diagnosis, instructions, medications, status")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false })
      .limit(50);

    const rxDocIds = [...new Set((prescriptions ?? []).map((p) => p.doctor_id))];
    const rxDocNameMap = new Map<string, string>();
    if (rxDocIds.length > 0) {
      const { data: dRows } = await adminDb.from("doctors").select("id, user_id").in("id", rxDocIds);
      const dUserIds = (dRows ?? []).map((d) => d.user_id);
      if (dUserIds.length > 0) {
        const { data: dUsers } = await adminDb.from("users").select("id, full_name").in("id", dUserIds);
        const uidMap = new Map((dUsers ?? []).map((u) => [u.id, u.full_name?.trim() || "Médico"]));
        for (const d of dRows ?? []) rxDocNameMap.set(d.id, uidMap.get(d.user_id) ?? "Médico");
      }
    }

    rxItems = (prescriptions ?? []).map((p) => ({
      id: p.id,
      doctorName: rxDocNameMap.get(p.doctor_id) ?? "Médico",
      createdAt: p.created_at,
      diagnosis: p.diagnosis,
      instructions: p.instructions,
      medications: formatMeds(p.medications),
      status: p.status,
    }));
  }

  // ================================================================
  // TAB 3: Mis médicos
  // ================================================================
  type MyDoctor = { id: string; name: string; specialty: string | null; nextAppt: string | null };
  let myDoctors: MyDoctor[] = [];
  if (patientId) {
    const { data: links } = await adminDb
      .from("patient_doctors")
      .select("doctor_id")
      .eq("patient_id", patientId);

    const linkedDocIds = (links ?? []).map((l) => l.doctor_id);
    if (linkedDocIds.length > 0) {
      const { data: dRows } = await adminDb.from("doctors").select("id, user_id, specialty").in("id", linkedDocIds);
      const dUserIds = (dRows ?? []).map((d) => d.user_id);
      const { data: dUsers } = await adminDb.from("users").select("id, full_name").in("id", dUserIds);
      const uidMap = new Map((dUsers ?? []).map((u) => [u.id, u.full_name?.trim() || "Médico"]));

      // Get next appointment per doctor
      const now = new Date().toISOString();
      const { data: nextAppts } = await adminDb
        .from("appointments")
        .select("doctor_id, starts_at")
        .eq("patient_id", patientId)
        .in("doctor_id", linkedDocIds)
        .in("status", ["scheduled", "confirmed"])
        .gte("starts_at", now)
        .order("starts_at", { ascending: true });

      const nextApptMap = new Map<string, string>();
      for (const a of nextAppts ?? []) {
        if (!nextApptMap.has(a.doctor_id) && a.starts_at) {
          nextApptMap.set(a.doctor_id, a.starts_at);
        }
      }

      myDoctors = (dRows ?? []).map((d) => ({
        id: d.id,
        name: uidMap.get(d.user_id) ?? "Médico",
        specialty: d.specialty,
        nextAppt: nextApptMap.get(d.id) ?? null,
      }));
    }
  }

  // ================================================================
  // TAB 4: Buscar médico — data for search
  // ================================================================
  const { data: allCities } = await adminDb.from("cities").select("id, name").order("name");
  const { data: allDocs } = await adminDb.from("doctors").select("specialty").not("specialty", "is", null);
  const specialties = [...new Set((allDocs ?? []).map((d) => d.specialty).filter(Boolean) as string[])].sort();

  // ================================================================
  // TAB 5: Mi perfil
  // ================================================================
  const { data: departmentsList } = await adminDb.from("departments").select("id, name").order("name");

  const profileData = {
    fullName: userProfile?.full_name ?? "",
    email: userProfile?.email ?? "",
    phone: patientRow?.phone ?? userProfile?.phone ?? null,
    birthDate: patientRow?.birth_date ?? null,
    bloodType: patientRow?.blood_type ?? null,
    allergies: patientRow?.allergies ?? null,
    emergencyContact: patientRow?.emergency_contact ?? null,
    departmentId: patientRow?.department_id ?? null,
    cityId: patientRow?.city_id ?? null,
    neighborhood: patientRow?.neighborhood ?? null,
    address: patientRow?.address ?? null,
  };

  // ================================================================
  // Build tabs
  // ================================================================
  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat("es", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

  const RX_STATUS: Record<string, { label: string; style: string }> = {
    active: { label: "Activa", style: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
    expired: { label: "Expirada", style: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400" },
    cancelled: { label: "Cancelada", style: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
  };

  const tabs = [
    {
      id: "citas",
      label: `Mis citas (${apptItems.length})`,
      content: <AppointmentsList appointments={apptItems} />,
    },
    {
      id: "recetas",
      label: `Mis recetas (${rxItems.length})`,
      content: rxItems.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">No hay recetas.</div>
      ) : (
        <div className="space-y-3">
          {rxItems.map((rx) => (
            <div key={rx.id} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Dr. {rx.doctorName}</p>
                  <p className="text-xs text-zinc-500">{formatDate(rx.createdAt)}</p>
                  {rx.diagnosis ? <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300"><span className="font-medium">Diagnóstico:</span> {rx.diagnosis}</p> : null}
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{rx.instructions}</p>
                  <p className="mt-1 text-xs text-zinc-500"><span className="font-medium text-zinc-700 dark:text-zinc-400">Medicación:</span> {rx.medications}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${RX_STATUS[rx.status]?.style ?? ""}`}>
                  {RX_STATUS[rx.status]?.label ?? rx.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "medicos",
      label: `Mis médicos (${myDoctors.length})`,
      content: myDoctors.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
          No tenés médicos vinculados. Buscá uno en la pestaña &quot;Buscar médico&quot;.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {myDoctors.map((d) => (
            <div key={d.id} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-base font-bold text-zinc-500 dark:bg-zinc-800">{d.name.charAt(0)}</div>
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">Dr. {d.name}</p>
                  {d.specialty ? <p className="text-sm text-zinc-500">{d.specialty}</p> : null}
                </div>
              </div>
              {d.nextAppt ? (
                <p className="mt-3 text-xs text-zinc-500">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">Próxima cita:</span>{" "}
                  {formatDate(d.nextAppt)}
                </p>
              ) : (
                <p className="mt-3 text-xs text-zinc-400">Sin citas próximas</p>
              )}
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "buscar",
      label: "Buscar médico",
      content: (
        <DoctorSearch
          cities={(allCities ?? []).map((c) => ({ id: c.id, name: c.name }))}
          specialties={specialties}
          isLoggedIn={true}
          isPatient={true}
        />
      ),
    },
    {
      id: "perfil",
      label: "Mi perfil",
      content: (
        <ProfileForm
          profile={profileData}
          departments={(departmentsList ?? []).map((d) => ({ id: d.id, name: d.name }))}
        />
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-6">
          <div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Panel del paciente</p>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Hola, {displayName}
            </h1>
          </div>
          <LogoutButton />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {!patientId ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
            No hay perfil de paciente vinculado a tu cuenta.
          </div>
        ) : (
          <DoctorTabs tabs={tabs} />
        )}
      </main>
    </div>
  );
}

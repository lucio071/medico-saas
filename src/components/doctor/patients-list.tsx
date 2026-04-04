"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { createPatient, updatePatient, togglePatientActive } from "@/app/actions/patients";

interface Department {
  id: number;
  name: string;
}

interface City {
  id: number;
  name: string;
}

interface Patient {
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
}

interface PatientsListProps {
  patients: Patient[];
  departments: Department[];
}

function calcAge(birthDate: string | null): string {
  if (!birthDate) return "—";
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return `${age} años`;
}

// ───────────── Patient Form (shared for create & edit) ─────────────
function PatientForm({
  departments,
  initial,
  onSubmit,
  isPending,
  error,
  submitLabel,
}: {
  departments: Department[];
  initial?: Partial<Patient>;
  onSubmit: (fd: FormData) => void;
  isPending: boolean;
  error: string | null;
  submitLabel: string;
}) {
  const [selectedDept, setSelectedDept] = useState(
    initial?.departmentId?.toString() ?? "",
  );
  const [cities, setCities] = useState<City[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [selectedCity, setSelectedCity] = useState(
    initial?.cityId?.toString() ?? "",
  );
  const formRef = useRef<HTMLFormElement>(null);

  const fetchCities = useCallback(async (deptId: string) => {
    if (!deptId) { setCities([]); return; }
    setLoadingCities(true);
    try {
      const res = await fetch(`/api/cities?department_id=${deptId}`);
      const data: City[] = await res.json();
      setCities(data);
    } catch { setCities([]); }
    finally { setLoadingCities(false); }
  }, []);

  useEffect(() => {
    fetchCities(selectedDept);
  }, [selectedDept, fetchCities]);

  // When cities load and we have an initial city, keep it selected
  useEffect(() => {
    if (initial?.cityId && cities.some((c) => c.id === initial.cityId)) {
      setSelectedCity(initial.cityId.toString());
    }
  }, [cities, initial?.cityId]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSubmit(new FormData(e.currentTarget));
  }

  const inp =
    "h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";
  const lbl = "text-sm font-medium text-zinc-700 dark:text-zinc-300";

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      {initial?.id ? <input type="hidden" name="patientId" value={initial.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1">
          <label className={lbl}>Nombre completo *</label>
          <input name="fullName" required className={inp} defaultValue={initial?.fullName ?? ""} placeholder="Juan Pérez" />
        </div>
        {!initial?.id ? (
          <div className="space-y-1">
            <label className={lbl}>Email *</label>
            <input name="email" type="email" required className={inp} placeholder="paciente@email.com" />
          </div>
        ) : null}
        <div className="space-y-1">
          <label className={lbl}>Teléfono</label>
          <input name="phone" type="tel" className={inp} defaultValue={initial?.phone ?? ""} placeholder="+595 981 123456" />
        </div>
        <div className="space-y-1">
          <label className={lbl}>Fecha de nacimiento</label>
          <input name="birthDate" type="date" className={inp} defaultValue={initial?.birthDate ?? ""} />
        </div>
        <div className="space-y-1">
          <label className={lbl}>Tipo de sangre</label>
          <select name="bloodType" className={inp} defaultValue={initial?.bloodType ?? ""}>
            <option value="">— No indicado —</option>
            <option>A+</option><option>A-</option>
            <option>B+</option><option>B-</option>
            <option>AB+</option><option>AB-</option>
            <option>O+</option><option>O-</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className={lbl}>Alergias</label>
          <input name="allergies" className={inp} defaultValue={initial?.allergies?.join(", ") ?? ""} placeholder="Penicilina, polen" />
        </div>
        <div className="space-y-1">
          <label className={lbl}>Contacto de emergencia</label>
          <input name="emergencyContact" className={inp} defaultValue={initial?.emergencyContact ?? ""} placeholder="María López — +595 981 000000" />
        </div>
        <div className="space-y-1">
          <label className={lbl}>Departamento</label>
          <select
            name="departmentId"
            className={inp}
            value={selectedDept}
            onChange={(e) => { setSelectedDept(e.target.value); setSelectedCity(""); }}
          >
            <option value="">— Seleccionar —</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className={lbl}>Ciudad</label>
          <select
            name="cityId"
            className={inp}
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            disabled={!selectedDept || loadingCities}
          >
            <option value="">
              {loadingCities ? "Cargando..." : !selectedDept ? "Elegí departamento" : "— Seleccionar —"}
            </option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className={lbl}>Barrio</label>
          <input name="neighborhood" className={inp} defaultValue={initial?.neighborhood ?? ""} placeholder="Sajonia" />
        </div>
        <div className="space-y-1">
          <label className={lbl}>Dirección</label>
          <input name="address" className={inp} defaultValue={initial?.address ?? ""} placeholder="Av. Mariscal López 1234" />
        </div>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      ) : null}

      {!initial?.id ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Se creará con contraseña temporal <strong>12345678</strong>.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-10 items-center rounded-lg bg-zinc-900 px-5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {isPending ? "Guardando..." : submitLabel}
      </button>
    </form>
  );
}

// ───────────── Main component ─────────────
export function PatientsList({ patients, departments }: PatientsListProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [editPatient, setEditPatient] = useState<Patient | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCreate(fd: FormData) {
    setCreateError(null);
    startTransition(async () => {
      const res = await createPatient(fd);
      if (res.error) setCreateError(res.error);
      else setShowCreate(false);
    });
  }

  function handleUpdate(fd: FormData) {
    setEditError(null);
    startTransition(async () => {
      const res = await updatePatient(fd);
      if (res.error) setEditError(res.error);
      else setEditPatient(null);
    });
  }

  function handleToggle(p: Patient) {
    const action = p.isActive ? "desactivar" : "activar";
    if (!confirm(`¿Estás seguro que deseas ${action} a ${p.fullName}?`)) return;
    startTransition(async () => {
      await togglePatientActive(p.id, !p.isActive);
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Pacientes ({patients.length})
        </h3>
        <button
          type="button"
          onClick={() => { setShowCreate((v) => !v); setEditPatient(null); }}
          className="inline-flex h-9 items-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {showCreate ? "Cancelar" : "+ Nuevo paciente"}
        </button>
      </div>

      {/* Create form */}
      {showCreate ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h4 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Nuevo paciente</h4>
          <PatientForm
            departments={departments}
            onSubmit={handleCreate}
            isPending={isPending}
            error={createError}
            submitLabel="Guardar paciente"
          />
        </div>
      ) : null}

      {/* Edit modal */}
      {editPatient ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 pt-10 pb-10">
          <div className="mx-4 w-full max-w-3xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Editar paciente
              </h4>
              <button
                type="button"
                onClick={() => setEditPatient(null)}
                className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <PatientForm
              departments={departments}
              initial={editPatient}
              onSubmit={handleUpdate}
              isPending={isPending}
              error={editError}
              submitLabel="Guardar cambios"
            />
          </div>
        </div>
      ) : null}

      {/* Table */}
      {patients.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          Aún no hay pacientes registrados.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">Nombre</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">Edad</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">Teléfono</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">Sangre</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">Ubicación</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">Estado</th>
                <th className="px-4 py-3 text-right font-medium text-zinc-500 dark:text-zinc-400">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {patients.map((p) => (
                <tr key={p.id} className={!p.isActive ? "opacity-50" : ""}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">{p.fullName}</p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">{p.email}</p>
                  </td>
                  <td className="px-4 py-3 tabular-nums text-zinc-600 dark:text-zinc-400">
                    {calcAge(p.birthDate)}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{p.phone || "—"}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{p.bloodType || "—"}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {p.cityName && p.departmentName
                      ? `${p.cityName}, ${p.departmentName}`
                      : p.departmentName || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        p.isActive
                          ? "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300"
                          : "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300"
                      }`}
                    >
                      {p.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => { setEditPatient(p); setShowCreate(false); setEditError(null); }}
                        className="rounded-md px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/30"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggle(p)}
                        disabled={isPending}
                        className={`rounded-md px-2 py-1 text-xs font-medium disabled:opacity-50 ${
                          p.isActive
                            ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                            : "text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950/30"
                        }`}
                      >
                        {p.isActive ? "Desactivar" : "Activar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

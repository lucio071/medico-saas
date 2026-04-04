"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { createPatient } from "@/app/actions/patients";

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
  fullName: string;
  email: string;
  phone: string | null;
  birthDate: string | null;
  bloodType: string | null;
  allergies: string | null;
  departmentName: string | null;
  cityName: string | null;
}

interface PatientsListProps {
  patients: Patient[];
  departments: Department[];
}

export function PatientsList({ patients, departments }: PatientsListProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const [selectedDept, setSelectedDept] = useState("");
  const [cities, setCities] = useState<City[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);

  const fetchCities = useCallback(async (deptId: string) => {
    if (!deptId) {
      setCities([]);
      return;
    }
    setLoadingCities(true);
    try {
      const res = await fetch(`/api/cities?department_id=${deptId}`);
      const data: City[] = await res.json();
      setCities(data);
    } catch {
      setCities([]);
    } finally {
      setLoadingCities(false);
    }
  }, []);

  useEffect(() => {
    fetchCities(selectedDept);
  }, [selectedDept, fetchCities]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createPatient(fd);
      if (res.error) {
        setError(res.error);
      } else {
        formRef.current?.reset();
        setSelectedDept("");
        setCities([]);
        setOpen(false);
      }
    });
  }

  const inp =
    "h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";
  const lbl = "text-sm font-medium text-zinc-700 dark:text-zinc-300";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Pacientes ({patients.length})
        </h3>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-9 items-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {open ? "Cancelar" : "+ Nuevo paciente"}
        </button>
      </div>

      {open ? (
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="p-fn" className={lbl}>Nombre completo *</label>
              <input id="p-fn" name="fullName" required className={inp} placeholder="Juan Pérez" />
            </div>
            <div className="space-y-1">
              <label htmlFor="p-em" className={lbl}>Email *</label>
              <input id="p-em" name="email" type="email" required className={inp} placeholder="paciente@email.com" />
            </div>
            <div className="space-y-1">
              <label htmlFor="p-ph" className={lbl}>Teléfono</label>
              <input id="p-ph" name="phone" type="tel" className={inp} placeholder="+595 981 123456" />
            </div>
            <div className="space-y-1">
              <label htmlFor="p-bd" className={lbl}>Fecha de nacimiento</label>
              <input id="p-bd" name="birthDate" type="date" className={inp} />
            </div>
            <div className="space-y-1">
              <label htmlFor="p-bt" className={lbl}>Tipo de sangre</label>
              <select id="p-bt" name="bloodType" className={inp} defaultValue="">
                <option value="">— No indicado —</option>
                <option>A+</option><option>A-</option>
                <option>B+</option><option>B-</option>
                <option>AB+</option><option>AB-</option>
                <option>O+</option><option>O-</option>
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="p-al" className={lbl}>Alergias</label>
              <input id="p-al" name="allergies" className={inp} placeholder="Ej: Penicilina, polen" />
            </div>

            {/* Location fields */}
            <div className="space-y-1">
              <label htmlFor="p-dept" className={lbl}>Departamento</label>
              <select
                id="p-dept"
                name="departmentId"
                className={inp}
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
              >
                <option value="">— Seleccionar —</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="p-city" className={lbl}>Ciudad</label>
              <select
                id="p-city"
                name="cityId"
                className={inp}
                disabled={!selectedDept || loadingCities}
              >
                <option value="">
                  {loadingCities ? "Cargando..." : !selectedDept ? "Elegí departamento primero" : "— Seleccionar —"}
                </option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="p-nb" className={lbl}>Barrio</label>
              <input id="p-nb" name="neighborhood" className={inp} placeholder="Ej: Sajonia" />
            </div>
            <div className="space-y-1">
              <label htmlFor="p-addr" className={lbl}>Dirección</label>
              <input id="p-addr" name="address" className={inp} placeholder="Ej: Av. Mariscal López 1234" />
            </div>
          </div>

          {error ? (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </p>
          ) : null}

          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
            Se creará con contraseña temporal <strong>12345678</strong>. El paciente deberá cambiarla al iniciar sesión.
          </p>

          <button
            type="submit"
            disabled={isPending}
            className="mt-4 inline-flex h-10 items-center rounded-lg bg-zinc-900 px-5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {isPending ? "Guardando..." : "Guardar paciente"}
          </button>
        </form>
      ) : null}

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
                <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">Email</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">Teléfono</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">Sangre</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">Ubicación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {patients.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{p.fullName}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{p.email}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{p.phone || "—"}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{p.bloodType || "—"}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {p.cityName && p.departmentName
                      ? `${p.cityName}, ${p.departmentName}`
                      : p.departmentName || "—"}
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

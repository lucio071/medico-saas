"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { updatePatientProfile } from "@/app/actions/patient-actions";

interface Department {
  id: number;
  name: string;
}

interface City {
  id: number;
  name: string;
}

interface ProfileData {
  fullName: string;
  email: string;
  phone: string | null;
  birthDate: string | null;
  bloodType: string | null;
  allergies: string[] | null;
  emergencyContact: string | null;
  departmentId: number | null;
  cityId: number | null;
  neighborhood: string | null;
  address: string | null;
}

interface ProfileFormProps {
  profile: ProfileData;
  departments: Department[];
}

export function ProfileForm({ profile, departments }: ProfileFormProps) {
  const [selectedDept, setSelectedDept] = useState(profile.departmentId?.toString() ?? "");
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState(profile.cityId?.toString() ?? "");
  const [loadingCities, setLoadingCities] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const fetchCities = useCallback(async (deptId: string) => {
    if (!deptId) { setCities([]); return; }
    setLoadingCities(true);
    try {
      const res = await fetch(`/api/cities?department_id=${deptId}`);
      setCities(await res.json());
    } catch { setCities([]); }
    finally { setLoadingCities(false); }
  }, []);

  useEffect(() => { fetchCities(selectedDept); }, [selectedDept, fetchCities]);

  useEffect(() => {
    if (profile.cityId && cities.some((c) => c.id === profile.cityId)) {
      setSelectedCity(profile.cityId.toString());
    }
  }, [cities, profile.cityId]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updatePatientProfile(fd);
      if (res.error) setError(res.error);
      else setSuccess(true);
    });
  }

  const inp = "h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";
  const lbl = "text-sm font-medium text-zinc-700 dark:text-zinc-300";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">Datos personales</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1">
            <label className={lbl}>Nombre completo *</label>
            <input name="fullName" required defaultValue={profile.fullName} className={inp} />
          </div>
          <div className="space-y-1">
            <label className={lbl}>Email</label>
            <input value={profile.email} disabled className={`${inp} opacity-50`} />
          </div>
          <div className="space-y-1">
            <label className={lbl}>Teléfono</label>
            <input name="phone" type="tel" defaultValue={profile.phone ?? ""} className={inp} placeholder="+595 981 123456" />
          </div>
          <div className="space-y-1">
            <label className={lbl}>Fecha de nacimiento</label>
            <input name="birthDate" type="date" defaultValue={profile.birthDate ?? ""} className={inp} />
          </div>
          <div className="space-y-1">
            <label className={lbl}>Tipo de sangre</label>
            <select name="bloodType" defaultValue={profile.bloodType ?? ""} className={inp}>
              <option value="">— No indicado —</option>
              <option>A+</option><option>A-</option>
              <option>B+</option><option>B-</option>
              <option>AB+</option><option>AB-</option>
              <option>O+</option><option>O-</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className={lbl}>Alergias</label>
            <input name="allergies" defaultValue={profile.allergies?.join(", ") ?? ""} className={inp} placeholder="Penicilina, polen" />
          </div>
          <div className="space-y-1">
            <label className={lbl}>Contacto de emergencia</label>
            <input name="emergencyContact" defaultValue={profile.emergencyContact ?? ""} className={inp} placeholder="María — +595 981 000000" />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">Ubicación</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className={lbl}>Departamento</label>
            <select name="departmentId" value={selectedDept} onChange={(e) => { setSelectedDept(e.target.value); setSelectedCity(""); }} className={inp}>
              <option value="">— Seleccionar —</option>
              {departments.map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
            </select>
          </div>
          <div className="space-y-1">
            <label className={lbl}>Ciudad</label>
            <select name="cityId" value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} disabled={!selectedDept || loadingCities} className={inp}>
              <option value="">{loadingCities ? "Cargando..." : !selectedDept ? "Elegí departamento" : "— Seleccionar —"}</option>
              {cities.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
          </div>
          <div className="space-y-1">
            <label className={lbl}>Barrio</label>
            <input name="neighborhood" defaultValue={profile.neighborhood ?? ""} className={inp} />
          </div>
          <div className="space-y-1">
            <label className={lbl}>Dirección</label>
            <input name="address" defaultValue={profile.address ?? ""} className={inp} />
          </div>
        </div>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">{error}</p>
      ) : null}
      {success ? (
        <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-300">Perfil actualizado correctamente.</p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-10 items-center rounded-lg bg-zinc-900 px-6 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {isPending ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}

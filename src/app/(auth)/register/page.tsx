"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Dept { id: number; name: string }
interface City { id: number; name: string }

function buildSlug(name: string, email: string): string {
  const namePart = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
  const emailPart = email
    .split("@")[0]
    .slice(0, 10)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  const rand = Math.random().toString(36).slice(2, 6);
  return `${namePart}-${emailPart}-${rand}`.slice(0, 50);
}

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Department / City
  const [departments, setDepartments] = useState<Dept[]>([]);
  const [selectedDept, setSelectedDept] = useState("");
  const [cities, setCities] = useState<City[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [cityId, setCityId] = useState("");

  // Load departments on mount
  useEffect(() => {
    supabase.from("departments").select("id, name").order("name").then(({ data }) => {
      setDepartments((data ?? []) as Dept[]);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch cities when department changes
  useEffect(() => {
    if (!selectedDept) { setCities([]); setCityId(""); return; }
    setLoadingCities(true);
    setCityId("");
    fetch(`/api/cities?department_id=${selectedDept}`)
      .then((r) => r.json())
      .then((data: City[]) => setCities(data))
      .catch(() => setCities([]))
      .finally(() => setLoadingCities(false));
  }, [selectedDept]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (!selectedDept || !cityId) {
      setError("Departamento y ciudad son obligatorios.");
      return;
    }

    setIsSubmitting(true);

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (authError || !authData.user) {
      setError(authError?.message ?? "No se pudo crear la cuenta.");
      setIsSubmitting(false);
      return;
    }

    const userId = authData.user.id;

    // 2. Create tenant automatically
    const slug = buildSlug(fullName, email);
    const { data: tenantData, error: tenantError } = await supabase
      .from("tenants")
      .insert({ name: `Consultorio ${fullName}`, slug })
      .select("id")
      .single();

    if (tenantError || !tenantData) {
      setError(
        `Cuenta creada, pero falló la creación del consultorio. ${tenantError?.message ?? ""}`,
      );
      setIsSubmitting(false);
      return;
    }

    const tenantId = tenantData.id;

    // 3. Insert users record
    const { error: insertUserError } = await supabase.from("users").insert({
      id: userId,
      tenant_id: tenantId,
      email,
      full_name: fullName,
      phone,
      role: "doctor",
      is_active: true,
    });

    if (insertUserError) {
      const parts = [
        insertUserError.message,
        insertUserError.code && `code: ${insertUserError.code}`,
        insertUserError.details && `details: ${insertUserError.details}`,
        insertUserError.hint && `hint: ${insertUserError.hint}`,
      ].filter(Boolean);
      setError(
        `La cuenta se creó, pero falló el registro del perfil. ${parts.join(" · ")}`,
      );
      setIsSubmitting(false);
      return;
    }

    // 4. Insert doctors record
    const { error: insertDoctorError } = await supabase.from("doctors").insert({
      tenant_id: tenantId,
      user_id: userId,
      specialty,
      license_number: licenseNumber,
      department_id: parseInt(selectedDept),
      city_id: parseInt(cityId),
    });

    if (insertDoctorError) {
      const parts = [
        insertDoctorError.message,
        insertDoctorError.code && `code: ${insertDoctorError.code}`,
        insertDoctorError.details && `details: ${insertDoctorError.details}`,
        insertDoctorError.hint && `hint: ${insertDoctorError.hint}`,
      ].filter(Boolean);
      setError(
        `La cuenta se creó, pero falló el registro del médico. ${parts.join(" · ")}`,
      );
      setIsSubmitting(false);
      return;
    }

    if (!authData.session) {
      router.replace("/register/success");
      router.refresh();
      return;
    }

    router.replace("/doctor");
    router.refresh();
  }

  const inputClass =
    "h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-500";
  const labelClass = "text-sm font-medium text-zinc-700 dark:text-zinc-300";

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-10 dark:bg-zinc-950">
      <div className="mx-auto flex w-full max-w-md flex-col justify-center">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-8 space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Registro de médico
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Crea tu cuenta y consultorio de forma gratuita.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="fullName" className={labelClass}>
                Nombre completo
              </label>
              <input
                id="fullName"
                type="text"
                autoComplete="name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={inputClass}
                placeholder="Dra. Ana García"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className={labelClass}>
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="tu@email.com"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="phone" className={labelClass}>
                Teléfono
              </label>
              <input
                id="phone"
                type="tel"
                autoComplete="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
                placeholder="+54 11 1234 5678"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="specialty" className={labelClass}>
                Especialidad
              </label>
              <input
                id="specialty"
                type="text"
                autoComplete="organization-title"
                required
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className={inputClass}
                placeholder="Ej: Cardiología"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="licenseNumber" className={labelClass}>
                Número de matrícula
              </label>
              <input
                id="licenseNumber"
                type="text"
                autoComplete="off"
                required
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                className={inputClass}
                placeholder="Ej: 123456"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="department" className={labelClass}>
                  Departamento
                </label>
                <select
                  id="department"
                  required
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Seleccionar...</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="city" className={labelClass}>
                  Ciudad
                </label>
                <select
                  id="city"
                  required
                  value={cityId}
                  onChange={(e) => setCityId(e.target.value)}
                  disabled={!selectedDept || loadingCities}
                  className={inputClass}
                >
                  <option value="">
                    {loadingCities ? "Cargando..." : !selectedDept ? "Elegí departamento" : "Seleccionar..."}
                  </option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className={labelClass}>
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                placeholder="••••••••"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className={labelClass}>
                Confirmar contraseña
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass}
                placeholder="••••••••"
              />
            </div>

            {error ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-zinc-900 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              {isSubmitting ? "Creando cuenta..." : "Crear cuenta gratis"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
            ¿Ya tienes cuenta?{" "}
            <Link
              href="/login"
              className="font-medium text-zinc-900 underline decoration-zinc-300 underline-offset-4 hover:decoration-zinc-800 dark:text-zinc-100 dark:decoration-zinc-600"
            >
              Inicia sesión
            </Link>
          </p>
          <p className="mt-3 text-center text-sm text-zinc-600 dark:text-zinc-400">
            <Link
              href="/buscar"
              className="font-medium text-zinc-900 underline decoration-zinc-300 underline-offset-4 hover:decoration-zinc-800 dark:text-zinc-100 dark:decoration-zinc-600"
            >
              Buscar médico
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

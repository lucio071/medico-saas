import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { DoctorSearch } from "@/components/patient/doctor-search";

export default async function BuscarPage() {
  const admin = createAdminClient();

  // Load departments
  const { data: departments } = await admin
    .from("departments")
    .select("id, name")
    .order("name", { ascending: true });

  // Load unique specialties
  const { data: doctors } = await admin
    .from("doctors")
    .select("specialty")
    .not("specialty", "is", null);

  const specialties = [
    ...new Set((doctors ?? []).map((d) => d.specialty).filter(Boolean) as string[]),
  ].sort();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Buscar médico
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Encontrá un especialista y agendá tu cita.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/login"
              className="inline-flex h-9 items-center rounded-lg border border-zinc-300 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="inline-flex h-9 items-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
            >
              Registrarse
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <DoctorSearch
          departments={(departments ?? []).map((d) => ({ id: d.id, name: d.name }))}
          specialties={specialties}
          isLoggedIn={false}
          isPatient={false}
        />
      </main>
    </div>
  );
}

import { getCurrentUserRole, requireAuth } from "@/lib/auth/server";
import { getRolePath } from "@/lib/auth/roles";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function NewPrescriptionPage() {
  await requireAuth();
  const role = await getCurrentUserRole();
  if (role !== "doctor") redirect(getRolePath(role));

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
          Nueva receta
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Formulario de receta en construcción. Vuelve al panel para gestionar
          tus citas.
        </p>
        <Link
          href="/doctor"
          className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
        >
          Volver al panel
        </Link>
      </div>
    </div>
  );
}

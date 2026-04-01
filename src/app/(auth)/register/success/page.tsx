import Link from "next/link";

export default function RegisterSuccessPage() {
  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-10 dark:bg-zinc-950">
      <div className="mx-auto flex w-full max-w-md flex-col justify-center">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="space-y-3 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Registro exitoso
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Tu cuenta fue creada. Revisa tu correo para verificar tu email y
              luego inicia sesión.
            </p>
          </div>

          <div className="mt-8 space-y-3">
            <Link
              href="/login"
              className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-zinc-900 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              Ir a iniciar sesión
            </Link>
            <Link
              href="/register"
              className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-zinc-300 bg-white text-sm font-medium text-zinc-800 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              Crear otra cuenta
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

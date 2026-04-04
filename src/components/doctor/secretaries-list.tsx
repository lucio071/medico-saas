"use client";

import { useRef, useState, useTransition } from "react";
import { createSecretary } from "@/app/actions/secretaries";

interface Secretary {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  isActive: boolean;
}

interface SecretariesListProps {
  secretaries: Secretary[];
}

export function SecretariesList({ secretaries }: SecretariesListProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createSecretary(fd);
      if (res.error) setError(res.error);
      else { formRef.current?.reset(); setOpen(false); }
    });
  }

  const inp =
    "h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";
  const lbl = "text-sm font-medium text-zinc-700 dark:text-zinc-300";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Secretarias ({secretaries.length})
        </h3>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-9 items-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {open ? "Cancelar" : "+ Nueva secretaria"}
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
              <label className={lbl}>Nombre completo *</label>
              <input name="fullName" required className={inp} placeholder="María López" />
            </div>
            <div className="space-y-1">
              <label className={lbl}>Email *</label>
              <input name="email" type="email" required className={inp} placeholder="secretaria@email.com" />
            </div>
            <div className="space-y-1">
              <label className={lbl}>Teléfono</label>
              <input name="phone" type="tel" className={inp} placeholder="+595 981 123456" />
            </div>
            <div className="space-y-1">
              <label className={lbl}>Contraseña temporal *</label>
              <input name="password" type="text" required minLength={6} className={inp} defaultValue="12345678" />
            </div>
          </div>

          {error ? (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isPending}
            className="mt-4 inline-flex h-10 items-center rounded-lg bg-zinc-900 px-5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {isPending ? "Creando..." : "Crear secretaria"}
          </button>
        </form>
      ) : null}

      {secretaries.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          No hay secretarias registradas.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">Nombre</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">Email</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">Teléfono</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {secretaries.map((s) => (
                <tr key={s.id} className={!s.isActive ? "opacity-50" : ""}>
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{s.fullName}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{s.email}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{s.phone || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      s.isActive
                        ? "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300"
                        : "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300"
                    }`}>
                      {s.isActive ? "Activa" : "Inactiva"}
                    </span>
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

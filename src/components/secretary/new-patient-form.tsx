"use client";

import { useRef, useState, useTransition } from "react";
import { createPatient } from "@/app/actions/patients";

export function NewPatientForm() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);

    startTransition(async () => {
      const result = await createPatient(formData);
      if (result.error) {
        setError(result.error);
      } else {
        formRef.current?.reset();
        setOpen(false);
      }
    });
  }

  const inputClass =
    "h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-500";
  const labelClass = "text-sm font-medium text-zinc-700 dark:text-zinc-300";

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-10 items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {open ? "Cancelar" : "+ Agregar paciente"}
      </button>

      {open ? (
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="mt-4 space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Nuevo paciente
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="np-fullName" className={labelClass}>
                Nombre completo *
              </label>
              <input
                id="np-fullName"
                name="fullName"
                type="text"
                required
                className={inputClass}
                placeholder="Ana García"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="np-email" className={labelClass}>
                Email *
              </label>
              <input
                id="np-email"
                name="email"
                type="email"
                required
                className={inputClass}
                placeholder="paciente@email.com"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="np-phone" className={labelClass}>
                Teléfono
              </label>
              <input
                id="np-phone"
                name="phone"
                type="tel"
                className={inputClass}
                placeholder="+54 11 1234 5678"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="np-birthDate" className={labelClass}>
                Fecha de nacimiento
              </label>
              <input
                id="np-birthDate"
                name="birthDate"
                type="date"
                className={inputClass}
              />
            </div>
          </div>

          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-zinc-900 px-5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {isPending ? "Guardando..." : "Guardar paciente"}
          </button>
        </form>
      ) : null}
    </div>
  );
}

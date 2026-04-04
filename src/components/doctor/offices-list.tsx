"use client";

import { useRef, useState, useTransition } from "react";
import { createOffice } from "@/app/actions/offices";

interface Office {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  isActive: boolean;
}

interface OfficesListProps {
  offices: Office[];
}

export function OfficesList({ offices }: OfficesListProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createOffice(fd);
      if (res.error) {
        setError(res.error);
      } else {
        formRef.current?.reset();
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
          Consultorios ({offices.length})
        </h3>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-9 items-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {open ? "Cancelar" : "+ Nuevo consultorio"}
        </button>
      </div>

      {open ? (
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <label htmlFor="o-name" className={lbl}>Nombre *</label>
              <input id="o-name" name="name" required className={inp} placeholder="Consultorio Central" />
            </div>
            <div className="space-y-1">
              <label htmlFor="o-addr" className={lbl}>Dirección</label>
              <input id="o-addr" name="address" className={inp} placeholder="Av. Corrientes 1234, CABA" />
            </div>
            <div className="space-y-1">
              <label htmlFor="o-phone" className={lbl}>Teléfono</label>
              <input id="o-phone" name="phone" type="tel" className={inp} placeholder="+54 11 5555 1234" />
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
            {isPending ? "Guardando..." : "Guardar consultorio"}
          </button>
        </form>
      ) : null}

      {offices.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          Aún no hay consultorios. Crea uno para poder gestionar horarios.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {offices.map((o) => (
            <div
              key={o.id}
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-start justify-between">
                <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">{o.name}</h4>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    o.isActive
                      ? "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300"
                      : "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300"
                  }`}
                >
                  {o.isActive ? "Activo" : "Inactivo"}
                </span>
              </div>
              {o.address ? (
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{o.address}</p>
              ) : null}
              {o.phone ? (
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">{o.phone}</p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

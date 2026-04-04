"use client";

import { useRef, useState, useTransition } from "react";
import { addToWaitlist, cancelWaitlistItem } from "@/app/actions/booking";

interface Doctor {
  id: string;
  name: string;
  color: string;
}

interface Patient {
  id: string;
  name: string;
}

interface WaitlistItem {
  id: string;
  patientName: string;
  patientPhone: string | null;
  doctorName: string;
  doctorColor: string;
  requestedDate: string;
  notes: string | null;
}

interface WaitlistTableProps {
  items: WaitlistItem[];
  doctors: Doctor[];
  patients: Patient[];
}

export function WaitlistTable({ items, doctors, patients }: WaitlistTableProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await addToWaitlist(fd);
      if (res.error) setError(res.error);
      else { formRef.current?.reset(); setOpen(false); }
    });
  }

  function handleCancel(id: string) {
    if (!confirm("¿Cancelar esta entrada de la lista de espera?")) return;
    startTransition(async () => {
      await cancelWaitlistItem(id);
    });
  }

  const inp = "h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";
  const lbl = "text-sm font-medium text-zinc-700 dark:text-zinc-300";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Lista de espera ({items.length})
        </h3>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-9 items-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {open ? "Cancelar" : "+ Agregar a espera"}
        </button>
      </div>

      {open ? (
        <form
          ref={formRef}
          onSubmit={handleAdd}
          className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className={lbl}>Paciente *</label>
              <select name="patientId" required className={inp}>
                <option value="">Seleccionar</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className={lbl}>Médico *</label>
              <select name="doctorId" required className={inp}>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>Dr. {d.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className={lbl}>Fecha solicitada *</label>
              <input name="requestedDate" type="date" required className={inp} />
            </div>
            <div className="space-y-1">
              <label className={lbl}>Notas</label>
              <input name="notes" className={inp} placeholder="Motivo, preferencia..." />
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
            className="mt-4 inline-flex h-10 items-center rounded-lg bg-zinc-900 px-5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {isPending ? "Guardando..." : "Agregar a espera"}
          </button>
        </form>
      ) : null}

      {items.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          No hay pacientes en lista de espera.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">Paciente</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">Médico</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">Fecha</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">Teléfono</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">Notas</th>
                <th className="px-4 py-3 text-right font-medium text-zinc-500 dark:text-zinc-400">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {items.map((w) => (
                <tr key={w.id}>
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{w.patientName}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: w.doctorColor }} />
                      <span className="text-zinc-700 dark:text-zinc-300">{w.doctorName}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 tabular-nums text-zinc-600 dark:text-zinc-400">{w.requestedDate}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{w.patientPhone || "—"}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{w.notes || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleCancel(w.id)}
                      disabled={isPending}
                      className="text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50 dark:text-red-400"
                    >
                      Cancelar
                    </button>
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

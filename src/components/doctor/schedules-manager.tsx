"use client";

import { useRef, useState, useTransition } from "react";
import { upsertSchedule, deleteSchedule } from "@/app/actions/schedules";

interface Office {
  id: string;
  name: string;
}

interface Schedule {
  id: string;
  officeId: string | null;
  officeName: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface SchedulesManagerProps {
  offices: Office[];
  schedules: Schedule[];
}

const DAY_NAMES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

export function SchedulesManager({ offices, schedules }: SchedulesManagerProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const [confirmDelete, setConfirmDelete] = useState<Schedule | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await upsertSchedule(fd);
      if (res.error) {
        setError(res.error);
      } else {
        formRef.current?.reset();
        setOpen(false);
      }
    });
  }

  function handleDelete(schedule: Schedule) {
    setConfirmDelete(schedule);
  }

  function confirmDeleteAction() {
    if (!confirmDelete) return;
    const id = confirmDelete.id;
    setConfirmDelete(null);
    startTransition(async () => {
      await deleteSchedule(id);
    });
  }

  const inp =
    "h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";
  const lbl = "text-sm font-medium text-zinc-700 dark:text-zinc-300";

  // Group schedules by office
  const byOffice = new Map<string, Schedule[]>();
  for (const s of schedules) {
    const key = s.officeId ?? "sin-consultorio";
    const arr = byOffice.get(key) ?? [];
    arr.push(s);
    byOffice.set(key, arr);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Horarios semanales
        </h3>
        {offices.length > 0 ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-9 items-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {open ? "Cancelar" : "+ Agregar horario"}
          </button>
        ) : null}
      </div>

      {offices.length === 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
          Primero creá al menos un consultorio en la pestaña &quot;Consultorios&quot; para poder configurar horarios.
        </div>
      ) : null}

      {open && offices.length > 0 ? (
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <label htmlFor="s-office" className={lbl}>Consultorio *</label>
              <select id="s-office" name="officeId" required className={inp}>
                <option value="">Seleccionar</option>
                {offices.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="s-day" className={lbl}>Día *</label>
              <select id="s-day" name="dayOfWeek" required className={inp}>
                <option value="">Seleccionar</option>
                {DAY_NAMES.map((name, i) => (
                  <option key={i} value={i}>{name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="s-start" className={lbl}>Hora inicio *</label>
              <input id="s-start" name="startTime" type="time" required className={inp} />
            </div>
            <div className="space-y-1">
              <label htmlFor="s-end" className={lbl}>Hora fin *</label>
              <input id="s-end" name="endTime" type="time" required className={inp} />
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
            {isPending ? "Guardando..." : "Guardar horario"}
          </button>
        </form>
      ) : null}

      {schedules.length === 0 && offices.length > 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          No hay horarios configurados.
        </div>
      ) : null}

      {Array.from(byOffice.entries()).map(([officeKey, items]) => {
        const officeName = items[0]?.officeName || "Sin consultorio";
        const sorted = [...items].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
        return (
          <div key={officeKey}>
            <h4 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              {officeName}
            </h4>
            <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800">
                    <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">Día</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">Inicio</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">Fin</th>
                    <th className="px-4 py-3 text-right font-medium text-zinc-500 dark:text-zinc-400">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {sorted.map((s) => (
                    <tr key={s.id}>
                      <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                        {DAY_NAMES[s.dayOfWeek] ?? `Día ${s.dayOfWeek}`}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-zinc-600 dark:text-zinc-400">
                        {s.startTime}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-zinc-600 dark:text-zinc-400">
                        {s.endTime}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(s)}
                          disabled={isPending}
                          className="text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {/* Confirmation dialog */}
      {confirmDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Confirmar eliminación
            </h3>
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
              ¿Estás seguro que deseas eliminar el horario del{" "}
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {DAY_NAMES[confirmDelete.dayOfWeek] ?? `Día ${confirmDelete.dayOfWeek}`}
              </span>{" "}
              de{" "}
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {confirmDelete.startTime}
              </span>{" "}
              a{" "}
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {confirmDelete.endTime}
              </span>{" "}
              en{" "}
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {confirmDelete.officeName}
              </span>
              ? Esta acción no se puede deshacer.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="inline-flex h-10 items-center rounded-lg border border-zinc-300 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteAction}
                disabled={isPending}
                className="inline-flex h-10 items-center rounded-lg bg-red-600 px-4 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isPending ? "Eliminando..." : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

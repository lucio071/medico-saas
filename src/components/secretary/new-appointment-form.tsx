"use client";

import { useRef, useState, useTransition } from "react";
import { createAppointment } from "@/app/actions/appointments";

interface Doctor {
  id: string;
  name: string;
}

interface Patient {
  id: string;
  name: string;
}

interface NewAppointmentFormProps {
  doctors: Doctor[];
  patients: Patient[];
}

export function NewAppointmentForm({
  doctors,
  patients,
}: NewAppointmentFormProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);

    startTransition(async () => {
      const result = await createAppointment(formData);
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
        {open ? "Cancelar" : "+ Agendar cita"}
      </button>

      {open ? (
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="mt-4 space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Nueva cita
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="na-doctor" className={labelClass}>
                Médico *
              </label>
              <select
                id="na-doctor"
                name="doctorId"
                required
                className={inputClass}
              >
                <option value="">Seleccionar médico</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="na-patient" className={labelClass}>
                Paciente *
              </label>
              <select
                id="na-patient"
                name="patientId"
                required
                className={inputClass}
              >
                <option value="">Seleccionar paciente</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="na-starts" className={labelClass}>
                Fecha y hora *
              </label>
              <input
                id="na-starts"
                name="startsAt"
                type="datetime-local"
                required
                className={inputClass}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="na-duration" className={labelClass}>
                Duración (minutos)
              </label>
              <select
                id="na-duration"
                name="durationMin"
                className={inputClass}
                defaultValue="30"
              >
                <option value="15">15 min</option>
                <option value="30">30 min</option>
                <option value="45">45 min</option>
                <option value="60">60 min</option>
              </select>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label htmlFor="na-notes" className={labelClass}>
                Motivo / notas
              </label>
              <input
                id="na-notes"
                name="notes"
                type="text"
                className={inputClass}
                placeholder="Ej: Control de presión"
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
            {isPending ? "Guardando..." : "Guardar cita"}
          </button>
        </form>
      ) : null}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { createPrescription } from "@/app/actions/prescriptions";

interface Appointment {
  id: string;
  label: string;
  patientName: string;
}

interface PrescriptionFormProps {
  appointments: Appointment[];
}

export function PrescriptionForm({ appointments }: PrescriptionFormProps) {
  const [selectedAppt, setSelectedAppt] = useState("");
  const [instructions, setInstructions] = useState("");
  const [medications, setMedications] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await createPrescription(formData);
      if (result && result.error) {
        setError(result.error);
      }
    });
  }

  const inputClass =
    "h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-500";
  const labelClass = "text-sm font-medium text-zinc-700 dark:text-zinc-300";
  const textareaClass =
    "w-full min-h-28 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-500";

  const selectedApptData = appointments.find((a) => a.id === selectedAppt);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="appointmentId" className={labelClass}>
          Seleccionar cita *
        </label>
        <select
          id="appointmentId"
          name="appointmentId"
          required
          value={selectedAppt}
          onChange={(e) => setSelectedAppt(e.target.value)}
          className={inputClass}
        >
          <option value="">— Elegir cita —</option>
          {appointments.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
            </option>
          ))}
        </select>
        {selectedApptData ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Paciente: <span className="font-medium">{selectedApptData.patientName}</span>
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="instructions" className={labelClass}>
          Indicaciones *
        </label>
        <textarea
          id="instructions"
          name="instructions"
          required
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          className={textareaClass}
          placeholder="Ej: Tomar el medicamento con alimentos, descansar 48 h, evitar alcohol..."
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="medications" className={labelClass}>
          Medicamentos (uno por línea)
        </label>
        <textarea
          id="medications"
          name="medications"
          value={medications}
          onChange={(e) => setMedications(e.target.value)}
          className={textareaClass}
          placeholder={"Ibuprofeno 400 mg — 1 comprimido cada 8 h por 5 días\nOmeprazol 20 mg — 1 cápsula en ayunas"}
        />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Escribe cada medicamento en una línea separada.
        </p>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-11 items-center justify-center rounded-lg bg-zinc-900 px-6 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {isPending ? "Guardando..." : "Guardar receta"}
        </button>
        <a
          href="/doctor"
          className="inline-flex h-11 items-center justify-center rounded-lg border border-zinc-300 px-6 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}

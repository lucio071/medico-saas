"use client";

import { useState, useTransition } from "react";
import { createPrescription } from "@/app/actions/prescriptions";

interface Patient {
  id: string;
  name: string;
}

interface Appointment {
  id: string;
  label: string;
  patientId: string;
}

interface PrescriptionTabProps {
  patients: Patient[];
  appointments: Appointment[];
}

export function PrescriptionTab({ patients, appointments }: PrescriptionTabProps) {
  const [selectedPatient, setSelectedPatient] = useState("");
  const [selectedAppt, setSelectedAppt] = useState("");
  const [instructions, setInstructions] = useState("");
  const [medications, setMedications] = useState([
    { name: "", dose: "", frequency: "", duration: "" },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredAppts = selectedPatient
    ? appointments.filter((a) => a.patientId === selectedPatient)
    : appointments;

  function addMed() {
    setMedications((m) => [...m, { name: "", dose: "", frequency: "", duration: "" }]);
  }

  function removeMed(i: number) {
    setMedications((m) => m.filter((_, idx) => idx !== i));
  }

  function updateMed(i: number, field: string, value: string) {
    setMedications((m) =>
      m.map((item, idx) => (idx === i ? { ...item, [field]: value } : item)),
    );
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!selectedAppt) {
      setError("Seleccioná una cita.");
      return;
    }

    const medsJson = JSON.stringify(
      medications.filter((m) => m.name.trim()),
    );

    const fd = new FormData();
    fd.set("appointmentId", selectedAppt);
    fd.set("instructions", instructions);
    fd.set("medications", medsJson);

    startTransition(async () => {
      const res = await createPrescription(fd);
      if (res && res.error) {
        setError(res.error);
      }
    });
  }

  const inp =
    "h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";
  const lbl = "text-sm font-medium text-zinc-700 dark:text-zinc-300";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="rx-patient" className={lbl}>Paciente</label>
          <select
            id="rx-patient"
            value={selectedPatient}
            onChange={(e) => {
              setSelectedPatient(e.target.value);
              setSelectedAppt("");
            }}
            className={inp}
          >
            <option value="">— Todos —</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="rx-appt" className={lbl}>Cita *</label>
          <select
            id="rx-appt"
            value={selectedAppt}
            onChange={(e) => setSelectedAppt(e.target.value)}
            required
            className={inp}
          >
            <option value="">— Seleccionar cita —</option>
            {filteredAppts.map((a) => (
              <option key={a.id} value={a.id}>{a.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="rx-instructions" className={lbl}>Diagnóstico e instrucciones generales *</label>
        <textarea
          id="rx-instructions"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          required
          rows={3}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          placeholder="Diagnóstico: Faringitis aguda. Reposo por 48 h, hidratación abundante..."
        />
      </div>

      {/* Medications */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className={lbl}>Medicamentos</label>
          <button
            type="button"
            onClick={addMed}
            className="text-sm font-medium text-zinc-900 underline underline-offset-4 hover:text-zinc-600 dark:text-zinc-100 dark:hover:text-zinc-300"
          >
            + Agregar medicamento
          </button>
        </div>

        {medications.map((med, i) => (
          <div
            key={i}
            className="grid gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 sm:grid-cols-5 dark:border-zinc-800 dark:bg-zinc-900/50"
          >
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs text-zinc-500 dark:text-zinc-400">Nombre</label>
              <input
                value={med.name}
                onChange={(e) => updateMed(i, "name", e.target.value)}
                className={inp}
                placeholder="Ibuprofeno 400mg"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-500 dark:text-zinc-400">Dosis</label>
              <input
                value={med.dose}
                onChange={(e) => updateMed(i, "dose", e.target.value)}
                className={inp}
                placeholder="1 comp."
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-500 dark:text-zinc-400">Frecuencia</label>
              <input
                value={med.frequency}
                onChange={(e) => updateMed(i, "frequency", e.target.value)}
                className={inp}
                placeholder="Cada 8 h"
              />
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1">
                <label className="text-xs text-zinc-500 dark:text-zinc-400">Duración</label>
                <input
                  value={med.duration}
                  onChange={(e) => updateMed(i, "duration", e.target.value)}
                  className={inp}
                  placeholder="5 días"
                />
              </div>
              {medications.length > 1 ? (
                <button
                  type="button"
                  onClick={() => removeMed(i)}
                  className="mb-0.5 shrink-0 rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                  title="Eliminar"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-11 items-center rounded-lg bg-zinc-900 px-6 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {isPending ? "Guardando..." : "Guardar receta"}
      </button>
    </form>
  );
}

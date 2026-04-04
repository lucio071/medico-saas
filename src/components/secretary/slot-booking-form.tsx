"use client";

import { useState, useTransition } from "react";
import { bookSlot } from "@/app/actions/booking";

interface Doctor {
  id: string;
  name: string;
  color: string;
}

interface Slot {
  id: string;
  doctorId: string;
  officeId: string;
  startTime: string;
  endTime: string;
}

interface Patient {
  id: string;
  name: string;
}

interface SlotBookingFormProps {
  doctors: Doctor[];
  patients: Patient[];
  slotsByDoctor: Record<string, Slot[]>;
  currentDate: string;
}

export function SlotBookingForm({
  doctors,
  patients,
  slotsByDoctor,
  currentDate,
}: SlotBookingFormProps) {
  const [selectedDoctor, setSelectedDoctor] = useState(doctors[0]?.id ?? "");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const slots = selectedDoctor ? (slotsByDoctor[selectedDoctor] ?? []) : [];

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await bookSlot(fd);
      if (res.error) setError(res.error);
      else {
        setSelectedSlot("");
      }
    });
  }

  const inp = "h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";
  const lbl = "text-sm font-medium text-zinc-700 dark:text-zinc-300";

  return (
    <div className="space-y-6">
      <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
        Agendar nueva cita — {currentDate}
      </h3>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className={lbl}>Médico *</label>
            <select
              value={selectedDoctor}
              onChange={(e) => { setSelectedDoctor(e.target.value); setSelectedSlot(""); }}
              className={inp}
            >
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>Dr. {d.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className={lbl}>Horario disponible *</label>
            <select
              name="slotId"
              required
              value={selectedSlot}
              onChange={(e) => setSelectedSlot(e.target.value)}
              className={inp}
            >
              <option value="">
                {slots.length === 0 ? "Sin slots disponibles" : "— Seleccionar —"}
              </option>
              {slots.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.startTime.slice(0, 5)} — {s.endTime.slice(0, 5)}
                </option>
              ))}
            </select>
          </div>

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
            <label className={lbl}>Motivo / notas</label>
            <input name="notes" className={inp} placeholder="Control, consulta..." />
          </div>
        </div>

        {error ? (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isPending || !selectedSlot}
          className="mt-4 inline-flex h-10 items-center rounded-lg bg-zinc-900 px-5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {isPending ? "Agendando..." : "Agendar cita"}
        </button>
      </form>
    </div>
  );
}

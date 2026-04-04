"use client";

import { useState, useTransition } from "react";
import { updateAppointmentStatus } from "@/app/actions/appointments";
import { bookSlot } from "@/app/actions/booking";

// ─── Types ───
type Status = "scheduled" | "confirmed" | "attended" | "cancelled" | "no_show";

interface DoctorInfo {
  id: string;
  name: string;
  color: string;
}

interface AppointmentCell {
  id: string;
  slotId: string | null;
  patientName: string;
  status: Status;
  notes: string | null;
  startTime: string;
  endTime: string;
  doctorId: string;
}

interface SlotCell {
  id: string;
  startTime: string;
  endTime: string;
  doctorId: string;
  officeId: string;
}

interface PatientOption {
  id: string;
  name: string;
}

interface StatusCounts {
  scheduled: number;
  confirmed: number;
  attended: number;
  cancelled: number;
  no_show: number;
}

interface ScheduleGridProps {
  doctors: DoctorInfo[];
  appointments: AppointmentCell[];
  availableSlots: SlotCell[];
  patients: PatientOption[];
  currentDate: string;
}

// ─── Constants ───
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7..20
const STATUS_LABELS: Record<Status, string> = {
  scheduled: "Agendado",
  confirmed: "Confirmado",
  attended: "Atendido",
  cancelled: "Cancelado",
  no_show: "No se presentó",
};
const STATUS_NEXT: Record<Status, Status[]> = {
  scheduled: ["confirmed", "cancelled"],
  confirmed: ["attended", "no_show", "cancelled"],
  attended: [],
  cancelled: [],
  no_show: [],
};
const STATUS_COLORS: Record<Status, string> = {
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
  confirmed: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200",
  attended: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
  no_show: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
};

export function ScheduleGrid({
  doctors,
  appointments,
  availableSlots,
  patients,
  currentDate,
}: ScheduleGridProps) {
  const [selectedAppt, setSelectedAppt] = useState<AppointmentCell | null>(null);
  const [bookingSlot, setBookingSlot] = useState<SlotCell | null>(null);
  const [isPending, startTransition] = useTransition();

  // ─── Status counters ───
  const counts: StatusCounts = { scheduled: 0, confirmed: 0, attended: 0, cancelled: 0, no_show: 0 };
  for (const a of appointments) counts[a.status]++;

  // ─── Index appointments & slots by (doctorId, hour) ───
  function getHour(time: string) {
    return parseInt(time.split(":")[0], 10);
  }

  function apptKey(doctorId: string, hour: number) {
    return `${doctorId}-${hour}`;
  }

  const apptByKey = new Map<string, AppointmentCell[]>();
  for (const a of appointments) {
    const h = getHour(a.startTime);
    const k = apptKey(a.doctorId, h);
    const arr = apptByKey.get(k) ?? [];
    arr.push(a);
    apptByKey.set(k, arr);
  }

  const slotByKey = new Map<string, SlotCell[]>();
  for (const s of availableSlots) {
    const h = getHour(s.startTime);
    const k = apptKey(s.doctorId, h);
    const arr = slotByKey.get(k) ?? [];
    arr.push(s);
    slotByKey.set(k, arr);
  }

  // ─── Handlers ───
  function handleStatusChange(apptId: string, newStatus: Status) {
    setSelectedAppt(null);
    startTransition(async () => {
      await updateAppointmentStatus(apptId, newStatus);
    });
  }

  function handleBookSlot(fd: FormData) {
    setBookingSlot(null);
    startTransition(async () => {
      await bookSlot(fd);
    });
  }

  return (
    <div className="space-y-4">
      {/* Status counters */}
      <div className="flex flex-wrap gap-3">
        {(Object.keys(counts) as Status[]).map((s) => (
          <div
            key={s}
            className={`rounded-xl px-4 py-2 text-center ${STATUS_COLORS[s]}`}
          >
            <p className="text-2xl font-bold tabular-nums">{counts[s]}</p>
            <p className="text-xs font-medium">{STATUS_LABELS[s]}</p>
          </div>
        ))}
        <div className="rounded-xl bg-zinc-100 px-4 py-2 text-center dark:bg-zinc-800">
          <p className="text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
            {appointments.length}
          </p>
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total</p>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800">
              <th className="sticky left-0 z-10 w-16 bg-white px-3 py-3 text-left text-xs font-medium text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                Hora
              </th>
              {doctors.map((d) => (
                <th
                  key={d.id}
                  className="min-w-[180px] px-3 py-3 text-left text-xs font-medium"
                  style={{ color: d.color }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-3 w-3 rounded-full"
                      style={{ backgroundColor: d.color }}
                    />
                    Dr. {d.name}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HOURS.map((hour) => (
              <tr
                key={hour}
                className="border-b border-zinc-100 dark:border-zinc-800/50"
              >
                <td className="sticky left-0 z-10 bg-white px-3 py-2 text-xs font-medium tabular-nums text-zinc-400 dark:bg-zinc-900">
                  {hour.toString().padStart(2, "0")}:00
                </td>
                {doctors.map((doc) => {
                  const k = apptKey(doc.id, hour);
                  const cellAppts = apptByKey.get(k) ?? [];
                  const cellSlots = slotByKey.get(k) ?? [];

                  return (
                    <td key={doc.id} className="px-2 py-1 align-top">
                      <div className="space-y-1">
                        {cellAppts.map((a) => (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => setSelectedAppt(a)}
                            className="w-full rounded-lg px-2 py-1.5 text-left text-xs transition hover:opacity-80"
                            style={{
                              backgroundColor: `${doc.color}20`,
                              borderLeft: `3px solid ${doc.color}`,
                            }}
                          >
                            <span className="font-semibold" style={{ color: doc.color }}>
                              {a.startTime.slice(0, 5)}
                            </span>
                            <span className="ml-1 text-zinc-700 dark:text-zinc-300">
                              {a.patientName}
                            </span>
                            <span className={`ml-1 inline-block rounded px-1 py-0.5 text-[10px] font-medium ${STATUS_COLORS[a.status]}`}>
                              {STATUS_LABELS[a.status]}
                            </span>
                          </button>
                        ))}
                        {cellSlots.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setBookingSlot(s)}
                            className="flex w-full items-center gap-1 rounded-lg border border-dashed border-zinc-300 px-2 py-1 text-xs text-zinc-400 transition hover:border-zinc-400 hover:text-zinc-600 dark:border-zinc-700 dark:hover:border-zinc-500 dark:hover:text-zinc-300"
                          >
                            <span className="text-lg leading-none">+</span>
                            <span>{s.startTime.slice(0, 5)}</span>
                          </button>
                        ))}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Appointment status modal */}
      {selectedAppt ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {selectedAppt.patientName}
            </h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {selectedAppt.startTime.slice(0, 5)} — {selectedAppt.endTime.slice(0, 5)} · {currentDate}
            </p>
            {selectedAppt.notes ? (
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{selectedAppt.notes}</p>
            ) : null}

            <p className="mt-4 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Estado actual:{" "}
              <span className={`rounded px-1.5 py-0.5 ${STATUS_COLORS[selectedAppt.status]}`}>
                {STATUS_LABELS[selectedAppt.status]}
              </span>
            </p>

            {STATUS_NEXT[selectedAppt.status].length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {STATUS_NEXT[selectedAppt.status].map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(selectedAppt.id, s)}
                    disabled={isPending}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${STATUS_COLORS[s]}`}
                  >
                    {isPending ? "..." : STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-xs text-zinc-400">Estado final — no se puede cambiar.</p>
            )}

            <button
              type="button"
              onClick={() => setSelectedAppt(null)}
              className="mt-4 w-full rounded-lg border border-zinc-300 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cerrar
            </button>
          </div>
        </div>
      ) : null}

      {/* Booking modal */}
      {bookingSlot ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Agendar cita
            </h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {bookingSlot.startTime.slice(0, 5)} — {bookingSlot.endTime.slice(0, 5)} · {currentDate}
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleBookSlot(new FormData(e.currentTarget));
              }}
              className="mt-4 space-y-3"
            >
              <input type="hidden" name="slotId" value={bookingSlot.id} />
              <div>
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Paciente *
                </label>
                <select
                  name="patientId"
                  required
                  className="mt-1 h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                >
                  <option value="">Seleccionar</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Motivo
                </label>
                <input
                  name="notes"
                  className="mt-1 h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                  placeholder="Control, consulta..."
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 rounded-lg bg-zinc-900 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
                >
                  {isPending ? "Agendando..." : "Confirmar"}
                </button>
                <button
                  type="button"
                  onClick={() => setBookingSlot(null)}
                  className="flex-1 rounded-lg border border-zinc-300 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

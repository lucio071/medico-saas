"use client";

import { useTransition } from "react";
import { cancelAppointment } from "@/app/actions/patient-actions";

interface Appointment {
  id: string;
  doctorName: string;
  officeName: string | null;
  startsAt: string;
  notes: string | null;
  status: string;
  isFuture: boolean;
}

interface AppointmentsListProps {
  appointments: Appointment[];
}

const STATUS_STYLE: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
  confirmed: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200",
  attended: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
  no_show: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
};

const STATUS_LABEL: Record<string, string> = {
  scheduled: "Agendado",
  confirmed: "Confirmado",
  attended: "Atendido",
  cancelled: "Cancelado",
  no_show: "No se presentó",
};

function formatDt(iso: string) {
  return new Intl.DateTimeFormat("es", {
    weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));
}

export function AppointmentsList({ appointments }: AppointmentsListProps) {
  const [isPending, startTransition] = useTransition();

  function handleCancel(id: string) {
    if (!confirm("¿Cancelar esta cita?")) return;
    startTransition(async () => {
      await cancelAppointment(id);
    });
  }

  if (appointments.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
        No tenés citas registradas.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {appointments.map((a) => (
        <div
          key={a.id}
          className={`rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 ${a.status === "cancelled" ? "opacity-50" : ""}`}
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold capitalize text-zinc-900 dark:text-zinc-100">
                {formatDt(a.startsAt)}
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Dr. {a.doctorName}
                {a.officeName ? ` — ${a.officeName}` : ""}
              </p>
              {a.notes ? <p className="mt-1 text-xs text-zinc-500">{a.notes}</p> : null}
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[a.status] ?? ""}`}>
                {STATUS_LABEL[a.status] ?? a.status}
              </span>
              {a.isFuture && ["scheduled", "confirmed"].includes(a.status) ? (
                <button
                  onClick={() => handleCancel(a.id)}
                  disabled={isPending}
                  className="rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400"
                >
                  Cancelar
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

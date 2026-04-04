"use client";

import { useTransition } from "react";
import { updateAppointmentStatus } from "@/app/actions/appointments";

type Status = "scheduled" | "confirmed" | "attended" | "cancelled" | "no_show";

interface AppointmentCard {
  id: string;
  startsAt: string;
  patientName: string;
  officeName: string;
  notes: string | null;
  status: Status;
}

interface KanbanBoardProps {
  appointments: AppointmentCard[];
}

const COLUMNS: { status: Status; label: string; color: string }[] = [
  { status: "scheduled", label: "Agendado", color: "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800" },
  { status: "confirmed", label: "Confirmado", color: "bg-indigo-50 border-indigo-200 dark:bg-indigo-950/30 dark:border-indigo-800" },
  { status: "attended", label: "Atendido", color: "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800" },
  { status: "cancelled", label: "Cancelado", color: "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800" },
  { status: "no_show", label: "No se presentó", color: "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800" },
];

const STATUS_TRANSITIONS: Record<Status, Status[]> = {
  scheduled: ["confirmed", "cancelled"],
  confirmed: ["attended", "no_show", "cancelled"],
  attended: [],
  cancelled: [],
  no_show: [],
};

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("es", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function Card({
  appt,
  transitions,
}: {
  appt: AppointmentCard;
  transitions: Status[];
}) {
  const [isPending, startTransition] = useTransition();

  function move(newStatus: Status) {
    startTransition(async () => {
      await updateAppointmentStatus(appt.id, newStatus);
    });
  }

  const btnLabel: Record<Status, string> = {
    scheduled: "Agendar",
    confirmed: "Confirmar",
    attended: "Atendido",
    cancelled: "Cancelar",
    no_show: "No asistió",
  };

  const btnColor: Record<Status, string> = {
    scheduled: "bg-blue-600 hover:bg-blue-700 text-white",
    confirmed: "bg-indigo-600 hover:bg-indigo-700 text-white",
    attended: "bg-green-600 hover:bg-green-700 text-white",
    cancelled: "bg-red-600 hover:bg-red-700 text-white",
    no_show: "bg-amber-600 hover:bg-amber-700 text-white",
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
          {formatTime(appt.startsAt)}
        </span>
      </div>
      <p className="mt-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">
        {appt.patientName}
      </p>
      {appt.officeName ? (
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          {appt.officeName}
        </p>
      ) : null}
      {appt.notes ? (
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
          {appt.notes}
        </p>
      ) : null}
      {transitions.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {transitions.map((s) => (
            <button
              key={s}
              onClick={() => move(s)}
              disabled={isPending}
              className={`rounded-md px-2 py-1 text-xs font-medium transition disabled:opacity-50 ${btnColor[s]}`}
            >
              {isPending ? "..." : btnLabel[s]}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function KanbanBoard({ appointments }: KanbanBoardProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {COLUMNS.map((col) => {
        const cards = appointments.filter((a) => a.status === col.status);
        return (
          <div key={col.status} className={`rounded-2xl border p-3 ${col.color}`}>
            <h3 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-200">
              {col.label}{" "}
              <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
                ({cards.length})
              </span>
            </h3>
            <div className="space-y-2">
              {cards.length === 0 ? (
                <p className="py-4 text-center text-xs text-zinc-400 dark:text-zinc-500">
                  Sin citas
                </p>
              ) : (
                cards.map((a) => (
                  <Card
                    key={a.id}
                    appt={a}
                    transitions={STATUS_TRANSITIONS[a.status]}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

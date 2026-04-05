"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { bookSlot } from "@/app/actions/booking";

interface Doctor {
  id: string;
  name: string;
  color: string;
}

interface Slot {
  id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  office_id: string;
}

interface Patient {
  id: string;
  name: string;
}

interface SlotBookingFormProps {
  doctors: Doctor[];
  patients: Patient[];
}

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function formatMonthLabel(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("es", { month: "long", year: "numeric" }).format(
    new Date(y, m - 1),
  );
}

export function SlotBookingForm({ doctors, patients }: SlotBookingFormProps) {
  const [selectedDoctor, setSelectedDoctor] = useState(doctors[0]?.id ?? "");
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}`;
  });
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const fetchSlots = useCallback(async () => {
    if (!selectedDoctor || !currentMonth) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/slots?doctor_id=${selectedDoctor}&month=${currentMonth}`,
      );
      const data: Slot[] = await res.json();
      setSlots(data);
    } catch {
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDoctor, currentMonth]);

  useEffect(() => {
    fetchSlots();
    setSelectedDate(null);
    setSelectedSlot("");
  }, [fetchSlots]);

  // Group slots by date
  const slotsByDate = new Map<string, Slot[]>();
  for (const s of slots) {
    const arr = slotsByDate.get(s.slot_date) ?? [];
    arr.push(s);
    slotsByDate.set(s.slot_date, arr);
  }

  // Build calendar days
  const [yearNum, monthNum] = currentMonth.split("-").map(Number);
  const firstDay = new Date(yearNum, monthNum - 1, 1).getDay();
  const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
  const today = new Date().toISOString().slice(0, 10);

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  function navigateMonth(offset: number) {
    const d = new Date(yearNum, monthNum - 1 + offset, 1);
    setCurrentMonth(
      `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`,
    );
  }

  const slotsForSelectedDate = selectedDate
    ? (slotsByDate.get(selectedDate) ?? [])
    : [];

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await bookSlot(fd);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess("Cita agendada correctamente.");
        setSelectedSlot("");
        fetchSlots(); // reload slots
      }
    });
  }

  const doctorColor =
    doctors.find((d) => d.id === selectedDoctor)?.color ?? "#3B82F6";

  const inp =
    "h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";
  const lbl = "text-sm font-medium text-zinc-700 dark:text-zinc-300";

  return (
    <div className="space-y-6">
      {/* Doctor selector */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <label className={lbl}>Médico</label>
          <select
            value={selectedDoctor}
            onChange={(e) => {
              setSelectedDoctor(e.target.value);
              setSelectedSlot("");
              setSelectedDate(null);
            }}
            className={inp}
            style={{ minWidth: 200 }}
          >
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                Dr. {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Calendar */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {/* Month nav */}
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigateMonth(-1)}
              className="rounded-lg border border-zinc-300 p-1.5 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h4 className="text-sm font-semibold capitalize text-zinc-900 dark:text-zinc-100">
              {formatMonthLabel(currentMonth)}
            </h4>
            <button
              type="button"
              onClick={() => navigateMonth(1)}
              className="rounded-lg border border-zinc-300 p-1.5 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {loading ? (
            <div className="py-8 text-center text-sm text-zinc-400">Cargando...</div>
          ) : (
            <>
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {DAY_NAMES.map((d) => (
                  <div key={d} className="py-1">{d}</div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="mt-1 grid grid-cols-7 gap-1">
                {calendarDays.map((day, i) => {
                  if (day === null) {
                    return <div key={`empty-${i}`} />;
                  }

                  const dateStr = `${currentMonth}-${day.toString().padStart(2, "0")}`;
                  const daySlots = slotsByDate.get(dateStr) ?? [];
                  const hasSlots = daySlots.length > 0;
                  const isSelected = selectedDate === dateStr;
                  const isPast = dateStr < today;
                  const isToday = dateStr === today;

                  return (
                    <button
                      key={dateStr}
                      type="button"
                      disabled={!hasSlots || isPast}
                      onClick={() => {
                        setSelectedDate(dateStr);
                        setSelectedSlot("");
                      }}
                      className={`relative rounded-lg py-2 text-center text-sm transition ${
                        isSelected
                          ? "font-bold text-white"
                          : hasSlots && !isPast
                            ? "font-medium text-zinc-900 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800"
                            : "text-zinc-300 dark:text-zinc-700"
                      }`}
                      style={
                        isSelected ? { backgroundColor: doctorColor } : undefined
                      }
                    >
                      {day}
                      {hasSlots && !isPast ? (
                        <span
                          className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full"
                          style={{
                            backgroundColor: isSelected ? "#fff" : doctorColor,
                          }}
                        />
                      ) : null}
                      {isToday ? (
                        <span className="absolute top-0.5 right-1 h-1.5 w-1.5 rounded-full bg-red-500" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Slot selection + booking form */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {!selectedDate ? (
            <div className="flex h-full items-center justify-center py-12">
              <p className="text-sm text-zinc-400 dark:text-zinc-500">
                Seleccioná un día en el calendario para ver los horarios disponibles.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {new Intl.DateTimeFormat("es", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                }).format(new Date(selectedDate + "T12:00:00"))}{" "}
                — {slotsForSelectedDate.length} horario(s)
              </h4>

              {slotsForSelectedDate.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  No hay horarios disponibles para este día.
                </p>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Slot grid */}
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {slotsForSelectedDate.map((s) => (
                      <label
                        key={s.id}
                        className={`cursor-pointer rounded-lg border px-3 py-2 text-center text-sm font-medium transition ${
                          selectedSlot === s.id
                            ? "border-transparent text-white"
                            : "border-zinc-200 text-zinc-700 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-300"
                        }`}
                        style={
                          selectedSlot === s.id
                            ? { backgroundColor: doctorColor }
                            : undefined
                        }
                      >
                        <input
                          type="radio"
                          name="slotId"
                          value={s.id}
                          checked={selectedSlot === s.id}
                          onChange={() => setSelectedSlot(s.id)}
                          className="sr-only"
                        />
                        {s.start_time.slice(0, 5)}
                      </label>
                    ))}
                  </div>

                  <div className="space-y-1">
                    <label className={lbl}>Paciente *</label>
                    <select name="patientId" required className={inp}>
                      <option value="">Seleccionar</option>
                      {patients.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className={lbl}>Motivo</label>
                    <input
                      name="notes"
                      className={inp}
                      placeholder="Control, consulta..."
                    />
                  </div>

                  {error ? (
                    <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
                      {error}
                    </p>
                  ) : null}
                  {success ? (
                    <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-300">
                      {success}
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={isPending || !selectedSlot}
                    className="inline-flex h-10 w-full items-center justify-center rounded-lg text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: doctorColor }}
                  >
                    {isPending ? "Agendando..." : "Agendar cita"}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

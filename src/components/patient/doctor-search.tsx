"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { bookSlotAsPatient } from "@/app/actions/patient-actions";

interface Department {
  id: number;
  name: string;
}

interface City {
  id: number;
  name: string;
}

interface DoctorResult {
  id: string;
  name: string;
  specialty: string | null;
  offices: { name: string; address: string | null }[];
  nextSlots: { date: string; time: string }[];
}

interface Slot {
  id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
}

interface DoctorSearchProps {
  departments: Department[];
  specialties: string[];
  isLoggedIn: boolean;
  isPatient: boolean;
}

export function DoctorSearch({ departments, specialties, isLoggedIn, isPatient }: DoctorSearchProps) {
  const [specialty, setSpecialty] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [cities, setCities] = useState<City[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [cityId, setCityId] = useState("");
  const [results, setResults] = useState<DoctorResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Booking state
  const [bookingDoctor, setBookingDoctor] = useState<DoctorResult | null>(null);
  const [bookingMonth, setBookingMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}`;
  });
  const [doctorSlots, setDoctorSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Fetch cities when department changes
  useEffect(() => {
    if (!selectedDept) { setCities([]); setCityId(""); return; }
    setLoadingCities(true);
    setCityId("");
    fetch(`/api/cities?department_id=${selectedDept}`)
      .then((r) => r.json())
      .then((data: City[]) => setCities(data))
      .catch(() => setCities([]))
      .finally(() => setLoadingCities(false));
  }, [selectedDept]);

  // Load all doctors on mount
  useEffect(() => { handleSearch(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  async function handleSearch() {
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams();
      if (specialty) params.set("specialty", specialty);
      if (selectedDept) params.set("department_id", selectedDept);
      if (cityId) params.set("city_id", cityId);
      const res = await fetch(`/api/doctors/search?${params}`);
      if (!res.ok) { setResults([]); return; }
      const data: DoctorResult[] = await res.json();
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  const fetchSlots = useCallback(async () => {
    if (!bookingDoctor) return;
    setLoadingSlots(true);
    try {
      const res = await fetch(`/api/slots?doctor_id=${bookingDoctor.id}&month=${bookingMonth}`);
      const data: Slot[] = await res.json();
      setDoctorSlots(data);
    } catch {
      setDoctorSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [bookingDoctor, bookingMonth]);

  useEffect(() => {
    if (bookingDoctor) fetchSlots();
  }, [bookingDoctor, fetchSlots]);

  function handleBook() {
    if (!bookingDoctor || !selectedSlot) return;
    if (!isLoggedIn) {
      window.location.href = "/register";
      return;
    }
    setBookingError(null);
    startTransition(async () => {
      const res = await bookSlotAsPatient(selectedSlot, bookingDoctor.id, bookingNotes);
      if (res.error) setBookingError(res.error);
      else {
        setBookingSuccess(true);
        setSelectedSlot("");
        fetchSlots();
      }
    });
  }

  // Group slots by date
  const slotsByDate = new Map<string, Slot[]>();
  for (const s of doctorSlots) {
    const arr = slotsByDate.get(s.slot_date) ?? [];
    arr.push(s);
    slotsByDate.set(s.slot_date, arr);
  }

  const inp = "h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";

  function formatSlotDate(d: string) {
    return new Intl.DateTimeFormat("es", { weekday: "short", day: "numeric", month: "short" }).format(new Date(d + "T12:00:00"));
  }

  return (
    <div className="space-y-6">
      {/* Search form */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Especialidad</label>
            <select value={specialty} onChange={(e) => setSpecialty(e.target.value)} className={inp}>
              <option value="">Todas</option>
              {specialties.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Departamento</label>
            <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} className={inp}>
              <option value="">Todos</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Ciudad</label>
            <select
              value={cityId}
              onChange={(e) => setCityId(e.target.value)}
              disabled={!selectedDept || loadingCities}
              className={inp}
            >
              <option value="">
                {loadingCities ? "Cargando..." : !selectedDept ? "Elegí departamento" : "Todas"}
              </option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleSearch}
              disabled={loading}
              className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-zinc-900 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {loading ? "Buscando..." : "Buscar médicos"}
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {searched && !loading && results.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
          No se encontraron médicos con esos criterios.
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((doc) => (
          <div key={doc.id} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-lg font-bold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                {doc.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Dr. {doc.name}</h3>
                {doc.specialty ? (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{doc.specialty}</p>
                ) : null}
              </div>
            </div>

            {doc.offices.length > 0 ? (
              <div className="mt-3 space-y-1">
                {doc.offices.map((o, i) => (
                  <p key={i} className="text-xs text-zinc-500 dark:text-zinc-400">
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">{o.name}</span>
                    {o.address ? ` — ${o.address}` : ""}
                  </p>
                ))}
              </div>
            ) : null}

            {doc.nextSlots.length > 0 ? (
              <div className="mt-3">
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Próximos horarios:</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {doc.nextSlots.map((s, i) => (
                    <span key={i} className="rounded-md bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950/40 dark:text-green-300">
                      {s.date.slice(5)} {s.time}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="mt-3 text-xs text-zinc-400">Sin horarios disponibles esta semana</p>
            )}

            <button
              onClick={() => {
                if (!isLoggedIn) { window.location.href = "/register"; return; }
                if (!isPatient) return;
                setBookingDoctor(doc);
                setSelectedSlot("");
                setBookingSuccess(false);
                setBookingError(null);
              }}
              className="mt-4 inline-flex h-9 w-full items-center justify-center rounded-lg bg-zinc-900 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {!isLoggedIn ? "Registrarse para agendar" : "Agendar cita"}
            </button>
          </div>
        ))}
      </div>

      {/* Booking modal */}
      {bookingDoctor ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 pt-10 pb-10">
          <div className="mx-4 w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Agendar con Dr. {bookingDoctor.name}
                </h3>
                {bookingDoctor.specialty ? (
                  <p className="text-sm text-zinc-500">{bookingDoctor.specialty}</p>
                ) : null}
              </div>
              <button
                onClick={() => setBookingDoctor(null)}
                className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Month nav */}
            <div className="mb-3 flex items-center justify-between">
              <button
                onClick={() => {
                  const [y, m] = bookingMonth.split("-").map(Number);
                  const d = new Date(y, m - 2, 1);
                  setBookingMonth(`${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`);
                }}
                className="rounded-lg border border-zinc-300 p-1.5 text-zinc-600 dark:border-zinc-700"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-sm font-semibold capitalize text-zinc-900 dark:text-zinc-100">
                {new Intl.DateTimeFormat("es", { month: "long", year: "numeric" }).format(
                  new Date(parseInt(bookingMonth.split("-")[0]), parseInt(bookingMonth.split("-")[1]) - 1),
                )}
              </span>
              <button
                onClick={() => {
                  const [y, m] = bookingMonth.split("-").map(Number);
                  const d = new Date(y, m, 1);
                  setBookingMonth(`${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`);
                }}
                className="rounded-lg border border-zinc-300 p-1.5 text-zinc-600 dark:border-zinc-700"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {loadingSlots ? (
              <p className="py-6 text-center text-sm text-zinc-400">Cargando horarios...</p>
            ) : doctorSlots.length === 0 ? (
              <p className="py-6 text-center text-sm text-zinc-400">Sin horarios disponibles este mes.</p>
            ) : (
              <div className="max-h-64 space-y-3 overflow-y-auto">
                {Array.from(slotsByDate.entries()).map(([date, dateSlots]) => (
                  <div key={date}>
                    <p className="mb-1 text-xs font-semibold capitalize text-zinc-600 dark:text-zinc-400">
                      {formatSlotDate(date)}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {dateSlots.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSelectedSlot(s.id)}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                            selectedSlot === s.id
                              ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                              : "border-zinc-200 text-zinc-700 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-300"
                          }`}
                        >
                          {s.start_time.slice(0, 5)}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedSlot ? (
              <div className="mt-4 space-y-3">
                <input
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  placeholder="Motivo de la consulta (opcional)"
                  className={inp}
                />
                <button
                  onClick={handleBook}
                  disabled={isPending}
                  className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-zinc-900 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
                >
                  {isPending ? "Agendando..." : "Confirmar cita"}
                </button>
              </div>
            ) : null}

            {bookingError ? (
              <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
                {bookingError}
              </p>
            ) : null}
            {bookingSuccess ? (
              <p className="mt-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-300">
                Cita agendada correctamente.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

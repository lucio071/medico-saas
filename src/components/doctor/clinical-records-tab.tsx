"use client";

import { useMemo, useState, useTransition } from "react";
import {
  createClinicalRecord,
  type ClinicalRecordInput,
} from "@/app/actions/clinical-records";

export interface PatientSummary {
  id: string;
  fullName: string;
  lastVisitAt: string | null;
  visitCount: number;
}

export interface VitalSigns {
  id: string;
  weight: number | null;
  height: number | null;
  blood_pressure_sys: number | null;
  blood_pressure_dia: number | null;
  heart_rate: number | null;
  temperature: number | null;
  oxygen_saturation: number | null;
}

export interface ClinicalVisit {
  id: string;
  createdAt: string;
  chiefComplaint: string | null;
  anamnesis: string | null;
  physicalExam: string | null;
  diagnosis: string | null;
  cie10Code: string | null;
  treatment: string | null;
  notes: string | null;
  nextVisitDate: string | null;
  vitals: VitalSigns | null;
}

export interface PatientHistoryData {
  patient: PatientSummary;
  visits: ClinicalVisit[];
}

interface ClinicalRecordsTabProps {
  patients: PatientSummary[];
  historyByPatientId: Record<string, ClinicalVisit[]>;
}

type Mode = { kind: "list" } | { kind: "history"; patientId: string } | { kind: "new"; patientId: string };

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function formatShortDate(iso: string | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export function ClinicalRecordsTab({
  patients,
  historyByPatientId,
}: ClinicalRecordsTabProps) {
  const [mode, setMode] = useState<Mode>({ kind: "list" });
  const [search, setSearch] = useState("");
  const [localHistory, setLocalHistory] = useState(historyByPatientId);

  const filteredPatients = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter((p) => p.fullName.toLowerCase().includes(q));
  }, [patients, search]);

  const currentPatient =
    mode.kind !== "list"
      ? patients.find((p) => p.id === mode.patientId) ?? null
      : null;

  if (mode.kind === "new" && currentPatient) {
    return (
      <NewVisitForm
        patient={currentPatient}
        onCancel={() => setMode({ kind: "history", patientId: currentPatient.id })}
        onSuccess={(visit) => {
          setLocalHistory((prev) => ({
            ...prev,
            [currentPatient.id]: [visit, ...(prev[currentPatient.id] ?? [])],
          }));
          setMode({ kind: "history", patientId: currentPatient.id });
        }}
      />
    );
  }

  if (mode.kind === "history" && currentPatient) {
    const visits = localHistory[currentPatient.id] ?? [];
    return (
      <PatientHistoryView
        patient={currentPatient}
        visits={visits}
        onBack={() => setMode({ kind: "list" })}
        onNewVisit={() => setMode({ kind: "new", patientId: currentPatient.id })}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar paciente..."
          className="h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
        />
      </div>

      {filteredPatients.length === 0 ? (
        <p className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
          No hay pacientes para mostrar.
        </p>
      ) : (
        <div className="divide-y divide-zinc-200 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {filteredPatients.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setMode({ kind: "history", patientId: p.id })}
              className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-bold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                  {p.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    {p.fullName}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {p.visitCount} {p.visitCount === 1 ? "visita" : "visitas"} · última:{" "}
                    {p.lastVisitAt ? formatShortDate(p.lastVisitAt) : "sin visitas"}
                  </p>
                </div>
              </div>
              <svg className="h-5 w-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PatientHistoryView({
  patient,
  visits,
  onBack,
  onNewVisit,
}: {
  patient: PatientSummary;
  visits: ClinicalVisit[];
  onBack: () => void;
  onNewVisit: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver
        </button>
        <button
          type="button"
          onClick={onNewVisit}
          className="inline-flex h-9 items-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
        >
          Nueva consulta
        </button>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {patient.fullName}
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Historia clínica · {visits.length} {visits.length === 1 ? "visita registrada" : "visitas registradas"}
        </p>
      </div>

      {visits.length === 0 ? (
        <p className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
          Sin visitas registradas. Hacé clic en "Nueva consulta" para empezar.
        </p>
      ) : (
        <div className="space-y-4">
          {visits.map((v) => (
            <VisitCard key={v.id} visit={v} />
          ))}
        </div>
      )}
    </div>
  );
}

function VisitCard({ visit }: { visit: ClinicalVisit }) {
  const v = visit.vitals;
  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <header className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {formatDate(visit.createdAt)}
        </p>
        {visit.cie10Code ? (
          <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
            CIE-10: {visit.cie10Code}
          </span>
        ) : null}
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {visit.chiefComplaint ? (
          <Field label="Motivo de consulta" value={visit.chiefComplaint} />
        ) : null}
        {visit.diagnosis ? <Field label="Diagnóstico" value={visit.diagnosis} /> : null}
        {visit.anamnesis ? <Field label="Anamnesis" value={visit.anamnesis} full /> : null}
        {visit.physicalExam ? (
          <Field label="Examen físico" value={visit.physicalExam} full />
        ) : null}
        {visit.treatment ? <Field label="Tratamiento" value={visit.treatment} full /> : null}
        {visit.notes ? <Field label="Notas" value={visit.notes} full /> : null}
        {visit.nextVisitDate ? (
          <Field label="Próxima visita" value={formatShortDate(visit.nextVisitDate)} />
        ) : null}
      </div>

      {v &&
      (v.weight != null ||
        v.height != null ||
        v.blood_pressure_sys != null ||
        v.heart_rate != null ||
        v.temperature != null ||
        v.oxygen_saturation != null) ? (
        <div className="mt-4 border-t border-zinc-200 pt-3 dark:border-zinc-800">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Signos vitales
          </p>
          <div className="flex flex-wrap gap-2">
            {v.weight != null ? <Vital label="Peso" value={`${v.weight} kg`} /> : null}
            {v.height != null ? <Vital label="Talla" value={`${v.height} cm`} /> : null}
            {v.blood_pressure_sys != null && v.blood_pressure_dia != null ? (
              <Vital
                label="P. arterial"
                value={`${v.blood_pressure_sys}/${v.blood_pressure_dia} mmHg`}
              />
            ) : null}
            {v.heart_rate != null ? (
              <Vital label="F. cardíaca" value={`${v.heart_rate} lpm`} />
            ) : null}
            {v.temperature != null ? (
              <Vital label="Temp." value={`${v.temperature} °C`} />
            ) : null}
            {v.oxygen_saturation != null ? (
              <Vital label="Sat. O₂" value={`${v.oxygen_saturation}%`} />
            ) : null}
          </div>
        </div>
      ) : null}
    </article>
  );
}

function Field({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p className="mt-0.5 whitespace-pre-wrap text-sm text-zinc-800 dark:text-zinc-200">
        {value}
      </p>
    </div>
  );
}

function Vital({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs dark:border-zinc-800 dark:bg-zinc-950">
      <span className="font-semibold text-zinc-500 dark:text-zinc-400">{label}:</span>{" "}
      <span className="text-zinc-900 dark:text-zinc-100">{value}</span>
    </div>
  );
}

function NewVisitForm({
  patient,
  onCancel,
  onSuccess,
}: {
  patient: PatientSummary;
  onCancel: () => void;
  onSuccess: (visit: ClinicalVisit) => void;
}) {
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [anamnesis, setAnamnesis] = useState("");
  const [physicalExam, setPhysicalExam] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [cie10, setCie10] = useState("");
  const [treatment, setTreatment] = useState("");
  const [notes, setNotes] = useState("");
  const [nextVisit, setNextVisit] = useState("");

  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [bpSys, setBpSys] = useState("");
  const [bpDia, setBpDia] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [temperature, setTemperature] = useState("");
  const [oxygenSat, setOxygenSat] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function parseNum(v: string): number | null {
    if (!v.trim()) return null;
    const n = parseFloat(v);
    return isNaN(n) ? null : n;
  }

  function parseInt10(v: string): number | null {
    if (!v.trim()) return null;
    const n = parseInt(v, 10);
    return isNaN(n) ? null : n;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const input: ClinicalRecordInput = {
      patient_id: patient.id,
      chief_complaint: chiefComplaint.trim() || null,
      anamnesis: anamnesis.trim() || null,
      physical_exam: physicalExam.trim() || null,
      diagnosis: diagnosis.trim() || null,
      cie10_code: cie10.trim() || null,
      treatment: treatment.trim() || null,
      notes: notes.trim() || null,
      next_visit_date: nextVisit || null,
      vital_signs: {
        weight: parseNum(weight),
        height: parseNum(height),
        blood_pressure_sys: parseInt10(bpSys),
        blood_pressure_dia: parseInt10(bpDia),
        heart_rate: parseInt10(heartRate),
        temperature: parseNum(temperature),
        oxygen_saturation: parseInt10(oxygenSat),
      },
    };

    startTransition(async () => {
      const res = await createClinicalRecord(input);
      if (res.error || !res.id) {
        setError(res.error ?? "Error al guardar");
        return;
      }

      const vitals: VitalSigns = {
        id: "",
        weight: input.vital_signs?.weight ?? null,
        height: input.vital_signs?.height ?? null,
        blood_pressure_sys: input.vital_signs?.blood_pressure_sys ?? null,
        blood_pressure_dia: input.vital_signs?.blood_pressure_dia ?? null,
        heart_rate: input.vital_signs?.heart_rate ?? null,
        temperature: input.vital_signs?.temperature ?? null,
        oxygen_saturation: input.vital_signs?.oxygen_saturation ?? null,
      };

      onSuccess({
        id: res.id,
        createdAt: new Date().toISOString(),
        chiefComplaint: input.chief_complaint ?? null,
        anamnesis: input.anamnesis ?? null,
        physicalExam: input.physical_exam ?? null,
        diagnosis: input.diagnosis ?? null,
        cie10Code: input.cie10_code ?? null,
        treatment: input.treatment ?? null,
        notes: input.notes ?? null,
        nextVisitDate: input.next_visit_date ?? null,
        vitals,
      });
    });
  }

  const inputCls =
    "h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";
  const textareaCls =
    "min-h-20 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";
  const labelCls = "text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Cancelar
        </button>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Nueva consulta
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Paciente: {patient.fullName}
        </p>
      </div>

      <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Datos clínicos
        </h3>

        <div className="space-y-1.5">
          <label className={labelCls}>Motivo de consulta</label>
          <input
            value={chiefComplaint}
            onChange={(e) => setChiefComplaint(e.target.value)}
            className={inputCls}
            placeholder="Ej: Dolor abdominal de 2 días"
          />
        </div>

        <div className="space-y-1.5">
          <label className={labelCls}>Anamnesis</label>
          <textarea
            value={anamnesis}
            onChange={(e) => setAnamnesis(e.target.value)}
            className={textareaCls}
            placeholder="Historia de la enfermedad actual, antecedentes..."
          />
        </div>

        <div className="space-y-1.5">
          <label className={labelCls}>Examen físico</label>
          <textarea
            value={physicalExam}
            onChange={(e) => setPhysicalExam(e.target.value)}
            className={textareaCls}
            placeholder="Hallazgos al examen físico"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5 sm:col-span-2">
            <label className={labelCls}>Diagnóstico</label>
            <input
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              className={inputCls}
              placeholder="Diagnóstico principal"
            />
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>Código CIE-10</label>
            <input
              value={cie10}
              onChange={(e) => setCie10(e.target.value)}
              className={inputCls}
              placeholder="Ej: J00"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className={labelCls}>Tratamiento</label>
          <textarea
            value={treatment}
            onChange={(e) => setTreatment(e.target.value)}
            className={textareaCls}
            placeholder="Plan terapéutico indicado"
          />
        </div>

        <div className="space-y-1.5">
          <label className={labelCls}>Notas privadas</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={textareaCls}
            placeholder="Notas que no serán visibles para el paciente"
          />
        </div>

        <div className="space-y-1.5">
          <label className={labelCls}>Próxima visita</label>
          <input
            type="date"
            value={nextVisit}
            onChange={(e) => setNextVisit(e.target.value)}
            className={inputCls}
          />
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Signos vitales <span className="font-normal text-zinc-500">(opcional)</span>
        </h3>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <label className={labelCls}>Peso (kg)</label>
            <input type="number" step="0.01" value={weight} onChange={(e) => setWeight(e.target.value)} className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>Talla (cm)</label>
            <input type="number" step="0.1" value={height} onChange={(e) => setHeight(e.target.value)} className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>Temperatura (°C)</label>
            <input type="number" step="0.1" value={temperature} onChange={(e) => setTemperature(e.target.value)} className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>P. sistólica</label>
            <input type="number" value={bpSys} onChange={(e) => setBpSys(e.target.value)} className={inputCls} placeholder="120" />
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>P. diastólica</label>
            <input type="number" value={bpDia} onChange={(e) => setBpDia(e.target.value)} className={inputCls} placeholder="80" />
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>F. cardíaca (lpm)</label>
            <input type="number" value={heartRate} onChange={(e) => setHeartRate(e.target.value)} className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>Saturación O₂ (%)</label>
            <input type="number" value={oxygenSat} onChange={(e) => setOxygenSat(e.target.value)} className={inputCls} />
          </div>
        </div>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      ) : null}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-10 items-center rounded-lg border border-zinc-300 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-10 items-center rounded-lg bg-zinc-900 px-5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {isPending ? "Guardando..." : "Guardar consulta"}
        </button>
      </div>
    </form>
  );
}

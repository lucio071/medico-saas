"use client";

import { useState, useTransition } from "react";
import { updateDoctorSpecialties } from "@/app/actions/doctor-profile";
import { SPECIALTIES, MAX_SPECIALTIES_PER_DOCTOR } from "@/lib/specialties";

interface DoctorProfileFormProps {
  initialSpecialties: string[];
}

export function DoctorProfileForm({ initialSpecialties }: DoctorProfileFormProps) {
  const [selected, setSelected] = useState<string[]>(initialSpecialties);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function toggle(s: string) {
    setSuccess(false);
    setError(null);
    setSelected((prev) => {
      if (prev.includes(s)) return prev.filter((x) => x !== s);
      if (prev.length >= MAX_SPECIALTIES_PER_DOCTOR) {
        setError(`Podés elegir hasta ${MAX_SPECIALTIES_PER_DOCTOR} especialidades`);
        return prev;
      }
      return [...prev, s];
    });
  }

  function handleSave() {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const res = await updateDoctorSpecialties(selected);
      if (res.error) setError(res.error);
      else setSuccess(true);
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Especialidades
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Elegí hasta {MAX_SPECIALTIES_PER_DOCTOR} especialidades. Seleccionadas:{" "}
          {selected.length}/{MAX_SPECIALTIES_PER_DOCTOR}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {SPECIALTIES.map((s) => {
          const isActive = selected.includes(s);
          const isDisabled =
            !isActive && selected.length >= MAX_SPECIALTIES_PER_DOCTOR;
          return (
            <button
              key={s}
              type="button"
              onClick={() => toggle(s)}
              disabled={isDisabled}
              className={`rounded-full border px-3 py-1.5 text-sm transition ${
                isActive
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                  : isDisabled
                    ? "cursor-not-allowed border-zinc-200 text-zinc-400 dark:border-zinc-800 dark:text-zinc-600"
                    : "border-zinc-300 text-zinc-700 hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-300"
              }`}
            >
              {s}
            </button>
          );
        })}
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-300">
          Especialidades actualizadas.
        </p>
      ) : null}

      <button
        type="button"
        onClick={handleSave}
        disabled={isPending || selected.length === 0}
        className="inline-flex h-10 items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {isPending ? "Guardando..." : "Guardar"}
      </button>
    </div>
  );
}

"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface Doctor {
  id: string;
  name: string;
}

interface DoctorSelectorProps {
  doctors: Doctor[];
  selectedId: string;
}

export function DoctorSelector({ doctors, selectedId }: DoctorSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(doctorId: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("doctor", doctorId);
    router.push(`/secretary?${params.toString()}`);
  }

  if (doctors.length <= 1) return null;

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
        Médico:
      </label>
      <select
        value={selectedId}
        onChange={(e) => handleChange(e.target.value)}
        className="h-9 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
      >
        {doctors.map((d) => (
          <option key={d.id} value={d.id}>
            Dr. {d.name}
          </option>
        ))}
      </select>
    </div>
  );
}

"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface DateNavProps {
  currentDate: string; // YYYY-MM-DD
}

export function DateNav({ currentDate }: DateNavProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const d = new Date(currentDate + "T12:00:00");
  const label = new Intl.DateTimeFormat("es", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);

  function navigate(offset: number) {
    const next = new Date(d);
    next.setDate(next.getDate() + offset);
    const dateStr = next.toISOString().slice(0, 10);
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", dateStr);
    router.push(`/secretary?${params.toString()}`);
  }

  function goToday() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("date");
    router.push(`/secretary?${params.toString()}`);
  }

  const isToday = currentDate === new Date().toISOString().slice(0, 10);

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="rounded-lg border border-zinc-300 p-2 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div className="text-center">
        <p className="text-sm font-semibold capitalize text-zinc-900 dark:text-zinc-100">
          {label}
        </p>
      </div>

      <button
        type="button"
        onClick={() => navigate(1)}
        className="rounded-lg border border-zinc-300 p-2 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {!isToday ? (
        <button
          type="button"
          onClick={goToday}
          className="rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Hoy
        </button>
      ) : null}
    </div>
  );
}

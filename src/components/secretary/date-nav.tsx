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

  function goToDate(dateStr: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", dateStr);
    router.push(`/secretary?${params.toString()}`);
  }

  function navigate(offset: number) {
    const next = new Date(d);
    next.setDate(next.getDate() + offset);
    goToDate(next.toISOString().slice(0, 10));
  }

  function goToday() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("date");
    router.push(`/secretary?${params.toString()}`);
  }

  const isToday = currentDate === new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="rounded-lg border border-zinc-300 p-2 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        type="button"
        onClick={() => {
          const input = document.getElementById("date-picker") as HTMLInputElement | null;
          input?.showPicker();
        }}
        className="text-sm font-semibold capitalize text-zinc-900 hover:text-zinc-600 dark:text-zinc-100 dark:hover:text-zinc-300"
      >
        {label}
      </button>

      <input
        id="date-picker"
        type="date"
        value={currentDate}
        onChange={(e) => {
          if (e.target.value) goToDate(e.target.value);
        }}
        className="sr-only"
        tabIndex={-1}
      />

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

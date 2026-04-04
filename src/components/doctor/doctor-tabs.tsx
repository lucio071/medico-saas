"use client";

import { useState, type ReactNode } from "react";

interface Tab {
  id: string;
  label: string;
  content: ReactNode;
}

interface DoctorTabsProps {
  tabs: Tab[];
}

export function DoctorTabs({ tabs }: DoctorTabsProps) {
  const [active, setActive] = useState(tabs[0]?.id ?? "");

  return (
    <div>
      <nav className="flex gap-1 overflow-x-auto border-b border-zinc-200 dark:border-zinc-800">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActive(t.id)}
            className={`shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition ${
              active === t.id
                ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>
      <div className="pt-6">
        {tabs.find((t) => t.id === active)?.content}
      </div>
    </div>
  );
}

"use client";

import type { ReactNode } from "react";

interface HeaderProps {
  title: string;
  subtitle?: string | null;
  actions?: ReactNode;
  onOpenMobile: () => void;
}

function formatToday(): string {
  return new Intl.DateTimeFormat("es", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

export function Header({ title, subtitle, actions, onOpenMobile }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Abrir menú"
          onClick={onOpenMobile}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-[#64748B] hover:bg-slate-50 lg:hidden"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div>
          <h1 className="text-lg font-semibold text-[#1E293B]">{title}</h1>
          {subtitle ? (
            <p className="text-xs text-[#64748B]">{subtitle}</p>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <p className="hidden text-sm capitalize text-[#64748B] sm:block">
          {formatToday()}
        </p>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}

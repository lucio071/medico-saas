"use client";

import { useState, type ReactNode } from "react";
import { LogoutButton } from "@/components/auth/logout-button";

export interface NavItem {
  id: string;
  label: string;
  icon: ReactNode;
  content: ReactNode;
}

export interface Metric {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
  tone?: "default" | "success" | "warning" | "danger" | "brand";
}

interface DashboardShellProps {
  brand: string;
  roleLabel: string;
  userName: string;
  userEmail?: string;
  userSubtitle?: string | null;
  nav: NavItem[];
  metrics?: Metric[];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.charAt(0) ?? "?";
  const second = parts.length > 1 ? parts[parts.length - 1]?.charAt(0) ?? "" : "";
  return (first + second).toUpperCase();
}

const toneClasses: Record<NonNullable<Metric["tone"]>, string> = {
  default: "bg-white dark:bg-slate-900",
  success: "bg-emerald-50 dark:bg-emerald-950/30",
  warning: "bg-amber-50 dark:bg-amber-950/30",
  danger: "bg-rose-50 dark:bg-rose-950/30",
  brand: "bg-blue-50 dark:bg-blue-950/30",
};

const toneIconClasses: Record<NonNullable<Metric["tone"]>, string> = {
  default: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  danger: "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300",
  brand: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
};

export function DashboardShell({
  brand,
  roleLabel,
  userName,
  userEmail,
  userSubtitle,
  nav,
  metrics,
}: DashboardShellProps) {
  const [activeId, setActiveId] = useState(nav[0]?.id ?? "");
  const [mobileOpen, setMobileOpen] = useState(false);

  const active = nav.find((n) => n.id === activeId) ?? nav[0];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-slate-200 bg-white transition-transform dark:border-slate-800 dark:bg-slate-900 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-5 dark:border-slate-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="M12 2v6M12 16v6M4 12h6M14 12h6" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
              {brand}
            </p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              {roleLabel}
            </p>
          </div>
        </div>

        <nav className="space-y-1 p-3">
          {nav.map((item) => {
            const isActive = item.id === active?.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveId(item.id);
                  setMobileOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                    : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center ${
                    isActive
                      ? "text-blue-700 dark:text-blue-300"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Abrir menú"
              onClick={() => setMobileOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {active?.label ?? ""}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {userName}
              </p>
              {userSubtitle ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">{userSubtitle}</p>
              ) : userEmail ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">{userEmail}</p>
              ) : null}
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
              {initials(userName)}
            </div>
            <LogoutButton />
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {metrics && metrics.length > 0 ? (
            <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {metrics.map((m, i) => {
                const tone = m.tone ?? "default";
                return (
                  <div
                    key={i}
                    className={`rounded-xl border border-slate-200 ${toneClasses[tone]} p-4 shadow-sm dark:border-slate-800`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          {m.label}
                        </p>
                        <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
                          {m.value}
                        </p>
                        {m.hint ? (
                          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            {m.hint}
                          </p>
                        ) : null}
                      </div>
                      {m.icon ? (
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${toneIconClasses[tone]}`}
                        >
                          {m.icon}
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}

          <div>{active?.content}</div>
        </main>
      </div>
    </div>
  );
}

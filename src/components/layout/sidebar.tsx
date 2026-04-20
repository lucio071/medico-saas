"use client";

import type { ReactNode } from "react";
import { LogoutButton } from "@/components/auth/logout-button";

export interface SidebarItem {
  id: string;
  label: string;
  icon: ReactNode;
}

interface SidebarProps {
  brand?: string;
  roleLabel: string;
  items: SidebarItem[];
  activeId: string;
  onSelect: (id: string) => void;
  userName: string;
  userSubtitle?: string | null;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.charAt(0) ?? "?";
  const second = parts.length > 1 ? parts[parts.length - 1]?.charAt(0) ?? "" : "";
  return (first + second).toUpperCase();
}

export function Sidebar({
  brand = "Médico SaaS",
  roleLabel,
  items,
  activeId,
  onSelect,
  userName,
  userSubtitle,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[240px] flex-col border-r border-slate-200 bg-white transition-transform ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex h-16 items-center gap-2.5 border-b border-slate-200 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2563EB] text-white shadow-sm">
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
            <p className="truncate text-sm font-semibold text-[#1E293B]">{brand}</p>
            <p className="truncate text-xs text-[#64748B]">{roleLabel}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {items.map((item) => {
            const isActive = item.id === activeId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelect(item.id);
                  onCloseMobile();
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-[#EFF6FF] text-[#2563EB]"
                    : "text-[#64748B] hover:bg-slate-50 hover:text-[#1E293B]"
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center ${
                    isActive ? "text-[#2563EB]" : "text-[#94A3B8]"
                  }`}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2563EB] text-xs font-semibold text-white">
              {initials(userName)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[#1E293B]">
                {userName}
              </p>
              {userSubtitle ? (
                <p className="truncate text-xs text-[#64748B]">{userSubtitle}</p>
              ) : null}
            </div>
            <LogoutButton />
          </div>
        </div>
      </aside>
    </>
  );
}

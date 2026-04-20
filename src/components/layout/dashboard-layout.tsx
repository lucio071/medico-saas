"use client";

import { useState, type ReactNode } from "react";
import { Sidebar, type SidebarItem } from "./sidebar";
import { Header } from "./header";

export interface NavEntry extends SidebarItem {
  content: ReactNode;
  subtitle?: string;
}

interface DashboardLayoutProps {
  brand?: string;
  roleLabel: string;
  userName: string;
  userSubtitle?: string | null;
  nav: NavEntry[];
  actions?: ReactNode;
}

export function DashboardLayout({
  brand,
  roleLabel,
  userName,
  userSubtitle,
  nav,
  actions,
}: DashboardLayoutProps) {
  const [activeId, setActiveId] = useState(nav[0]?.id ?? "");
  const [mobileOpen, setMobileOpen] = useState(false);

  const active = nav.find((n) => n.id === activeId) ?? nav[0];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Sidebar
        brand={brand}
        roleLabel={roleLabel}
        items={nav.map(({ id, label, icon }) => ({ id, label, icon }))}
        activeId={active?.id ?? ""}
        onSelect={setActiveId}
        userName={userName}
        userSubtitle={userSubtitle}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="lg:pl-[240px]">
        <Header
          title={active?.label ?? ""}
          subtitle={active?.subtitle ?? null}
          actions={actions}
          onOpenMobile={() => setMobileOpen(true)}
        />

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {active?.content}
        </main>
      </div>
    </div>
  );
}

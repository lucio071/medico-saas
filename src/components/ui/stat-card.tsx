import type { ReactNode } from "react";

export type StatTone = "brand" | "success" | "warning" | "danger" | "default";

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
  tone?: StatTone;
}

const ICON_TONE: Record<StatTone, string> = {
  brand: "bg-[#EFF6FF] text-[#2563EB]",
  success: "bg-[#ECFDF5] text-[#10B981]",
  warning: "bg-[#FEF3C7] text-[#F59E0B]",
  danger: "bg-[#FEE2E2] text-[#EF4444]",
  default: "bg-slate-100 text-[#64748B]",
};

export function StatCard({ label, value, hint, icon, tone = "default" }: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04),0_1px_2px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-[#64748B]">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold text-[#1E293B]">{value}</p>
          {hint ? (
            <p className="mt-1 text-xs text-[#64748B]">{hint}</p>
          ) : null}
        </div>
        {icon ? (
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${ICON_TONE[tone]}`}>
            {icon}
          </div>
        ) : null}
      </div>
    </div>
  );
}

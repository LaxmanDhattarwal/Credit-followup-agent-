"use client";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface Props {
  label: string;
  value: string | number;
  sub?: string;
  icon?: LucideIcon;
  accent?: boolean;
  warning?: boolean;
  danger?: boolean;
}

export default function StatCard({ label, value, sub, icon: Icon, accent, warning, danger }: Props) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border bg-[#111113] p-4 transition-all duration-200",
        "hover:border-zinc-600",
        accent  && "border-amber-800/50 hover:border-amber-600/60",
        warning && "border-orange-800/40 hover:border-orange-600/50",
        danger  && "border-red-800/40   hover:border-red-600/50",
        !accent && !warning && !danger && "border-zinc-800",
      )}
    >
      {accent && (
        <div className="absolute inset-0 bg-gradient-to-br from-amber-950/20 to-transparent pointer-events-none" />
      )}
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">{label}</span>
          {Icon && (
            <Icon
              size={14}
              className={cn(
                "text-zinc-600",
                accent  && "text-amber-600",
                warning && "text-orange-600",
                danger  && "text-red-600",
              )}
            />
          )}
        </div>
        <div
          className={cn(
            "text-2xl font-display font-bold tracking-tight",
            accent  ? "text-amber-400" : "text-zinc-100",
            warning && "text-orange-400",
            danger  && "text-red-400",
          )}
        >
          {value}
        </div>
        {sub && <div className="mt-1 text-xs text-zinc-600">{sub}</div>}
      </div>
    </div>
  );
}

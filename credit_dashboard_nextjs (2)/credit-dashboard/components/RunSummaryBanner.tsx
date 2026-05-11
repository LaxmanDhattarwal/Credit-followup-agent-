"use client";
import { CheckCircle2, Clock, Zap, AlertTriangle } from "lucide-react";
import { RunStats } from "@/lib/types";

export default function RunSummaryBanner({ stats }: { stats: RunStats }) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-amber-800/30 bg-gradient-to-r from-amber-950/20 via-[#111113] to-[#111113] px-5 py-3.5">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-500 to-amber-700 rounded-l-lg" />

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        {/* Run ID */}
        <div className="flex items-center gap-2">
          <CheckCircle2 size={13} className="text-amber-500" />
          <span className="font-mono text-xs text-zinc-500">Run</span>
          <span className="font-mono text-xs text-amber-400 font-semibold">{stats.runId}</span>
        </div>

        {/* Time */}
        <div className="flex items-center gap-1.5">
          <Clock size={12} className="text-zinc-600" />
          <span className="font-mono text-xs text-zinc-500">{stats.timestamp}</span>
        </div>

        {/* Duration */}
        <div className="flex items-center gap-1.5">
          <Zap size={12} className="text-zinc-600" />
          <span className="font-mono text-xs text-zinc-400">{stats.duration}s</span>
        </div>

        {/* Mode */}
        <span className="font-mono text-[10px] px-2 py-0.5 rounded border bg-amber-950/50 text-amber-300 border-amber-800/40">
          {stats.mode}
        </span>

        {/* Model */}
        <span className="font-mono text-[10px] px-2 py-0.5 rounded border bg-zinc-900 text-zinc-400 border-zinc-700">
          {stats.model}
        </span>

        {/* Stats */}
        <div className="flex items-center gap-4 ml-auto">
          {[
            { label: "Generated", value: stats.generated, color: "text-zinc-300" },
            { label: "Dry Run",   value: stats.dryRun,    color: "text-amber-400" },
            { label: "Sent",      value: stats.sent,      color: "text-green-400" },
            { label: "Failed",    value: stats.failed,    color: "text-red-400"   },
            { label: "Escalated", value: stats.escalated, color: "text-purple-400"},
          ].map(({ label, value, color }) => (
            <div key={label} className="text-center">
              <div className={`font-mono text-base font-bold ${color}`}>{value}</div>
              <div className="font-mono text-[9px] text-zinc-600 uppercase tracking-wider">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

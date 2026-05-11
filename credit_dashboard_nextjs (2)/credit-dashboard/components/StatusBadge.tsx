"use client";

type Status = "DRY_RUN" | "SENT" | "FAILED" | "ESCALATED";

const config: Record<Status, { label: string; cls: string }> = {
  DRY_RUN:   { label: "DRY RUN",   cls: "bg-amber-950/50 text-amber-300 border-amber-800/40" },
  SENT:      { label: "SENT",      cls: "bg-green-950/50 text-green-400 border-green-800/40" },
  FAILED:    { label: "FAILED",    cls: "bg-red-950/50   text-red-400   border-red-800/40"   },
  ESCALATED: { label: "ESCALATED", cls: "bg-purple-950/50 text-purple-300 border-purple-800/40" },
};

export default function StatusBadge({ status }: { status: Status }) {
  const c = config[status];
  return (
    <span className={`inline-block font-mono text-[10px] px-1.5 py-0.5 rounded border ${c.cls}`}>
      {c.label}
    </span>
  );
}

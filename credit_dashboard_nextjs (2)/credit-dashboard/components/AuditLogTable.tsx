"use client";
import { fmtINR } from "@/lib/data";
import StageBadge from "./StageBadge";
import StatusBadge from "./StatusBadge";
import { StageNumber } from "@/lib/types";

// Accepts both static mock shape and live API shape
interface AuditRow {
  id:                number;
  timestamp?:        string;
  timestamp_utc?:    string;
  invoiceNo?:        string;
  invoice_no?:       string;
  clientName?:       string;
  client_name?:      string;
  company?:          string;
  amount:            number;
  daysOverdue?:      number;
  days_overdue?:     number;
  stage?:            StageNumber;
  stage_number?:     number;
  tone?:             string;
  tone_used?:        string;
  subject?:          string | null;
  recipientMasked?:  string;
  recipient_masked?: string;
  status?:           string;
  send_status?:      string;
  model?:            string | null;
  model_used?:       string | null;
}

function g(row: AuditRow) {
  return {
    ts:       row.timestamp     ?? row.timestamp_utc   ?? "—",
    inv:      row.invoiceNo     ?? row.invoice_no       ?? "—",
    client:   row.clientName    ?? row.client_name      ?? "—",
    days:     row.daysOverdue   ?? row.days_overdue     ?? 0,
    stage:    (row.stage        ?? row.stage_number     ?? 1) as StageNumber,
    tone:     row.tone          ?? row.tone_used        ?? "—",
    recipient:row.recipientMasked ?? row.recipient_masked ?? "—",
    status:   (row.status       ?? row.send_status      ?? "DRY_RUN") as "DRY_RUN"|"SENT"|"FAILED"|"ESCALATED",
    model:    row.model         ?? row.model_used       ?? null,
  };
}

export default function AuditLogTable({ entries }: { entries: AuditRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-zinc-800">
            {["#","Timestamp","Invoice","Client","Amount","Days","Stage","Tone","Status","Model"].map(h => (
              <th key={h} className="px-3 py-2.5 text-left font-mono text-[10px] uppercase tracking-widest text-zinc-600">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {entries.map((e, i) => {
            const r = g(e);
            return (
              <tr key={e.id} className="border-b border-zinc-800/40 hover:bg-zinc-800/20 transition-colors animate-fade-in"
                style={{ animationDelay: `${i * 20}ms` }}>
                <td className="px-3 py-2.5 font-mono text-xs text-zinc-700">{e.id}</td>
                <td className="px-3 py-2.5 font-mono text-[11px] text-zinc-500 whitespace-nowrap">{r.ts}</td>
                <td className="px-3 py-2.5 font-mono text-xs text-amber-400/90">{r.inv}</td>
                <td className="px-3 py-2.5">
                  <div className="text-sm text-zinc-200">{r.client}</div>
                  <div className="text-[10px] text-zinc-600">{r.recipient}</div>
                </td>
                <td className="px-3 py-2.5 font-mono text-sm font-semibold text-zinc-100">{fmtINR(e.amount)}</td>
                <td className="px-3 py-2.5">
                  <span className={`font-mono text-sm font-bold ${r.days >= 30 ? "text-red-400" : r.days >= 15 ? "text-orange-400" : "text-zinc-300"}`}>
                    {r.days}d
                  </span>
                </td>
                <td className="px-3 py-2.5"><StageBadge stage={r.stage} /></td>
                <td className="px-3 py-2.5 text-xs text-zinc-500 whitespace-nowrap">{r.tone}</td>
                <td className="px-3 py-2.5"><StatusBadge status={r.status} /></td>
                <td className="px-3 py-2.5 font-mono text-[10px] text-zinc-600 whitespace-nowrap">{r.model ?? "—"}</td>
              </tr>
            );
          })}
          {entries.length === 0 && (
            <tr><td colSpan={10} className="text-center py-10 text-zinc-600 font-mono text-sm">No audit entries yet — run the agent first</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

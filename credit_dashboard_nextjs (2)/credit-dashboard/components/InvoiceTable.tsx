"use client";
import { useState } from "react";
import { ChevronUp, ChevronDown, Mail, AlertTriangle } from "lucide-react";
import { Invoice, STAGES, StageNumber } from "@/lib/types";
import { GeneratedEmail } from "@/lib/types";
import { fmtINR } from "@/lib/data";
import StageBadge from "./StageBadge";
import EmailModal from "./EmailModal";

type SortKey = "id" | "client" | "amount" | "daysOverdue" | "stage";
type SortDir = "asc" | "desc";

interface Props {
  invoices: Invoice[];
  emails: Record<string, GeneratedEmail>;
  filterStage: StageNumber | null;
}

export default function InvoiceTable({ invoices, emails, filterStage }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("daysOverdue");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [modalInv, setModalInv] = useState<Invoice | null>(null);

  const filtered = filterStage !== null
    ? invoices.filter(i => i.stage === filterStage)
    : invoices;

  const sorted = [...filtered].sort((a, b) => {
    let av = a[sortKey], bv = b[sortKey];
    if (typeof av === "string") av = av.toLowerCase();
    if (typeof bv === "string") bv = bv.toLowerCase();
    return sortDir === "asc" ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
  });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const Th = ({ label, k }: { label: string; k: SortKey }) => (
    <th
      className="px-3 py-2.5 text-left cursor-pointer select-none group"
      onClick={() => toggleSort(k)}
    >
      <div className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-zinc-600 group-hover:text-zinc-400 transition-colors">
        {label}
        {sortKey === k
          ? sortDir === "asc"
            ? <ChevronUp size={10} className="text-amber-500" />
            : <ChevronDown size={10} className="text-amber-500" />
          : <ChevronDown size={10} className="opacity-0 group-hover:opacity-40" />}
      </div>
    </th>
  );

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-zinc-800">
              <Th label="Invoice"     k="id" />
              <Th label="Client"      k="client" />
              <Th label="Amount"      k="amount" />
              <Th label="Days OD"     k="daysOverdue" />
              <Th label="Stage"       k="stage" />
              <th className="px-3 py-2.5 font-mono text-[10px] uppercase tracking-widest text-zinc-600 text-left">
                Email
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((inv, i) => {
              const hasEmail = !!emails[inv.id];
              const isEscalated = inv.stage === 5;
              return (
                <tr
                  key={inv.id}
                  className={`border-b border-zinc-800/50 transition-colors ${
                    isEscalated ? "hover:bg-purple-950/10" : "hover:bg-zinc-800/30"
                  } animate-fade-in`}
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  {/* Invoice ID */}
                  <td className="px-3 py-3">
                    <span className="font-mono text-xs text-amber-400/90">{inv.id}</span>
                  </td>

                  {/* Client */}
                  <td className="px-3 py-3">
                    <div className="font-medium text-sm text-zinc-200">{inv.client}</div>
                    <div className="text-xs text-zinc-600 mt-0.5 truncate max-w-[160px]">{inv.company}</div>
                  </td>

                  {/* Amount */}
                  <td className="px-3 py-3">
                    <span className="font-mono text-sm font-semibold text-zinc-100">
                      {fmtINR(inv.amount)}
                    </span>
                  </td>

                  {/* Days overdue */}
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`font-mono text-sm font-bold ${
                          inv.daysOverdue >= 30 ? "text-red-400" :
                          inv.daysOverdue >= 15 ? "text-orange-400" :
                          "text-zinc-300"
                        }`}
                      >
                        {inv.daysOverdue}d
                      </span>
                      {inv.daysOverdue >= 30 && (
                        <AlertTriangle size={11} className="text-red-500" />
                      )}
                    </div>
                    <div className="text-[10px] text-zinc-600 font-mono mt-0.5">Due {inv.dueDate}</div>
                  </td>

                  {/* Stage */}
                  <td className="px-3 py-3">
                    <StageBadge stage={inv.stage} />
                    <div className="text-[10px] text-zinc-600 mt-1">{STAGES[inv.stage].tone}</div>
                  </td>

                  {/* Email action */}
                  <td className="px-3 py-3">
                    {isEscalated ? (
                      <span className="font-mono text-[10px] text-purple-400">Legal flagged</span>
                    ) : hasEmail ? (
                      <button
                        onClick={() => setModalInv(inv)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-zinc-700 text-[11px] font-medium text-zinc-300 hover:border-amber-600/60 hover:text-amber-400 hover:bg-amber-950/20 transition-all"
                      >
                        <Mail size={11} />
                        View email
                      </button>
                    ) : (
                      <span className="font-mono text-[10px] text-zinc-700">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {sorted.length === 0 && (
          <div className="text-center py-12 text-zinc-600 font-mono text-sm">
            No invoices in this stage
          </div>
        )}
      </div>

      {modalInv && emails[modalInv.id] && (
        <EmailModal
          invoice={modalInv}
          email={emails[modalInv.id]}
          onClose={() => setModalInv(null)}
        />
      )}
    </>
  );
}

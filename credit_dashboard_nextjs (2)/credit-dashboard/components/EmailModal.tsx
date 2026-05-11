"use client";
import { useState } from "react";
import { X, Copy, Check, Mail, Zap } from "lucide-react";
import { GeneratedEmail, Invoice } from "@/lib/types";
import { fmtINR } from "@/lib/data";
import StageBadge from "./StageBadge";
import StatusBadge from "./StatusBadge";

interface Props {
  invoice: Invoice;
  email: GeneratedEmail;
  onClose: () => void;
}

export default function EmailModal({ invoice, email, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(`Subject: ${email.subject}\n\n${email.body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl border border-zinc-700 bg-[#111113] shadow-2xl animate-slide-in overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-zinc-800 bg-[#0f0f11]">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Mail size={14} className="text-amber-500 flex-shrink-0" />
              <span className="font-mono text-xs text-zinc-500">{invoice.id}</span>
              <StageBadge stage={invoice.stage} />
              <StatusBadge status={email.status} />
            </div>
            <h2 className="font-display font-semibold text-base text-zinc-100 truncate">
              {email.subject}
            </h2>
            <div className="mt-1 text-xs text-zinc-500">
              To: {invoice.email} · {invoice.client} · {fmtINR(invoice.amount)} · {invoice.daysOverdue}d overdue
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors flex-shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-4 px-5 py-2.5 border-b border-zinc-800/60 bg-zinc-900/30 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Zap size={11} className="text-amber-500" />
            <span className="font-mono text-[11px] text-zinc-500">Model:</span>
            <span className="font-mono text-[11px] text-amber-400">{email.model}</span>
          </div>
          <div className="text-zinc-700">·</div>
          <span className="font-mono text-[11px] text-zinc-500">
            Tone: <span className="text-zinc-300">{email.tone}</span>
          </span>
          <div className="text-zinc-700">·</div>
          <span className="font-mono text-[11px] text-zinc-500">
            Generated: <span className="text-zinc-400">{email.generatedAt}</span>
          </span>
        </div>

        {/* Email body */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="font-mono text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap bg-[#0d0d0f] rounded-lg border border-zinc-800 p-4">
            {email.body}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-800 bg-[#0f0f11]">
          <span className="text-xs text-zinc-600 font-mono">
            {email.body.length} chars · {email.body.split('\n').length} lines
          </span>
          <button
            onClick={copy}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-700 text-xs font-medium text-zinc-300 hover:border-amber-600/60 hover:text-amber-400 transition-all"
          >
            {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
            {copied ? "Copied!" : "Copy email"}
          </button>
        </div>
      </div>
    </div>
  );
}

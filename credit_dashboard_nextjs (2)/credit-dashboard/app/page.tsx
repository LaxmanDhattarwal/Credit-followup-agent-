"use client";
import { useState } from "react";
import {
  AlertTriangle, TrendingUp, DollarSign, Mail, Activity,
  RefreshCw, Shield, CheckCircle2, FileText, Zap, Clock,
  Wifi, WifiOff, Loader2,
} from "lucide-react";

import Sidebar from "@/components/Sidebar";
import StatCard from "@/components/StatCard";
import StageBadge from "@/components/StageBadge";
import StatusBadge from "@/components/StatusBadge";
import RunSummaryBanner from "@/components/RunSummaryBanner";
import InvoiceTable from "@/components/InvoiceTable";
import AuditLogTable from "@/components/AuditLogTable";
import { DonutChart, StageBarChart } from "@/components/PortfolioChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { useAgentData } from "@/hooks/useAgentData";
import { STAGES, StageNumber } from "@/lib/types";
import { fmtINR } from "@/lib/data";
import { cn } from "@/lib/utils";

export default function Home() {
  const [tab, setTab]               = useState("overview");
  const [filterStage, setFilterStage] = useState<StageNumber | null>(null);
  const [dryRun, setDryRun]         = useState(true);

  const {
    connected, loading, error, lastRefresh,
    invoices, auditLog, emails, stats,
    runInProgress, lastRun,
    triggerAgentRun, refresh,
  } = useAgentData();

  const portfolio    = stats?.portfolio;
  const totalInv     = portfolio?.totalInvoices ?? 0;
  const totalAmt     = portfolio?.totalOutstanding ?? 0;
  const byStage      = portfolio?.byStage ?? [];
  const auditStats   = stats?.auditStats ?? {};
  const criticalCnt  = invoices.filter(i => i.stage === 3 || i.stage === 4).length;
  const escalatedInv = invoices.filter(i => i.stage === 5);
  const generated    = auditStats["DRY_RUN"] ?? 0;
  const escalated    = auditStats["ESCALATED"] ?? 0;
  const lastRunFull  = (stats?.lastRunFull ?? lastRun) as Record<string, unknown>;

  // Adapt live data shape to RunSummaryBanner's props
  const bannerStats = {
    runId:     String(lastRunFull.runId ?? lastRunFull.run_id ?? "—"),
    timestamp: String(lastRunFull.timestamp ?? lastRunFull.timestamp_utc ?? "—"),
    duration:  Number(lastRunFull.duration ?? 0),
    generated: Number(lastRunFull.generated ?? generated),
    sent:      Number(lastRunFull.sent ?? 0),
    dryRun:    Number(lastRunFull.dryRun ?? lastRunFull.dry_run ?? generated),
    failed:    Number(lastRunFull.failed ?? 0),
    escalated: Number(lastRunFull.escalated ?? escalated),
    model:     String(lastRunFull.model ?? lastRunFull.model_used ?? "llama-3.3-70b-versatile"),
    mode:      (lastRunFull.mode ?? "DRY_RUN") as "DRY_RUN" | "LIVE",
  };

  // Adapt to what InvoiceTable / AuditLogTable expect
  // (they accept the same shape — ApiInvoice is compatible with Invoice)
  const tableInvoices = invoices as Parameters<typeof InvoiceTable>[0]["invoices"];
  const tableEmails   = emails   as Parameters<typeof InvoiceTable>[0]["emails"];
  const tableAudit    = auditLog as Parameters<typeof AuditLogTable>[0]["entries"];

  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden bg-[#0a0a0b]">
        <Sidebar activeTab={tab} setActiveTab={setTab} />

        <main className="flex-1 flex flex-col overflow-hidden">
          {/* ── Top bar ────────────────────────────────── */}
          <header className="flex items-center justify-between px-6 py-3.5 border-b border-zinc-800 bg-[#0d0d0f] flex-shrink-0">
            <div>
              <h1 className="font-display text-base font-semibold text-zinc-100">
                {tab === "overview" && "Dashboard Overview"}
                {tab === "invoices" && "Invoice Queue"}
                {tab === "audit"    && "Audit Trail"}
              </h1>
              <p className="font-mono text-[11px] text-zinc-600 mt-0.5">
                {lastRefresh
                  ? <>Last sync: <span className="text-zinc-400">{lastRefresh.toLocaleTimeString()}</span></>
                  : "Connecting to agent…"
                }
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Connection indicator */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border cursor-default",
                    connected ? "border-green-800/40 bg-green-950/20" : "border-zinc-800 bg-zinc-900"
                  )}>
                    {connected
                      ? <Wifi size={11} className="text-green-400" />
                      : <WifiOff size={11} className="text-zinc-600" />}
                    <span className={cn(
                      "font-mono text-[11px]",
                      connected ? "text-green-400" : "text-zinc-600"
                    )}>
                      {connected ? "Live" : "Demo"}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {connected ? "Connected to FastAPI backend :8000" : "Backend offline — showing demo data"}
                </TooltipContent>
              </Tooltip>

              {/* Model pill */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-zinc-800 bg-zinc-900 cursor-default">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse-slow" />
                    <span className="font-mono text-[11px] text-zinc-500">llama-3.3-70b</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Provider: Groq · JSON mode · Pydantic validated</TooltipContent>
              </Tooltip>

              {/* Dry-run toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setDryRun(d => !d)}
                    className={cn(
                      "px-2.5 py-1.5 rounded-md border font-mono text-[11px] transition-all",
                      dryRun
                        ? "border-amber-800/40 bg-amber-950/20 text-amber-400"
                        : "border-red-800/40 bg-red-950/20 text-red-400"
                    )}
                  >
                    {dryRun ? "Dry Run" : "Live Send"}
                  </button>
                </TooltipTrigger>
                <TooltipContent>{dryRun ? "Emails generated but not sent" : "Emails will actually be sent!"}</TooltipContent>
              </Tooltip>

              {/* Refresh */}
              <Button variant="ghost" size="sm" onClick={refresh} disabled={loading}>
                <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
              </Button>

              {/* Run agent */}
              <Button
                variant="amber-outline"
                size="sm"
                disabled={runInProgress || !connected}
                onClick={() => triggerAgentRun({ dry_run: dryRun })}
              >
                {runInProgress
                  ? <><Loader2 size={11} className="animate-spin" /> Running…</>
                  : <><Zap size={11} /> Run Agent</>}
              </Button>
            </div>
          </header>

          {/* Error banner */}
          {error && (
            <div className="flex items-center gap-2 px-6 py-2 border-b border-amber-800/30 bg-amber-950/10 text-xs font-mono text-amber-400">
              <AlertTriangle size={11} />
              {error}
            </div>
          )}

          {/* ── Content ────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto">

            {/* ══ OVERVIEW TAB ══ */}
            {tab === "overview" && (
              <div className="p-6 space-y-5 animate-fade-in">
                {bannerStats.runId !== "—" && <RunSummaryBanner stats={bannerStats} />}

                {/* KPI row */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  <StatCard label="Total Overdue"    value={totalInv}           sub="invoices"       icon={FileText}      accent />
                  <StatCard label="Outstanding"      value={fmtINR(totalAmt)}   sub="total exposure" icon={DollarSign}    accent />
                  <StatCard label="Emails Generated" value={generated}          sub={dryRun ? "dry run" : "sent"} icon={Mail} />
                  <StatCard label="Escalated"        value={escalated}          sub="legal review"   icon={AlertTriangle} danger />
                  <StatCard label="Critical (S3–4)"  value={criticalCnt}        sub="needs action"   icon={Activity}      warning />
                  <StatCard label="Run Mode"         value={dryRun ? "DRY RUN" : "LIVE"} sub="current" icon={Clock} />
                </div>

                {/* Charts row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-mono uppercase tracking-widest text-zinc-500 font-normal">Exposure by Stage</CardTitle>
                    </CardHeader>
                    <CardContent><DonutChart /></CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-mono uppercase tracking-widest text-zinc-500 font-normal">Amount by Stage (₹K)</CardTitle>
                    </CardHeader>
                    <CardContent><StageBarChart /></CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-mono uppercase tracking-widest text-zinc-500 font-normal">Stage Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {byStage.map(s => {
                        const pct = totalAmt > 0 ? Math.round((s.amount / totalAmt) * 100) : 0;
                        const sn = s.stage as StageNumber;
                        return (
                          <div key={s.stage}>
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                <StageBadge stage={sn} />
                                <span className="font-mono text-[11px] text-zinc-600">{s.count} inv</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[11px] text-zinc-500">{pct}%</span>
                                <span className="font-mono text-xs text-zinc-300">{fmtINR(s.amount)}</span>
                              </div>
                            </div>
                            <Progress value={pct} className="h-1" />
                          </div>
                        );
                      })}
                      <div className="pt-3 border-t border-zinc-800 flex justify-between items-center">
                        <span className="font-mono text-xs text-zinc-600">Total Outstanding</span>
                        <span className="font-display text-xl font-bold text-amber-400">{fmtINR(totalAmt)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Escalation alerts */}
                {escalatedInv.length > 0 && (
                  <div>
                    <div className="font-mono text-xs uppercase tracking-widest text-zinc-500 mb-3 flex items-center gap-2">
                      <AlertTriangle size={11} className="text-red-500" /> Escalation Alerts
                    </div>
                    <div className="space-y-2">
                      {escalatedInv.map(inv => (
                        <div key={inv.id} className="flex items-center justify-between px-4 py-3 rounded-lg border border-purple-800/30 bg-purple-950/10 hover:bg-purple-950/20 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-1.5 h-8 rounded-full bg-purple-500/50 flex-shrink-0" />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs text-amber-400">{inv.id}</span>
                                <span className="text-zinc-200 text-sm font-medium">{inv.client}</span>
                              </div>
                              <span className="text-zinc-600 text-xs">{inv.company}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="font-mono text-sm font-bold text-red-400">{inv.daysOverdue}d overdue</div>
                              <div className="font-mono text-xs text-zinc-500">Due {inv.dueDate}</div>
                            </div>
                            <div className="font-mono text-sm font-semibold text-zinc-100 w-24 text-right">{fmtINR(inv.amount)}</div>
                            <StageBadge stage={5} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Security checklist */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-mono uppercase tracking-widest text-zinc-500 font-normal flex items-center gap-2">
                      <Shield size={11} /> Security Mitigations Active
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                      {[
                        ["Prompt injection sanitisation", "Input fields stripped of injection patterns"],
                        ["PII masking in all logs",        "Emails masked as r***@domain.com"],
                        ["API keys via .env only",         "Never hardcoded · .gitignore enforced"],
                        ["Pydantic output validation",     "All LLM JSON fields validated before use"],
                        ["Batch send rate limiter",        "BATCH_SEND_LIMIT env cap per run"],
                        ["Dry-run mode default",           "SEND_MODE=dry_run unless explicitly live"],
                      ].map(([label, tip]) => (
                        <Tooltip key={label}>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2 text-xs text-zinc-400 cursor-default hover:text-zinc-300 transition-colors">
                              <CheckCircle2 size={11} className="text-green-500 flex-shrink-0" />
                              {label}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>{tip}</TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ══ INVOICES TAB ══ */}
            {tab === "invoices" && (
              <div className="p-6 space-y-4 animate-fade-in">
                <div className="flex items-center gap-2 flex-wrap">
                  <Button variant={filterStage === null ? "amber-outline" : "ghost"} size="sm"
                    onClick={() => setFilterStage(null)} className="font-mono text-xs">
                    All ({invoices.length})
                  </Button>
                  {([1,2,3,4,5] as StageNumber[]).map(sn => {
                    const count = invoices.filter(i => i.stage === sn).length;
                    if (!count) return null;
                    return (
                      <button key={sn}
                        onClick={() => setFilterStage(sn)}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-mono transition-all",
                          filterStage === sn ? `stage-${sn}` : "text-zinc-500 border-zinc-800 hover:text-zinc-300"
                        )}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: STAGES[sn].dotColor }} />
                        {STAGES[sn].short} ({count})
                      </button>
                    );
                  })}
                  <div className="ml-auto font-mono text-xs text-zinc-600">
                    Total: <span className="text-zinc-300">{fmtINR(
                      invoices.filter(i => filterStage === null || i.stage === filterStage).reduce((a,i) => a + i.amount, 0)
                    )}</span>
                  </div>
                </div>

                <Card className="overflow-hidden">
                  <div className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between bg-[#0f0f11]">
                    <span className="font-mono text-xs uppercase tracking-widest text-zinc-500">
                      {filterStage !== null
                        ? `${STAGES[filterStage].label} — ${invoices.filter(i => i.stage === filterStage).length} records`
                        : `All Overdue Invoices — ${invoices.length} records`}
                    </span>
                    <div className="flex items-center gap-2">
                      {runInProgress && <Loader2 size={11} className="animate-spin text-amber-500" />}
                      <span className="font-mono text-[11px] text-zinc-600">Click row to preview email</span>
                    </div>
                  </div>
                  <InvoiceTable invoices={tableInvoices} emails={tableEmails} filterStage={filterStage} />
                </Card>
              </div>
            )}

            {/* ══ AUDIT TAB ══ */}
            {tab === "audit" && (
              <div className="p-6 space-y-4 animate-fade-in">
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: "Total Entries", value: auditLog.length,                                       cls: "text-zinc-100"    },
                    { label: "DRY_RUN",       value: auditLog.filter(e => e.send_status === "DRY_RUN").length, cls: "text-amber-400" },
                    { label: "ESCALATED",     value: auditLog.filter(e => e.send_status === "ESCALATED").length, cls:"text-purple-400"},
                    { label: "FAILED",        value: auditLog.filter(e => e.send_status === "FAILED").length, cls: "text-red-400"    },
                  ].map(({ label, value, cls }) => (
                    <Card key={label}>
                      <CardContent className="p-4">
                        <div className="font-mono text-[10px] uppercase tracking-widest text-zinc-600 mb-1">{label}</div>
                        <div className={`font-mono text-2xl font-bold ${cls}`}>{value}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card className="overflow-hidden">
                  <div className="px-5 py-3 border-b border-zinc-800 bg-[#0f0f11] flex items-center justify-between">
                    <span className="font-mono text-xs uppercase tracking-widest text-zinc-500">
                      Audit Log · SQLite · logs/audit.db
                    </span>
                    <div className="flex items-center gap-2">
                      {connected
                        ? <Badge variant="success" className="font-mono text-[10px]"><Wifi size={9}/> Live data</Badge>
                        : <Badge variant="amber"   className="font-mono text-[10px]"><WifiOff size={9}/> Demo data</Badge>}
                    </div>
                  </div>
                  <AuditLogTable entries={tableAudit} />
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="font-mono text-[10px] uppercase tracking-widest text-zinc-600 mb-3">Status Legend</div>
                    <div className="flex flex-wrap gap-4">
                      {(["DRY_RUN","SENT","FAILED","ESCALATED"] as const).map(s => (
                        <div key={s} className="flex items-center gap-2">
                          <StatusBadge status={s} />
                          <span className="text-xs text-zinc-500">
                            {s === "DRY_RUN"   && "Generated, not sent"}
                            {s === "SENT"       && "Dispatched via SMTP/SendGrid"}
                            {s === "FAILED"     && "Generation or send failed"}
                            {s === "ESCALATED"  && "Flagged for legal review"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}

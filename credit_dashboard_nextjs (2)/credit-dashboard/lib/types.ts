export type StageNumber = 0 | 1 | 2 | 3 | 4 | 5;

export interface StageConfig {
  label: string;
  short: string;
  tone: string;
  cta: string;
  color: string;         // tailwind text color
  bg: string;            // tailwind bg color
  border: string;        // tailwind border color
  dotColor: string;      // hex for recharts
}

export const STAGES: Record<StageNumber, StageConfig> = {
  0: { label: "Not Overdue",           short: "On Time",   tone: "—",               cta: "—",                          color: "text-green-400",  bg: "bg-green-950/40",  border: "border-green-800/40",  dotColor: "#4ade80" },
  1: { label: "Stage 1 — Warm",        short: "S1 Warm",   tone: "Warm & Friendly", cta: "Pay now link",               color: "text-amber-300",  bg: "bg-amber-950/40",  border: "border-amber-800/40",  dotColor: "#fcd34d" },
  2: { label: "Stage 2 — Polite Firm", short: "S2 Firm",   tone: "Polite but Firm", cta: "Confirm date",               color: "text-orange-300", bg: "bg-orange-950/40", border: "border-orange-800/40", dotColor: "#fdba74" },
  3: { label: "Stage 3 — Formal",      short: "S3 Formal", tone: "Formal & Serious",cta: "Respond 48h",                color: "text-red-300",    bg: "bg-red-950/40",    border: "border-red-800/40",    dotColor: "#fca5a5" },
  4: { label: "Stage 4 — Stern",       short: "S4 Urgent", tone: "Stern & Urgent",  cta: "Pay immediately",            color: "text-red-400",    bg: "bg-red-900/50",    border: "border-red-700/50",    dotColor: "#f87171" },
  5: { label: "Escalated — Legal",     short: "Escalated", tone: "Legal Review",    cta: "Assign to Finance Mgr",      color: "text-purple-300", bg: "bg-purple-950/40", border: "border-purple-800/40", dotColor: "#c4b5fd" },
};

export interface Invoice {
  id: string;
  client: string;
  company: string;
  amount: number;
  dueDate: string;
  email: string;
  payLink: string;
  accountManager: string;
  daysOverdue: number;
  stage: StageNumber;
  followUpCount: number;
}

export interface GeneratedEmail {
  invoiceId: string;
  subject: string;
  body: string;
  tone: string;
  generatedAt: string;
  status: "DRY_RUN" | "SENT" | "FAILED";
  model: string;
}

export interface AuditEntry {
  id: number;
  timestamp: string;
  invoiceNo: string;
  clientName: string;
  company: string;
  amount: number;
  daysOverdue: number;
  stage: StageNumber;
  tone: string;
  subject: string;
  recipientMasked: string;
  status: "DRY_RUN" | "SENT" | "FAILED" | "ESCALATED";
  model: string | null;
}

export interface RunStats {
  runId: string;
  timestamp: string;
  duration: number;
  generated: number;
  sent: number;
  dryRun: number;
  failed: number;
  escalated: number;
  model: string;
  mode: "DRY_RUN" | "LIVE";
}

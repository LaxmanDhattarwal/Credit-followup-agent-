/**
 * lib/api.ts
 * ----------
 * Typed fetch helpers that call the FastAPI backend.
 * All components import from here — never fetch directly in components.
 *
 * Base URL is read from NEXT_PUBLIC_API_URL (set in .env.local).
 * Falls back to http://localhost:8000 in development.
 */

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ── generic fetcher ───────────────────────────────────────────────────────────
async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(`API ${path} → ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// ── response shapes ───────────────────────────────────────────────────────────
export interface ApiInvoice {
  id:             string;
  client:         string;
  company:        string;
  amount:         number;
  currency:       string;
  dueDate:        string;
  email:          string;
  payLink:        string;
  accountManager: string;
  daysOverdue:    number;
  stage:          0 | 1 | 2 | 3 | 4 | 5;
  stageLabel:     string;
  tone:           string;
  followUpCount:  number;
  autoSend:       boolean;
}

export interface ApiAuditEntry {
  id:               number;
  timestamp_utc:    string;
  invoice_no:       string;
  client_name:      string;
  company:          string;
  amount:           number;
  days_overdue:     number;
  stage_number:     number;
  tone_used:        string;
  subject:          string | null;
  body:             string | null;
  recipient_masked: string;
  send_status:      "DRY_RUN" | "SENT" | "FAILED" | "ESCALATED";
  model_used:       string | null;
  run_id:           string | null;
}

export interface ApiEmail {
  invoiceId:    string;
  subject:      string;
  body:         string;
  tone:         string;
  generatedAt:  string;
  status:       "DRY_RUN" | "SENT" | "FAILED";
  model:        string;
}

export interface ApiStats {
  portfolio: {
    totalInvoices:    number;
    totalOutstanding: number;
    byStage: Array<{
      stage:  number;
      count:  number;
      amount: number;
      label:  string;
    }>;
  };
  auditStats:  Record<string, number>;
  lastRun:     { run_id: string; timestamp_utc: string; model_used: string } | null;
  lastRunFull: Record<string, unknown>;
}

export interface ApiRunStatus {
  running:   boolean;
  last_run:  Record<string, unknown>;
}

// ── API calls ─────────────────────────────────────────────────────────────────

/** Fetch all overdue invoices. */
export async function fetchInvoices(): Promise<ApiInvoice[]> {
  const data = await apiFetch<{ invoices: ApiInvoice[] }>("/api/invoices");
  return data.invoices;
}

/** Fetch full audit log (most recent first). */
export async function fetchAudit(limit = 100): Promise<ApiAuditEntry[]> {
  const data = await apiFetch<{ entries: ApiAuditEntry[] }>(`/api/audit?limit=${limit}`);
  return data.entries;
}

/** Fetch generated email bodies keyed by invoice_no. */
export async function fetchEmails(): Promise<Record<string, ApiEmail>> {
  const data = await apiFetch<{ emails: Record<string, ApiEmail> }>("/api/emails");
  return data.emails;
}

/** Fetch portfolio stats and last run info. */
export async function fetchStats(): Promise<ApiStats> {
  return apiFetch<ApiStats>("/api/stats");
}

/** Check if a run is in progress. */
export async function fetchRunStatus(): Promise<ApiRunStatus> {
  return apiFetch<ApiRunStatus>("/api/run-status");
}

/** Trigger a new agent run. */
export async function triggerRun(options: {
  dry_run?: boolean;
  model?: string;
}): Promise<{ run_id: string; status: string; dry_run: boolean }> {
  return apiFetch("/api/run-agent", {
    method: "POST",
    body: JSON.stringify({
      dry_run: options.dry_run ?? true,
      model:   options.model ?? "llama-3.3-70b-versatile",
    }),
  });
}

/** Health check — returns true if backend is reachable. */
export async function checkHealth(): Promise<boolean> {
  try {
    await apiFetch("/api/health");
    return true;
  } catch {
    return false;
  }
}

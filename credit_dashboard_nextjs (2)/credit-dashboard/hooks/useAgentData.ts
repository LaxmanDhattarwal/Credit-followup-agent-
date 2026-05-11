"use client";
/**
 * hooks/useAgentData.ts
 * ---------------------
 * Single hook that fetches all live data from the FastAPI backend.
 * Falls back gracefully to static mock data when the backend is unreachable.
 *
 * Polling: every 10 seconds (configurable via POLL_INTERVAL).
 * When a run is in progress, polls every 2 seconds until it completes.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchInvoices, fetchAudit, fetchEmails, fetchStats,
  fetchRunStatus, triggerRun, checkHealth,
  ApiInvoice, ApiAuditEntry, ApiEmail, ApiStats,
} from "@/lib/api";

// Static fallback data (your existing mock)
import {
  invoices as mockInvoices,
  auditLog as mockAuditLog,
  generatedEmails as mockEmails,
  runStats as mockRunStats,
  portfolioSummary as mockPortfolio,
} from "@/lib/data";

const POLL_INTERVAL      = 10_000;   // normal polling: 10s
const FAST_POLL_INTERVAL = 2_000;    // during a run: 2s

export interface AgentData {
  // connection
  connected:    boolean;
  loading:      boolean;
  error:        string | null;
  lastRefresh:  Date | null;

  // data
  invoices:     ApiInvoice[];
  auditLog:     ApiAuditEntry[];
  emails:       Record<string, ApiEmail>;
  stats:        ApiStats | null;

  // run control
  runInProgress: boolean;
  lastRun:        Record<string, unknown>;
  triggerAgentRun: (opts: { dry_run: boolean }) => Promise<void>;
  refresh:         () => void;
}

export function useAgentData(): AgentData {
  const [connected,     setConnected]     = useState(false);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);
  const [lastRefresh,   setLastRefresh]   = useState<Date | null>(null);
  const [invoices,      setInvoices]      = useState<ApiInvoice[]>([]);
  const [auditLog,      setAuditLog]      = useState<ApiAuditEntry[]>([]);
  const [emails,        setEmails]        = useState<Record<string, ApiEmail>>({});
  const [stats,         setStats]         = useState<ApiStats | null>(null);
  const [runInProgress, setRunInProgress] = useState(false);
  const [lastRun,       setLastRun]       = useState<Record<string, unknown>>({});

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAll = useCallback(async () => {
    const alive = await checkHealth();
    setConnected(alive);

    if (!alive) {
      // Use mock data when backend is offline
      setInvoices(mockInvoices as unknown as ApiInvoice[]);
      setAuditLog(mockAuditLog as unknown as ApiAuditEntry[]);
      setEmails(mockEmails as unknown as Record<string, ApiEmail>);
      setStats({
        portfolio: {
          totalInvoices:    mockPortfolio.totalInvoices,
          totalOutstanding: mockPortfolio.totalOutstanding,
          byStage:          mockPortfolio.byStage as ApiStats["portfolio"]["byStage"],
        },
        auditStats:  { DRY_RUN: mockRunStats.dryRun, ESCALATED: mockRunStats.escalated },
        lastRun:      null,
        lastRunFull:  mockRunStats as unknown as Record<string, unknown>,
      });
      setError("Backend offline — showing demo data. Start FastAPI with: uvicorn api_server:app --port 8000");
      setLoading(false);
      return;
    }

    setError(null);
    try {
      const [inv, audit, em, st, status] = await Promise.all([
        fetchInvoices(),
        fetchAudit(),
        fetchEmails(),
        fetchStats(),
        fetchRunStatus(),
      ]);
      setInvoices(inv);
      setAuditLog(audit);
      setEmails(em);
      setStats(st);
      setRunInProgress(status.running);
      setLastRun(status.last_run ?? {});
      setLastRefresh(new Date());
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  // Restart polling at the right interval
  const startPolling = useCallback((fast = false) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const interval = fast ? FAST_POLL_INTERVAL : POLL_INTERVAL;
    timerRef.current = setInterval(fetchAll, interval);
  }, [fetchAll]);

  useEffect(() => {
    fetchAll();
    startPolling(false);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [fetchAll, startPolling]);

  // Speed up polling while a run is in progress
  useEffect(() => {
    startPolling(runInProgress);
  }, [runInProgress, startPolling]);

  const triggerAgentRun = async (opts: { dry_run: boolean }) => {
    try {
      await triggerRun(opts);
      setRunInProgress(true);
      startPolling(true);
    } catch (e) {
      setError(`Failed to start run: ${e}`);
    }
  };

  return {
    connected,
    loading,
    error,
    lastRefresh,
    invoices,
    auditLog,
    emails,
    stats,
    runInProgress,
    lastRun,
    triggerAgentRun,
    refresh: fetchAll,
  };
}

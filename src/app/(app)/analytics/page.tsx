"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Trophy, BarChart2, Clock, AlertTriangle,
  ArrowUp, ArrowDown, ArrowUpDown, Loader2, AlertCircle, Plus,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { SetupStat, SessionStat, TagStat } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ── Period selector ────────────────────────────────────────────────────────

const PERIODS = ["1D", "1W", "1M", "YTD"] as const;
type Period = (typeof PERIODS)[number];

// ── Local types ────────────────────────────────────────────────────────────

type AnalyticsTrade = {
  id: string;
  date: string;
  account_id: string | null;
  instrument: string;
  custom_instrument: string | null;
  session: string;
  setup: string;
  custom_setup: string | null;
  pnl: number | null;
  r_multiple: number | null;
  improvement_tags: string[];
  positive_review_tags: string[];
};

// ── Date helpers ───────────────────────────────────────────────────────────

function todayStr(): string {
  const n = new Date();
  const p = (v: number) => String(v).padStart(2, "0");
  return `${n.getFullYear()}-${p(n.getMonth() + 1)}-${p(n.getDate())}`;
}

function getPeriodStart(period: Period): string {
  const n = new Date();
  const p = (v: number) => String(v).padStart(2, "0");
  if (period === "1D") return todayStr();
  if (period === "1W") {
    const d = new Date(n); d.setDate(d.getDate() - 6);
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }
  if (period === "1M") return `${n.getFullYear()}-${p(n.getMonth() + 1)}-01`;
  return `${n.getFullYear()}-01-01`;
}

// ── Calculation helpers ────────────────────────────────────────────────────

function calcPerformanceStats(
  trades: AnalyticsTrade[],
  keyFn: (t: AnalyticsTrade) => string
): SetupStat[] {
  const map = new Map<string, { wins: number; count: number; pnl: number; rSum: number; rCount: number }>();
  for (const t of trades) {
    const key = keyFn(t);
    const s = map.get(key) ?? { wins: 0, count: 0, pnl: 0, rSum: 0, rCount: 0 };
    s.count++;
    if ((t.pnl ?? 0) > 0) s.wins++;
    s.pnl += t.pnl ?? 0;
    if (t.r_multiple != null) { s.rSum += t.r_multiple; s.rCount++; }
    map.set(key, s);
  }
  return Array.from(map.entries()).map(([name, s]) => ({
    name,
    trades: s.count,
    wins: s.wins,
    pnl: parseFloat(s.pnl.toFixed(2)),
    avgR: s.rCount > 0 ? parseFloat((s.rSum / s.rCount).toFixed(2)) : 0,
  }));
}

function calcTagStats(
  trades: AnalyticsTrade[],
  tagsFn: (t: AnalyticsTrade) => string[]
): TagStat[] {
  const map = new Map<string, { count: number; pnl: number }>();
  for (const t of trades) {
    for (const tag of tagsFn(t)) {
      const s = map.get(tag) ?? { count: 0, pnl: 0 };
      s.count++;
      s.pnl += t.pnl ?? 0;
      map.set(tag, s);
    }
  }
  return Array.from(map.entries()).map(([name, s]) => ({
    name,
    count: s.count,
    pnl: parseFloat(s.pnl.toFixed(2)),
  }));
}

// ── Format helpers ─────────────────────────────────────────────────────────

function fmtPnl(n: number): string {
  return (n >= 0 ? "+" : "") + "$" + Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function winRatePct(wins: number, trades: number): number {
  return trades > 0 ? Math.round((wins / trades) * 100) : 0;
}

// ── Sub-components ─────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
      {children}
    </p>
  );
}

function WinRateBar({ pct }: { pct: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-14 h-1.5 rounded-full bg-muted overflow-hidden shrink-0">
        <div
          className={cn(
            "h-full rounded-full",
            pct >= 60 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-400" : "bg-red-400"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={cn(
        "text-xs font-semibold tabular-nums",
        pct >= 60 ? "text-emerald-600 dark:text-emerald-400" :
        pct >= 40 ? "text-foreground" :
        "text-red-500 dark:text-red-400"
      )}>
        {pct}%
      </span>
    </div>
  );
}

function PnlText({ value }: { value: number }) {
  return (
    <span className={cn(
      "text-sm font-semibold tabular-nums",
      value > 0 ? "text-emerald-600 dark:text-emerald-400" :
      value < 0 ? "text-red-500 dark:text-red-400" :
      "text-muted-foreground"
    )}>
      {fmtPnl(value)}
    </span>
  );
}

function RText({ value }: { value: number }) {
  return (
    <span className={cn(
      "text-sm font-semibold tabular-nums",
      value > 0 ? "text-emerald-600 dark:text-emerald-400" :
      value < 0 ? "text-red-500 dark:text-red-400" :
      "text-muted-foreground"
    )}>
      {value > 0 ? "+" : ""}
      {value}R
    </span>
  );
}

// ── Sort types + head ──────────────────────────────────────────────────────

type SetupSortKey = "trades" | "winRate" | "pnl" | "avgR";
type SortDir = "asc" | "desc";

function SetupSortHead({
  children,
  className,
  sortKey,
  activeKey,
  activeDir,
  onSort,
  scope,
  title,
}: {
  children: React.ReactNode;
  className?: string;
  sortKey: SetupSortKey;
  activeKey: SetupSortKey | null;
  activeDir: SortDir;
  onSort: (k: SetupSortKey) => void;
  scope?: string;
  title?: string;
}) {
  const isActive = activeKey === sortKey;
  return (
    <th
      scope={scope}
      title={title}
      className={cn(
        "text-right text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-2.5 cursor-pointer select-none hover:text-foreground transition-colors",
        isActive && "text-foreground",
        className
      )}
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center justify-end gap-1">
        {children}
        {isActive
          ? activeDir === "desc" ? <ArrowDown size={11} /> : <ArrowUp size={11} />
          : <ArrowUpDown size={11} className="opacity-30" />
        }
      </span>
    </th>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("1M");
  const [trades, setTrades] = useState<AnalyticsTrade[]>([]);
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState("all");
  const [selectedInstrument, setSelectedInstrument] = useState("all");
  const [selectedSetup, setSelectedSetup] = useState("all");
  const [selectedSession, setSelectedSession] = useState("all");
  const [setupSortKey, setSetupSortKey] = useState<SetupSortKey | null>(null);
  const [setupSortDir, setSetupSortDir] = useState<SortDir>("desc");

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const [tradesResult, accountsResult] = await Promise.all([
        supabase
          .from("trades")
          .select("id, date, account_id, instrument, custom_instrument, session, setup, custom_setup, pnl, r_multiple, improvement_tags, positive_review_tags")
          .eq("user_id", user.id)
          .eq("status", "Closed"),
        supabase
          .from("evaluation_accounts")
          .select("id, account_name")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true }),
      ]);

      if (tradesResult.error || accountsResult.error) {
        setFetchError((tradesResult.error ?? accountsResult.error)!.message);
        setLoading(false);
        return;
      }

      setTrades(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (tradesResult.data ?? []).map((t: any) => ({
          id: t.id as string,
          date: t.date as string,
          account_id: t.account_id as string | null,
          instrument: t.instrument as string,
          custom_instrument: t.custom_instrument as string | null,
          session: t.session as string,
          setup: t.setup as string,
          custom_setup: t.custom_setup as string | null,
          pnl: t.pnl as number | null,
          r_multiple: t.r_multiple as number | null,
          improvement_tags: (t.improvement_tags as string[]) ?? [],
          positive_review_tags: (t.positive_review_tags as string[]) ?? [],
        }))
      );
      setAccounts(
        (accountsResult.data ?? []).map((a) => ({ id: a.id, name: a.account_name }))
      );
      setLoading(false);
    }
    fetchData();
  }, []);

  function handleSetupSort(key: SetupSortKey) {
    if (setupSortKey === key) {
      setSetupSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSetupSortKey(key);
      setSetupSortDir("desc");
    }
  }

  // ── Filter options derived from all trades ─────────────────────────────

  const uniqueInstruments = [...new Set(trades.map((t) =>
    t.instrument === "Custom" ? (t.custom_instrument || "Custom") : t.instrument
  ))].sort();

  const uniqueSetups = [...new Set(trades.map((t) =>
    t.setup === "Custom" ? (t.custom_setup || "Custom") : t.setup
  ))].sort();

  const uniqueSessions = [...new Set(trades.map((t) => t.session))].sort();

  // ── Apply filters ──────────────────────────────────────────────────────

  const today = todayStr();
  const periodStart = getPeriodStart(period);
  const filteredTrades = trades
    .filter((t) => t.date >= periodStart && t.date <= today)
    .filter((t) => selectedAccountId === "all" || t.account_id === selectedAccountId)
    .filter((t) => {
      if (selectedInstrument === "all") return true;
      const name = t.instrument === "Custom" ? (t.custom_instrument || "Custom") : t.instrument;
      return name === selectedInstrument;
    })
    .filter((t) => {
      if (selectedSetup === "all") return true;
      const name = t.setup === "Custom" ? (t.custom_setup || "Custom") : t.setup;
      return name === selectedSetup;
    })
    .filter((t) => selectedSession === "all" || t.session === selectedSession);

  // ── Compute stats from filtered trades ─────────────────────────────────

  const setupStats = calcPerformanceStats(
    filteredTrades,
    (t) => t.setup === "Custom" ? (t.custom_setup || "Custom") : t.setup
  ).sort((a, b) => b.pnl - a.pnl);

  const instrumentStats = calcPerformanceStats(
    filteredTrades,
    (t) => t.instrument === "Custom" ? (t.custom_instrument || "Custom") : t.instrument
  ).sort((a, b) => b.pnl - a.pnl);

  const sessionStats = calcPerformanceStats(filteredTrades, (t) => t.session)
    .sort((a, b) => b.pnl - a.pnl);

  // Sort mistake tags by most negative total P/L first
  const mistakeStats = calcTagStats(filteredTrades, (t) => t.improvement_tags)
    .sort((a, b) => a.pnl - b.pnl);

  // Sort positive tags by most positive total P/L first
  const behaviourStats = calcTagStats(filteredTrades, (t) => t.positive_review_tags)
    .sort((a, b) => b.pnl - a.pnl);

  // ── Insight highlights ─────────────────────────────────────────────────

  // Best = highest positive total P/L
  const bestSetup      = setupStats.filter((s) => s.pnl > 0)[0] ?? null;
  const bestInstrument = instrumentStats.filter((s) => s.pnl > 0)[0] ?? null;
  const bestSession    = sessionStats.filter((s) => s.pnl > 0)[0] ?? null;
  // Biggest mistake = tag with most negative total P/L (already sorted asc)
  const biggestMistake = mistakeStats[0] ?? null;

  // ── Sorted setup table ─────────────────────────────────────────────────

  const sortedSetups = [...setupStats].sort((a: SetupStat, b: SetupStat) => {
    if (!setupSortKey) return 0;
    let aVal: number, bVal: number;
    switch (setupSortKey) {
      case "trades":  aVal = a.trades;                     bVal = b.trades;                     break;
      case "winRate": aVal = winRatePct(a.wins, a.trades); bVal = winRatePct(b.wins, b.trades); break;
      case "pnl":     aVal = a.pnl;                        bVal = b.pnl;                        break;
      case "avgR":    aVal = a.avgR;                       bVal = b.avgR;                       break;
      default: return 0;
    }
    return setupSortDir === "desc" ? bVal - aVal : aVal - bVal;
  });

  // ── Tag bar max values ─────────────────────────────────────────────────

  const mistakeMax   = Math.max(...mistakeStats.map((m) => m.count), 1);
  const behaviourMax = Math.max(...behaviourStats.map((b) => b.count), 1);

  // ── Session chart tooltip — closes over sessionStats ───────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function SessionTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    const d = sessionStats.find((s) => s.name === label);
    if (!d) return null;
    const wr = winRatePct(d.wins, d.trades);
    return (
      <div className="rounded-lg border border-border bg-popover px-3 py-2.5 shadow-lg text-xs min-w-[160px]">
        <p className="font-semibold text-foreground mb-1.5">{label}</p>
        <div className="flex justify-between gap-6 mb-1">
          <span className="text-muted-foreground">Trades</span>
          <span className="font-medium tabular-nums">{d.trades}</span>
        </div>
        <div className="flex justify-between gap-6 mb-1">
          <span className="text-muted-foreground">Win Rate</span>
          <span className={cn(
            "font-medium tabular-nums",
            wr >= 60 ? "text-emerald-600 dark:text-emerald-400" :
            wr >= 40 ? "text-foreground" :
            "text-red-500 dark:text-red-400"
          )}>
            {wr}%
          </span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-muted-foreground">Net P&L</span>
          <span className={cn(
            "font-semibold tabular-nums",
            d.pnl >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"
          )}>
            {fmtPnl(d.pnl)}
          </span>
        </div>
      </div>
    );
  }

  // ── Loading state ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-6 md:p-8 flex items-center justify-center min-h-[60vh] gap-3">
        <Loader2 size={20} className="animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading analytics...</span>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────

  if (fetchError) {
    return (
      <div className="p-6 md:p-8 flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <AlertCircle size={20} className="text-destructive" />
        <p className="text-sm font-medium text-foreground">Failed to load analytics</p>
        <p className="text-sm text-muted-foreground max-w-xs text-center">{fetchError}</p>
      </div>
    );
  }

  // ── Empty state (no closed trades at all) ──────────────────────────────

  if (trades.length === 0) {
    return (
      <div className="p-6 md:p-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Find your best setups, strongest sessions, and repeated trading patterns.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center">
          <p className="text-sm font-medium text-foreground">No trade data yet.</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            Log trades to unlock setup, session, and behaviour analytics.
          </p>
          <Link
            href="/trades/new"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus size={14} />
            Log Trade
          </Link>
        </div>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────

  return (
    <div className="p-6 md:p-8">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Find your best setups, strongest sessions, and repeated trading patterns.
        </p>
      </div>

      {/* Insight cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-5 py-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Best Setup</p>
            <Trophy size={13} className="text-amber-500 shrink-0" />
          </div>
          {bestSetup ? (
            <>
              <p className="text-sm font-semibold text-foreground leading-snug">{bestSetup.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {winRatePct(bestSetup.wins, bestSetup.trades)}% win rate
              </p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">Not enough data yet</p>
          )}
        </div>

        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 px-5 py-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Best Instrument</p>
            <BarChart2 size={13} className="text-blue-500 shrink-0" />
          </div>
          {bestInstrument ? (
            <>
              <p className="text-sm font-semibold text-foreground leading-snug">{bestInstrument.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {winRatePct(bestInstrument.wins, bestInstrument.trades)}% win rate
              </p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">Not enough data yet</p>
          )}
        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Best Session</p>
            <Clock size={13} className="text-emerald-500 shrink-0" />
          </div>
          {bestSession ? (
            <>
              <p className="text-sm font-semibold text-foreground leading-snug">{bestSession.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {winRatePct(bestSession.wins, bestSession.trades)}% win rate
              </p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">Not enough data yet</p>
          )}
        </div>

        <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-5 py-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Biggest Mistake</p>
            <AlertTriangle size={13} className="text-red-500 shrink-0" />
          </div>
          {biggestMistake ? (
            <>
              <p className="text-sm font-semibold text-foreground leading-snug">{biggestMistake.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {biggestMistake.count} {biggestMistake.count === 1 ? "time" : "times"} tagged
              </p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">Not enough data yet</p>
          )}
        </div>

      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-8">

        {/* Period — functional */}
        <div className="flex items-center gap-0.5 bg-muted rounded-lg p-1">
          {PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                period === p
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Account filter */}
        <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
          <SelectTrigger className="w-36 h-8 text-sm">
            <SelectValue placeholder="Account" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All accounts</SelectItem>
            {accounts.map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Instrument filter */}
        <Select value={selectedInstrument} onValueChange={setSelectedInstrument}>
          <SelectTrigger className="w-36 h-8 text-sm">
            <SelectValue placeholder="Instrument" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All instruments</SelectItem>
            {uniqueInstruments.map((v) => (
              <SelectItem key={v} value={v}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Setup filter */}
        <Select value={selectedSetup} onValueChange={setSelectedSetup}>
          <SelectTrigger className="w-44 h-8 text-sm">
            <SelectValue placeholder="Setup" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All setups</SelectItem>
            {uniqueSetups.map((v) => (
              <SelectItem key={v} value={v}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Session filter */}
        <Select value={selectedSession} onValueChange={setSelectedSession}>
          <SelectTrigger className="w-36 h-8 text-sm">
            <SelectValue placeholder="Session" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sessions</SelectItem>
            {uniqueSessions.map((v) => (
              <SelectItem key={v} value={v}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>

      </div>

      {/* Session chart + Instrument breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* Session P&L bar chart */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card px-5 py-4 shadow-sm">
          <SectionLabel>Session Performance</SectionLabel>
          {sessionStats.length === 0 ? (
            <div className="h-[260px] flex items-center justify-center">
              <p className="text-sm text-muted-foreground">No session data for this period.</p>
            </div>
          ) : (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={sessionStats}
                  margin={{ top: 4, right: 4, bottom: 0, left: 4 }}
                  barSize={36}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v: number) => {
                      if (v === 0) return "$0";
                      const abs = Math.abs(v);
                      const sign = v < 0 ? "-" : "";
                      return abs >= 1000
                        ? `${sign}$${(abs / 1000).toFixed(1)}k`
                        : `${sign}$${abs}`;
                    }}
                    tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                    width={48}
                  />
                  <Tooltip
                    content={<SessionTooltip />}
                    cursor={{ fill: "var(--color-muted)", opacity: 0.5 }}
                  />
                  <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                    {sessionStats.map((entry: SessionStat) => (
                      <Cell
                        key={entry.name}
                        fill={entry.pnl >= 0 ? "#10b981" : "#ef4444"}
                        fillOpacity={0.8}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Instrument Performance */}
        <div className="rounded-xl border border-border bg-card px-5 py-4 shadow-sm">
          <SectionLabel>Instrument Performance</SectionLabel>
          {instrumentStats.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">No data for this period.</p>
            </div>
          ) : (
            <div>
              {instrumentStats.map((row: SetupStat, i: number) => {
                const wr = winRatePct(row.wins, row.trades);
                return (
                  <div
                    key={row.name}
                    className={cn(
                      "py-3 flex flex-col gap-1.5",
                      i < instrumentStats.length - 1 && "border-b border-border"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <Link
                        href={`/trades?instrument=${encodeURIComponent(row.name)}`}
                        className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
                      >
                        {row.name}
                      </Link>
                      <PnlText value={row.pnl} />
                    </div>
                    <div className="flex items-center justify-between">
                      <WinRateBar pct={wr} />
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {row.trades} trades
                        </span>
                        <RText value={row.avgR} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Setup Performance table */}
      <div className="rounded-xl border border-border bg-card shadow-sm mb-6 overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Setup Performance
          </p>
        </div>
        {sortedSetups.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-muted-foreground">No setup data for this period.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th scope="col" className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-5 py-2.5">
                  Setup
                </th>
                <SetupSortHead scope="col" sortKey="trades"  activeKey={setupSortKey} activeDir={setupSortDir} onSort={handleSetupSort}>Trades</SetupSortHead>
                <SetupSortHead scope="col" sortKey="winRate" activeKey={setupSortKey} activeDir={setupSortDir} onSort={handleSetupSort}>Win Rate</SetupSortHead>
                <SetupSortHead scope="col" sortKey="pnl"     activeKey={setupSortKey} activeDir={setupSortDir} onSort={handleSetupSort}>Total P/L</SetupSortHead>
                <SetupSortHead scope="col" sortKey="avgR"    activeKey={setupSortKey} activeDir={setupSortDir} onSort={handleSetupSort} className="px-5" title="Average R-multiple per trade">Avg R</SetupSortHead>
              </tr>
            </thead>
            <tbody>
              {sortedSetups.map((row: SetupStat, i: number) => {
                const wr = winRatePct(row.wins, row.trades);
                return (
                  <tr
                    key={row.name}
                    className={cn(
                      "hover:bg-muted/40 transition-colors",
                      i < sortedSetups.length - 1 && "border-b border-border"
                    )}
                  >
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/trades?setup=${encodeURIComponent(row.name)}`}
                        className="font-medium text-foreground hover:text-primary transition-colors"
                      >
                        {row.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 text-right tabular-nums text-muted-foreground">
                      {row.trades}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex justify-end">
                        <WinRateBar pct={wr} />
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <PnlText value={row.pnl} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <RText value={row.avgR} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Mistake Analysis + Positive Behaviours */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <div className="rounded-xl border border-border bg-card px-5 py-4 shadow-sm">
          <SectionLabel>Mistake Analysis</SectionLabel>
          {mistakeStats.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No mistake tags in this period.</p>
          ) : (
            <div className="space-y-3.5">
              {mistakeStats.map((row: TagStat) => (
                <div key={row.name} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-foreground truncate">{row.name}</span>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {row.count}&times;
                      </span>
                      <PnlText value={row.pnl} />
                    </div>
                  </div>
                  <div className="h-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-red-400/70"
                      style={{ width: `${(row.count / mistakeMax) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card px-5 py-4 shadow-sm">
          <SectionLabel>Positive Behaviours</SectionLabel>
          {behaviourStats.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No positive tags in this period.</p>
          ) : (
            <div className="space-y-3.5">
              {behaviourStats.map((row: TagStat) => (
                <div key={row.name} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-foreground truncate">{row.name}</span>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {row.count}&times;
                      </span>
                      <PnlText value={row.pnl} />
                    </div>
                  </div>
                  <div className="h-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500/60"
                      style={{ width: `${(row.count / behaviourMax) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

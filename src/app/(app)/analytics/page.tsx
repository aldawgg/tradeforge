"use client";

import { useState } from "react";
import Link from "next/link";
import { Trophy, Cpu, Clock, AlertTriangle, ChevronDown, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
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

// ── Placeholder data ──────────────────────────────────────────────────────────

const INSIGHTS = {
  bestSetup:      "VWAP Bounce",
  bestInstrument: "MNQ",
  bestSession:    "New York AM",
  biggestMistake: "Entered too early",
};

const PERIODS = ["1D", "1W", "1M", "YTD"] as const;
type Period = (typeof PERIODS)[number];

interface SetupRow    { name: string; trades: number; wins: number; pnl: number; avgR: number; }
interface SessionRow  { name: string; trades: number; wins: number; pnl: number; avgR: number; }
interface TagRow      { name: string; count: number;  pnl: number; }

const SETUP_STATS: SetupRow[] = [
  { name: "VWAP Bounce",      trades: 28, wins: 20, pnl:  1840, avgR:  1.4 },
  { name: "Liquidity Sweep",  trades: 18, wins: 10, pnl:   620, avgR:  0.9 },
  { name: "FVG Continuation", trades: 14, wins:  9, pnl:   540, avgR:  1.1 },
  { name: "Rejection Block",  trades: 11, wins:  6, pnl:   210, avgR:  0.7 },
  { name: "Failed Breakout",  trades:  8, wins:  2, pnl:  -380, avgR: -0.8 },
];

const INSTRUMENT_STATS: SetupRow[] = [
  { name: "MNQ", trades: 48, wins: 31, pnl:  2640, avgR:  1.3 },
  { name: "MES", trades: 22, wins: 12, pnl:   480, avgR:  0.8 },
  { name: "NQ",  trades:  8, wins:  3, pnl:  -120, avgR: -0.4 },
  { name: "ES",  trades:  5, wins:  2, pnl:   -60, avgR: -0.3 },
];

const SESSION_STATS: SessionRow[] = [
  { name: "New York AM", trades: 42, wins: 27, pnl:  2340, avgR:  1.3 },
  { name: "London",      trades: 18, wins:  9, pnl:   480, avgR:  0.7 },
  { name: "New York PM", trades: 12, wins:  6, pnl:   120, avgR:  0.4 },
  { name: "Asia",        trades:  6, wins:  2, pnl:  -210, avgR: -0.8 },
  { name: "Other",       trades:  5, wins:  3, pnl:    90, avgR:  0.6 },
];

const MISTAKE_STATS: TagRow[] = [
  { name: "Entered too early",     count: 8, pnl:  -520 },
  { name: "Took profit too early", count: 6, pnl:  -250 },
  { name: "FOMO entry",            count: 5, pnl:  -410 },
  { name: "Moved stop loss",       count: 3, pnl:  -300 },
  { name: "Overtraded",            count: 3, pnl:  -180 },
];

const BEHAVIOUR_STATS: TagRow[] = [
  { name: "Respected stop loss",     count: 15, pnl:  760 },
  { name: "Followed trading plan",   count: 12, pnl: 1200 },
  { name: "Waited for confirmation", count:  9, pnl:  850 },
  { name: "Managed emotions well",   count:  7, pnl:  430 },
];

const MISTAKE_MAX   = Math.max(...MISTAKE_STATS.map((m) => m.count));
const BEHAVIOUR_MAX = Math.max(...BEHAVIOUR_STATS.map((b) => b.count));

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtPnl(n: number): string {
  return (n >= 0 ? "+" : "") + "$" + Math.abs(n).toLocaleString();
}

function winRatePct(wins: number, trades: number): number {
  return trades > 0 ? Math.round((wins / trades) * 100) : 0;
}

// ── Sub-components ────────────────────────────────────────────────────────────

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
      <span
        className={cn(
          "text-xs font-semibold tabular-nums",
          pct >= 60
            ? "text-emerald-600 dark:text-emerald-400"
            : pct >= 40
            ? "text-foreground"
            : "text-red-500 dark:text-red-400"
        )}
      >
        {pct}%
      </span>
    </div>
  );
}

function PnlText({ value }: { value: number }) {
  return (
    <span
      className={cn(
        "text-sm font-semibold tabular-nums",
        value > 0
          ? "text-emerald-600 dark:text-emerald-400"
          : value < 0
          ? "text-red-500 dark:text-red-400"
          : "text-muted-foreground"
      )}
    >
      {fmtPnl(value)}
    </span>
  );
}

function RText({ value }: { value: number }) {
  return (
    <span
      className={cn(
        "text-sm font-semibold tabular-nums",
        value > 0
          ? "text-emerald-600 dark:text-emerald-400"
          : value < 0
          ? "text-red-500 dark:text-red-400"
          : "text-muted-foreground"
      )}
    >
      {value > 0 ? "+" : ""}
      {value}R
    </span>
  );
}

function FilterChip({ label, value }: { label: string; value: string }) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
    >
      <span className="text-muted-foreground/60">{label}:</span>
      <span className="text-foreground">{value}</span>
      <ChevronDown size={11} className="text-muted-foreground/50" />
    </button>
  );
}

// ── Sort types + head ─────────────────────────────────────────────────────────

type SetupSortKey = "trades" | "winRate" | "pnl" | "avgR";
type SortDir = "asc" | "desc";

function SetupSortHead({
  children,
  className,
  sortKey,
  activeKey,
  activeDir,
  onSort,
}: {
  children: React.ReactNode;
  className?: string;
  sortKey: SetupSortKey;
  activeKey: SetupSortKey | null;
  activeDir: SortDir;
  onSort: (k: SetupSortKey) => void;
}) {
  const isActive = activeKey === sortKey;
  return (
    <th
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
          ? activeDir === "desc"
            ? <ArrowDown size={11} />
            : <ArrowUp size={11} />
          : <ArrowUpDown size={11} className="opacity-30" />
        }
      </span>
    </th>
  );
}

// ── Session chart tooltip ─────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SessionTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const d = SESSION_STATS.find((s) => s.name === label);
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
        <span
          className={cn(
            "font-medium tabular-nums",
            wr >= 60
              ? "text-emerald-600 dark:text-emerald-400"
              : wr >= 40
              ? "text-foreground"
              : "text-red-500 dark:text-red-400"
          )}
        >
          {wr}%
        </span>
      </div>
      <div className="flex justify-between gap-6">
        <span className="text-muted-foreground">Net P&L</span>
        <span
          className={cn(
            "font-semibold tabular-nums",
            d.pnl >= 0
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-red-500 dark:text-red-400"
          )}
        >
          {fmtPnl(d.pnl)}
        </span>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("1M");
  const [setupSortKey, setSetupSortKey] = useState<SetupSortKey | null>(null);
  const [setupSortDir, setSetupSortDir] = useState<SortDir>("desc");

  function handleSetupSort(key: SetupSortKey) {
    if (setupSortKey === key) {
      setSetupSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSetupSortKey(key);
      setSetupSortDir("desc");
    }
  }

  const sortedSetups = [...SETUP_STATS].sort((a, b) => {
    if (!setupSortKey) return 0;
    let aVal: number, bVal: number;
    switch (setupSortKey) {
      case "trades":  aVal = a.trades;                          bVal = b.trades;                          break;
      case "winRate": aVal = winRatePct(a.wins, a.trades);      bVal = winRatePct(b.wins, b.trades);      break;
      case "pnl":     aVal = a.pnl;                             bVal = b.pnl;                             break;
      case "avgR":    aVal = a.avgR;                            bVal = b.avgR;                            break;
      default:        return 0;
    }
    return setupSortDir === "desc" ? bVal - aVal : aVal - bVal;
  });

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
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Best Setup
            </p>
            <Trophy size={13} className="text-amber-500 shrink-0" />
          </div>
          <p className="text-sm font-semibold text-foreground leading-snug">
            {INSIGHTS.bestSetup}
          </p>
          <p className="text-xs text-muted-foreground mt-1">73% win rate</p>
        </div>

        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 px-5 py-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Best Instrument
            </p>
            <Cpu size={13} className="text-blue-500 shrink-0" />
          </div>
          <p className="text-sm font-semibold text-foreground leading-snug">
            {INSIGHTS.bestInstrument}
          </p>
          <p className="text-xs text-muted-foreground mt-1">65% win rate</p>
        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Best Session
            </p>
            <Clock size={13} className="text-emerald-500 shrink-0" />
          </div>
          <p className="text-sm font-semibold text-foreground leading-snug">
            {INSIGHTS.bestSession}
          </p>
          <p className="text-xs text-muted-foreground mt-1">64% win rate</p>
        </div>

        <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-5 py-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Biggest Mistake
            </p>
            <AlertTriangle size={13} className="text-red-500 shrink-0" />
          </div>
          <p className="text-sm font-semibold text-foreground leading-snug">
            {INSIGHTS.biggestMistake}
          </p>
          <p className="text-xs text-muted-foreground mt-1">8 times tagged</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
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
        <FilterChip label="Account" value="All accounts" />
        <FilterChip label="Instrument" value="All instruments" />
        <FilterChip label="Setup" value="All setups" />
        <FilterChip label="Session" value="All sessions" />
      </div>

      {/* Session chart + Instrument breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* Session P&L bar chart */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card px-5 py-4 shadow-sm">
          <SectionLabel>Session Performance</SectionLabel>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={SESSION_STATS}
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
                  tickFormatter={(v: number) =>
                    v === 0
                      ? "$0"
                      : `${v < 0 ? "-" : ""}$${(Math.abs(v) / 1000).toFixed(1)}k`
                  }
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
                  {SESSION_STATS.map((entry) => (
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
        </div>

        {/* Instrument Performance */}
        <div className="rounded-xl border border-border bg-card px-5 py-4 shadow-sm">
          <SectionLabel>Instrument Performance</SectionLabel>
          <div>
            {INSTRUMENT_STATS.map((row, i) => {
              const wr = winRatePct(row.wins, row.trades);
              return (
                <div
                  key={row.name}
                  className={cn(
                    "py-3 flex flex-col gap-1.5",
                    i < INSTRUMENT_STATS.length - 1 && "border-b border-border"
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
        </div>

      </div>

      {/* Setup Performance table */}
      <div className="rounded-xl border border-border bg-card shadow-sm mb-6 overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Setup Performance
          </p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide px-5 py-2.5">
                Setup
              </th>
              <SetupSortHead sortKey="trades"  activeKey={setupSortKey} activeDir={setupSortDir} onSort={handleSetupSort}>Trades</SetupSortHead>
              <SetupSortHead sortKey="winRate" activeKey={setupSortKey} activeDir={setupSortDir} onSort={handleSetupSort}>Win Rate</SetupSortHead>
              <SetupSortHead sortKey="pnl"     activeKey={setupSortKey} activeDir={setupSortDir} onSort={handleSetupSort}>Total P/L</SetupSortHead>
              <SetupSortHead sortKey="avgR"    activeKey={setupSortKey} activeDir={setupSortDir} onSort={handleSetupSort} className="px-5">Avg R</SetupSortHead>
            </tr>
          </thead>
          <tbody>
            {sortedSetups.map((row, i) => {
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
      </div>

      {/* Mistake Analysis + Positive Behaviours */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <div className="rounded-xl border border-border bg-card px-5 py-4 shadow-sm">
          <SectionLabel>Mistake Analysis</SectionLabel>
          <div className="space-y-3.5">
            {MISTAKE_STATS.map((row) => (
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
                    style={{ width: `${(row.count / MISTAKE_MAX) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card px-5 py-4 shadow-sm">
          <SectionLabel>Positive Behaviours</SectionLabel>
          <div className="space-y-3.5">
            {BEHAVIOUR_STATS.map((row) => (
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
                    style={{ width: `${(row.count / BEHAVIOUR_MAX) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

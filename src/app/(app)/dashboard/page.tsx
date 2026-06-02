"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Trophy, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { AccountGrowthChart } from "@/components/dashboard/account-growth-chart";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { EvaluationStatus, AccountGrowthPoint, AccountChartConfig } from "@/lib/types";

const PERIODS = ["1D", "1W", "1M", "YTD"] as const;
type Period = (typeof PERIODS)[number];

const PERIOD_LABELS: Record<Period, string> = {
  "1D":  "Today",
  "1W":  "This Week",
  "1M":  "This Month",
  "YTD": "Year to Date",
};

const EVAL_WIDGET_STATUSES: { label: string; status: EvaluationStatus; dot: string }[] = [
  { label: "In Eval",  status: "In Eval",  dot: "bg-blue-500"    },
  { label: "Passed",   status: "Passed",   dot: "bg-amber-500"   },
  { label: "Funded",   status: "Funded",   dot: "bg-emerald-500" },
  { label: "Breached", status: "Breached", dot: "bg-red-500"     },
];

const CHART_COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#06b6d4"];
const CONSISTENCY_TARGET = 30;

// ── Local types ────────────────────────────────────────────────────────────

type FetchedTrade = {
  id: string;
  date: string;
  account_id: string | null;
  pnl: number;
  setup: string | null;
  custom_setup: string | null;
};

type FetchedAccount = {
  id: string;
  account_name: string;
  starting_balance: number;
  status: EvaluationStatus;
};

// ── Calculation helpers ────────────────────────────────────────────────────

function todayString(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function getPeriodStart(period: Period): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  if (period === "1D") return todayString();
  if (period === "1W") {
    const d = new Date(now);
    d.setDate(d.getDate() - 6);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  if (period === "1M") {
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
  }
  return `${now.getFullYear()}-01-01`;
}

function calcPeriodStats(trades: FetchedTrade[], period: Period) {
  const start = getPeriodStart(period);
  const today = todayString();
  const subset = trades.filter((t) => t.date >= start && t.date <= today);

  if (subset.length === 0) {
    return { pl: "$0", plColor: "default" as const, winRate: "0%", winRateSubtitle: "0W · 0L", trades: "0" };
  }

  const total = subset.reduce((s, t) => s + t.pnl, 0);
  const wins = subset.filter((t) => t.pnl > 0).length;
  const losses = subset.filter((t) => t.pnl < 0).length;
  const decisive = wins + losses;
  const winRate = decisive > 0 ? Math.round((wins / decisive) * 100) : 0;
  const plColor: "green" | "red" | "default" = total > 0 ? "green" : total < 0 ? "red" : "default";
  const abs = Math.abs(total).toLocaleString("en-US", { maximumFractionDigits: 0 });
  const pl = total === 0 ? "$0" : total > 0 ? `+$${abs}` : `-$${abs}`;

  return { pl, plColor, winRate: `${winRate}%`, winRateSubtitle: `${wins}W · ${losses}L`, trades: String(subset.length) };
}

function calcStreak(trades: FetchedTrade[]) {
  const sorted = [...trades]
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
    .filter((t) => t.pnl !== 0);
  if (!sorted.length) return { type: "none" as const, count: 0 };
  const firstType = sorted[0].pnl > 0 ? ("win" as const) : ("loss" as const);
  let count = 0;
  for (const t of sorted) {
    if (firstType === "win" && t.pnl > 0) count++;
    else if (firstType === "loss" && t.pnl < 0) count++;
    else break;
  }
  return { type: firstType, count };
}

function calcBestSetup(trades: FetchedTrade[]) {
  const map = new Map<string, { wins: number; count: number; pnl: number }>();
  for (const t of trades) {
    if (!t.setup) continue;
    const name = t.setup === "Custom" ? (t.custom_setup || "Custom") : t.setup;
    const s = map.get(name) ?? { wins: 0, count: 0, pnl: 0 };
    s.count++;
    if (t.pnl > 0) s.wins++;
    s.pnl += t.pnl;
    map.set(name, s);
  }
  if (!map.size) return null;
  let bestName = "";
  let bestWr = -1;
  let bestPnl = -Infinity;
  for (const [name, s] of map) {
    const wr = s.wins / s.count;
    if (wr > bestWr || (wr === bestWr && s.pnl > bestPnl)) {
      bestWr = wr; bestPnl = s.pnl; bestName = name;
    }
  }
  const best = map.get(bestName)!;
  const absPnl = Math.abs(best.pnl).toLocaleString("en-US", { maximumFractionDigits: 0 });
  return {
    name: bestName,
    winRate: Math.round(bestWr * 100),
    trades: best.count,
    totalPnl: best.pnl >= 0 ? `+$${absPnl}` : `-$${absPnl}`,
  };
}

function calcConsistency(trades: FetchedTrade[]): number {
  const dayPnl = new Map<string, number>();
  let totalPos = 0;
  for (const t of trades) {
    if (t.pnl <= 0) continue;
    dayPnl.set(t.date, (dayPnl.get(t.date) ?? 0) + t.pnl);
    totalPos += t.pnl;
  }
  if (!totalPos) return 0;
  return Math.round((Math.max(...dayPnl.values()) / totalPos) * 100);
}

function buildGrowthData(
  trades: FetchedTrade[],
  accounts: FetchedAccount[]
): { data: AccountGrowthPoint[]; configs: AccountChartConfig[] } {
  const accsWithTrades = accounts.filter((a) => trades.some((t) => t.account_id === a.id));
  if (!accsWithTrades.length) return { data: [], configs: [] };

  const keyMap = new Map(accsWithTrades.map((a, i) => [a.id, `acc${i}`]));
  const configs: AccountChartConfig[] = accsWithTrades.map((a, i) => ({
    key: `acc${i}`,
    label: a.account_name,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const linked = trades
    .filter((t) => t.account_id && keyMap.has(t.account_id))
    .sort((a, b) => a.date.localeCompare(b.date));

  const dates = [...new Set(linked.map((t) => t.date))].sort();
  const balances = new Map(accsWithTrades.map((a) => [a.id, a.starting_balance]));
  const data: AccountGrowthPoint[] = [];

  for (const date of dates) {
    for (const t of linked.filter((l) => l.date === date)) {
      if (t.account_id) balances.set(t.account_id, (balances.get(t.account_id) ?? 0) + t.pnl);
    }
    const point: AccountGrowthPoint = { date };
    for (const [id, key] of keyMap) point[key] = balances.get(id) ?? 0;
    data.push(point);
  }

  return { data, configs };
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>("1D");
  const [trades, setTrades] = useState<FetchedTrade[]>([]);
  const [accounts, setAccounts] = useState<FetchedAccount[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      setDisplayName((user.user_metadata?.full_name as string | undefined) ?? "");

      const [tradesResult, accountsResult] = await Promise.all([
        supabase
          .from("trades")
          .select("id, date, account_id, pnl, setup, custom_setup")
          .eq("user_id", user.id)
          .eq("status", "Closed")
          .not("pnl", "is", null),
        supabase
          .from("evaluation_accounts")
          .select("id, account_name, starting_balance, status")
          .eq("user_id", user.id),
      ]);

      if (tradesResult.error || accountsResult.error) {
        setFetchError((tradesResult.error ?? accountsResult.error)!.message);
        setLoading(false);
        return;
      }

      setTrades(
        (tradesResult.data ?? []).map((t) => ({
          id: t.id as string,
          date: t.date as string,
          account_id: t.account_id as string | null,
          pnl: t.pnl as number,
          setup: t.setup as string | null,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          custom_setup: (t as any).custom_setup as string | null,
        }))
      );
      setAccounts(
        (accountsResult.data ?? []).map((a) => ({
          id: a.id as string,
          account_name: a.account_name as string,
          starting_balance: a.starting_balance as number,
          status: a.status as EvaluationStatus,
        }))
      );
      setLoading(false);
    }
    fetchData();
  }, []);

  // ── Derived values ─────────────────────────────────────────────────────

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const totalPnl = trades.reduce((s, t) => s + t.pnl, 0);
  const absTotalPnl = Math.abs(totalPnl).toLocaleString("en-US", { maximumFractionDigits: 0 });
  const totalPnlFormatted =
    trades.length === 0 || totalPnl === 0 ? "$0" :
    totalPnl > 0 ? `+$${absTotalPnl}` : `-$${absTotalPnl}`;
  const totalPnlColor =
    totalPnl > 0 ? "text-emerald-600" :
    totalPnl < 0 ? "text-red-500 dark:text-red-400" :
    "text-foreground";

  const streak = calcStreak(trades);
  const bestSetup = calcBestSetup(trades);
  const consistencyValue = calcConsistency(trades);
  const isOverTarget = consistencyValue > CONSISTENCY_TARGET;
  const d = calcPeriodStats(trades, period);

  const pnlByAccount = new Map<string, number>();
  for (const t of trades) {
    if (t.account_id) pnlByAccount.set(t.account_id, (pnlByAccount.get(t.account_id) ?? 0) + t.pnl);
  }
  const totalAccountBalance = accounts.reduce(
    (s, a) => s + a.starting_balance + (pnlByAccount.get(a.id) ?? 0),
    0
  );
  const totalStartingBalance = accounts.reduce((s, a) => s + a.starting_balance, 0);
  const totalBalanceChange = totalAccountBalance - totalStartingBalance;
  const totalBalancePct =
    totalStartingBalance > 0
      ? ((totalBalanceChange / totalStartingBalance) * 100).toFixed(1)
      : "0.0";
  const absBalChange = Math.abs(totalBalanceChange).toLocaleString("en-US", { maximumFractionDigits: 0 });
  const balanceChangeFmt =
    totalBalanceChange === 0 ? "$0" :
    totalBalanceChange > 0 ? `+$${absBalChange}` :
    `-$${absBalChange}`;
  const balancePctFmt =
    totalBalanceChange === 0 ? "0%" :
    totalBalanceChange > 0 ? `+${totalBalancePct}%` :
    `-${Math.abs(parseFloat(totalBalancePct))}%`;

  const { data: growthData, configs: growthConfigs } = buildGrowthData(trades, accounts);

  const streakStyle = {
    win: {
      wrapper: "bg-emerald-500/10 border-emerald-500/20",
      value:   "text-emerald-600 dark:text-emerald-400",
      text:    `🔥 ${streak.count} trade win streak`,
      hint:    "Keep following your plan",
    },
    loss: {
      wrapper: "bg-red-500/10 border-red-500/20",
      value:   "text-red-500 dark:text-red-400",
      text:    `💔 ${streak.count} trade loss streak`,
      hint:    "Reduce size and reset mentally",
    },
    none: {
      wrapper: "bg-card border-border",
      value:   "text-foreground",
      text:    "No active streak",
      hint:    "Waiting for next closed trade",
    },
  }[streak.type];

  // ── Loading state ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-6 md:p-8 flex items-center justify-center min-h-[60vh] gap-3">
        <Loader2 size={20} className="animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading dashboard...</span>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────

  if (fetchError) {
    return (
      <div className="p-6 md:p-8 flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <AlertCircle size={20} className="text-destructive" />
        <p className="text-sm font-medium text-foreground">Failed to load dashboard</p>
        <p className="text-sm text-muted-foreground max-w-xs text-center">{fetchError}</p>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────

  return (
    <div className="p-6 md:p-8">

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Welcome back{displayName ? `, ${displayName}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{today}</p>
        </div>
        <Link
          href="/trades/new"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 active:bg-primary/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Plus size={15} />
          Log Trade
        </Link>
      </div>

      {/* No-trades-today prompt */}
      {period === "1D" && d.trades === "0" && (
        <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-foreground">No trades logged today</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Start your session by logging your first trade.
            </p>
          </div>
          <Link
            href="/trades/new"
            className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus size={14} />
            Log Trade
          </Link>
        </div>
      )}

      {/* Always-on row: Total P/L + Current Streak + Best Setup */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">

        <div className="rounded-xl border border-border bg-card px-6 py-5 shadow-sm">
          <p className="text-xs text-muted-foreground mb-2">Total P/L</p>
          <p className={cn("text-4xl font-bold tabular-nums leading-none", totalPnlColor)}>
            {totalPnlFormatted}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            All time · {trades.length} closed {trades.length === 1 ? "trade" : "trades"}
          </p>
        </div>

        <div className={cn("rounded-xl border px-6 py-5 shadow-sm", streakStyle.wrapper)}>
          <p className="text-xs text-muted-foreground mb-2">Current Streak</p>
          <p className={cn("text-2xl font-bold leading-none mb-2", streakStyle.value)}>
            {streakStyle.text}
          </p>
          <p className="text-xs text-muted-foreground">{streakStyle.hint}</p>
        </div>

        <div className="rounded-xl border border-border bg-card px-6 py-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground">Best Setup</p>
            <Trophy size={13} className="text-amber-500 shrink-0" />
          </div>
          {bestSetup ? (
            <>
              <p className="text-2xl font-bold text-foreground leading-none mb-3 truncate">
                {bestSetup.name}
              </p>
              <div className="mb-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Win rate</span>
                  <span className="text-xs font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {bestSetup.winRate}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${bestSetup.winRate}%` }}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {bestSetup.trades} {bestSetup.trades === 1 ? "trade" : "trades"} · {bestSetup.totalPnl}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground mt-2">
              No setup data yet. Log your first trade with a setup to see stats.
            </p>
          )}
        </div>

      </div>

      {/* Period stats */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-muted-foreground">Performance</p>
          <div className="flex items-center gap-0.5 bg-muted rounded-lg p-1">
            {PERIODS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                  period === p
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label={`${PERIOD_LABELS[period]} P/L`}
            value={d.pl}
            valueColor={d.plColor}
            tint={d.plColor !== "default" ? d.plColor : undefined}
          />
          <StatCard
            label="Win Rate"
            value={d.winRate}
            subtitle={d.winRateSubtitle}
            meter={parseFloat(d.winRate)}
          />
          <StatCard
            label="Trades"
            value={d.trades}
            subtitle={PERIOD_LABELS[period]}
          />
        </div>
      </div>

      {/* Main content: chart + right sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2">
          <AccountGrowthChart data={growthData} accounts={growthConfigs} />
        </div>

        <div className="flex flex-col gap-4">

          {/* Total Account Balance */}
          <div className="rounded-xl border border-border bg-card px-5 py-4 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground mb-3">Total Account Balance</p>
            <p className="text-2xl font-bold text-foreground tabular-nums leading-none">
              ${totalAccountBalance.toLocaleString("en-US", { maximumFractionDigits: 0 })}
            </p>
            {accounts.length > 0 && (
              <div className="flex items-center gap-2 mt-1.5">
                <span className={cn(
                  "text-sm font-semibold tabular-nums",
                  totalBalanceChange > 0 ? "text-emerald-600" :
                  totalBalanceChange < 0 ? "text-red-500 dark:text-red-400" :
                  "text-muted-foreground"
                )}>
                  {balanceChangeFmt}
                </span>
                <span className={cn(
                  "text-xs font-medium rounded-md px-1.5 py-0.5 tabular-nums border",
                  totalBalanceChange > 0
                    ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                    : totalBalanceChange < 0
                    ? "text-red-500 dark:text-red-400 bg-red-500/10 border-red-500/20"
                    : "text-muted-foreground bg-muted border-border"
                )}>
                  {balancePctFmt}
                </span>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              {accounts.length === 0
                ? "No tracked accounts"
                : `Across ${accounts.length} tracked account${accounts.length === 1 ? "" : "s"}`}
            </p>
          </div>

          {/* Consistency Score */}
          <div className={cn(
            "rounded-xl border px-5 py-4 shadow-sm",
            isOverTarget ? "border-red-500/20 bg-red-500/[0.04]" : "border-border bg-card"
          )}>
            <p className="text-xs font-medium text-muted-foreground mb-3">Consistency Score</p>
            <div className="flex items-end justify-between mb-3">
              <p className={cn(
                "text-3xl font-bold tabular-nums leading-none",
                isOverTarget ? "text-red-500" : "text-foreground"
              )}>
                {consistencyValue}%
              </p>
              <span className={cn(
                "text-xs font-medium px-2 py-0.5 rounded-full border",
                isOverTarget
                  ? "text-red-500 dark:text-red-400 bg-red-500/10 border-red-500/20"
                  : "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
              )}>
                {isOverTarget ? "At Risk" : "Safe"}
              </span>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full mb-3">
              <div
                className={cn("h-full rounded-full", isOverTarget ? "bg-red-400" : "bg-emerald-500")}
                style={{ width: `${Math.min(consistencyValue, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Largest winning day as % of total P/L
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Target: Under {CONSISTENCY_TARGET}%
            </p>
          </div>

          {/* Eval Status */}
          <div className="rounded-xl border border-border bg-card px-5 py-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground">Eval Status</p>
              <Link
                href="/evaluations"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                View all
                <ExternalLink size={10} />
              </Link>
            </div>
            <div className="space-y-2.5">
              {EVAL_WIDGET_STATUSES.map((s) => {
                const count = accounts.filter((a) => a.status === s.status).length;
                return (
                  <div key={s.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn("w-2 h-2 rounded-full shrink-0", s.dot)} />
                      <span className="text-sm text-muted-foreground">{s.label}</span>
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-foreground">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Trophy, ExternalLink } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { AccountGrowthChart } from "@/components/dashboard/account-growth-chart";
import { cn } from "@/lib/utils";
import {
  MOCK_DASHBOARD_PERIOD_DATA,
  MOCK_STREAK,
  MOCK_BEST_SETUP,
  MOCK_CONSISTENCY,
  MOCK_TOTAL_PNL,
  MOCK_TOTAL_BALANCE,
  MOCK_TOTAL_BALANCE_CHANGE,
  MOCK_TOTAL_BALANCE_PCT,
  MOCK_TRACKED_ACCOUNT_COUNT,
  MOCK_EVAL_ACCOUNTS,
} from "@/lib/mock-data";
import type { EvaluationStatus } from "@/lib/types";

const PERIODS = ["1D", "1W", "1M", "YTD"] as const;
type Period = (typeof PERIODS)[number];

const PERIOD_LABELS: Record<Period, string> = {
  "1D":  "Today",
  "1W":  "This Week",
  "1M":  "This Month",
  "YTD": "Year to Date",
};

// Eval status widget config
const EVAL_WIDGET_STATUSES: { label: string; status: EvaluationStatus; dot: string }[] = [
  { label: "In Eval",  status: "In Eval",  dot: "bg-blue-500"    },
  { label: "Passed",   status: "Passed",   dot: "bg-amber-500"   },
  { label: "Funded",   status: "Funded",   dot: "bg-emerald-500" },
  { label: "Breached", status: "Breached", dot: "bg-red-500"     },
];

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>("1D");
  const d = MOCK_DASHBOARD_PERIOD_DATA[period];

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const isOverTarget = MOCK_CONSISTENCY.value > MOCK_CONSISTENCY.target;

  const streakStyle = {
    win: {
      wrapper: "bg-emerald-500/10 border-emerald-500/20",
      value:   "text-emerald-600 dark:text-emerald-400",
      text:    `🔥 ${MOCK_STREAK.count} trade win streak`,
      hint:    "Keep following your plan",
    },
    loss: {
      wrapper: "bg-red-500/10 border-red-500/20",
      value:   "text-red-500 dark:text-red-400",
      text:    `💔 ${MOCK_STREAK.count} trade loss streak`,
      hint:    "Reduce size and reset mentally",
    },
    none: {
      wrapper: "bg-card border-border",
      value:   "text-foreground",
      text:    "No active streak",
      hint:    "Waiting for next closed trade",
    },
  }[MOCK_STREAK.type];

  return (
    <div className="p-6 md:p-8">

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Welcome back, Alden</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{today}</p>
        </div>
        <Link
          href="/trades/new"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 active:bg-primary/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Plus size={15} />
          Log Trade
        </Link>
      </div>

      {/* No-trades-today prompt — only shown on 1D with zero trades */}
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
            className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus size={14} />
            Log Trade
          </Link>
        </div>
      )}

      {/* Always-on row: Total P/L + Current Streak + Best Setup */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">

        <div className="rounded-xl border border-primary/20 bg-primary/5 px-6 py-5 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Total P/L
          </p>
          <p className="text-4xl font-bold text-emerald-600 tabular-nums leading-none">
            {MOCK_TOTAL_PNL}
          </p>
          <p className="text-xs text-muted-foreground mt-2">All time</p>
        </div>

        <div className={cn("rounded-xl border px-6 py-5 shadow-sm", streakStyle.wrapper)}>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Current Streak
          </p>
          <p className={cn("text-2xl font-bold leading-none mb-2", streakStyle.value)}>
            {streakStyle.text}
          </p>
          <p className="text-xs text-muted-foreground">{streakStyle.hint}</p>
        </div>

        {/* Best Setup */}
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-6 py-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Best Setup
            </p>
            <Trophy size={13} className="text-amber-500 shrink-0" />
          </div>
          <p className="text-2xl font-bold text-foreground leading-none mb-3 truncate">
            {MOCK_BEST_SETUP.name}
          </p>
          <div className="mb-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Win rate</span>
              <span className="text-xs font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                {MOCK_BEST_SETUP.winRate}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${MOCK_BEST_SETUP.winRate}%` }}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {MOCK_BEST_SETUP.trades} trades · {MOCK_BEST_SETUP.totalPnl}
          </p>
        </div>

      </div>

      {/* Period stats */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Performance
          </p>
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

        {/* Account Growth Chart */}
        <div className="lg:col-span-2">
          <AccountGrowthChart />
        </div>

        {/* Right sidebar */}
        <div className="flex flex-col gap-4">

          {/* Total Account Balance */}
          <div className="rounded-xl border border-border bg-card px-5 py-4 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Total Account Balance
            </p>
            <p className="text-2xl font-bold text-foreground tabular-nums leading-none">
              ${MOCK_TOTAL_BALANCE.toLocaleString("en-US")}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-sm font-semibold text-emerald-600 tabular-nums">
                +${MOCK_TOTAL_BALANCE_CHANGE.toLocaleString("en-US")}
              </span>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-md px-1.5 py-0.5 tabular-nums">
                +{MOCK_TOTAL_BALANCE_PCT}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Across {MOCK_TRACKED_ACCOUNT_COUNT} tracked accounts
            </p>
          </div>

          {/* Consistency Score */}
          <div className={cn(
            "rounded-xl border px-5 py-4 shadow-sm",
            isOverTarget
              ? "border-red-500/20 bg-red-500/[0.04]"
              : "border-border bg-card"
          )}>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Consistency Score
            </p>
            <div className="flex items-end justify-between mb-3">
              <p
                className={cn(
                  "text-3xl font-bold tabular-nums leading-none",
                  isOverTarget ? "text-red-500" : "text-foreground"
                )}
              >
                {MOCK_CONSISTENCY.value}%
              </p>
              <span
                className={cn(
                  "text-xs font-medium px-2 py-0.5 rounded-full border",
                  isOverTarget
                    ? "text-red-500 dark:text-red-400 bg-red-500/10 border-red-500/20"
                    : "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                )}
              >
                {isOverTarget ? "At Risk" : "Safe"}
              </span>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full mb-3">
              <div
                className={cn(
                  "h-full rounded-full",
                  isOverTarget ? "bg-red-400" : "bg-emerald-500"
                )}
                style={{ width: `${MOCK_CONSISTENCY.value}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Largest winning day as % of total P/L
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Target: Under {MOCK_CONSISTENCY.target}%
            </p>
          </div>

          {/* Eval Status — counts derived from MOCK_EVAL_ACCOUNTS */}
          <div className="rounded-xl border border-border bg-card px-5 py-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Eval Status
              </p>
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
                const count = MOCK_EVAL_ACCOUNTS.filter((a) => a.status === s.status).length;
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

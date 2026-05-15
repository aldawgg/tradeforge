"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { AccountGrowthChart } from "@/components/dashboard/account-growth-chart";
import { cn } from "@/lib/utils";

const PERIODS = ["1D", "1W", "1M", "YTD"] as const;
type Period = (typeof PERIODS)[number];

const PERIOD_LABELS: Record<Period, string> = {
  "1D":  "Today",
  "1W":  "This Week",
  "1M":  "This Month",
  "YTD": "Year to Date",
};

const PERIOD_DATA: Record<
  Period,
  {
    pl: string;
    plColor: "green" | "red" | "default";
    winRate: string;
    winRateSubtitle: string;
    trades: string;
  }
> = {
  "1D":  { pl: "+$250",   plColor: "green", winRate: "60%", winRateSubtitle: "3 of 5 trades",     trades: "5"   },
  "1W":  { pl: "+$780",   plColor: "green", winRate: "55%", winRateSubtitle: "12 of 22 trades",   trades: "22"  },
  "1M":  { pl: "+$2,150", plColor: "green", winRate: "58%", winRateSubtitle: "50 of 87 trades",   trades: "87"  },
  "YTD": { pl: "+$8,400", plColor: "green", winRate: "52%", winRateSubtitle: "162 of 312 trades", trades: "312" },
};

const STREAK = {
  type: "win" as "win" | "loss" | "none",
  count: 4,
};

const EVAL_STATUSES = [
  { label: "In Eval",  count: 3, dot: "bg-blue-500"    },
  { label: "Passed",   count: 1, dot: "bg-amber-500"   },
  { label: "Funded",   count: 2, dot: "bg-emerald-500" },
  { label: "Breached", count: 1, dot: "bg-red-500"     },
];

const CONSISTENCY = { value: 28, target: 30 };

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>("1D");
  const d = PERIOD_DATA[period];

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const isOverTarget = CONSISTENCY.value > CONSISTENCY.target;

  const streakStyle = {
    win: {
      wrapper: "bg-emerald-500/10 border-emerald-500/20",
      value:   "text-emerald-600 dark:text-emerald-400",
      text:    `🔥 ${STREAK.count} trade win streak`,
      hint:    "Keep following your plan",
    },
    loss: {
      wrapper: "bg-red-500/10 border-red-500/20",
      value:   "text-red-500 dark:text-red-400",
      text:    `💔 ${STREAK.count} trade loss streak`,
      hint:    "Reduce size and reset mentally",
    },
    none: {
      wrapper: "bg-card border-border",
      value:   "text-foreground",
      text:    "No active streak",
      hint:    "Waiting for next closed trade",
    },
  }[STREAK.type];

  return (
    <div className="p-6 md:p-8 max-w-6xl">

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Welcome back, Alden</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{today}</p>
        </div>
        <Link
          href="/trades/add"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus size={14} />
          Log Trade
        </Link>
      </div>

      {/* Always-on row: Total P/L + Current Streak */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">

        <div className="rounded-xl border border-primary/20 bg-primary/5 px-6 py-5 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Total P/L
          </p>
          <p className="text-4xl font-bold text-emerald-600 tabular-nums leading-none">
            +$8,400
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

      </div>

      {/* Period stats */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Period View
          </p>
          <div className="flex items-center gap-0.5 bg-muted rounded-lg p-1">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-md transition-colors",
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
          />
          <StatCard
            label="Win Rate"
            value={d.winRate}
            subtitle={d.winRateSubtitle}
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
            <p className="text-3xl font-bold text-foreground tabular-nums leading-none">
              $154,250
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-sm font-semibold text-emerald-600 tabular-nums">
                +$4,250
              </span>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-md px-1.5 py-0.5 tabular-nums">
                +2.83%
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Across 4 tracked accounts</p>
          </div>

          {/* Consistency Score */}
          <div className="rounded-xl border border-border bg-card px-5 py-4 shadow-sm">
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
                {CONSISTENCY.value}%
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
                  "h-full rounded-full transition-all",
                  isOverTarget ? "bg-red-400" : "bg-emerald-500"
                )}
                style={{ width: `${CONSISTENCY.value}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Largest winning day of total profit
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Target: Under {CONSISTENCY.target}%
            </p>
          </div>

          {/* Eval Status */}
          <div className="rounded-xl border border-border bg-card px-5 py-4 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Eval Status
            </p>
            <div className="space-y-2.5">
              {EVAL_STATUSES.map((s) => (
                <div key={s.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={cn("w-2 h-2 rounded-full shrink-0", s.dot)} />
                    <span className="text-sm text-muted-foreground">{s.label}</span>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-foreground">
                    {s.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

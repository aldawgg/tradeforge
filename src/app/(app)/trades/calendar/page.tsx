"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

interface DayData {
  trades: number;
  wins: number;
  grossWin: number;
  grossLoss: number;
}

// ── Placeholder data (May 2026) ───────────────────────────────────────────────

const PLACEHOLDER_DAYS: Record<string, DayData> = {
  "2026-05-01": { trades: 3, wins: 2, grossWin: 320,  grossLoss: 140 },
  "2026-05-04": { trades: 4, wins: 3, grossWin: 450,  grossLoss: 130 },
  "2026-05-05": { trades: 2, wins: 1, grossWin: 180,  grossLoss: 200 },
  "2026-05-06": { trades: 5, wins: 4, grossWin: 620,  grossLoss: 110 },
  "2026-05-07": { trades: 3, wins: 2, grossWin: 290,  grossLoss: 160 },
  "2026-05-08": { trades: 2, wins: 0, grossWin: 0,    grossLoss: 280 },
  "2026-05-11": { trades: 4, wins: 3, grossWin: 510,  grossLoss: 120 },
  "2026-05-12": { trades: 3, wins: 2, grossWin: 340,  grossLoss: 130 },
  "2026-05-13": { trades: 2, wins: 2, grossWin: 260,  grossLoss: 0   },
  "2026-05-14": { trades: 5, wins: 2, grossWin: 300,  grossLoss: 350 },
  "2026-05-15": { trades: 3, wins: 3, grossWin: 480,  grossLoss: 0   },
  "2026-05-19": { trades: 4, wins: 3, grossWin: 420,  grossLoss: 110 },
  "2026-05-20": { trades: 2, wins: 1, grossWin: 150,  grossLoss: 190 },
  "2026-05-21": { trades: 3, wins: 2, grossWin: 310,  grossLoss: 140 },
  "2026-05-22": { trades: 4, wins: 3, grossWin: 490,  grossLoss: 120 },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function dateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function netPnl(d: DayData): number {
  return d.grossWin - d.grossLoss;
}

function winRate(d: DayData): number {
  return d.trades > 0 ? Math.round((d.wins / d.trades) * 100) : 0;
}

function fmtPnl(n: number): string {
  return (n >= 0 ? "+" : "") + "$" + Math.abs(n).toLocaleString();
}

function fmtPnlShort(n: number): string {
  const abs = Math.abs(n);
  const s = abs >= 1000 ? `$${(abs / 1000).toFixed(1)}k` : `$${abs}`;
  return (n >= 0 ? "+" : "-") + s;
}

/** Returns weeks (Mon–Sun) for a given year/month. Days outside the month are null. */
function getMonthWeeks(year: number, month: number): (Date | null)[][] {
  const weeks: (Date | null)[][] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);

  // Monday=0 offset
  const startOffset = (firstDay.getDay() + 6) % 7;
  let cursor = new Date(firstDay);
  cursor.setDate(cursor.getDate() - startOffset);

  while (cursor <= lastDay || cursor.getDay() !== 1) {
    const week: (Date | null)[] = [];
    for (let i = 0; i < 7; i++) {
      const inMonth = cursor.getMonth() === month && cursor.getFullYear() === year;
      week.push(inMonth ? new Date(cursor) : null);
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
    if (cursor > lastDay && (cursor.getDay() === 1 || cursor.getMonth() !== month)) break;
  }
  return weeks;
}

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_LABELS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

// ── Stats computation ─────────────────────────────────────────────────────────

function computeStats(days: Record<string, DayData>, year: number, month: number) {
  const entries = Object.entries(days).filter(([k]) => {
    const d = new Date(k);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const data = entries.map(([, v]) => v);
  const totalTrades = data.reduce((s, d) => s + d.trades, 0);
  const totalWins   = data.reduce((s, d) => s + d.wins, 0);
  const grossWin    = data.reduce((s, d) => s + d.grossWin, 0);
  const grossLoss   = data.reduce((s, d) => s + d.grossLoss, 0);
  const netPnlTotal = grossWin - grossLoss;

  const winRatePct = totalTrades > 0 ? Math.round((totalWins / totalTrades) * 100) : 0;
  const profitFactor = grossLoss > 0 ? parseFloat((grossWin / grossLoss).toFixed(2)) : grossWin > 0 ? Infinity : 0;
  const avgWin  = totalWins > 0 ? Math.round(grossWin / totalWins) : 0;
  const totalLosses = totalTrades - totalWins;
  const avgLoss = totalLosses > 0 ? Math.round(grossLoss / totalLosses) : 0;
  const expectancy = totalTrades > 0
    ? parseFloat(((winRatePct / 100) * avgWin - (1 - winRatePct / 100) * avgLoss).toFixed(0))
    : 0;

  // Day streak: consecutive profitable/unprofitable trading days ending at most recent
  const sortedKeys = entries.map(([k]) => k).sort();
  let dayStreak = 0;
  if (sortedKeys.length > 0) {
    const lastNet = netPnl(days[sortedKeys[sortedKeys.length - 1]]);
    const positive = lastNet > 0;
    for (let i = sortedKeys.length - 1; i >= 0; i--) {
      const n = netPnl(days[sortedKeys[i]]);
      if (positive ? n > 0 : n < 0) dayStreak++;
      else break;
    }
    if (!positive) dayStreak = -dayStreak;
  }

  // Trade streak: consecutive win/loss trades (flatten all trades by day order)
  let tradeStreak = 0;
  if (sortedKeys.length > 0) {
    const lastDay = days[sortedKeys[sortedKeys.length - 1]];
    const lastPositive = lastDay.wins > lastDay.trades - lastDay.wins;
    for (let i = sortedKeys.length - 1; i >= 0; i--) {
      const d = days[sortedKeys[i]];
      const wins = d.wins;
      const losses = d.trades - d.wins;
      if (lastPositive) {
        if (losses > 0 && tradeStreak > 0) break;
        tradeStreak += wins;
        if (losses > 0) break;
      } else {
        if (wins > 0 && tradeStreak > 0) break;
        tradeStreak += losses;
        if (wins > 0) break;
      }
    }
    if (!lastPositive) tradeStreak = -tradeStreak;
  }

  return { winRatePct, profitFactor, expectancy, avgWin, avgLoss, netPnlTotal, dayStreak, tradeStreak, totalTrades };
}

// ── Stat pill ─────────────────────────────────────────────────────────────────

function StatPill({
  label,
  value,
  sub,
  color,
  meter,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: "green" | "red" | "default";
  meter?: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm flex flex-col gap-1.5 min-w-[110px]">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-none">
        {label}
      </p>
      <p
        className={cn(
          "text-lg font-bold tabular-nums leading-none",
          color === "green" && "text-emerald-600 dark:text-emerald-400",
          color === "red"   && "text-red-500 dark:text-red-400",
          (!color || color === "default") && "text-foreground"
        )}
      >
        {value}
      </p>
      {meter !== undefined && (
        <div className="h-1 rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              meter >= 60 ? "bg-emerald-500" : meter >= 40 ? "bg-amber-400" : "bg-red-400"
            )}
            style={{ width: `${Math.min(meter, 100)}%` }}
          />
        </div>
      )}
      {sub && (
        <p className="text-xs text-muted-foreground leading-none">{sub}</p>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TradeCalendarPage() {
  const today = new Date();
  const [year, setYear]   = useState(2026);
  const [month, setMonth] = useState(4); // 0-indexed, 4 = May

  const stats  = computeStats(PLACEHOLDER_DAYS, year, month);
  const weeks  = getMonthWeeks(year, month);

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  const todayKey = dateKey(today);

  return (
    <div className="p-6 md:p-8">

      {/* Back link */}
      <div className="mb-5">
        <Link
          href="/trades"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} />
          Trades
        </Link>
      </div>

      {/* Header + month nav */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-foreground">Trade Calendar</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Previous month"
            onClick={prevMonth}
            className="p-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-semibold text-foreground min-w-[120px] text-center">
            {MONTH_NAMES[month]} {year}
          </span>
          <button
            type="button"
            aria-label="Next month"
            onClick={nextMonth}
            className="p-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Stats — empty state or metrics */}
      {stats.totalTrades === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 px-6 py-8 flex flex-col items-center text-center gap-3 mb-6">
          <p className="text-sm font-medium text-foreground">
            No trades logged for {MONTH_NAMES[month]} {year}
          </p>
          <p className="text-xs text-muted-foreground max-w-xs">
            Log trades to see your win rate, P&L, profit factor, and streaks for this month.
          </p>
          <Link
            href="/trades/new"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors mt-1"
          >
            Log a trade
          </Link>
        </div>
      ) : (
        <>
      {/* Stats — tier 1: primary metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {/* Win Rate hero card */}
        <div className="rounded-xl border border-border bg-card px-5 py-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Win Rate
          </p>
          <p
            className={cn(
              "text-3xl font-bold tabular-nums leading-none mb-3",
              stats.winRatePct >= 60
                ? "text-emerald-600 dark:text-emerald-400"
                : stats.winRatePct >= 40
                ? "text-foreground"
                : "text-red-500 dark:text-red-400"
            )}
          >
            {stats.winRatePct}%
          </p>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                stats.winRatePct >= 60
                  ? "bg-emerald-500"
                  : stats.winRatePct >= 40
                  ? "bg-amber-400"
                  : "bg-red-400"
              )}
              style={{ width: `${Math.min(stats.winRatePct, 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {stats.totalTrades} trades this month
          </p>
        </div>

        {/* Net P&L hero card */}
        <div className="rounded-xl border border-border bg-card px-5 py-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Net P&L
          </p>
          <p
            className={cn(
              "text-3xl font-bold tabular-nums leading-none",
              stats.netPnlTotal >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-500 dark:text-red-400"
            )}
          >
            {fmtPnl(stats.netPnlTotal)}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {MONTH_NAMES[month]} {year}
          </p>
        </div>
      </div>

      {/* Stats — tier 2: secondary metrics in two labeled groups */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Performance
          </p>
          <div className="flex flex-wrap gap-2">
            <StatPill
              label="Profit Factor"
              value={stats.profitFactor === Infinity ? "—" : String(stats.profitFactor)}
              sub={stats.profitFactor === Infinity ? "all wins" : "gross win / gross loss"}
              color={stats.profitFactor >= 1.5 ? "green" : stats.profitFactor >= 1 ? "default" : "red"}
            />
            <StatPill
              label="Expectancy"
              value={`$${stats.expectancy}`}
              color={stats.expectancy > 0 ? "green" : stats.expectancy < 0 ? "red" : "default"}
              sub="avg return per trade"
            />
            <StatPill
              label="Avg Win"
              value={`$${stats.avgWin}`}
              color="green"
            />
            <StatPill
              label="Avg Loss"
              value={`$${stats.avgLoss}`}
              color="red"
            />
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Streaks
          </p>
          <div className="flex gap-2">
            <StatPill
              label="Day Streak"
              value={stats.dayStreak === 0 ? "—" : `${Math.abs(stats.dayStreak)}${stats.dayStreak > 0 ? "W" : "L"}`}
              color={stats.dayStreak > 0 ? "green" : stats.dayStreak < 0 ? "red" : "default"}
              sub={stats.dayStreak > 0 ? "winning days" : stats.dayStreak < 0 ? "losing days" : ""}
            />
            <StatPill
              label="Trade Streak"
              value={stats.tradeStreak === 0 ? "—" : `${Math.abs(stats.tradeStreak)}${stats.tradeStreak > 0 ? "W" : "L"}`}
              color={stats.tradeStreak > 0 ? "green" : stats.tradeStreak < 0 ? "red" : "default"}
              sub={stats.tradeStreak > 0 ? "winning trades" : stats.tradeStreak < 0 ? "losing trades" : ""}
            />
          </div>
        </div>
      </div>
        </>
      )}

      {/* Calendar */}
      <div className="overflow-x-auto">
        <div className="min-w-[720px]">
          {/* Day labels row */}
          <div className="flex mb-1">
            {DAY_LABELS.map((d) => (
              <div key={d} className="flex-1 text-center text-xs font-medium text-muted-foreground py-1">
                {d}
              </div>
            ))}
            <div className="w-[88px] shrink-0 text-center text-xs font-semibold text-muted-foreground py-1 bg-muted/60 rounded-md">
              WK
            </div>
          </div>

          {/* Weeks */}
          <div className="space-y-1.5">
            {weeks.map((week, wi) => {
              // Week summary
              const weekDays = week.filter(Boolean) as Date[];
              const weekData = weekDays
                .map((d) => PLACEHOLDER_DAYS[dateKey(d)])
                .filter(Boolean) as DayData[];
              const weekTrades = weekData.reduce((s, d) => s + d.trades, 0);
              const weekNet    = weekData.reduce((s, d) => s + netPnl(d), 0);

              return (
                <div key={wi} className="flex gap-1.5">
                  {week.map((date, di) => {
                    const isWeekend = di >= 5;
                    if (!date) {
                      return (
                        <div
                          key={di}
                          className={cn(
                            "flex-1 rounded-xl border border-dashed border-border/40 h-[88px]",
                            isWeekend ? "bg-muted/20" : "bg-muted/10"
                          )}
                        />
                      );
                    }
                    const key  = dateKey(date);
                    const data = PLACEHOLDER_DAYS[key];
                    const net  = data ? netPnl(data) : null;
                    const wr   = data ? winRate(data) : null;
                    const isToday = key === todayKey;
                    const isProfit = net !== null && net > 0;
                    const isLoss   = net !== null && net < 0;

                    return (
                      <div
                        key={di}
                        className={cn(
                          "flex-1 rounded-xl border h-[88px] px-2.5 py-2 flex flex-col gap-1 cursor-default",
                          isToday
                            ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                            : "border-border",
                          !isToday && isWeekend && "bg-muted/20",
                          !isToday && isProfit  && "bg-emerald-500/[0.06] dark:bg-emerald-500/[0.08]",
                          !isToday && isLoss    && "bg-red-500/[0.06] dark:bg-red-500/[0.08]",
                          !isToday && !data && !isWeekend && "bg-card",
                          !isToday && data && !isProfit && !isLoss && "bg-card"
                        )}
                      >
                        {/* Date number */}
                        <span
                          className={cn(
                            "text-xs font-semibold leading-none",
                            isToday ? "text-primary" : "text-muted-foreground"
                          )}
                        >
                          {date.getDate()}
                        </span>

                        {data ? (
                          <>
                            {/* Net P&L */}
                            <span
                              className={cn(
                                "text-sm font-bold tabular-nums leading-none",
                                isProfit ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"
                              )}
                            >
                              {fmtPnlShort(net!)}
                            </span>

                            {/* Trade count + win rate */}
                            <div className="flex items-center gap-1.5 mt-auto">
                              <span className="text-xs text-muted-foreground">
                                {data.trades} {data.trades === 1 ? "trade" : "trades"}
                              </span>
                              <span
                                className={cn(
                                  "text-xs font-semibold px-1 py-0.5 rounded",
                                  wr! >= 60
                                    ? "text-emerald-700 dark:text-emerald-400 bg-emerald-500/10"
                                    : wr! >= 40
                                    ? "text-amber-700 dark:text-amber-400 bg-amber-500/10"
                                    : "text-red-600 dark:text-red-400 bg-red-500/10"
                                )}
                              >
                                {wr}%
                              </span>
                            </div>
                          </>
                        ) : !isWeekend ? (
                          <span className="text-xs text-muted-foreground/40 mt-auto">
                            No trades
                          </span>
                        ) : null}
                      </div>
                    );
                  })}

                  {/* Week summary column */}
                  <div className="w-[88px] shrink-0 rounded-xl border border-border/40 bg-muted h-[88px] px-3 py-2 flex flex-col gap-1">
                    <span className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wide leading-none">
                      WK
                    </span>
                    {weekTrades > 0 ? (
                      <div className="flex flex-col gap-0.5 mt-auto">
                        <span className="text-xs text-muted-foreground">
                          {weekTrades} trades
                        </span>
                        <span
                          className={cn(
                            "text-sm font-bold tabular-nums",
                            weekNet >= 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-red-500 dark:text-red-400"
                          )}
                        >
                          {fmtPnlShort(weekNet)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground/30 mt-auto">—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { MOCK_EVAL_ACCOUNTS } from "@/lib/mock-data";
import type { EvaluationAccount, EvaluationStatus } from "@/lib/types";

// ── Filter tabs ────────────────────────────────────────────────────────────

const FILTER_TABS = ["All", "Evaluation", "Funded", "Passed", "Breached"] as const;
type FilterTab = (typeof FILTER_TABS)[number];

function filterAccounts(accounts: EvaluationAccount[], filter: FilterTab): EvaluationAccount[] {
  switch (filter) {
    case "All":        return accounts;
    case "Evaluation": return accounts.filter((a) => a.status === "In Eval" || a.status === "Not Started");
    case "Funded":     return accounts.filter((a) => a.status === "Funded");
    case "Passed":     return accounts.filter((a) => a.status === "Passed");
    case "Breached":   return accounts.filter((a) => a.status === "Breached");
  }
}

// ── Style maps ─────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<EvaluationStatus, string> = {
  "Not Started": "text-muted-foreground bg-muted border-border",
  "In Eval":     "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20",
  "Passed":      "text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
  "Funded":      "text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  "Breached":    "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20",
};

const STATUS_DOT: Record<EvaluationStatus, string> = {
  "Not Started": "bg-muted-foreground",
  "In Eval":     "bg-blue-500",
  "Passed":      "bg-amber-500",
  "Funded":      "bg-emerald-500",
  "Breached":    "bg-red-500",
};

// ── Helpers ────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function fmtDiff(n: number): string {
  const abs = Math.abs(n).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
  return n >= 0 ? `+${abs}` : `-${abs}`;
}

function calcProgress(account: EvaluationAccount): number | null {
  if (account.status === "Passed") return 100;
  if (account.status === "Funded" || account.status === "Breached") return null;
  if (!account.profitTarget) return null;
  const range = account.profitTarget - account.startingBalance;
  if (range <= 0) return null;
  const gained = account.currentBalance - account.startingBalance;
  return Math.min(100, Math.max(0, (gained / range) * 100));
}

// ── Sub-components ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: EvaluationStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border",
        STATUS_BADGE[status]
      )}
    >
      {status}
    </span>
  );
}

function AccountCard({ account }: { account: EvaluationAccount }) {
  const progress = calcProgress(account);
  const balanceDiff = account.currentBalance - account.startingBalance;
  const isProfit = balanceDiff >= 0;
  const threshold = account.consistencyThreshold ?? 30;
  const consistencyAtRisk = account.consistency !== null && account.consistency >= threshold;

  const showStartTarget =
    account.status !== "In Eval" && account.status !== "Not Started";

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-border">

        {/* Left: Identity */}
        <div className="px-5 py-4 lg:w-52 shrink-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {account.accountName}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {account.firm} · {fmt(account.accountSize)}
              </p>
              <div className="mt-2.5">
                <StatusBadge status={account.status} />
              </div>
            </div>
            <Link
              href={`/evaluations/${account.id}/edit`}
              title="Edit account"
              className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <Pencil size={16} />
            </Link>
          </div>
        </div>

        {/* Middle: Balance + Progress */}
        <div className="px-5 py-4 flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-3 mb-3">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Current balance</p>
              <p
                className={cn(
                  "text-xl font-bold tabular-nums leading-none",
                  account.status === "Breached"
                    ? "text-red-500 dark:text-red-400"
                    : "text-foreground"
                )}
              >
                {fmt(account.currentBalance)}
              </p>
            </div>
            <span
              className={cn(
                "text-sm font-semibold tabular-nums shrink-0",
                isProfit
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-500 dark:text-red-400"
              )}
            >
              {fmtDiff(balanceDiff)}
            </span>
          </div>

          {account.status === "Funded" && (
            <div className="flex items-center gap-2.5">
              <div className="flex-1 h-1.5 bg-emerald-500/20 rounded-full">
                <div className="h-full w-full rounded-full bg-emerald-500" />
              </div>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 shrink-0">
                Funded
              </span>
            </div>
          )}

          {account.status === "Passed" && (
            <div className="flex items-center gap-2.5">
              <div className="flex-1 h-1.5 bg-amber-500/20 rounded-full">
                <div className="h-full w-full rounded-full bg-amber-500" />
              </div>
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400 shrink-0">
                Target reached · 100%
              </span>
            </div>
          )}

          {account.status === "Breached" && (
            <div className="flex items-center gap-2.5">
              <div className="flex-1 h-1.5 bg-red-500/10 rounded-full" />
              <span className="text-xs font-medium text-red-500 dark:text-red-400 shrink-0">
                Breached
              </span>
            </div>
          )}

          {(account.status === "In Eval" || account.status === "Not Started") &&
            progress !== null &&
            account.profitTarget !== null && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-muted-foreground">
                    Target: {fmt(account.profitTarget)}
                  </span>
                  <span className="text-xs font-semibold tabular-nums text-blue-600 dark:text-blue-400">
                    {progress.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  {fmt(account.profitTarget - account.currentBalance)} to target
                </p>
              </div>
            )}

          {showStartTarget && (
            <div className="flex items-center gap-4 mt-2.5 text-xs text-muted-foreground">
              <span>Start: {fmt(account.startingBalance)}</span>
              {account.profitTarget !== null && (
                <span>Target: {fmt(account.profitTarget)}</span>
              )}
            </div>
          )}
        </div>

        {/* Right: Risk Stats */}
        <div className="px-5 py-4 lg:w-64 shrink-0">
          <div className="grid grid-cols-2 gap-x-5 gap-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Max drawdown</p>
              <p className="text-sm font-semibold tabular-nums text-foreground">
                {fmt(account.maxDrawdown)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Daily limit</p>
              <p className="text-sm font-semibold tabular-nums text-foreground">
                {fmt(account.dailyLossLimit)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Trading days</p>
              <p className="text-sm font-semibold tabular-nums text-foreground">
                {account.minTradingDays > 0
                  ? `${account.completedTradingDays} / ${account.minTradingDays}`
                  : `${account.completedTradingDays} days`}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Consistency</p>
              {account.consistency !== null ? (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p
                    className={cn(
                      "text-sm font-semibold tabular-nums",
                      consistencyAtRisk
                        ? "text-red-500 dark:text-red-400"
                        : "text-foreground"
                    )}
                  >
                    {account.consistency}%
                  </p>
                  <span
                    className={cn(
                      "text-xs font-medium px-1.5 py-0.5 rounded border",
                      consistencyAtRisk
                        ? "text-red-500 dark:text-red-400 bg-red-500/10 border-red-500/20"
                        : "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                    )}
                  >
                    {consistencyAtRisk ? "At Risk" : "Safe"}
                  </span>
                </div>
              ) : (
                <p className="text-sm font-semibold text-muted-foreground">N/A</p>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Notes: full-width, conditional */}
      {account.notes && (
        <div className="border-t border-border px-5 py-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {account.notes}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function EvaluationsPage() {
  const [activeFilter, setActiveFilter] = useState<FilterTab>("All");

  const filteredAccounts = filterAccounts(MOCK_EVAL_ACCOUNTS, activeFilter);

  const total    = MOCK_EVAL_ACCOUNTS.length;
  const inEval   = MOCK_EVAL_ACCOUNTS.filter((a) => a.status === "In Eval").length;
  const passed   = MOCK_EVAL_ACCOUNTS.filter((a) => a.status === "Passed").length;
  const funded   = MOCK_EVAL_ACCOUNTS.filter((a) => a.status === "Funded").length;
  const breached = MOCK_EVAL_ACCOUNTS.filter((a) => a.status === "Breached").length;

  const concluded = passed + funded + breached;
  const passRate  = concluded > 0 ? Math.round(((passed + funded) / concluded) * 100) : null;

  return (
    <div className="p-6 md:p-8">

      {/* Page header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Evaluation Tracker
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track prop firm accounts, progress, consistency, and risk.
          </p>
        </div>
        <Link
          href="/evaluations/new"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 active:bg-primary/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Plus size={14} />
          Add Account
        </Link>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <div className="rounded-xl border border-border bg-card px-4 py-3.5 shadow-sm cursor-default select-none">
          <p className="text-xs font-medium text-muted-foreground mb-2">Total Accounts</p>
          <div className="flex items-baseline gap-2.5">
            <p className="text-2xl font-bold tabular-nums leading-none text-foreground">{total}</p>
            {passRate !== null && (
              <span
                className={cn(
                  "text-xs font-semibold tabular-nums",
                  passRate >= 66
                    ? "text-emerald-600 dark:text-emerald-400"
                    : passRate >= 33
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-red-500 dark:text-red-400"
                )}
              >
                {passRate}% pass rate
              </span>
            )}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3.5 shadow-sm cursor-default select-none">
          <div className="flex items-center gap-1.5 mb-2">
            <span className={cn("w-2 h-2 rounded-full shrink-0", STATUS_DOT["In Eval"])} />
            <p className="text-xs font-medium text-muted-foreground">In Eval</p>
          </div>
          <p className="text-2xl font-bold tabular-nums leading-none text-blue-600 dark:text-blue-400">{inEval}</p>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3.5 shadow-sm cursor-default select-none">
          <div className="flex items-center gap-1.5 mb-2">
            <span className={cn("w-2 h-2 rounded-full shrink-0", STATUS_DOT["Passed"])} />
            <p className="text-xs font-medium text-muted-foreground">Passed</p>
          </div>
          <p className="text-2xl font-bold tabular-nums leading-none text-amber-600 dark:text-amber-400">{passed}</p>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3.5 shadow-sm cursor-default select-none">
          <div className="flex items-center gap-1.5 mb-2">
            <span className={cn("w-2 h-2 rounded-full shrink-0", STATUS_DOT["Funded"])} />
            <p className="text-xs font-medium text-muted-foreground">Funded</p>
          </div>
          <p className="text-2xl font-bold tabular-nums leading-none text-emerald-600 dark:text-emerald-400">{funded}</p>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3.5 shadow-sm cursor-default select-none">
          <div className="flex items-center gap-1.5 mb-2">
            <span className={cn("w-2 h-2 rounded-full shrink-0", STATUS_DOT["Breached"])} />
            <p className="text-xs font-medium text-muted-foreground">Breached</p>
          </div>
          <p className="text-2xl font-bold tabular-nums leading-none text-red-500 dark:text-red-400">{breached}</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-0.5 bg-muted rounded-lg p-1">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveFilter(tab)}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                activeFilter === tab
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {filteredAccounts.length} {filteredAccounts.length === 1 ? "account" : "accounts"}
        </p>
      </div>

      {/* Account list */}
      {filteredAccounts.length > 0 ? (
        <div className="flex flex-col gap-4">
          {filteredAccounts.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card px-6 py-14 text-center shadow-sm">
          <p className="text-sm font-semibold text-foreground mb-1.5">
            {activeFilter === "All"
              ? "No evaluation accounts yet."
              : `No ${activeFilter.toLowerCase()} accounts.`}
          </p>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
            {activeFilter === "All"
              ? "Track your first prop firm account to monitor progress, consistency, and risk."
              : `Switch to All to see all accounts, or add a new ${activeFilter.toLowerCase()} account.`}
          </p>
          {activeFilter === "All" && (
            <Link
              href="/evaluations/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 active:bg-primary/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Plus size={14} />
              Add your first account
            </Link>
          )}
        </div>
      )}

    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Loader2, AlertCircle, CheckCircle2, AlertTriangle, EyeOff, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { EvaluationAccount, EvaluationStatus } from "@/lib/types";

// ── Filter tabs ────────────────────────────────────────────────────────────

const FILTER_TABS = ["All", "Evaluation", "Funded", "Passed", "Breached"] as const;
type FilterTab = (typeof FILTER_TABS)[number];

function filterAccounts(accounts: EvaluationAccount[], filter: FilterTab, hiddenIds: Set<string>): EvaluationAccount[] {
  const visible = (a: EvaluationAccount) => !hiddenIds.has(a.id);
  switch (filter) {
    case "All":        return accounts.filter(visible);
    case "Evaluation": return accounts.filter((a) => visible(a) && (a.status === "In Eval" || a.status === "Not Started"));
    case "Funded":     return accounts.filter((a) => visible(a) && a.status === "Funded");
    case "Passed":     return accounts.filter((a) => visible(a) && a.status === "Passed");
    case "Breached":   return accounts.filter((a) => a.status === "Breached"); // shows hidden accounts so they can be unhidden
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

// ── Row mapper ─────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): EvaluationAccount {
  return {
    id: row.id as string,
    firm: row.prop_firm_name as string,
    accountName: row.account_name as string,
    accountSize: Number(row.account_size),
    startingBalance: Number(row.starting_balance),
    currentBalance: Number(row.current_balance),
    profitTarget: row.profit_target != null ? Number(row.profit_target) : null,
    maxDrawdown: Number(row.max_drawdown),
    dailyLossLimit: Number(row.daily_loss_limit),
    minTradingDays: Number(row.minimum_trading_days),
    completedTradingDays: Number(row.completed_trading_days),
    status: row.status as EvaluationStatus,
    consistency: row.consistency != null ? Number(row.consistency) : null,
    consistencyThreshold:
      row.consistency_threshold != null ? Number(row.consistency_threshold) : null,
    notes: (row.notes as string) ?? "",
  };
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

interface AccountCardProps {
  account: EvaluationAccount;
  confirmDelete: boolean;
  confirmFunded: boolean;
  deleting: boolean;
  updatingStatus: boolean;
  isHidden: boolean;
  onHide: () => void;
  onUnhide: () => void;
  onDeleteRequest: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
  onMarkPassed: () => void;
  onMarkBreached: () => void;
  onMarkFundedRequest: () => void;
  onMarkFundedConfirm: () => void;
  onMarkFundedCancel: () => void;
}

function AccountCard({
  account,
  confirmDelete,
  confirmFunded,
  deleting,
  updatingStatus,
  isHidden,
  onHide,
  onUnhide,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
  onMarkPassed,
  onMarkBreached,
  onMarkFundedRequest,
  onMarkFundedConfirm,
  onMarkFundedCancel,
}: AccountCardProps) {
  const progress = calcProgress(account);

  // ── Status suggestion logic ──────────────────────────────────────────────
  const passBalanceReached =
    account.profitTarget !== null &&
    account.currentBalance >= account.profitTarget;
  const passDaysReached =
    account.minTradingDays === 0 ||
    account.completedTradingDays >= account.minTradingDays;
  const showPassSuggestion =
    passBalanceReached &&
    passDaysReached &&
    account.status !== "Passed" &&
    account.status !== "Funded" &&
    account.status !== "Breached";

  const breachLevel =
    account.maxDrawdown > 0
      ? account.startingBalance - account.maxDrawdown
      : null;
  const showBreachSuggestion =
    breachLevel !== null &&
    account.currentBalance <= breachLevel &&
    account.status !== "Breached";

  const showFundedTransition = account.status === "Passed";

  const hasSuggestions = showPassSuggestion || showBreachSuggestion || showFundedTransition;
  const balanceDiff = account.currentBalance - account.startingBalance;
  const isProfit = balanceDiff >= 0;
  const threshold = account.consistencyThreshold ?? 30;
  const consistencyAtRisk = account.consistency !== null && account.consistency >= threshold;

  // Drawdown buffer health for funded accounts.
  // Formula: bufferRemaining / totalBuffer * 100
  //   breachLevel    = startingBalance - maxDrawdown  (already computed above)
  //   bufferRemaining = currentBalance - breachLevel
  //   totalBuffer     = startingBalance - breachLevel  (= maxDrawdown)
  const hasFundedHealth = breachLevel !== null && account.maxDrawdown > 0;
  const fundedHealthPct = hasFundedHealth
    ? Math.min(100, Math.max(0, (account.currentBalance - (breachLevel as number)) / account.maxDrawdown * 100))
    : 0;
  const fundedFillColor =
    !hasFundedHealth  ? "" :
    fundedHealthPct > 75 ? "bg-emerald-500" :
    fundedHealthPct > 50 ? "bg-teal-500" :
    fundedHealthPct > 25 ? "bg-amber-500" :
    fundedHealthPct > 10 ? "bg-orange-500" :
                           "bg-red-500";
  const fundedTrackColor =
    !hasFundedHealth  ? "bg-muted" :
    fundedHealthPct > 75 ? "bg-emerald-900/25" :
    fundedHealthPct > 50 ? "bg-teal-900/25" :
    fundedHealthPct > 25 ? "bg-amber-900/25" :
    fundedHealthPct > 10 ? "bg-orange-900/25" :
                           "bg-red-900/25";
  const fundedLabelColor =
    !hasFundedHealth  ? "text-muted-foreground" :
    fundedHealthPct > 75 ? "text-emerald-600 dark:text-emerald-400" :
    fundedHealthPct > 50 ? "text-teal-600 dark:text-teal-400" :
    fundedHealthPct > 25 ? "text-amber-600 dark:text-amber-400" :
    fundedHealthPct > 10 ? "text-orange-600 dark:text-orange-400" :
                           "text-red-500 dark:text-red-400";
  const fundedZoneLabel =
    !hasFundedHealth  ? "" :
    fundedHealthPct > 75 ? "Healthy" :
    fundedHealthPct > 50 ? "Stable" :
    fundedHealthPct > 25 ? "Caution" :
    fundedHealthPct > 10 ? "Danger" :
                           "Critical";

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
            <div className="flex items-center gap-0.5 shrink-0 -mr-1.5">
              <Link
                href={`/evaluations/${account.id}/edit`}
                title="Edit account"
                className="min-w-11 min-h-11 inline-flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <Pencil size={15} />
              </Link>
              <button
                type="button"
                title="Delete account"
                onClick={onDeleteRequest}
                className="min-w-11 min-h-11 inline-flex items-center justify-center rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Middle: Balance + Progress */}
        <div className="px-5 py-4 flex-1 min-w-0">
          {/* Balance row */}
          <div className="flex items-start justify-between gap-3 mb-3">
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
            <div className="text-right shrink-0">
              <p className="text-xs text-muted-foreground mb-0.5">Net change</p>
              <p
                className={cn(
                  "text-sm font-semibold tabular-nums",
                  balanceDiff === 0
                    ? "text-muted-foreground"
                    : isProfit
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-500 dark:text-red-400"
                )}
              >
                {balanceDiff === 0 ? "$0" : fmtDiff(balanceDiff)}
              </p>
            </div>
          </div>

          {/* In Eval / Not Started */}
          {(account.status === "In Eval" || account.status === "Not Started") &&
            progress !== null &&
            account.profitTarget !== null && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Progress to Target</span>
                  <span className="text-xs font-semibold tabular-nums text-blue-600 dark:text-blue-400">
                    {progress.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-blue-900/25 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {fmt(account.startingBalance)} start
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {fmt(account.profitTarget)} target
                  </span>
                </div>
                {account.currentBalance < account.profitTarget && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    <span className="tabular-nums">{fmt(account.profitTarget - account.currentBalance)}</span> remaining to target
                  </p>
                )}
              </div>
            )}

          {/* Passed */}
          {account.status === "Passed" && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Target Reached</span>
                <span className="text-xs font-semibold tabular-nums text-amber-600 dark:text-amber-400">100%</span>
              </div>
              <div className="w-full h-2 bg-amber-900/25 rounded-full overflow-hidden">
                <div className="h-full w-full rounded-full bg-amber-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                Waiting for funded account activation.
              </p>
            </div>
          )}

          {/* Funded */}
          {account.status === "Funded" && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-muted-foreground">Drawdown Buffer</span>
                {hasFundedHealth ? (
                  <span className={cn("text-xs font-semibold tabular-nums", fundedLabelColor)}>
                    {fundedHealthPct.toFixed(0)}% · {fundedZoneLabel}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </div>
              <div className={cn("w-full h-2 rounded-full overflow-hidden", fundedTrackColor)}>
                {hasFundedHealth && (
                  <div
                    className={cn("h-full rounded-full", fundedFillColor)}
                    style={{ width: `${fundedHealthPct}%` }}
                  />
                )}
              </div>
              {hasFundedHealth ? (
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-xs text-muted-foreground">
                    Buffer remaining:{" "}
                    <span className="tabular-nums font-medium text-foreground">
                      {fmt(account.currentBalance - (breachLevel as number))}
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    Breach level: {fmt(breachLevel as number)}
                  </span>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mt-1.5">
                  Add max drawdown to track funded account health.
                </p>
              )}
            </div>
          )}

          {/* Breached */}
          {account.status === "Breached" && (
            <div>
              <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1.5">
                Drawdown Breached
              </p>
              {breachLevel !== null ? (
                <div className="space-y-0.5 mb-2">
                  <p className="text-xs text-muted-foreground">
                    Breach level:{" "}
                    <span className="tabular-nums font-medium text-foreground">{fmt(breachLevel)}</span>
                  </p>
                  {account.currentBalance < breachLevel && (
                    <p className="text-xs tabular-nums text-red-500 dark:text-red-400">
                      {fmt(breachLevel - account.currentBalance)} below limit
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mb-2">
                  Max drawdown limit was reached.
                </p>
              )}
              <div className="w-full h-2 bg-red-900/25 rounded-full overflow-hidden">
                <div className="h-full w-full rounded-full bg-red-600/80" />
              </div>
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

      {/* Notes: conditional */}
      {account.notes && !confirmDelete && (
        <div className="border-t border-border px-5 py-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {account.notes}
          </p>
        </div>
      )}

      {/* Status suggestions — hidden when delete confirmation is open */}
      {!confirmDelete && hasSuggestions && (
        <div className="border-t border-border">

          {/* Pass conditions met */}
          {showPassSuggestion && (
            <div className="flex items-start justify-between gap-3 px-5 py-3.5 bg-amber-500/5 border-b border-amber-500/10 last:border-0">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <CheckCircle2 size={13} className="text-amber-600 dark:text-amber-400 shrink-0" />
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                    Pass conditions met
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  This account appears ready to be marked as Passed.
                </p>
              </div>
              <button
                type="button"
                onClick={onMarkPassed}
                disabled={updatingStatus}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-amber-500/30 text-amber-700 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {updatingStatus && <Loader2 size={11} className="animate-spin" />}
                Mark as Passed
              </button>
            </div>
          )}

          {/* Breach risk detected */}
          {showBreachSuggestion && (
            <div className="flex items-start justify-between gap-3 px-5 py-3.5 bg-red-500/5 border-b border-red-500/10 last:border-0">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <AlertTriangle size={13} className="text-red-500 dark:text-red-400 shrink-0" />
                  <p className="text-xs font-semibold text-red-600 dark:text-red-400">
                    Breach risk detected
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  This account appears to be at or below the max drawdown limit.
                </p>
              </div>
              <button
                type="button"
                onClick={onMarkBreached}
                disabled={updatingStatus}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-500/30 text-red-600 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {updatingStatus && <Loader2 size={11} className="animate-spin" />}
                Mark as Breached
              </button>
            </div>
          )}

          {/* Funded transition — initial button, only for Passed accounts */}
          {showFundedTransition && !confirmFunded && (
            <div className="flex items-start justify-between gap-3 px-5 py-3.5 bg-emerald-500/5 border-b border-emerald-500/10 last:border-0">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mb-0.5">
                  Ready for funded?
                </p>
                <p className="text-xs text-muted-foreground">
                  Use this once your prop firm has activated the funded account.
                </p>
              </div>
              <button
                type="button"
                onClick={onMarkFundedRequest}
                disabled={updatingStatus}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Mark as Funded
              </button>
            </div>
          )}

          {/* Funded confirmation step */}
          {showFundedTransition && confirmFunded && (
            <div className="border-b border-emerald-500/10 bg-emerald-500/5 px-5 py-3.5 last:border-0">
              <p className="text-xs font-semibold text-foreground mb-0.5">
                Mark as Funded?
              </p>
              <p className="text-xs text-muted-foreground mb-2.5">
                Has this account been activated by the prop firm? The balance will reset to the starting balance and the account will be marked as Funded.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onMarkFundedCancel}
                  disabled={updatingStatus}
                  className="px-3 py-1.5 text-xs font-medium border border-border text-muted-foreground rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onMarkFundedConfirm}
                  disabled={updatingStatus}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-600 dark:bg-emerald-500 text-white rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {updatingStatus && <Loader2 size={11} className="animate-spin" />}
                  Yes, mark as Funded
                </button>
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="px-5 py-2 bg-muted/20 rounded-b-xl">
            <p className="text-[11px] text-muted-foreground/60 italic">
              Status suggestions are based on the rules you entered. Prop firm rules can vary, so always confirm manually.
            </p>
          </div>

        </div>
      )}

      {/* Breached: hide / unhide */}
      {account.status === "Breached" && !confirmDelete && (
        <div className="border-t border-border px-5 py-3 flex items-center justify-between gap-3">
          {isHidden ? (
            <>
              <p className="text-xs text-muted-foreground">
                This account is hidden from the main view.
              </p>
              <button
                type="button"
                onClick={onUnhide}
                className="shrink-0 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <Eye size={11} />
                Unhide
              </button>
            </>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                Hide this account from your main view.
              </p>
              <button
                type="button"
                onClick={onHide}
                className="shrink-0 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <EyeOff size={11} />
                Hide
              </button>
            </>
          )}
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="border-t border-destructive/20 bg-destructive/5 px-5 py-3.5 rounded-b-xl">
          <p className="text-xs font-semibold text-foreground mb-0.5">
            Delete this account?
          </p>
          <p className="text-xs text-muted-foreground mb-2.5">
            Are you sure you want to delete this evaluation account? This action cannot be undone.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onDeleteCancel}
              disabled={deleting}
              className="px-3 py-1.5 text-xs font-medium border border-border text-muted-foreground rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onDeleteConfirm}
              disabled={deleting}
              className="px-3 py-1.5 text-xs font-medium bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {deleting ? "Deleting..." : "Yes, delete account"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function EvaluationsPage() {
  const router = useRouter();

  // Data state
  const [accounts, setAccounts] = useState<EvaluationAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  // UI state
  const [activeFilter, setActiveFilter] = useState<FilterTab>("All");

  // Delete state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");

  // Status update state
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [statusUpdateError, setStatusUpdateError] = useState("");

  // Funded confirmation (two-step: request → confirm)
  const [confirmFundedId, setConfirmFundedId] = useState<string | null>(null);

  // Banner shown after automatic In Eval → Passed transitions on load
  const [autoPassNotice, setAutoPassNotice] = useState("");

  // Hidden breached account IDs — persisted to localStorage so they survive page reloads.
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem("tradeforge_hidden_evals");
      if (raw) setHiddenIds(new Set(JSON.parse(raw) as string[]));
    } catch {}
  }, []);

  function handleHide(accountId: string) {
    setHiddenIds((prev) => {
      const next = new Set(prev);
      next.add(accountId);
      try { localStorage.setItem("tradeforge_hidden_evals", JSON.stringify([...next])); } catch {}
      return next;
    });
  }

  function handleUnhide(accountId: string) {
    setHiddenIds((prev) => {
      const next = new Set(prev);
      next.delete(accountId);
      try { localStorage.setItem("tradeforge_hidden_evals", JSON.stringify([...next])); } catch {}
      return next;
    });
  }

  // ── Fetch accounts + linked closed trades, then auto-pass if eligible ────
  useEffect(() => {
    async function fetchAccounts() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Fetch evaluation accounts and the user's closed linked trades in parallel.
      // Both queries are scoped to user_id so no user can see another user's data.
      const [accountsResult, tradesResult] = await Promise.all([
        supabase
          .from("evaluation_accounts")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("trades")
          .select("account_id, pnl")
          .eq("user_id", user.id)
          .eq("status", "Closed")
          .not("pnl", "is", null)
          .not("account_id", "is", null),
      ]);

      if (accountsResult.error) {
        setFetchError(accountsResult.error.message);
        setLoading(false);
        return;
      }

      // Build P&L totals and trade counts per account.
      // If the trades query fails we fall back to the manual current_balance for each account.
      const pnlSums: Record<string, number> = {};
      const tradeCounts: Record<string, number> = {};
      for (const trade of tradesResult.data ?? []) {
        if (trade.account_id && trade.pnl != null) {
          pnlSums[trade.account_id] = (pnlSums[trade.account_id] ?? 0) + Number(trade.pnl);
          tradeCounts[trade.account_id] = (tradeCounts[trade.account_id] ?? 0) + 1;
        }
      }

      // For accounts with linked closed trades: calculated balance = starting_balance + sum(pnl).
      // For accounts with no linked trades: keep the manually entered current_balance as fallback.
      // Funded accounts skip trade recalculation — the DB current_balance was reset to
      // starting_balance on funding and is the source of truth for the funded phase.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mappedAccounts = (accountsResult.data ?? []).map((row: any) => {
        const account = mapRow(row);
        if ((tradeCounts[account.id] ?? 0) > 0) {
          return {
            ...account,
            currentBalance: account.startingBalance + (pnlSums[account.id] ?? 0),
          };
        }
        return account;
      });

      // ── Auto-pass: promote In Eval accounts that have met pass conditions ──
      // Pass conditions (all must be true):
      //   1. calculatedBalance >= profitTarget
      //   2. profitTarget is set (not null)
      //   3. status is In Eval or Not Started
      //   4. account is not Breached
      //   5. minTradingDays is 0 (no requirement) OR completedTradingDays >= minTradingDays
      // Funded is NEVER set automatically — only Passed.
      const eligibleForPass = mappedAccounts.filter((a) => {
        if (a.status !== "In Eval" && a.status !== "Not Started") return false;
        if (a.profitTarget === null) return false;
        if (a.currentBalance < a.profitTarget) return false;
        const daysOk = a.minTradingDays === 0 || a.completedTradingDays >= a.minTradingDays;
        return daysOk;
      });

      let finalAccounts = mappedAccounts;

      if (eligibleForPass.length > 0) {
        // Update each eligible account in Supabase. Both id and user_id are required.
        const passResults = await Promise.allSettled(
          eligibleForPass.map((a) =>
            supabase
              .from("evaluation_accounts")
              .update({ status: "Passed" })
              .eq("id", a.id)
              .eq("user_id", user.id)
          )
        );

        // Only flip status locally for accounts where the Supabase update succeeded.
        const successIds = new Set(
          eligibleForPass
            .filter((_, i) => {
              const r = passResults[i];
              return r.status === "fulfilled" && !r.value.error;
            })
            .map((a) => a.id)
        );

        if (successIds.size > 0) {
          finalAccounts = mappedAccounts.map((a) =>
            successIds.has(a.id) ? { ...a, status: "Passed" as EvaluationStatus } : a
          );

          const passedNames = eligibleForPass
            .filter((a) => successIds.has(a.id))
            .map((a) => a.accountName);

          setAutoPassNotice(
            passedNames.length === 1
              ? `Profit target reached. ${passedNames[0]} has been moved to Passed.`
              : `${passedNames.length} accounts reached their profit target and were moved to Passed.`
          );
        }
      }

      setAccounts(finalAccounts);
      setLoading(false);
    }

    fetchAccounts();
  }, [router]);

  // ── Delete handler ───────────────────────────────────────────────────────
  async function handleDelete(accountId: string) {
    setDeletingId(accountId);
    setDeleteError("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setDeleteError("You must be logged in to delete an account.");
      setDeletingId(null);
      return;
    }

    const { error } = await supabase
      .from("evaluation_accounts")
      .delete()
      .eq("id", accountId)
      .eq("user_id", user.id);

    if (error) {
      setDeleteError(error.message);
      setDeletingId(null);
      setConfirmDeleteId(null);
      return;
    }

    setAccounts((prev) => prev.filter((a) => a.id !== accountId));
    setConfirmDeleteId(null);
    setDeletingId(null);
  }

  // ── Status update handler ────────────────────────────────────────────────
  async function handleStatusUpdate(accountId: string, newStatus: EvaluationStatus) {
    setUpdatingStatusId(accountId);
    setStatusUpdateError("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setStatusUpdateError("You must be logged in to update an account.");
      setUpdatingStatusId(null);
      return;
    }

    // When marking as Funded, also reset current_balance back to starting_balance.
    // Prop firms start funded accounts fresh at the original account size.
    const updatePayload: Record<string, unknown> = { status: newStatus };
    if (newStatus === "Funded") {
      const account = accounts.find((a) => a.id === accountId);
      if (account) updatePayload.current_balance = account.startingBalance;
    }

    const { error } = await supabase
      .from("evaluation_accounts")
      .update(updatePayload)
      .eq("id", accountId)
      .eq("user_id", user.id);

    if (error) {
      setStatusUpdateError(error.message);
      setUpdatingStatusId(null);
      return;
    }

    setAccounts((prev) =>
      prev.map((a) => {
        if (a.id !== accountId) return a;
        const updated: EvaluationAccount = { ...a, status: newStatus };
        if (newStatus === "Funded") updated.currentBalance = a.startingBalance;
        return updated;
      })
    );
    setUpdatingStatusId(null);
  }

  // ── Loading state ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-6 md:p-8 flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 size={22} className="text-muted-foreground animate-spin" />
        <p className="text-sm text-muted-foreground">Loading accounts...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="p-6 md:p-8 flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <AlertCircle size={22} className="text-destructive" />
        <p className="text-sm font-medium text-foreground">Failed to load accounts</p>
        <p className="text-sm text-muted-foreground max-w-xs text-center">
          {fetchError}
        </p>
      </div>
    );
  }

  // ── Derived stats ────────────────────────────────────────────────────────

  const filteredAccounts = filterAccounts(accounts, activeFilter, hiddenIds);
  const hiddenBreachedCount = accounts.filter(
    (a) => a.status === "Breached" && hiddenIds.has(a.id)
  ).length;

  const total    = accounts.length;
  const inEval   = accounts.filter((a) => a.status === "In Eval").length;
  const passed   = accounts.filter((a) => a.status === "Passed").length;
  const funded   = accounts.filter((a) => a.status === "Funded").length;
  const breached = accounts.filter((a) => a.status === "Breached").length;

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

      {/* Hidden breached accounts notice */}
      {hiddenBreachedCount > 0 && activeFilter !== "Breached" && (
        <p className="text-xs text-muted-foreground -mt-2 mb-4">
          {hiddenBreachedCount} breached {hiddenBreachedCount !== 1 ? "accounts" : "account"} hidden ·{" "}
          <button
            type="button"
            onClick={() => setActiveFilter("Breached")}
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            view in Breached tab
          </button>
        </p>
      )}

      {/* Error banners */}
      {deleteError && (
        <div className="mb-4 flex items-start gap-2 px-4 py-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>{deleteError}</span>
        </div>
      )}
      {statusUpdateError && (
        <div className="mb-4 flex items-start gap-2 px-4 py-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>{statusUpdateError}</span>
        </div>
      )}

      {/* Auto-pass notice — shown once after automatic In Eval → Passed promotion */}
      {autoPassNotice && (
        <div className="mb-4 flex items-start gap-2 px-4 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-amber-700 dark:text-amber-300">
          <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
          <span>{autoPassNotice}</span>
        </div>
      )}

      {/* Balance calculation note */}
      {accounts.length > 0 && (
        <p className="text-xs text-muted-foreground/60 italic mb-4">
          Account balance is calculated from starting balance plus closed trades linked to this account.
        </p>
      )}

      {/* Account list */}
      {accounts.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-6 py-14 text-center shadow-sm">
          <p className="text-sm font-semibold text-foreground mb-1.5">
            No evaluation accounts yet.
          </p>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
            Track your first prop firm account to monitor progress, consistency, and risk.
          </p>
          <Link
            href="/evaluations/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 active:bg-primary/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Plus size={14} />
            Add your first account
          </Link>
        </div>
      ) : filteredAccounts.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-6 py-14 text-center shadow-sm">
          <p className="text-sm font-semibold text-foreground mb-1.5">
            No {activeFilter.toLowerCase()} accounts.
          </p>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Switch to All to see all accounts, or add a new account.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredAccounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              confirmDelete={confirmDeleteId === account.id}
              confirmFunded={confirmFundedId === account.id}
              deleting={deletingId === account.id}
              updatingStatus={updatingStatusId === account.id}
              isHidden={hiddenIds.has(account.id)}
              onHide={() => handleHide(account.id)}
              onUnhide={() => handleUnhide(account.id)}
              onDeleteRequest={() => {
                setConfirmDeleteId(account.id);
                setDeleteError("");
              }}
              onDeleteConfirm={() => handleDelete(account.id)}
              onDeleteCancel={() => setConfirmDeleteId(null)}
              onMarkPassed={() => handleStatusUpdate(account.id, "Passed")}
              onMarkBreached={() => handleStatusUpdate(account.id, "Breached")}
              onMarkFundedRequest={() => setConfirmFundedId(account.id)}
              onMarkFundedConfirm={async () => {
                await handleStatusUpdate(account.id, "Funded");
                setConfirmFundedId(null);
              }}
              onMarkFundedCancel={() => setConfirmFundedId(null)}
            />
          ))}
        </div>
      )}

    </div>
  );
}

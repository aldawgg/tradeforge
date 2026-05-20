"use client";

import { useState } from "react";
import { Plus, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────

type EvalStatus = "Not Started" | "In Eval" | "Passed" | "Funded" | "Breached";

interface EvalAccount {
  id: string;
  firm: string;
  accountName: string;
  accountSize: number;
  startingBalance: number;
  currentBalance: number;
  profitTarget: number | null;
  maxDrawdown: number;
  dailyLossLimit: number;
  minTradingDays: number;
  completedTradingDays: number;
  status: EvalStatus;
  consistency: number | null;
  notes: string;
}

interface DialogForm {
  firm: string;
  accountName: string;
  accountSize: string;
  startingBalance: string;
  currentBalance: string;
  profitTarget: string;
  maxDrawdown: string;
  dailyLossLimit: string;
  minTradingDays: string;
  completedTradingDays: string;
  status: EvalStatus | "";
  notes: string;
}

// ── Placeholder accounts ───────────────────────────────────────────────────

const PLACEHOLDER_ACCOUNTS: EvalAccount[] = [
  {
    id: "1",
    firm: "Apex",
    accountName: "Apex 50K #1",
    accountSize: 50000,
    startingBalance: 50000,
    currentBalance: 51250,
    profitTarget: 53000,
    maxDrawdown: 2500,
    dailyLossLimit: 1000,
    minTradingDays: 7,
    completedTradingDays: 4,
    status: "In Eval",
    consistency: 28,
    notes: "On track. Avoid trading Fridays.",
  },
  {
    id: "2",
    firm: "Apex",
    accountName: "Apex 50K #2",
    accountSize: 50000,
    startingBalance: 50000,
    currentBalance: 50800,
    profitTarget: 53000,
    maxDrawdown: 2500,
    dailyLossLimit: 1000,
    minTradingDays: 7,
    completedTradingDays: 2,
    status: "In Eval",
    consistency: 15,
    notes: "",
  },
  {
    id: "3",
    firm: "Apex",
    accountName: "Apex 50K #3",
    accountSize: 50000,
    startingBalance: 50000,
    currentBalance: 53200,
    profitTarget: 53000,
    maxDrawdown: 2500,
    dailyLossLimit: 1000,
    minTradingDays: 7,
    completedTradingDays: 8,
    status: "Passed",
    consistency: 18,
    notes: "Waiting for funded account setup.",
  },
  {
    id: "4",
    firm: "Topstep",
    accountName: "Topstep 50K",
    accountSize: 50000,
    startingBalance: 50000,
    currentBalance: 52100,
    profitTarget: null,
    maxDrawdown: 2000,
    dailyLossLimit: 1000,
    minTradingDays: 0,
    completedTradingDays: 12,
    status: "Funded",
    consistency: 22,
    notes: "Keep daily losses under $1,000.",
  },
  {
    id: "5",
    firm: "Topstep",
    accountName: "Topstep 150K",
    accountSize: 150000,
    startingBalance: 150000,
    currentBalance: 153500,
    profitTarget: null,
    maxDrawdown: 6000,
    dailyLossLimit: 3000,
    minTradingDays: 0,
    completedTradingDays: 24,
    status: "Funded",
    consistency: 19,
    notes: "",
  },
  {
    id: "6",
    firm: "Tradeify",
    accountName: "Tradeify 25K",
    accountSize: 25000,
    startingBalance: 25000,
    currentBalance: 23400,
    profitTarget: 26500,
    maxDrawdown: 1500,
    dailyLossLimit: 500,
    minTradingDays: 5,
    completedTradingDays: 3,
    status: "Breached",
    consistency: null,
    notes: "Stopped out after news event.",
  },
  {
    id: "7",
    firm: "Tradeify",
    accountName: "Tradeify 50K",
    accountSize: 50000,
    startingBalance: 50000,
    currentBalance: 50200,
    profitTarget: 52500,
    maxDrawdown: 2500,
    dailyLossLimit: 1000,
    minTradingDays: 5,
    completedTradingDays: 1,
    status: "In Eval",
    consistency: 12,
    notes: "",
  },
];

const EMPTY_FORM: DialogForm = {
  firm: "",
  accountName: "",
  accountSize: "",
  startingBalance: "",
  currentBalance: "",
  profitTarget: "",
  maxDrawdown: "",
  dailyLossLimit: "",
  minTradingDays: "",
  completedTradingDays: "",
  status: "",
  notes: "",
};

// ── Style maps ─────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<EvalStatus, string> = {
  "Not Started": "text-muted-foreground bg-muted border-border",
  "In Eval":     "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20",
  "Passed":      "text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
  "Funded":      "text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  "Breached":    "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20",
};

const STATUS_DOT: Record<EvalStatus, string> = {
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

function calcProgress(account: EvalAccount): number | null {
  if (account.status === "Passed") return 100;
  if (account.status === "Funded" || account.status === "Breached") return null;
  if (!account.profitTarget) return null;
  const range = account.profitTarget - account.startingBalance;
  if (range <= 0) return null;
  const gained = account.currentBalance - account.startingBalance;
  return Math.min(100, Math.max(0, (gained / range) * 100));
}

function accountToForm(a: EvalAccount): DialogForm {
  return {
    firm: a.firm,
    accountName: a.accountName,
    accountSize: String(a.accountSize),
    startingBalance: String(a.startingBalance),
    currentBalance: String(a.currentBalance),
    profitTarget: a.profitTarget !== null ? String(a.profitTarget) : "",
    maxDrawdown: String(a.maxDrawdown),
    dailyLossLimit: String(a.dailyLossLimit),
    minTradingDays: String(a.minTradingDays),
    completedTradingDays: String(a.completedTradingDays),
    status: a.status,
    notes: a.notes,
  };
}

// ── Sub-components ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: EvalStatus }) {
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

function FormRow({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function AccountCard({
  account,
  onEdit,
}: {
  account: EvalAccount;
  onEdit: () => void;
}) {
  const progress = calcProgress(account);
  const balanceDiff = account.currentBalance - account.startingBalance;
  const isProfit = balanceDiff >= 0;
  const consistencyAtRisk =
    account.consistency !== null && account.consistency >= 30;

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">

      {/* Header */}
      <div className="px-5 pt-4 pb-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <h3 className="text-sm font-semibold text-foreground">
                {account.accountName}
              </h3>
              <StatusBadge status={account.status} />
            </div>
            <p className="text-xs text-muted-foreground">
              {account.firm} · {fmt(account.accountSize)} account
            </p>
          </div>
          <button
            type="button"
            onClick={onEdit}
            title="Edit account"
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <Pencil size={14} />
          </button>
        </div>
      </div>

      {/* Balance + progress */}
      <div className="border-t border-border px-5 pt-4 pb-4">
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Current balance</p>
            <p
              className={cn(
                "text-2xl font-bold tabular-nums leading-none",
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
              "text-sm font-semibold tabular-nums",
              isProfit
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-500 dark:text-red-400"
            )}
          >
            {fmtDiff(balanceDiff)}
          </span>
        </div>

        {/* Status-specific progress */}
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
      </div>

      {/* Stats grid */}
      <div className="border-t border-border px-5 pt-3.5 pb-3.5 grid grid-cols-2 gap-x-6 gap-y-3.5">
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Max drawdown</p>
          <p className="text-sm font-semibold tabular-nums text-foreground">
            {fmt(account.maxDrawdown)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Daily loss limit</p>
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
            <div className="flex items-center gap-1.5">
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

      {/* Notes */}
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<EvalAccount | null>(null);
  const [form, setForm] = useState<DialogForm>(EMPTY_FORM);

  function openAdd() {
    setEditingAccount(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(account: EvalAccount) {
    setEditingAccount(account);
    setForm(accountToForm(account));
    setDialogOpen(true);
  }

  function setField(key: keyof DialogForm, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setDialogOpen(false);
  }

  // Summary counts derived from placeholder data
  const total = PLACEHOLDER_ACCOUNTS.length;
  const inEval = PLACEHOLDER_ACCOUNTS.filter((a) => a.status === "In Eval").length;
  const passed = PLACEHOLDER_ACCOUNTS.filter((a) => a.status === "Passed").length;
  const funded = PLACEHOLDER_ACCOUNTS.filter((a) => a.status === "Funded").length;
  const breached = PLACEHOLDER_ACCOUNTS.filter((a) => a.status === "Breached").length;

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
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 active:bg-primary/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Plus size={14} />
          Add Account
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
        {/* Total */}
        <div className="rounded-xl border border-border bg-card px-4 py-3.5 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Total Accounts
          </p>
          <p className="text-2xl font-bold tabular-nums leading-none text-foreground">
            {total}
          </p>
        </div>

        {/* In Eval */}
        <div className="rounded-xl border border-border bg-card px-4 py-3.5 shadow-sm">
          <div className="flex items-center gap-1.5 mb-2">
            <span className={cn("w-2 h-2 rounded-full shrink-0", STATUS_DOT["In Eval"])} />
            <p className="text-xs font-medium text-muted-foreground">In Eval</p>
          </div>
          <p className="text-2xl font-bold tabular-nums leading-none text-blue-600 dark:text-blue-400">
            {inEval}
          </p>
        </div>

        {/* Passed */}
        <div className="rounded-xl border border-border bg-card px-4 py-3.5 shadow-sm">
          <div className="flex items-center gap-1.5 mb-2">
            <span className={cn("w-2 h-2 rounded-full shrink-0", STATUS_DOT["Passed"])} />
            <p className="text-xs font-medium text-muted-foreground">Passed</p>
          </div>
          <p className="text-2xl font-bold tabular-nums leading-none text-amber-600 dark:text-amber-400">
            {passed}
          </p>
        </div>

        {/* Funded */}
        <div className="rounded-xl border border-border bg-card px-4 py-3.5 shadow-sm">
          <div className="flex items-center gap-1.5 mb-2">
            <span className={cn("w-2 h-2 rounded-full shrink-0", STATUS_DOT["Funded"])} />
            <p className="text-xs font-medium text-muted-foreground">Funded</p>
          </div>
          <p className="text-2xl font-bold tabular-nums leading-none text-emerald-600 dark:text-emerald-400">
            {funded}
          </p>
        </div>

        {/* Breached */}
        <div className="rounded-xl border border-border bg-card px-4 py-3.5 shadow-sm">
          <div className="flex items-center gap-1.5 mb-2">
            <span className={cn("w-2 h-2 rounded-full shrink-0", STATUS_DOT["Breached"])} />
            <p className="text-xs font-medium text-muted-foreground">Breached</p>
          </div>
          <p className="text-2xl font-bold tabular-nums leading-none text-red-500 dark:text-red-400">
            {breached}
          </p>
        </div>
      </div>

      {/* Account cards grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {PLACEHOLDER_ACCOUNTS.map((account) => (
          <AccountCard
            key={account.id}
            account={account}
            onEdit={() => openEdit(account)}
          />
        ))}
      </div>

      {/* Add / Edit Account dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="sm:max-w-lg max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle>
              {editingAccount ? "Edit Account" : "Add Account"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} noValidate className="space-y-5 mt-1">

            {/* Account info */}
            <div className="grid grid-cols-2 gap-4">
              <FormRow label="Prop firm name" htmlFor="firm">
                <Input
                  id="firm"
                  placeholder="e.g. Apex, Topstep"
                  value={form.firm}
                  onChange={(e) => setField("firm", e.target.value)}
                />
              </FormRow>
              <FormRow label="Account name" htmlFor="accountName">
                <Input
                  id="accountName"
                  placeholder="e.g. Apex 50K #1"
                  value={form.accountName}
                  onChange={(e) => setField("accountName", e.target.value)}
                />
              </FormRow>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormRow label="Account size ($)" htmlFor="accountSize">
                <Input
                  id="accountSize"
                  type="number"
                  placeholder="e.g. 50000"
                  value={form.accountSize}
                  onChange={(e) => setField("accountSize", e.target.value)}
                  className="no-spin"
                />
              </FormRow>
              <FormRow label="Status" htmlFor="status">
                <Select
                  value={form.status}
                  onValueChange={(v) => setField("status", v)}
                >
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue placeholder="Select status..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      [
                        "Not Started",
                        "In Eval",
                        "Passed",
                        "Funded",
                        "Breached",
                      ] as EvalStatus[]
                    ).map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormRow>
            </div>

            {/* Balances */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Balances
              </p>
              <div className="grid grid-cols-2 gap-4">
                <FormRow label="Starting balance ($)" htmlFor="startingBalance">
                  <Input
                    id="startingBalance"
                    type="number"
                    placeholder="e.g. 50000"
                    value={form.startingBalance}
                    onChange={(e) => setField("startingBalance", e.target.value)}
                    className="no-spin"
                  />
                </FormRow>
                <FormRow label="Current balance ($)" htmlFor="currentBalance">
                  <Input
                    id="currentBalance"
                    type="number"
                    placeholder="e.g. 51250"
                    value={form.currentBalance}
                    onChange={(e) => setField("currentBalance", e.target.value)}
                    className="no-spin"
                  />
                </FormRow>
              </div>
              <div className="mt-4">
                <FormRow
                  label="Profit target ($)"
                  htmlFor="profitTarget"
                  hint="Leave blank for funded accounts with no active target."
                >
                  <Input
                    id="profitTarget"
                    type="number"
                    placeholder="e.g. 53000"
                    value={form.profitTarget}
                    onChange={(e) => setField("profitTarget", e.target.value)}
                    className="no-spin"
                  />
                </FormRow>
              </div>
            </div>

            {/* Risk rules */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Risk Rules
              </p>
              <div className="grid grid-cols-2 gap-4">
                <FormRow
                  label="Max drawdown ($)"
                  htmlFor="maxDrawdown"
                  hint="Enter as set by your prop firm."
                >
                  <Input
                    id="maxDrawdown"
                    type="number"
                    placeholder="e.g. 2500"
                    value={form.maxDrawdown}
                    onChange={(e) => setField("maxDrawdown", e.target.value)}
                    className="no-spin"
                  />
                </FormRow>
                <FormRow
                  label="Daily loss limit ($)"
                  htmlFor="dailyLossLimit"
                  hint="Enter as set by your prop firm."
                >
                  <Input
                    id="dailyLossLimit"
                    type="number"
                    placeholder="e.g. 1000"
                    value={form.dailyLossLimit}
                    onChange={(e) => setField("dailyLossLimit", e.target.value)}
                    className="no-spin"
                  />
                </FormRow>
              </div>
            </div>

            {/* Progress */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Progress
              </p>
              <div className="grid grid-cols-2 gap-4">
                <FormRow
                  label="Min trading days"
                  htmlFor="minTradingDays"
                  hint="Leave 0 if not required."
                >
                  <Input
                    id="minTradingDays"
                    type="number"
                    min="0"
                    placeholder="e.g. 7"
                    value={form.minTradingDays}
                    onChange={(e) => setField("minTradingDays", e.target.value)}
                    className="no-spin"
                  />
                </FormRow>
                <FormRow
                  label="Completed trading days"
                  htmlFor="completedTradingDays"
                >
                  <Input
                    id="completedTradingDays"
                    type="number"
                    min="0"
                    placeholder="e.g. 4"
                    value={form.completedTradingDays}
                    onChange={(e) =>
                      setField("completedTradingDays", e.target.value)
                    }
                    className="no-spin"
                  />
                </FormRow>
              </div>
            </div>

            {/* Notes */}
            <FormRow label="Notes" htmlFor="notes">
              <Textarea
                id="notes"
                placeholder="Any notes about this account, rules, or reminders."
                value={form.notes}
                onChange={(e) => setField("notes", e.target.value)}
                className="resize-none min-h-[72px]"
              />
            </FormRow>

            <p className="text-xs text-muted-foreground">
              Supabase connection coming soon. Changes will not be saved yet.
            </p>

            <DialogFooter>
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="px-4 py-2 text-sm font-medium border border-border text-foreground rounded-lg hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 active:bg-primary/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {editingAccount ? "Save Changes" : "Save Account"}
              </button>
            </DialogFooter>

          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}

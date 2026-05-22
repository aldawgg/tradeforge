"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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

const EVAL_STATUSES: EvalStatus[] = [
  "Not Started",
  "In Eval",
  "Passed",
  "Funded",
  "Breached",
];

const PROP_FIRMS = [
  "Apex Trader Funding",
  "Topstep",
  "Tradeify",
  "My Funded Futures",
  "Earn2Trade",
  "TradeDay",
  "Bulenox",
  "Take Profit Trader",
  "The Funded Trader",
  "Other / Custom",
] as const;

const ACCOUNT_SIZES = [
  { label: "$25,000",  value: "25000"  },
  { label: "$50,000",  value: "50000"  },
  { label: "$75,000",  value: "75000"  },
  { label: "$100,000", value: "100000" },
  { label: "$150,000", value: "150000" },
  { label: "$200,000", value: "200000" },
] as const;

interface FormState {
  firm: string;
  customFirm: string;
  accountName: string;
  accountSize: string;
  status: EvalStatus | "";
  startingBalance: string;
  currentBalance: string;
  profitTarget: string;
  maxDrawdown: string;
  dailyLossLimit: string;
  minTradingDays: string;
  completedTradingDays: string;
  consistency: string;
  consistencyThreshold: string;
  notes: string;
}

interface FormErrors {
  firm?: string;
  customFirm?: string;
  accountName?: string;
  accountSize?: string;
  status?: string;
  startingBalance?: string;
  currentBalance?: string;
  profitTarget?: string;
  maxDrawdown?: string;
  dailyLossLimit?: string;
  minTradingDays?: string;
  completedTradingDays?: string;
  consistency?: string;
  consistencyThreshold?: string;
}

// ── Helper components ──────────────────────────────────────────────────────

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-5 pt-4 pb-5 shadow-sm">
      <div className="mb-4">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

function FieldGroup({
  label,
  hint,
  error,
  children,
  htmlFor,
  required,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className={cn(error && "text-destructive")}>
        {label}
        {required && (
          <span className="text-destructive ml-0.5" aria-hidden>
            *
          </span>
        )}
      </Label>
      {children}
      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ── Empty form ─────────────────────────────────────────────────────────────

const EMPTY_FORM: FormState = {
  firm: "",
  customFirm: "",
  accountName: "",
  accountSize: "",
  status: "",
  startingBalance: "",
  currentBalance: "",
  profitTarget: "",
  maxDrawdown: "",
  dailyLossLimit: "",
  minTradingDays: "",
  completedTradingDays: "",
  consistency: "",
  consistencyThreshold: "",
  notes: "",
};

// ── Page ───────────────────────────────────────────────────────────────────

export default function NewEvaluationPage() {
  const [form, setFormState] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setFormState((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      if (key in next) delete next[key as keyof FormErrors];
      if (key === "firm") delete next.customFirm;
      return next;
    });
  }

  function validate(): FormErrors {
    const e: FormErrors = {};

    if (!form.firm) {
      e.firm = "Prop firm is required";
    } else if (form.firm === "Other / Custom" && !form.customFirm.trim()) {
      e.customFirm = "Firm name is required";
    }
    if (!form.accountName.trim()) e.accountName = "Account name is required";
    if (!form.status) e.status = "Status is required";

    if (!form.startingBalance.trim()) {
      e.startingBalance = "Starting balance is required";
    } else if (isNaN(Number(form.startingBalance)) || Number(form.startingBalance) <= 0) {
      e.startingBalance = "Must be a positive number";
    }

    if (!form.currentBalance.trim()) {
      e.currentBalance = "Current balance is required";
    } else if (isNaN(Number(form.currentBalance)) || Number(form.currentBalance) <= 0) {
      e.currentBalance = "Must be a positive number";
    }

    if (form.profitTarget.trim()) {
      const pt = Number(form.profitTarget);
      if (isNaN(pt) || pt <= 0) {
        e.profitTarget = "Must be a positive number";
      } else if (
        form.startingBalance.trim() &&
        !isNaN(Number(form.startingBalance)) &&
        pt <= Number(form.startingBalance)
      ) {
        e.profitTarget = "Must be greater than starting balance";
      }
    }

    if (form.maxDrawdown.trim()) {
      if (isNaN(Number(form.maxDrawdown)) || Number(form.maxDrawdown) <= 0) {
        e.maxDrawdown = "Must be a positive number";
      }
    }

    if (form.dailyLossLimit.trim()) {
      if (isNaN(Number(form.dailyLossLimit)) || Number(form.dailyLossLimit) <= 0) {
        e.dailyLossLimit = "Must be a positive number";
      }
    }

    if (form.minTradingDays.trim()) {
      if (isNaN(Number(form.minTradingDays)) || Number(form.minTradingDays) < 0) {
        e.minTradingDays = "Must be 0 or greater";
      }
    }

    if (form.completedTradingDays.trim()) {
      const completed = Number(form.completedTradingDays);
      if (isNaN(completed) || completed < 0) {
        e.completedTradingDays = "Must be 0 or greater";
      } else if (
        form.minTradingDays.trim() &&
        !isNaN(Number(form.minTradingDays)) &&
        Number(form.minTradingDays) > 0 &&
        form.status !== "Passed" &&
        form.status !== "Funded" &&
        completed > Number(form.minTradingDays)
      ) {
        e.completedTradingDays = "Cannot exceed minimum trading days";
      }
    }

    if (form.consistency.trim()) {
      const v = Number(form.consistency);
      if (isNaN(v) || v < 0 || v > 100) {
        e.consistency = "Must be between 0 and 100";
      }
    }

    if (form.consistencyThreshold.trim()) {
      const v = Number(form.consistencyThreshold);
      if (isNaN(v) || v < 0 || v > 100) {
        e.consistencyThreshold = "Must be between 0 and 100";
      }
    }

    return e;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSubmitted(true);
  }

  // ── Success screen ─────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <div className="rounded-xl border border-border bg-card px-6 py-10 shadow-sm text-center">
          <p className="text-lg font-semibold text-foreground mb-1.5">
            Account added
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Demo only: account saving will be connected to Supabase later.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/evaluations"
              className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 active:bg-primary/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Back to evaluations
            </Link>
            <button
              type="button"
              onClick={() => {
                setFormState(EMPTY_FORM);
                setSubmitted(false);
                setErrors({});
              }}
              className="px-4 py-2 text-sm font-medium border border-border text-foreground rounded-lg hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
            >
              Add another
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <Link
          href="/evaluations"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft size={14} />
          Evaluation Tracker
        </Link>
        <h1 className="text-xl font-semibold text-foreground">Add Account</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manually track your prop firm evaluation progress, risk rules, and consistency.
        </p>
        <p className="text-xs text-muted-foreground mt-4">
          <span className="text-destructive">*</span> Required fields
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-6">

        {/* ── Section 1: Account Details ────────────────────────── */}
        <SectionCard title="Account Details">
          <div className="space-y-4">

            <div className="grid grid-cols-2 gap-4">
              <FieldGroup label="Prop Firm" htmlFor="firm" error={errors.firm} required>
                <Select
                  value={form.firm}
                  onValueChange={(v) => setField("firm", v)}
                >
                  <SelectTrigger id="firm" className="w-full" aria-invalid={!!errors.firm}>
                    <SelectValue placeholder="Select firm..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PROP_FIRMS.map((f) => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldGroup>

              <FieldGroup
                label="Account Name"
                htmlFor="accountName"
                error={errors.accountName}
                required
              >
                <Input
                  id="accountName"
                  placeholder="e.g. Apex 50K #1"
                  value={form.accountName}
                  onChange={(e) => setField("accountName", e.target.value)}
                  aria-invalid={!!errors.accountName}
                />
              </FieldGroup>
            </div>

            {form.firm === "Other / Custom" && (
              <FieldGroup
                label="Firm Name"
                htmlFor="customFirm"
                error={errors.customFirm}
                required
              >
                <Input
                  id="customFirm"
                  placeholder="Enter prop firm name"
                  value={form.customFirm}
                  onChange={(e) => setField("customFirm", e.target.value)}
                  aria-invalid={!!errors.customFirm}
                />
              </FieldGroup>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FieldGroup
                label="Account Size"
                htmlFor="accountSize"
                error={errors.accountSize}
              >
                <Select
                  value={form.accountSize}
                  onValueChange={(v) => setField("accountSize", v)}
                >
                  <SelectTrigger id="accountSize" className="w-full" aria-invalid={!!errors.accountSize}>
                    <SelectValue placeholder="Select size..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_SIZES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldGroup>

              <FieldGroup
                label="Status"
                htmlFor="status"
                error={errors.status}
                required
              >
                <Select
                  value={form.status}
                  onValueChange={(v) => setField("status", v as EvalStatus)}
                >
                  <SelectTrigger id="status" className="w-full" aria-invalid={!!errors.status}>
                    <SelectValue placeholder="Select status..." />
                  </SelectTrigger>
                  <SelectContent>
                    {EVAL_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldGroup>
            </div>

          </div>
        </SectionCard>

        {/* ── Section 2: Balances ───────────────────────────────── */}
        <SectionCard title="Balances">
          <div className="space-y-4">

            <div className="grid grid-cols-2 gap-4">
              <FieldGroup
                label="Starting Balance ($)"
                htmlFor="startingBalance"
                error={errors.startingBalance}
                required
              >
                <Input
                  id="startingBalance"
                  type="number"
                  min="0"
                  step="100"
                  placeholder="e.g. 50000"
                  value={form.startingBalance}
                  onChange={(e) => setField("startingBalance", e.target.value)}
                  aria-invalid={!!errors.startingBalance}
                  className="no-spin"
                />
              </FieldGroup>

              <FieldGroup
                label="Current Balance ($)"
                htmlFor="currentBalance"
                error={errors.currentBalance}
                required
              >
                <Input
                  id="currentBalance"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 51250"
                  value={form.currentBalance}
                  onChange={(e) => setField("currentBalance", e.target.value)}
                  aria-invalid={!!errors.currentBalance}
                  className="no-spin"
                />
              </FieldGroup>
            </div>

            <FieldGroup
              label="Profit Target ($)"
              htmlFor="profitTarget"
              error={errors.profitTarget}
              hint="The balance you need to reach to pass. Leave blank for funded accounts with no fixed target."
            >
              <Input
                id="profitTarget"
                type="number"
                min="0"
                step="100"
                placeholder="e.g. 53000"
                value={form.profitTarget}
                onChange={(e) => setField("profitTarget", e.target.value)}
                aria-invalid={!!errors.profitTarget}
                className="no-spin max-w-[280px]"
              />
            </FieldGroup>

          </div>
        </SectionCard>

        {/* ── Section 3: Risk Rules ─────────────────────────────── */}
        <SectionCard
          title="Risk Rules"
          description="Set your firm's risk limits. Leave blank if not applicable."
        >
          <div className="grid grid-cols-2 gap-4">
            <FieldGroup
              label="Max Drawdown ($)"
              htmlFor="maxDrawdown"
              error={errors.maxDrawdown}
              hint="Maximum total loss allowed before the account is breached."
            >
              <Input
                id="maxDrawdown"
                type="number"
                min="0"
                step="100"
                placeholder="e.g. 2500"
                value={form.maxDrawdown}
                onChange={(e) => setField("maxDrawdown", e.target.value)}
                aria-invalid={!!errors.maxDrawdown}
                className="no-spin"
              />
            </FieldGroup>

            <FieldGroup
              label="Daily Loss Limit ($)"
              htmlFor="dailyLossLimit"
              error={errors.dailyLossLimit}
              hint="Maximum loss allowed in a single trading day."
            >
              <Input
                id="dailyLossLimit"
                type="number"
                min="0"
                step="100"
                placeholder="e.g. 1000"
                value={form.dailyLossLimit}
                onChange={(e) => setField("dailyLossLimit", e.target.value)}
                aria-invalid={!!errors.dailyLossLimit}
                className="no-spin"
              />
            </FieldGroup>
          </div>
        </SectionCard>

        {/* ── Section 4: Progress ───────────────────────────────── */}
        <SectionCard
          title="Progress"
          description="Track your trading days and consistency score."
        >
          <div className="space-y-4">

            <div className="grid grid-cols-2 gap-4">
              <FieldGroup
                label="Minimum Trading Days"
                htmlFor="minTradingDays"
                error={errors.minTradingDays}
                hint="Minimum days required to pass. Enter 0 if your firm has no requirement."
              >
                <Input
                  id="minTradingDays"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="e.g. 7"
                  value={form.minTradingDays}
                  onChange={(e) => setField("minTradingDays", e.target.value)}
                  aria-invalid={!!errors.minTradingDays}
                  className="no-spin"
                />
              </FieldGroup>

              <FieldGroup
                label="Completed Trading Days"
                htmlFor="completedTradingDays"
                error={errors.completedTradingDays}
                hint="Qualifying trading days completed so far."
              >
                <Input
                  id="completedTradingDays"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="e.g. 4"
                  value={form.completedTradingDays}
                  onChange={(e) =>
                    setField("completedTradingDays", e.target.value)
                  }
                  aria-invalid={!!errors.completedTradingDays}
                  className="no-spin"
                />
              </FieldGroup>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FieldGroup
                label="Consistency (%)"
                htmlFor="consistency"
                error={errors.consistency}
                hint="Your best day as a percentage of total profits. Leave blank if not tracked."
              >
                <Input
                  id="consistency"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  placeholder="e.g. 28"
                  value={form.consistency}
                  onChange={(e) => setField("consistency", e.target.value)}
                  aria-invalid={!!errors.consistency}
                  className="no-spin"
                />
              </FieldGroup>

              <FieldGroup
                label="Consistency Threshold (%)"
                htmlFor="consistencyThreshold"
                error={errors.consistencyThreshold}
                hint="Percentage at which your account is flagged At Risk. Common values: 30%, 35%."
              >
                <Input
                  id="consistencyThreshold"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  placeholder="e.g. 30"
                  value={form.consistencyThreshold}
                  onChange={(e) =>
                    setField("consistencyThreshold", e.target.value)
                  }
                  aria-invalid={!!errors.consistencyThreshold}
                  className="no-spin"
                />
              </FieldGroup>
            </div>

          </div>
        </SectionCard>

        {/* ── Section 5: Notes ──────────────────────────────────── */}
        <SectionCard
          title="Notes"
          description="Optional. Add reminders, rule exceptions, or anything else about this account."
        >
          <FieldGroup label="Notes" htmlFor="notes">
            <Textarea
              id="notes"
              placeholder="e.g. Avoid trading Fridays. Keep daily losses under $1,000."
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
              className="resize-none min-h-[88px]"
            />
          </FieldGroup>
        </SectionCard>

        {/* ── Footer ────────────────────────────────────────────── */}
        <div className="flex items-center justify-between pt-4 pb-6">
          <Link
            href="/evaluations"
            className="px-4 py-2 text-sm font-medium border border-border text-muted-foreground rounded-lg hover:bg-accent hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="px-5 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 active:bg-primary/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Save Account
          </button>
        </div>

      </form>
    </div>
  );
}

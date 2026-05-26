"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, AlertCircle, Trash2 } from "lucide-react";
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
import { createClient } from "@/lib/supabase/client";

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
  "Alpha Futures",
  "Lucid Trading",
  "FundedNext",
  "Other / Custom",
] as const;

const KNOWN_FIRMS = PROP_FIRMS.filter((f) => f !== "Other / Custom");

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

// ── Row → FormState conversion ─────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToFormState(row: any): FormState {
  const firmKnown = (KNOWN_FIRMS as readonly string[]).includes(
    row.prop_firm_name
  );
  const sizeVal = String(Math.round(Number(row.account_size)));
  const sizeKnown = ACCOUNT_SIZES.some((s) => s.value === sizeVal);

  return {
    firm: firmKnown ? row.prop_firm_name : "Other / Custom",
    customFirm: firmKnown ? "" : row.prop_firm_name,
    accountName: row.account_name ?? "",
    accountSize: sizeKnown ? sizeVal : "",
    status: (row.status ?? "") as EvalStatus,
    startingBalance: row.starting_balance != null ? String(row.starting_balance) : "",
    currentBalance: row.current_balance != null ? String(row.current_balance) : "",
    profitTarget: row.profit_target != null ? String(row.profit_target) : "",
    maxDrawdown: row.max_drawdown != null ? String(row.max_drawdown) : "",
    dailyLossLimit: row.daily_loss_limit != null ? String(row.daily_loss_limit) : "",
    minTradingDays: row.minimum_trading_days != null ? String(row.minimum_trading_days) : "0",
    completedTradingDays:
      row.completed_trading_days != null ? String(row.completed_trading_days) : "0",
    consistency: row.consistency != null ? String(row.consistency) : "",
    consistencyThreshold:
      row.consistency_threshold != null ? String(row.consistency_threshold) : "",
    notes: row.notes ?? "",
  };
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

// ── Page ───────────────────────────────────────────────────────────────────

export default function EditEvaluationPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  // Fetch state
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [accountName, setAccountName] = useState("");

  // Form state
  const [form, setFormState] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});

  // Save state
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Delete state
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // ── Load account on mount ──────────────────────────────────────────────
  useEffect(() => {
    async function loadAccount() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("evaluation_accounts")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (error) {
        // PGRST116 = no rows returned — account not found or belongs to another user
        if (error.code === "PGRST116") {
          setNotFound(true);
        } else {
          setLoadError(error.message);
        }
        setLoading(false);
        return;
      }

      if (!data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setFormState(rowToFormState(data));
      setAccountName(data.account_name ?? "");
      setLoading(false);
    }

    loadAccount();
  }, [id, router]);

  // ── Field helpers ──────────────────────────────────────────────────────

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
      if (isNaN(Number(form.maxDrawdown)) || Number(form.maxDrawdown) <= 0)
        e.maxDrawdown = "Must be a positive number";
    }

    if (form.dailyLossLimit.trim()) {
      if (isNaN(Number(form.dailyLossLimit)) || Number(form.dailyLossLimit) <= 0)
        e.dailyLossLimit = "Must be a positive number";
    }

    if (form.minTradingDays.trim()) {
      if (isNaN(Number(form.minTradingDays)) || Number(form.minTradingDays) < 0)
        e.minTradingDays = "Must be 0 or greater";
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
      if (isNaN(v) || v < 0 || v > 100)
        e.consistency = "Must be between 0 and 100";
    }

    if (form.consistencyThreshold.trim()) {
      const v = Number(form.consistencyThreshold);
      if (isNaN(v) || v < 0 || v > 100)
        e.consistencyThreshold = "Must be between 0 and 100";
    }

    return e;
  }

  // ── Save handler ───────────────────────────────────────────────────────

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    setSaveError("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaveError("You must be logged in to update an account.");
      setSaving(false);
      return;
    }

    const firmName =
      form.firm === "Other / Custom" ? form.customFirm.trim() : form.firm;

    const payload = {
      prop_firm_name: firmName,
      account_name: form.accountName.trim(),
      account_size: form.accountSize ? Number(form.accountSize) : 0,
      starting_balance: Number(form.startingBalance),
      current_balance: Number(form.currentBalance),
      profit_target: form.profitTarget.trim() ? Number(form.profitTarget) : null,
      max_drawdown: form.maxDrawdown.trim() ? Number(form.maxDrawdown) : 0,
      daily_loss_limit: form.dailyLossLimit.trim() ? Number(form.dailyLossLimit) : 0,
      minimum_trading_days: form.minTradingDays.trim() ? Number(form.minTradingDays) : 0,
      completed_trading_days: form.completedTradingDays.trim()
        ? Number(form.completedTradingDays)
        : 0,
      consistency_threshold: form.consistencyThreshold.trim()
        ? Number(form.consistencyThreshold)
        : null,
      consistency: form.consistency.trim() ? Number(form.consistency) : null,
      status: form.status,
      notes: form.notes,
    };

    const { error: updateError } = await supabase
      .from("evaluation_accounts")
      .update(payload)
      .eq("id", id)
      .eq("user_id", user.id);   // security: prevent editing another user's account

    if (updateError) {
      setSaveError(updateError.message);
      setSaving(false);
      return;
    }

    router.push("/evaluations");
  }

  // ── Delete handler ─────────────────────────────────────────────────────

  async function handleDelete() {
    setDeleting(true);
    setDeleteError("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setDeleteError("You must be logged in to delete an account.");
      setDeleting(false);
      return;
    }

    const { error } = await supabase
      .from("evaluation_accounts")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      setDeleteError(error.message);
      setDeleting(false);
      return;
    }

    router.push("/evaluations");
  }

  // ── Loading state ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-6 md:p-8 flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 size={22} className="text-muted-foreground animate-spin" />
        <p className="text-sm text-muted-foreground">Loading account...</p>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────

  if (loadError) {
    return (
      <div className="p-6 md:p-8 flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <AlertCircle size={22} className="text-destructive" />
        <p className="text-sm font-medium text-foreground">Failed to load account</p>
        <p className="text-sm text-muted-foreground max-w-xs text-center">
          {loadError}
        </p>
        <Link
          href="/evaluations"
          className="mt-1 text-sm text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
        >
          Back to Evaluation Tracker
        </Link>
      </div>
    );
  }

  // ── Not found state ────────────────────────────────────────────────────

  if (notFound) {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <div className="mb-5">
          <Link
            href="/evaluations"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={14} />
            Evaluation Tracker
          </Link>
        </div>
        <div className="rounded-xl border border-border bg-card px-6 py-14 text-center shadow-sm">
          <p className="text-sm font-semibold text-foreground mb-1.5">
            Account not found
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            This account does not exist or has been removed.
          </p>
          <Link
            href="/evaluations"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 active:bg-primary/80 transition-colors"
          >
            Back to evaluations
          </Link>
        </div>
      </div>
    );
  }

  // ── Account loaded — render form ───────────────────────────────────────

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <Link
            href="/evaluations"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft size={14} />
            Evaluation Tracker
          </Link>
          <h1 className="text-xl font-semibold text-foreground">Edit Account</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{accountName}</p>
          <p className="text-xs text-muted-foreground mt-4">
            <span className="text-destructive">*</span> Required fields
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setConfirmDelete(true); setDeleteError(""); }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-destructive/40 text-destructive hover:bg-destructive/10 transition-colors shrink-0"
        >
          <Trash2 size={13} />
          Delete
        </button>
      </div>

      {/* Delete confirmation banner */}
      {confirmDelete && (
        <div className="mb-8 rounded-xl border border-destructive/20 bg-destructive/5 px-5 py-4">
          <p className="text-sm font-semibold text-foreground mb-0.5">
            Delete this account?
          </p>
          <p className="text-sm text-muted-foreground mb-3">
            Are you sure you want to delete this evaluation account? This action cannot be undone.
          </p>
          {deleteError && (
            <p className="text-xs text-destructive mb-3">{deleteError}</p>
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { setConfirmDelete(false); setDeleteError(""); }}
              disabled={deleting}
              className="px-3 py-1.5 text-sm font-medium border border-border text-muted-foreground rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="px-3 py-1.5 text-sm font-medium bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {deleting ? "Deleting..." : "Yes, delete account"}
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} noValidate className="space-y-6">

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
        {saveError && (
          <div className="flex items-start gap-2 px-4 py-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}
        <div className="flex items-center justify-between pt-4 pb-6">
          <Link
            href="/evaluations"
            className="px-4 py-2 text-sm font-medium border border-border text-muted-foreground rounded-lg hover:bg-accent hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 active:bg-primary/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

      </form>
    </div>
  );
}

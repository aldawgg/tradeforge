"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ScreenshotUploader,
  PendingScreenshot,
} from "@/components/trades/screenshot-uploader";
import { ArrowLeft, ChevronDown, ImageIcon, X } from "lucide-react";
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

// ── Constants ──────────────────────────────────────────────────────────────

export const INSTRUMENTS = ["MES", "MNQ", "ES", "NQ", "Other / Custom"] as const;
export const SESSIONS = ["Asia", "London", "New York AM", "New York PM", "Other"] as const;
export const ACCOUNTS = [] as const;
export const SETUPS = [
  "VWAP bounce",
  "VWAP reclaim",
  "Liquidity sweep",
  "FVG continuation",
  "Inverse FVG",
  "Rejection block",
  "Breakout retest",
  "Failed breakout",
  "Trend continuation",
  "Reversal trade",
  "News trade",
  "Other / Custom",
] as const;
export const POSITIVE_TAGS = [
  "Waited for confirmation",
  "Followed trading plan",
  "Respected stop loss",
  "Good risk/reward",
  "Entered at key level",
  "Good trade management",
  "Correct position size",
  "Managed emotions well",
  "Avoided overtrading",
  "Took partials correctly",
  "Let winner run",
  "Followed session rules",
  "Other",
] as const;
export const POSITIVE_PRIMARY = 7;
export const IMPROVEMENT_TAGS = [
  "Entered too early",
  "Moved stop loss",
  "Overtraded",
  "FOMO entry",
  "Took profit too early",
  "Held loser too long",
  "Oversized",
  "No clear setup",
  "Revenge traded",
  "Ignored news",
  "Broke daily loss limit",
  "Other",
] as const;
export const IMPROVEMENT_PRIMARY = 7;

// ── Types ──────────────────────────────────────────────────────────────────

export type TradeStatusField = "Open" | "Closed";
export type OutcomeField = "Profit" | "Loss" | "Break even";

const TRADE_STATUS_STYLES: Record<TradeStatusField, string> = {
  Open:   "bg-primary border-primary text-primary-foreground",
  Closed: "bg-foreground/80 border-foreground/80 text-background",
};

const OUTCOME_STYLES: Record<OutcomeField, string> = {
  Profit:       "bg-emerald-500 border-emerald-500 text-white",
  Loss:         "bg-red-500 border-red-500 text-white",
  "Break even": "bg-slate-500 border-slate-500 text-white",
};

export interface FormState {
  date: string;
  accounts: string[];
  instrument: string;
  customInstrument: string;
  direction: "Long" | "Short" | "";
  session: string;
  setup: string;
  customSetup: string;
  tradeStatus: TradeStatusField | "";
  outcome: OutcomeField | "";
  contracts: string;
  pl: string;
  rMultiple: string;
  positiveTags: string[];
  improvements: string[];
  notes: string;
  entryPrice: string;
  exitPrice: string;
  stopLoss: string;
  target: string;
}

export interface FormErrors {
  date?: string;
  accounts?: string;
  instrument?: string;
  customInstrument?: string;
  direction?: string;
  session?: string;
  setup?: string;
  customSetup?: string;
  tradeStatus?: string;
  outcome?: string;
  contracts?: string;
  stopLoss?: string;
  target?: string;
}

export const EMPTY_FORM: FormState = {
  date: "",
  accounts: [],
  instrument: "",
  customInstrument: "",
  direction: "",
  session: "",
  setup: "",
  customSetup: "",
  tradeStatus: "",
  outcome: "",
  contracts: "",
  pl: "",
  rMultiple: "",
  positiveTags: [],
  improvements: [],
  notes: "",
  entryPrice: "",
  exitPrice: "",
  stopLoss: "",
  target: "",
};

// ── Validation ──────────────────────────────────────────────────────────────

export function validateForm(form: FormState): FormErrors {
  const e: FormErrors = {};

  if (!form.date) e.date = "Date is required";

  if (!form.instrument) {
    e.instrument = "Instrument is required";
  } else if (form.instrument === "Other / Custom" && !form.customInstrument.trim()) {
    e.customInstrument = "Custom instrument is required";
  }

  if (!form.direction) e.direction = "Direction is required";
  if (!form.session) e.session = "Session is required";

  if (!form.setup) {
    e.setup = "Setup type is required";
  } else if (form.setup === "Other / Custom" && !form.customSetup.trim()) {
    e.customSetup = "Custom setup is required";
  }

  if (!form.tradeStatus) e.tradeStatus = "Trade status is required";

  if (form.tradeStatus === "Closed" && !form.outcome) {
    e.outcome = "Outcome is required for closed trades";
  }

  if (
    form.contracts.trim() &&
    (isNaN(Number(form.contracts)) || Number(form.contracts) <= 0)
  ) {
    e.contracts = "Must be greater than 0";
  }

  if (form.direction && form.entryPrice && form.stopLoss) {
    const entry = Number(form.entryPrice);
    const sl = Number(form.stopLoss);
    if (!isNaN(entry) && !isNaN(sl)) {
      if (form.direction === "Long" && sl >= entry)
        e.stopLoss = "Must be below entry for a long trade";
      if (form.direction === "Short" && sl <= entry)
        e.stopLoss = "Must be above entry for a short trade";
    }
  }

  if (form.direction && form.entryPrice && form.target) {
    const entry = Number(form.entryPrice);
    const tgt = Number(form.target);
    if (!isNaN(entry) && !isNaN(tgt)) {
      if (form.direction === "Long" && tgt <= entry)
        e.target = "Must be above entry for a long trade";
      if (form.direction === "Short" && tgt >= entry)
        e.target = "Must be below entry for a short trade";
    }
  }

  return e;
}

// ── Sub-components ──────────────────────────────────────────────────────────

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
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function TagGroup({
  label,
  sublabel,
  tags,
  primaryCount,
  selected,
  onToggle,
  activeClass,
}: {
  label: string;
  sublabel?: string;
  tags: readonly string[];
  primaryCount: number;
  selected: string[];
  onToggle: (tag: string) => void;
  activeClass: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const moreTags = tags.slice(primaryCount);
  const hasSelectedHidden = moreTags.some((t) => selected.includes(t));
  const showAll = expanded || hasSelectedHidden;
  const canCollapse = expanded && !hasSelectedHidden;

  return (
    <div className="space-y-2">
      <Label>
        {label}
        {sublabel && (
          <span className="text-muted-foreground font-normal text-xs ml-1">
            {sublabel}
          </span>
        )}
      </Label>
      <div className="flex flex-wrap gap-2">
        {(showAll ? tags : tags.slice(0, primaryCount)).map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => onToggle(tag)}
            className={cn(
              "px-2.5 py-1 text-xs font-medium rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
              selected.includes(tag)
                ? activeClass
                : "border-input text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            {tag}
          </button>
        ))}
      </div>
      {!showAll && moreTags.length > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          +{moreTags.length} more options
        </button>
      )}
      {canCollapse && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Show fewer
        </button>
      )}
    </div>
  );
}

function AdvancedSection({
  open,
  onToggle,
  subtitle,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex items-center justify-between w-full px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset rounded-xl"
      >
        <div>
          <p className="text-sm font-semibold text-foreground">
            Advanced Trade Details
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
        <ChevronDown
          size={16}
          className={cn(
            "text-muted-foreground transition-transform shrink-0 ml-3",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div className="border-t border-border px-5 pb-5 pt-4">{children}</div>
      )}
    </div>
  );
}

// ── TradeForm component ─────────────────────────────────────────────────────

export interface ExistingScreenshot {
  id: string;
  storage_path: string;
  screenshot_type: string;
  publicUrl: string;
}

export interface TradeFormProps {
  mode: "create" | "edit";
  /** Required in edit mode — used for back and cancel link hrefs. */
  tradeId?: string;
  initialValues?: Partial<FormState>;
  /** First subtitle line (e.g. current date or "MNQ Long — May 16, 2026"). */
  subtitle?: string;
  /** Second subtitle line shown only in create mode. */
  description?: string;
  saving: boolean;
  saveError: string;
  onSave: (values: FormState, screenshots: PendingScreenshot[]) => Promise<void>;
  /** Real evaluation accounts fetched from Supabase. */
  availableAccounts?: { id: string; name: string }[];
  /** Already-saved screenshots shown in edit mode. */
  existingScreenshots?: ExistingScreenshot[];
  /** Called when the user confirms deleting an existing screenshot. */
  onDeleteExistingScreenshot?: (id: string, storagePath: string) => Promise<void>;
  /** Active instruments to show in the instrument select. Falls back to all built-ins when empty or omitted. */
  availableInstruments?: string[];
  /** Active setups to show in the setup select. Falls back to all built-ins when empty or omitted. */
  availableSetups?: string[];
}

export function TradeForm({
  mode,
  tradeId,
  initialValues,
  subtitle,
  description,
  saving,
  saveError,
  onSave,
  availableAccounts = [],
  existingScreenshots = [],
  onDeleteExistingScreenshot,
  availableInstruments,
  availableSetups,
}: TradeFormProps) {
  const backHref = mode === "create" ? "/dashboard" : `/trades/${tradeId}`;

  const instrumentOptions = availableInstruments && availableInstruments.length > 0
    ? [...availableInstruments, "Other / Custom"]
    : Array.from(INSTRUMENTS);
  const setupOptions = availableSetups && availableSetups.length > 0
    ? [...availableSetups, "Other / Custom"]
    : Array.from(SETUPS);

  const [form, setFormState] = useState<FormState>(() => ({
    ...EMPTY_FORM,
    ...initialValues,
  }));
  const [errors, setErrors] = useState<FormErrors>({});
  const [pendingScreenshots, setPendingScreenshots] = useState<PendingScreenshot[]>([]);
  const [confirmDeleteExistingId, setConfirmDeleteExistingId] = useState<string | null>(null);
  const [deletingExistingId, setDeletingExistingId] = useState<string | null>(null);
  // Edit form opens advanced section by default (trade likely has price data).
  const [showAdvanced, setShowAdvanced] = useState(mode === "edit");

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setFormState((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "tradeStatus" && value === "Open") next.outcome = "";
      // When the user picks Profit or Loss, snap existing P/L and R signs to match.
      if (key === "outcome" && (value === "Profit" || value === "Loss")) {
        const sign = value === "Loss" ? -1 : 1;
        if (prev.pl.trim()) {
          const num = Number(prev.pl);
          if (!isNaN(num) && num !== 0) next.pl = String(Math.abs(num) * sign);
        }
        if (prev.rMultiple.trim()) {
          const num = Number(prev.rMultiple);
          if (!isNaN(num) && num !== 0) next.rMultiple = String(Math.abs(num) * sign);
        }
      }
      return next;
    });
    setErrors((prev) => {
      const next = { ...prev };
      if (key in next) delete next[key as keyof FormErrors];
      if (key === "instrument") delete next.customInstrument;
      if (key === "setup") delete next.customSetup;
      if (key === "tradeStatus") delete next.outcome;
      return next;
    });
  }

  function toggleAccount(id: string) {
    setFormState((prev) => ({
      ...prev,
      accounts: prev.accounts.includes(id) ? [] : [id],
    }));
  }

  function toggleTag(field: "positiveTags" | "improvements", tag: string) {
    setFormState((prev) => ({
      ...prev,
      [field]: prev[field].includes(tag)
        ? prev[field].filter((t) => t !== tag)
        : [...prev[field], tag],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateForm(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      if (errs.stopLoss || errs.target) setShowAdvanced(true);
      return;
    }
    await onSave(form, pendingScreenshots);
  }

  const isOpen = form.tradeStatus === "Open";

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft size={14} />
          {mode === "create" ? "Back to Dashboard" : "Back to trade"}
        </Link>
        <h1 className="text-xl font-semibold text-foreground">
          {mode === "create" ? "Add Trade" : "Edit Trade"}
        </h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        <p className="text-xs text-muted-foreground mt-4">
          <span className="text-destructive">*</span> Required fields
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-6">

        {/* ── Section 1: Trade Basics ───────────────────────────── */}
        <SectionCard title="Trade Basics">

          {/* Date + Instrument */}
          <div className="grid grid-cols-2 gap-4">
            <FieldGroup label="Date" htmlFor="date" error={errors.date} required>
              <Input
                id="date"
                type="date"
                value={form.date}
                onChange={(e) => setField("date", e.target.value)}
                aria-invalid={!!errors.date}
                className="w-full"
              />
            </FieldGroup>

            <FieldGroup
              label="Instrument"
              htmlFor="instrument"
              error={errors.instrument}
              required
            >
              <Select
                value={form.instrument}
                onValueChange={(v) => setField("instrument", v)}
              >
                <SelectTrigger
                  id="instrument"
                  className="w-full"
                  aria-invalid={!!errors.instrument}
                >
                  <SelectValue placeholder="Select instrument..." />
                </SelectTrigger>
                <SelectContent>
                  {instrumentOptions.map((i) => (
                    <SelectItem key={i} value={i}>{i}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldGroup>
          </div>

          {/* Custom instrument */}
          {form.instrument === "Other / Custom" && (
            <div className="mt-4">
              <FieldGroup
                label="Custom Instrument"
                htmlFor="customInstrument"
                error={errors.customInstrument}
                hint="e.g. YM, CL, GC, BTC, EURUSD, AAPL"
                required
              >
                <Input
                  id="customInstrument"
                  placeholder="Enter instrument name"
                  value={form.customInstrument}
                  onChange={(e) => setField("customInstrument", e.target.value)}
                  aria-invalid={!!errors.customInstrument}
                />
              </FieldGroup>
            </div>
          )}

          {/* Account */}
          <div className="mt-4">
            <FieldGroup
              label="Account"
              error={errors.accounts}
              hint={availableAccounts.length > 0 ? "Select the account this trade was taken on." : undefined}
            >
              <div className="flex flex-wrap gap-2 mt-0.5">
                {availableAccounts.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No evaluation accounts found.{" "}
                    <Link
                      href="/evaluations/new"
                      className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
                    >
                      Add one in the Evaluation Tracker.
                    </Link>
                  </p>
                ) : (
                  availableAccounts.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      aria-pressed={form.accounts.includes(a.id)}
                      onClick={() => toggleAccount(a.id)}
                      className={cn(
                        "px-2.5 py-1 text-xs font-medium rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                        form.accounts.includes(a.id)
                          ? "bg-primary/10 border-primary/40 text-primary"
                          : "border-input text-muted-foreground hover:text-foreground hover:bg-accent"
                      )}
                    >
                      {a.name}
                    </button>
                  ))
                )}
              </div>
            </FieldGroup>
          </div>

          {/* Direction + Session */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <FieldGroup label="Direction" error={errors.direction} required>
              <div className="flex gap-2">
                {(["Long", "Short"] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={form.direction === d}
                    onClick={() => setField("direction", d)}
                    className={cn(
                      "flex-1 h-9 text-sm font-medium rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                      form.direction === d
                        ? d === "Long"
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : "bg-red-500 border-red-500 text-white"
                        : errors.direction
                          ? "border-destructive/50 text-muted-foreground hover:text-foreground hover:bg-accent"
                          : "border-input text-muted-foreground hover:text-foreground hover:bg-accent"
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </FieldGroup>

            <FieldGroup
              label="Session"
              htmlFor="session"
              error={errors.session}
              required
            >
              <Select
                value={form.session}
                onValueChange={(v) => setField("session", v)}
              >
                <SelectTrigger
                  id="session"
                  className="w-full"
                  aria-invalid={!!errors.session}
                >
                  <SelectValue placeholder="Select session..." />
                </SelectTrigger>
                <SelectContent>
                  {SESSIONS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldGroup>
          </div>

          {/* Setup */}
          <div className="mt-4">
            <FieldGroup
              label="Setup"
              htmlFor="setup"
              error={errors.setup}
              required
            >
              <Select
                value={form.setup}
                onValueChange={(v) => setField("setup", v)}
              >
                <SelectTrigger
                  id="setup"
                  className="w-full"
                  aria-invalid={!!errors.setup}
                >
                  <SelectValue placeholder="Select setup..." />
                </SelectTrigger>
                <SelectContent>
                  {setupOptions.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldGroup>
          </div>

          {/* Custom setup */}
          {form.setup === "Other / Custom" && (
            <div className="mt-4">
              <FieldGroup
                label="Custom Setup"
                htmlFor="customSetup"
                error={errors.customSetup}
                hint="e.g. Opening range breakout, Previous day high sweep"
                required
              >
                <Input
                  id="customSetup"
                  placeholder="Enter setup name"
                  value={form.customSetup}
                  onChange={(e) => setField("customSetup", e.target.value)}
                  aria-invalid={!!errors.customSetup}
                />
              </FieldGroup>
            </div>
          )}

        </SectionCard>

        {/* ── Section 2: Trade Result ───────────────────────────── */}
        <SectionCard title="Trade Result">
          <div className="space-y-4">

            {/* Trade Status */}
            <FieldGroup label="Trade Status" error={errors.tradeStatus} required>
              <div className="flex gap-2">
                {(["Open", "Closed"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={form.tradeStatus === s}
                    onClick={() => setField("tradeStatus", s)}
                    className={cn(
                      "flex-1 h-9 text-sm font-medium rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                      form.tradeStatus === s
                        ? TRADE_STATUS_STYLES[s]
                        : errors.tradeStatus
                          ? "border-destructive/50 text-muted-foreground hover:text-foreground hover:bg-accent"
                          : "border-input text-muted-foreground hover:text-foreground hover:bg-accent"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </FieldGroup>

            {/* Outcome — only shown for Closed trades */}
            {form.tradeStatus === "Closed" && (
              <FieldGroup label="Outcome" error={errors.outcome} required>
                <div className="flex gap-2">
                  {(["Profit", "Loss", "Break even"] as const).map((o) => (
                    <button
                      key={o}
                      type="button"
                      aria-pressed={form.outcome === o}
                      onClick={() => setField("outcome", o)}
                      className={cn(
                        "flex-1 h-9 text-sm font-medium rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                        form.outcome === o
                          ? OUTCOME_STYLES[o]
                          : errors.outcome
                            ? "border-destructive/50 text-muted-foreground hover:text-foreground hover:bg-accent"
                            : "border-input text-muted-foreground hover:text-foreground hover:bg-accent"
                      )}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </FieldGroup>
            )}

            {form.tradeStatus === "Open" && (
              <p className="text-xs text-muted-foreground">
                Outcome can be added once the trade is closed.
              </p>
            )}

            {/* Contracts */}
            <FieldGroup
              label="Contracts"
              htmlFor="contracts"
              error={errors.contracts}
            >
              <Input
                id="contracts"
                type="number"
                min="1"
                step="1"
                placeholder="e.g. 2"
                value={form.contracts}
                onChange={(e) => setField("contracts", e.target.value)}
                aria-invalid={!!errors.contracts}
                className="no-spin max-w-[160px]"
              />
            </FieldGroup>

            {/* P/L + R-Multiple — greyed when trade is Open */}
            <div
              className={cn(
                "grid grid-cols-2 gap-4",
                isOpen && "opacity-40 pointer-events-none"
              )}
            >
              <FieldGroup
                label="Profit / Loss ($)"
                htmlFor="pl"
                hint={
                  !isOpen
                    ? "Enter manually (auto-calculation coming later)"
                    : undefined
                }
              >
                <Input
                  id="pl"
                  type="number"
                  step="0.01"
                  placeholder="e.g. 125.00"
                  value={form.pl}
                  onChange={(e) => setField("pl", e.target.value)}
                  onBlur={() => {
                    if (!form.pl.trim() || !form.outcome || form.outcome === "Break even") return;
                    const num = Number(form.pl);
                    if (isNaN(num) || num === 0) return;
                    if (form.outcome === "Profit" && num < 0) setField("pl", String(-num));
                    if (form.outcome === "Loss"   && num > 0) setField("pl", String(-num));
                  }}
                  disabled={isOpen}
                  className="no-spin"
                />
              </FieldGroup>

              <FieldGroup
                label="R-Multiple"
                htmlFor="rMultiple"
                hint={
                  !isOpen
                    ? "Risk units. 2.0 = 2R profit, -1.0 = full stop out."
                    : undefined
                }
              >
                <Input
                  id="rMultiple"
                  type="number"
                  step="0.1"
                  placeholder="e.g. 1.5"
                  value={form.rMultiple}
                  onChange={(e) => setField("rMultiple", e.target.value)}
                  onBlur={() => {
                    if (!form.rMultiple.trim() || !form.outcome || form.outcome === "Break even") return;
                    const num = Number(form.rMultiple);
                    if (isNaN(num) || num === 0) return;
                    if (form.outcome === "Profit" && num < 0) setField("rMultiple", String(-num));
                    if (form.outcome === "Loss"   && num > 0) setField("rMultiple", String(-num));
                  }}
                  disabled={isOpen}
                />
              </FieldGroup>
            </div>
            {isOpen && (
              <p className="text-xs text-muted-foreground">
                Fill in the result when this trade closes.
              </p>
            )}

          </div>
        </SectionCard>

        {/* ── Section 3: Trade Reflection ──────────────────────── */}
        <SectionCard
          title="Trade Reflection"
          description="Optional. Helps you learn from each trade."
        >
          <div className="space-y-4">

            <TagGroup
              label="What went well?"
              sublabel="— select all that apply"
              tags={POSITIVE_TAGS}
              primaryCount={POSITIVE_PRIMARY}
              selected={form.positiveTags}
              onToggle={(tag) => toggleTag("positiveTags", tag)}
              activeClass="bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
            />

            <TagGroup
              label="What could improve?"
              sublabel="— select all that apply"
              tags={IMPROVEMENT_TAGS}
              primaryCount={IMPROVEMENT_PRIMARY}
              selected={form.improvements}
              onToggle={(tag) => toggleTag("improvements", tag)}
              activeClass="bg-destructive/10 border-destructive/30 text-destructive"
            />

            <FieldGroup label="Notes" htmlFor="notes">
              <Textarea
                id="notes"
                placeholder="Write what happened, what you did well, and what you want to improve next time."
                value={form.notes}
                onChange={(e) => setField("notes", e.target.value)}
                className="resize-none min-h-[88px]"
              />
            </FieldGroup>

            <div className="space-y-1.5">
              <p className="text-sm font-medium text-foreground">
                Screenshots
                <span className="font-normal text-muted-foreground text-xs ml-1.5">
                  (optional)
                </span>
              </p>

              {/* Existing screenshots (edit mode) */}
              {existingScreenshots.length > 0 && (
                <div className="grid grid-cols-2 gap-3 mb-1">
                  {existingScreenshots.map((s) => (
                    <div
                      key={s.id}
                      className="rounded-lg border border-border bg-muted/20 overflow-hidden"
                    >
                      <div className="aspect-video bg-muted">
                        {s.publicUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={s.publicUrl}
                            alt={s.screenshot_type}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon size={16} className="text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                      <div className="px-2.5 py-2 flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground truncate">
                          {s.screenshot_type}
                        </span>
                        {confirmDeleteExistingId === s.id ? (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteExistingId(null)}
                              disabled={deletingExistingId === s.id}
                              className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                setDeletingExistingId(s.id);
                                await onDeleteExistingScreenshot?.(s.id, s.storage_path);
                                setDeletingExistingId(null);
                                setConfirmDeleteExistingId(null);
                              }}
                              disabled={deletingExistingId === s.id}
                              className="text-xs text-destructive hover:text-destructive/80 transition-colors disabled:opacity-40"
                            >
                              {deletingExistingId === s.id ? "Deleting…" : "Confirm"}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteExistingId(s.id)}
                            disabled={saving}
                            aria-label="Delete screenshot"
                            className="shrink-0 p-0.5 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
                          >
                            <X size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <ScreenshotUploader
                pending={pendingScreenshots}
                onChange={setPendingScreenshots}
                disabled={saving}
              />
            </div>

          </div>
        </SectionCard>

        {/* ── Section 4: Advanced Trade Details (collapsible) ──── */}
        <AdvancedSection
          open={showAdvanced}
          onToggle={() => setShowAdvanced((v) => !v)}
          subtitle={
            mode === "create"
              ? "Optional: entry, exit, stop loss, and target"
              : "Entry, exit, stop loss, and target"
          }
        >
          <div className="grid grid-cols-2 gap-4">
            <FieldGroup label="Entry Price" htmlFor="entryPrice">
              <Input
                id="entryPrice"
                type="number"
                step="0.25"
                placeholder="e.g. 5280.50"
                value={form.entryPrice}
                onChange={(e) => setField("entryPrice", e.target.value)}
                className="no-spin"
              />
            </FieldGroup>

            <FieldGroup
              label="Exit Price"
              htmlFor="exitPrice"
              hint="Leave blank for open trades"
            >
              <Input
                id="exitPrice"
                type="number"
                step="0.25"
                placeholder="e.g. 5295.00"
                value={form.exitPrice}
                onChange={(e) => setField("exitPrice", e.target.value)}
                className="no-spin"
              />
            </FieldGroup>

            <FieldGroup
              label="Stop Loss"
              htmlFor="stopLoss"
              error={errors.stopLoss}
            >
              <Input
                id="stopLoss"
                type="number"
                step="0.25"
                placeholder="e.g. 5275.00"
                value={form.stopLoss}
                onChange={(e) => setField("stopLoss", e.target.value)}
                aria-invalid={!!errors.stopLoss}
                className="no-spin"
              />
            </FieldGroup>

            <FieldGroup label="Target" htmlFor="target" error={errors.target}>
              <Input
                id="target"
                type="number"
                step="0.25"
                placeholder="e.g. 5300.00"
                value={form.target}
                onChange={(e) => setField("target", e.target.value)}
                aria-invalid={!!errors.target}
                className="no-spin"
              />
            </FieldGroup>
          </div>
        </AdvancedSection>

        {/* ── Footer ────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3 pt-4 pb-6">
          {saveError && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
              {saveError}
            </p>
          )}
          <div className="flex items-center justify-between">
            <Link
              href={backHref}
              className="px-4 py-2 text-sm font-medium border border-border text-muted-foreground rounded-lg hover:bg-accent hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 active:bg-primary/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving
                ? "Saving..."
                : mode === "create"
                ? "Save Trade"
                : "Save Changes"}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}

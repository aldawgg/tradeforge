"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown } from "lucide-react";
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

const INSTRUMENTS = ["MES", "MNQ", "ES", "NQ", "Other / Custom"] as const;
const SESSIONS = ["Asia", "London", "New York AM", "New York PM", "Other"] as const;
const ACCOUNTS = [
  "Apex 50K #1",
  "Apex 50K #2",
  "Topstep 50K",
  "Tradeify 25K",
] as const;

const SETUPS = [
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

const POSITIVE_TAGS = [
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
const POSITIVE_PRIMARY = 7;

const IMPROVEMENT_TAGS = [
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
const IMPROVEMENT_PRIMARY = 7;

// ── Types ──────────────────────────────────────────────────────────────────

type TradeStatus = "Open" | "Closed";
type Outcome = "Profit" | "Loss" | "Break even";

const TRADE_STATUS_STYLES: Record<TradeStatus, string> = {
  Open:   "bg-primary border-primary text-primary-foreground",
  Closed: "bg-foreground/80 border-foreground/80 text-background",
};

const OUTCOME_STYLES: Record<Outcome, string> = {
  Profit:       "bg-emerald-500 border-emerald-500 text-white",
  Loss:         "bg-red-500 border-red-500 text-white",
  "Break even": "bg-slate-500 border-slate-500 text-white",
};

interface FormState {
  date: string;
  accounts: string[];
  instrument: string;
  customInstrument: string;
  direction: "Long" | "Short" | "";
  session: string;
  setup: string;
  customSetup: string;
  tradeStatus: TradeStatus | "";
  outcome: Outcome | "";
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

interface FormErrors {
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

// ── Placeholder trade data (mirrors the detail page) ──────────────────────

const TRADE_INITIAL: FormState = {
  date: "2026-05-16",
  accounts: ["Apex 50K #1"],
  instrument: "MNQ",
  customInstrument: "",
  direction: "Long",
  session: "New York AM",
  setup: "VWAP bounce",
  customSetup: "",
  tradeStatus: "Closed",
  outcome: "Profit",
  contracts: "2",
  pl: "250",
  rMultiple: "1.8",
  positiveTags: ["Waited for confirmation", "Followed trading plan", "Respected stop loss"],
  improvements: ["Took profit too early"],
  notes: "Clean VWAP bounce after liquidity sweep. Entry was patient, but exit could have been held closer to target.",
  entryPrice: "21450.25",
  exitPrice: "21487.50",
  stopLoss: "21425.00",
  target: "21500.00",
};

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
  children,
}: {
  open: boolean;
  onToggle: () => void;
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
          <p className="text-xs text-muted-foreground mt-0.5">
            Entry, exit, stop loss, and target
          </p>
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
        <div className="border-t border-border px-5 pb-5 pt-4">
          {children}
        </div>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function EditTradePage() {
  const [form, setFormState] = useState<FormState>(TRADE_INITIAL);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(true);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setFormState((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "tradeStatus" && value === "Open") {
        next.outcome = "";
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

  function toggleAccount(account: string) {
    setFormState((prev) => ({
      ...prev,
      accounts: prev.accounts.includes(account)
        ? prev.accounts.filter((a) => a !== account)
        : [...prev.accounts, account],
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

  function validate(): FormErrors {
    const e: FormErrors = {};

    if (!form.date) e.date = "Date is required";

    if (!form.instrument) {
      e.instrument = "Instrument is required";
    } else if (
      form.instrument === "Other / Custom" &&
      !form.customInstrument.trim()
    ) {
      e.customInstrument = "Custom instrument is required";
    }

    if (!form.direction) e.direction = "Direction is required";
    if (!form.session) e.session = "Session is required";

    if (!form.setup) {
      e.setup = "Setup type is required";
    } else if (
      form.setup === "Other / Custom" &&
      !form.customSetup.trim()
    ) {
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
        if (form.direction === "Long" && sl >= entry) {
          e.stopLoss = "Must be below entry for a long trade";
        }
        if (form.direction === "Short" && sl <= entry) {
          e.stopLoss = "Must be above entry for a short trade";
        }
      }
    }

    if (form.direction && form.entryPrice && form.target) {
      const entry = Number(form.entryPrice);
      const tgt = Number(form.target);
      if (!isNaN(entry) && !isNaN(tgt)) {
        if (form.direction === "Long" && tgt <= entry) {
          e.target = "Must be above entry for a long trade";
        }
        if (form.direction === "Short" && tgt >= entry) {
          e.target = "Must be below entry for a short trade";
        }
      }
    }

    return e;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      if (errs.stopLoss || errs.target) {
        setShowAdvanced(true);
      }
      return;
    }
    setSubmitted(true);
  }

  const isOpen = form.tradeStatus === "Open";

  // ── Success screen ─────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <div className="rounded-xl border border-border bg-card px-6 py-10 shadow-sm text-center">
          <p className="text-lg font-semibold text-foreground mb-1.5">
            Trade updated
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Your changes have been saved. Supabase connection coming soon.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/trades/1"
              className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 active:bg-primary/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              View trade
            </Link>
            <Link
              href="/trades"
              className="px-4 py-2 text-sm font-medium border border-border text-foreground rounded-lg hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
            >
              Back to journal
            </Link>
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
          href="/trades/1"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft size={14} />
          Back to trade
        </Link>
        <h1 className="text-xl font-semibold text-foreground">Edit Trade</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          MNQ Long — May 16, 2026
        </p>
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
                  {INSTRUMENTS.map((i) => (
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
                  onChange={(e) =>
                    setField("customInstrument", e.target.value)
                  }
                  aria-invalid={!!errors.customInstrument}
                />
              </FieldGroup>
            </div>
          )}

          {/* Account — multi-select pills */}
          <div className="mt-4">
            <FieldGroup
              label="Account"
              error={errors.accounts}
              hint="Select all accounts this trade was taken on."
            >
              <div className="flex flex-wrap gap-2 mt-0.5">
                {ACCOUNTS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    aria-pressed={form.accounts.includes(a)}
                    onClick={() => toggleAccount(a)}
                    className={cn(
                      "px-2.5 py-1 text-xs font-medium rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                      form.accounts.includes(a)
                        ? "bg-primary/10 border-primary/40 text-primary"
                        : "border-input text-muted-foreground hover:text-foreground hover:bg-accent"
                    )}
                  >
                    {a}
                  </button>
                ))}
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
                  {SETUPS.map((s) => (
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

            {/* Outcome */}
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

            {/* P/L + R-Multiple */}
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

          </div>
        </SectionCard>

        {/* ── Section 4: Advanced Trade Details (open by default) ── */}
        <AdvancedSection
          open={showAdvanced}
          onToggle={() => setShowAdvanced((v) => !v)}
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
        <div className="flex items-center justify-between pt-4 pb-6">
          <Link
            href="/trades/1"
            className="px-4 py-2 text-sm font-medium border border-border text-muted-foreground rounded-lg hover:bg-accent hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="px-5 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 active:bg-primary/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Save Changes
          </button>
        </div>

      </form>
    </div>
  );
}

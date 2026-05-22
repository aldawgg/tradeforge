"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  Copy,
  ImageIcon,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { cn } from "@/lib/utils";

// ── Placeholder trade ───────────────────────────────────────────────────────

const TRADE = {
  id: "1",
  instrument: "MNQ",
  direction: "Long" as const,
  setup: "VWAP Bounce",
  account: "Apex 50K #1",
  date: "May 16, 2026",
  session: "New York AM",
  outcome: "Profit" as const,
  pnl: "+$250",
  rMultiple: "+1.8R",
  contracts: 2,
  status: "Closed" as const,
  entryPrice: "21,450.25",
  exitPrice: "21,487.50",
  stopLoss: "21,425.00",
  target: "21,500.00",
  riskPoints: "25.25",
  riskDollars: "$101",
  rewardCaptured: "37.25",
  rewardDollars: "$149",
  wentWell: [
    "Waited for confirmation",
    "Followed trading plan",
    "Respected stop loss",
  ],
  couldImprove: ["Took profit slightly early"],
  notes:
    "Clean VWAP bounce after liquidity sweep. Entry was patient, but exit could have been held closer to target.",
};

// ── Types & style maps ──────────────────────────────────────────────────────

type Outcome = "Profit" | "Loss" | "Break even" | "Open";

const OUTCOME_BADGE: Record<Outcome, string> = {
  Profit:       "text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  Loss:         "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20",
  "Break even": "text-muted-foreground bg-muted border-border",
  Open:         "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20",
};

// ── Sub-components ──────────────────────────────────────────────────────────

function OutcomeBadge({ outcome }: { outcome: Outcome }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border",
        OUTCOME_BADGE[outcome]
      )}
    >
      {outcome}
    </span>
  );
}

function ContextRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="text-sm font-medium text-foreground">{children}</div>
    </div>
  );
}

function PriceRow({
  label,
  hint,
  value,
  color,
}: {
  label: string;
  hint?: string;
  value: string;
  color?: "green" | "red";
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        {hint && <p className="text-xs text-muted-foreground/60 mt-0.5">{hint}</p>}
      </div>
      <span
        className={cn(
          "text-sm font-semibold tabular-nums",
          color === "green" && "text-emerald-600 dark:text-emerald-400",
          color === "red"   && "text-red-500 dark:text-red-400",
          !color            && "text-foreground"
        )}
      >
        {value}
      </span>
    </div>
  );
}

function UnitToggle({
  showDollars,
  onToggle,
}: {
  showDollars: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center gap-0.5 bg-muted rounded-md p-0.5">
      <button
        type="button"
        onClick={() => showDollars && onToggle()}
        className={cn(
          "px-2 py-0.5 text-xs font-medium rounded transition-colors",
          !showDollars
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        pts
      </button>
      <button
        type="button"
        onClick={() => !showDollars && onToggle()}
        className={cn(
          "px-2 py-0.5 text-xs font-medium rounded transition-colors",
          showDollars
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        $
      </button>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function TradeDetailPage() {
  const [showDollars, setShowDollars] = useState(false);

  return (
    <div className="p-6 md:p-8">

      {/* Back link */}
      <div className="mb-5">
        <Link
          href="/trades"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} />
          Trade History
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <h1 className="text-xl font-semibold text-foreground">
              {TRADE.instrument} {TRADE.direction} — {TRADE.setup}
            </h1>
            <OutcomeBadge outcome={TRADE.outcome} />
          </div>
          <p className="text-sm text-muted-foreground">
            {TRADE.account} · {TRADE.date} · {TRADE.session}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-border text-foreground hover:bg-muted transition-colors"
          >
            <Copy size={13} />
            Duplicate
          </button>
          <Link
            href="/trades/1/edit"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 active:bg-primary/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Pencil size={13} />
            Edit Trade
          </Link>
        </div>
      </div>

      {/* Key result cards — outcome/direction/status already in header */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="P/L"
          value={TRADE.pnl}
          valueColor="green"
        />
        <StatCard
          label="R-Multiple"
          value={TRADE.rMultiple}
          valueColor="green"
          subtitle="Profit or loss vs. risk taken"
        />
        <StatCard
          label="Risk"
          value={showDollars ? TRADE.riskDollars : `${TRADE.riskPoints} pts`}
          subtitle="Entry to stop loss distance"
          action={
            <UnitToggle
              showDollars={showDollars}
              onToggle={() => setShowDollars((v) => !v)}
            />
          }
        />
        <StatCard
          label="Contracts"
          value={String(TRADE.contracts)}
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: main content (2/3) */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Trade Reflection — first because this is a journal */}
          <div className="rounded-xl border border-border bg-card px-5 py-5 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-5">
              Trade Reflection
            </p>

            <div className="mb-5">
              <div className="flex items-center gap-1.5 mb-3">
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                <p className="text-sm font-semibold text-foreground">What went well</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {TRADE.wentWell.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="mb-5 pb-5 border-b border-border">
              <div className="flex items-center gap-1.5 mb-3">
                <AlertCircle size={14} className="text-amber-500 shrink-0" />
                <p className="text-sm font-semibold text-foreground">What could improve</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {TRADE.couldImprove.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2.5">
                Notes
              </p>
              <p className="text-sm text-foreground leading-relaxed bg-muted/40 rounded-lg px-4 py-3 border border-border">
                {TRADE.notes}
              </p>
            </div>
          </div>

          {/* Trade Context — simplified, no fields already in header */}
          <div className="rounded-xl border border-border bg-card px-5 py-4 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              Trade Context
            </p>
            <ContextRow label="Instrument">
              <span className="font-semibold">{TRADE.instrument}</span>
            </ContextRow>
            <ContextRow label="Setup">{TRADE.setup}</ContextRow>
            <ContextRow label="Session">{TRADE.session}</ContextRow>
            <ContextRow label="Account">{TRADE.account}</ContextRow>
          </div>

          {/* Screenshots */}
          <div className="rounded-xl border border-border bg-card px-5 py-4 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-4">
              Screenshots
            </p>
            <div className="rounded-lg border-2 border-dashed border-border bg-muted/20 flex flex-col items-center justify-center text-center gap-3 py-10 px-6">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <ImageIcon size={18} className="text-muted-foreground/40" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">No screenshots uploaded</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  Screenshot upload will be available once storage is connected.
                </p>
              </div>
              <button
                type="button"
                disabled
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-border text-muted-foreground bg-muted cursor-not-allowed opacity-50 mt-1"
              >
                <UploadCloud size={13} />
                Upload Screenshot
              </button>
            </div>
          </div>

        </div>

        {/* Right: sidebar (1/3) */}
        <div className="flex flex-col gap-6">

          {/* Price Details */}
          <div className="rounded-xl border border-border bg-card px-5 py-4 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              Price Details
            </p>
            <PriceRow label="Entry price" value={TRADE.entryPrice} />
            <PriceRow label="Exit price"  value={TRADE.exitPrice}  />
            <PriceRow label="Stop loss"   value={TRADE.stopLoss}   />
            <PriceRow label="Target"      value={TRADE.target}     />

            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Risk / Reward
                </p>
                <UnitToggle
                  showDollars={showDollars}
                  onToggle={() => setShowDollars((v) => !v)}
                />
              </div>
              <PriceRow
                label="Risk"
                hint="Entry to stop loss distance"
                value={showDollars ? TRADE.riskDollars : `${TRADE.riskPoints} pts`}
                color="red"
              />
              <PriceRow
                label="Reward captured"
                hint="Actual move from entry to exit"
                value={showDollars ? TRADE.rewardDollars : `${TRADE.rewardCaptured} pts`}
                color="green"
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

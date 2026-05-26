"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Copy,
  ImageIcon,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  Loader2,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { cn } from "@/lib/utils";
import { formatPnl, formatR, formatPrice, formatCurrency } from "@/lib/utils";
import { POINT_VALUES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import type { Trade, TradeOutcome, TradeDirection, TradeStatus, TradingSession } from "@/lib/types";

// ── Style maps ──────────────────────────────────────────────────────────────

const OUTCOME_BADGE: Record<TradeOutcome, string> = {
  Profit:       "text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  Loss:         "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20",
  "Break even": "text-muted-foreground bg-muted border-border",
  Open:         "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20",
};

// ── Row mapper ──────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): Trade {
  const instrument: string =
    row.instrument === "Custom"
      ? (row.custom_instrument ?? "Custom")
      : row.instrument;
  const setupType: string =
    row.setup === "Custom"
      ? (row.custom_setup ?? "Custom")
      : row.setup;
  return {
    id: row.id as string,
    date: row.date as string,
    account: "Unassigned",
    instrument,
    direction: row.direction as TradeDirection,
    session: row.session as TradingSession,
    entryPrice: Number(row.entry_price),
    exitPrice: row.exit_price != null ? Number(row.exit_price) : null,
    stopLoss: Number(row.stop_loss),
    target: Number(row.target),
    contracts: Number(row.contracts),
    setupType,
    mistakeTags: (row.improvement_tags as string[]) ?? [],
    positiveTags: (row.positive_review_tags as string[]) ?? [],
    notes: (row.notes as string) ?? "",
    screenshots: [],
    pnl: row.pnl != null ? Number(row.pnl) : null,
    rMultiple: row.r_multiple != null ? Number(row.r_multiple) : null,
    outcome: row.outcome as TradeOutcome,
    status: row.status as TradeStatus,
  };
}

// ── Date formatter ──────────────────────────────────────────────────────────

function formatTradeDate(isoDate: string): string {
  return new Date(isoDate + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ── Sub-components ──────────────────────────────────────────────────────────

function OutcomeBadge({ outcome }: { outcome: TradeOutcome }) {
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
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [trade, setTrade] = useState<Trade | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [showDollars, setShowDollars] = useState(false);

  useEffect(() => {
    async function fetchTrade() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("trades")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (error) {
        // PGRST116 = no rows returned — trade not found or belongs to another user
        if (error.code === "PGRST116") {
          setNotFound(true);
        } else {
          setFetchError(error.message);
        }
        setLoading(false);
        return;
      }

      if (!data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setTrade(mapRow(data));
      setLoading(false);
    }

    fetchTrade();
  }, [id, router]);

  // ── Loading state ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-6 md:p-8 flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 size={22} className="text-muted-foreground animate-spin" />
        <p className="text-sm text-muted-foreground">Loading trade...</p>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────

  if (fetchError) {
    return (
      <div className="p-6 md:p-8 flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <AlertCircle size={22} className="text-destructive" />
        <p className="text-sm font-medium text-foreground">Failed to load trade</p>
        <p className="text-sm text-muted-foreground max-w-xs text-center">
          {fetchError}
        </p>
        <Link
          href="/trades"
          className="mt-1 text-sm text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
        >
          Back to Trade History
        </Link>
      </div>
    );
  }

  // ── Not found state ──────────────────────────────────────────────────────

  if (notFound || !trade) {
    return (
      <div className="p-6 md:p-8 flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <p className="text-sm font-medium text-foreground">Trade not found.</p>
        <Link
          href="/trades"
          className="text-sm text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
        >
          Back to Trade History
        </Link>
      </div>
    );
  }

  // ── Trade loaded ─────────────────────────────────────────────────────────

  const pointValue = POINT_VALUES[trade.instrument] ?? 1;

  const riskPts = Math.abs(trade.entryPrice - trade.stopLoss);
  const riskUsd = riskPts * pointValue * trade.contracts;

  const rewardPts =
    trade.exitPrice != null ? Math.abs(trade.exitPrice - trade.entryPrice) : 0;
  const rewardUsd = rewardPts * pointValue * trade.contracts;

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
              {trade.instrument} {trade.direction} — {trade.setupType}
            </h1>
            <OutcomeBadge outcome={trade.outcome} />
          </div>
          <p className="text-sm text-muted-foreground">
            {trade.account} · {formatTradeDate(trade.date)} · {trade.session}
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
            href={`/trades/${trade.id}/edit`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 active:bg-primary/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Pencil size={13} />
            Edit Trade
          </Link>
        </div>
      </div>

      {/* Key result cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="P/L"
          value={trade.pnl != null ? formatPnl(trade.pnl) : "Pending"}
          valueColor={
            trade.outcome === "Profit"
              ? "green"
              : trade.outcome === "Loss"
              ? "red"
              : "default"
          }
        />
        <StatCard
          label="R-Multiple"
          value={trade.rMultiple != null ? formatR(trade.rMultiple) : "Pending"}
          valueColor={
            trade.outcome === "Profit"
              ? "green"
              : trade.outcome === "Loss"
              ? "red"
              : "default"
          }
          subtitle="Profit or loss vs. risk taken"
        />
        <StatCard
          label="Risk"
          value={showDollars ? formatCurrency(riskUsd) : `${riskPts.toFixed(2)} pts`}
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
          value={String(trade.contracts)}
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: main content (2/3) */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Trade Reflection */}
          <div className="rounded-xl border border-border bg-card px-5 py-5 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-5">
              Trade Reflection
            </p>

            {trade.positiveTags.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center gap-1.5 mb-3">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  <p className="text-sm font-semibold text-foreground">What went well</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {trade.positiveTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {trade.mistakeTags.length > 0 && (
              <div className="mb-5 pb-5 border-b border-border">
                <div className="flex items-center gap-1.5 mb-3">
                  <AlertCircle size={14} className="text-amber-500 shrink-0" />
                  <p className="text-sm font-semibold text-foreground">What could improve</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {trade.mistakeTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {trade.notes && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2.5">
                  Notes
                </p>
                <p className="text-sm text-foreground leading-relaxed bg-muted/40 rounded-lg px-4 py-3 border border-border">
                  {trade.notes}
                </p>
              </div>
            )}

            {!trade.positiveTags.length && !trade.mistakeTags.length && !trade.notes && (
              <p className="text-sm text-muted-foreground">No reflection added yet.</p>
            )}
          </div>

          {/* Trade Context */}
          <div className="rounded-xl border border-border bg-card px-5 py-4 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              Trade Context
            </p>
            <ContextRow label="Instrument">
              <span className="font-semibold">{trade.instrument}</span>
            </ContextRow>
            <ContextRow label="Setup">{trade.setupType}</ContextRow>
            <ContextRow label="Session">{trade.session}</ContextRow>
            <ContextRow label="Account">{trade.account}</ContextRow>
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
            <PriceRow label="Entry price" value={formatPrice(trade.entryPrice)} />
            <PriceRow
              label="Exit price"
              value={trade.exitPrice != null ? formatPrice(trade.exitPrice) : "Pending"}
            />
            <PriceRow label="Stop loss" value={formatPrice(trade.stopLoss)} />
            <PriceRow label="Target"    value={formatPrice(trade.target)}   />

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
                value={showDollars ? formatCurrency(riskUsd) : `${riskPts.toFixed(2)} pts`}
                color="red"
              />
              <PriceRow
                label="Reward captured"
                hint="Actual move from entry to exit"
                value={
                  trade.exitPrice != null
                    ? showDollars
                      ? formatCurrency(rewardUsd)
                      : `${rewardPts.toFixed(2)} pts`
                    : "Pending"
                }
                color={trade.exitPrice != null ? "green" : undefined}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

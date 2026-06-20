"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  ClipboardX,
  Filter,
  Eye,
  Pencil,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatPnl, formatR } from "@/lib/utils";
import { INSTRUMENTS, SETUP_TAGS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import type { Trade, TradeOutcome, TradeDirection, TradeStatus } from "@/lib/types";

// ── Style helpers ───────────────────────────────────────────────────────────

const OUTCOME_BADGE: Record<TradeOutcome, string> = {
  Profit:       "text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20",
  Loss:         "text-red-600    dark:text-red-400    bg-red-500/10    border border-red-500/20",
  "Break even": "text-muted-foreground bg-muted border border-border",
  Open:         "text-blue-600   dark:text-blue-400   bg-blue-500/10   border border-blue-500/20",
};

const DIRECTION_BADGE: Record<TradeDirection, string> = {
  Long:  "text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20",
  Short: "text-red-600    dark:text-red-400    bg-red-500/10    border border-red-500/20",
};

const STATUS_BADGE: Record<TradeStatus, string> = {
  Closed: "text-muted-foreground bg-muted border border-border",
  Open:   "text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20",
};

const PNL_TEXT: Record<TradeOutcome, string> = {
  Profit:       "text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums",
  Loss:         "text-red-500    dark:text-red-400    font-semibold tabular-nums",
  "Break even": "text-muted-foreground font-medium tabular-nums",
  Open:         "text-muted-foreground tabular-nums",
};

// ── Sort types ──────────────────────────────────────────────────────────────

type SortKey = "date" | "account" | "setup" | "pnl" | "rMultiple";
type SortDir = "asc" | "desc";

// ── Helpers ─────────────────────────────────────────────────────────────────

// Format ISO date "2026-05-16" → "May 16, 2026"
function formatTradeDate(isoDate: string): string {
  return new Date(isoDate + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Format total P/L for summary cards
function formatSummaryPnl(pnl: number): string {
  if (pnl === 0) return "$0";
  const abs = Math.abs(pnl).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return pnl > 0 ? `+$${abs}` : `-$${abs}`;
}

function formatSummaryR(r: number): string {
  if (r === 0) return "0.0R";
  return (r > 0 ? "+" : "") + r.toFixed(1) + "R";
}

function isInDateRange(isoDate: string, range: string): boolean {
  const tradeDate = new Date(isoDate + "T00:00:00");
  const now = new Date();
  switch (range) {
    case "today":
      return tradeDate.toDateString() === now.toDateString();
    case "this-week": {
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay());
      start.setHours(0, 0, 0, 0);
      return tradeDate >= start;
    }
    case "this-month":
      return (
        tradeDate.getMonth() === now.getMonth() &&
        tradeDate.getFullYear() === now.getFullYear()
      );
    case "this-year":
      return tradeDate.getFullYear() === now.getFullYear();
    default:
      return true;
  }
}

// Map a raw Supabase row to the Trade interface shape
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
    account: (row.evaluation_accounts as { account_name: string } | null)?.account_name ?? "Unassigned",
    instrument,
    direction: row.direction as TradeDirection,
    session: row.session,
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

// ── Sortable column header ──────────────────────────────────────────────────

function SortHead({
  children,
  className,
  sortKey,
  activeKey,
  activeDir,
  onSort,
}: {
  children: React.ReactNode;
  className?: string;
  sortKey: SortKey;
  activeKey: SortKey | null;
  activeDir: SortDir;
  onSort: (k: SortKey) => void;
}) {
  const isActive = activeKey === sortKey;
  const Icon = isActive
    ? activeDir === "asc"
      ? ArrowUp
      : ArrowDown
    : ArrowUpDown;
  return (
    <TableHead
      className={cn(
        "text-xs font-medium text-muted-foreground uppercase tracking-wide select-none",
        className
      )}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "inline-flex items-center gap-1 transition-colors",
          isActive ? "text-foreground" : "hover:text-foreground"
        )}
      >
        {children}
        <Icon size={11} className={isActive ? "opacity-80" : "opacity-40"} />
      </button>
    </TableHead>
  );
}

// ── Sort logic ──────────────────────────────────────────────────────────────

function sortTrades(
  trades: Trade[],
  sortKey: SortKey | null,
  sortDir: SortDir
): Trade[] {
  if (!sortKey) return trades;
  const dir = sortDir === "asc" ? 1 : -1;
  return [...trades].sort((a, b) => {
    switch (sortKey) {
      case "date":
        return dir * (new Date(a.date).getTime() - new Date(b.date).getTime());
      case "account":
        return dir * a.account.localeCompare(b.account);
      case "setup":
        return dir * a.setupType.localeCompare(b.setupType);
      case "pnl":
        return dir * ((a.pnl ?? -Infinity) - (b.pnl ?? -Infinity));
      case "rMultiple":
        return dir * ((a.rMultiple ?? -Infinity) - (b.rMultiple ?? -Infinity));
      default:
        return 0;
    }
  });
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function TradesPage() {
  const router = useRouter();

  // ── Data state ──────────────────────────────────────────────────────────
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  // ── UI state ────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [instrumentFilter, setInstrumentFilter] = useState("all");
  const [outcomeFilter, setOutcomeFilter] = useState("all");
  const [setupFilter, setSetupFilter] = useState("all");
  const [accountFilter, setAccountFilter] = useState("all");
  const [dateRangeFilter, setDateRangeFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey | null>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [showMoreFilters, setShowMoreFilters] = useState(false);

  // Delete state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");

  // ── Fetch trades on mount ────────────────────────────────────────────────
  useEffect(() => {
    async function fetchTrades() {
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
        .select("*, evaluation_accounts(account_name)")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        setFetchError(error.message);
        setLoading(false);
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setTrades((data ?? []).map((row: any) => mapRow(row)));
      setLoading(false);
    }

    fetchTrades();
  }, [router]);

  // ── Delete handler ───────────────────────────────────────────────────────
  async function handleDelete(tradeId: string) {
    setDeletingId(tradeId);
    setDeleteError("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setDeleteError("You must be logged in to delete a trade.");
      setDeletingId(null);
      return;
    }

    const { error } = await supabase
      .from("trades")
      .delete()
      .eq("id", tradeId)
      .eq("user_id", user.id);

    if (error) {
      setDeleteError(error.message);
      setDeletingId(null);
      setConfirmDeleteId(null);
      return;
    }

    // Remove from local state — no full refetch needed
    setTrades((prev) => prev.filter((t) => t.id !== tradeId));
    setConfirmDeleteId(null);
    setDeletingId(null);
  }

  // ── Sort handler ─────────────────────────────────────────────────────────
  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  // ── Filter logic ─────────────────────────────────────────────────────────
  const filtered = trades.filter((t) => {
    if (search) {
      const q = search.toLowerCase();
      if (
        !t.setupType.toLowerCase().includes(q) &&
        !t.account.toLowerCase().includes(q) &&
        !t.instrument.toLowerCase().includes(q)
      )
        return false;
    }
    if (instrumentFilter !== "all" && t.instrument !== instrumentFilter)
      return false;
    if (outcomeFilter !== "all" && t.outcome !== outcomeFilter) return false;
    if (setupFilter !== "all" && t.setupType !== setupFilter) return false;
    if (accountFilter !== "all" && t.account !== accountFilter) return false;
    if (dateRangeFilter !== "all" && !isInDateRange(t.date, dateRangeFilter))
      return false;
    return true;
  });

  const sortedTrades = sortTrades(filtered, sortKey, sortDir);

  // Unique account names derived from loaded trades for the account filter dropdown
  const uniqueAccounts = [...new Set(trades.map((t) => t.account))].sort();

  // ── Summary stats (computed from all loaded trades, not just filtered) ──
  const closedTrades = trades.filter((t) => t.status === "Closed");
  const wins = closedTrades.filter((t) => t.outcome === "Profit");
  const losses = closedTrades.filter((t) => t.outcome === "Loss");
  const totalPnl = closedTrades.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
  const decisiveCount = wins.length + losses.length;
  const winRate =
    decisiveCount > 0 ? Math.round((wins.length / decisiveCount) * 100) : 0;
  const rValues = closedTrades
    .filter((t) => t.rMultiple != null)
    .map((t) => t.rMultiple!);
  const avgR =
    rValues.length > 0
      ? rValues.reduce((sum, r) => sum + r, 0) / rValues.length
      : 0;

  // ── Render states ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-6 md:p-8 flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 size={22} className="text-muted-foreground animate-spin" />
        <p className="text-sm text-muted-foreground">Loading trades...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="p-6 md:p-8 flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <AlertCircle size={22} className="text-destructive" />
        <p className="text-sm font-medium text-foreground">
          Failed to load trades
        </p>
        <p className="text-sm text-muted-foreground max-w-xs text-center">
          {fetchError}
        </p>
        <button
          onClick={() => {
            setFetchError("");
            setLoading(true);
            // re-mount effect by forcing a page refresh
            router.refresh();
          }}
          className="mt-1 text-sm text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Trade History
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Review, filter, and analyse your logged trades.
          </p>
        </div>
        <Button asChild>
          <Link href="/trades/new">
            <Plus size={14} />
            Log Trade
          </Link>
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Trades" value={String(trades.length)} />
        <StatCard
          label="Total P/L"
          value={formatSummaryPnl(totalPnl)}
          valueColor={totalPnl > 0 ? "green" : totalPnl < 0 ? "red" : "default"}
        />
        <StatCard
          label="Win Rate"
          value={decisiveCount > 0 ? `${winRate}%` : "—"}
        />
        <StatCard
          label="Average R"
          value={rValues.length > 0 ? formatSummaryR(avgR) : "—"}
          valueColor={avgR > 0 ? "green" : avgR < 0 ? "red" : "default"}
        />
      </div>

      {/* Filters */}
      {(() => {
        const extraFilterCount = [instrumentFilter, outcomeFilter, setupFilter, accountFilter]
          .filter((v) => v !== "all").length;
        return (
          <div className="rounded-xl border border-border bg-card shadow-sm px-5 py-4 mb-5">
            <div className="flex flex-wrap gap-2.5">
              <div className="relative flex-1 min-w-52">
                <Search
                  size={13}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                />
                <Input
                  placeholder="Search by setup, account, instrument..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8 text-sm"
                />
              </div>

              <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
                <SelectTrigger className="w-36 h-8 text-sm">
                  <SelectValue placeholder="Date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="this-week">This week</SelectItem>
                  <SelectItem value="this-month">This month</SelectItem>
                  <SelectItem value="this-year">This year</SelectItem>
                </SelectContent>
              </Select>

              <button
                type="button"
                onClick={() => setShowMoreFilters((v) => !v)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 h-8 text-sm font-medium rounded-md border transition-colors",
                  showMoreFilters || extraFilterCount > 0
                    ? "border-primary/30 bg-primary/5 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Filter size={13} />
                More filters
                {extraFilterCount > 0 && (
                  <span className="flex items-center justify-center w-4.5 h-4.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold leading-none">
                    {extraFilterCount}
                  </span>
                )}
              </button>
            </div>

            {showMoreFilters && (
              <div className="flex flex-wrap gap-2.5 mt-3 pt-3 border-t border-border">
                <Select value={instrumentFilter} onValueChange={setInstrumentFilter}>
                  <SelectTrigger className="w-36 h-8 text-sm">
                    <SelectValue placeholder="Instrument" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All instruments</SelectItem>
                    {INSTRUMENTS.map((inst) => (
                      <SelectItem key={inst} value={inst}>
                        {inst}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
                  <SelectTrigger className="w-32 h-8 text-sm">
                    <SelectValue placeholder="Outcome" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All outcomes</SelectItem>
                    <SelectItem value="Profit">Profit</SelectItem>
                    <SelectItem value="Loss">Loss</SelectItem>
                    <SelectItem value="Break even">Break even</SelectItem>
                    <SelectItem value="Open">Open</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={setupFilter} onValueChange={setSetupFilter}>
                  <SelectTrigger className="w-44 h-8 text-sm">
                    <SelectValue placeholder="Setup" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All setups</SelectItem>
                    {SETUP_TAGS.map((tag) => (
                      <SelectItem key={tag} value={tag}>
                        {tag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={accountFilter} onValueChange={setAccountFilter}>
                  <SelectTrigger className="w-40 h-8 text-sm">
                    <SelectValue placeholder="Account" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All accounts</SelectItem>
                    {uniqueAccounts.map((acc) => (
                      <SelectItem key={acc} value={acc}>{acc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        );
      })()}

      {/* Delete error banner */}
      {deleteError && (
        <div className="mb-4 flex items-start gap-2 px-4 py-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>{deleteError}</span>
        </div>
      )}

      {/* Table or empty state */}
      {trades.length === 0 ? (
        <EmptyState />
      ) : sortedTrades.length === 0 ? (
        <NoResults
          onClear={() => {
            setSearch("");
            setInstrumentFilter("all");
            setOutcomeFilter("all");
            setSetupFilter("all");
            setAccountFilter("all");
            setDateRangeFilter("all");
          }}
        />
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">

          {/* Table meta bar */}
          <div className="px-5 py-3 border-b border-border">
            <p className="text-xs text-muted-foreground">
              Showing{" "}
              <span className="font-medium text-foreground">
                {sortedTrades.length}
              </span>{" "}
              of{" "}
              <span className="font-medium text-foreground">
                {trades.length}
              </span>{" "}
              trades
            </p>
          </div>

          <Table className="table-fixed">
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border bg-muted/30">
                <SortHead className="w-[13%] pl-5" sortKey="date"      activeKey={sortKey} activeDir={sortDir} onSort={handleSort}>Date</SortHead>
                <SortHead className="w-[11%]"       sortKey="account"   activeKey={sortKey} activeDir={sortDir} onSort={handleSort}>Account</SortHead>
                <TableHead className="w-[7%] text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Instrument
                </TableHead>
                <TableHead className="w-[8%] text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Direction
                </TableHead>
                <SortHead className="w-[14%]" sortKey="setup" activeKey={sortKey} activeDir={sortDir} onSort={handleSort}>Setup</SortHead>
                <TableHead className="w-[10%] text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Outcome
                </TableHead>
                <SortHead className="w-[10%]" sortKey="pnl"       activeKey={sortKey} activeDir={sortDir} onSort={handleSort}>P/L</SortHead>
                <SortHead className="w-[9%]"  sortKey="rMultiple" activeKey={sortKey} activeDir={sortDir} onSort={handleSort}>R</SortHead>
                <TableHead className="w-[8%] text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Status
                </TableHead>
                <TableHead className="w-[10%] text-xs font-medium text-muted-foreground uppercase tracking-wide" />
              </TableRow>
            </TableHeader>

            <TableBody>
              {sortedTrades.map((trade) => (
                <TableRow
                  key={trade.id}
                  className="border-border group cursor-pointer"
                  onClick={() => router.push(`/trades/${trade.id}`)}
                >
                  <TableCell className="pl-5 py-3.5 text-sm text-foreground font-medium">
                    {formatTradeDate(trade.date)}
                  </TableCell>

                  <TableCell className="py-3.5 text-sm text-muted-foreground truncate">
                    {trade.account}
                  </TableCell>

                  <TableCell className="py-3.5">
                    <span className="text-sm font-semibold text-foreground">
                      {trade.instrument}
                    </span>
                  </TableCell>

                  <TableCell className="py-3.5">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium",
                        DIRECTION_BADGE[trade.direction]
                      )}
                    >
                      {trade.direction === "Long"
                        ? <TrendingUp size={11} />
                        : <TrendingDown size={11} />}
                      {trade.direction}
                    </span>
                  </TableCell>

                  <TableCell className="py-3.5 text-sm text-muted-foreground truncate">
                    {trade.setupType}
                  </TableCell>

                  <TableCell className="py-3.5">
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium",
                        OUTCOME_BADGE[trade.outcome]
                      )}
                    >
                      {trade.outcome}
                    </span>
                  </TableCell>

                  <TableCell className="py-3.5">
                    <span className={cn("text-sm", PNL_TEXT[trade.outcome])}>
                      {formatPnl(trade.pnl)}
                    </span>
                  </TableCell>

                  <TableCell className="py-3.5">
                    <span
                      className={cn(
                        "text-sm tabular-nums font-medium",
                        trade.outcome === "Profit" &&
                          "text-emerald-600 dark:text-emerald-400",
                        trade.outcome === "Loss" &&
                          "text-red-500 dark:text-red-400",
                        (trade.outcome === "Break even" ||
                          trade.outcome === "Open") &&
                          "text-muted-foreground font-normal"
                      )}
                    >
                      {formatR(trade.rMultiple)}
                    </span>
                  </TableCell>

                  <TableCell className="py-3.5">
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium",
                        STATUS_BADGE[trade.status]
                      )}
                    >
                      {trade.status}
                    </span>
                  </TableCell>

                  <TableCell className="py-3.5 pr-4">
                    {confirmDeleteId === trade.id ? (
                      // Inline confirmation for this row
                      <div
                        className="flex items-center justify-end gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="text-xs text-muted-foreground mr-0.5">
                          Delete?
                        </span>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-1 text-xs font-medium rounded border border-border text-muted-foreground hover:bg-muted transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(trade.id)}
                          disabled={deletingId === trade.id}
                          className="px-2 py-1 text-xs font-medium rounded bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {deletingId === trade.id ? "..." : "Delete"}
                        </button>
                      </div>
                    ) : (
                      // Normal hover actions
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          href={`/trades/${trade.id}`}
                          title="View trade"
                          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors inline-flex items-center justify-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Eye size={14} />
                        </Link>
                        <Link
                          href={`/trades/${trade.id}/edit`}
                          title="Edit trade"
                          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Pencil size={14} />
                        </Link>
                        <button
                          type="button"
                          title="Delete trade"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteId(trade.id);
                            setDeleteError("");
                          }}
                          className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Table footer */}
          <div className="px-5 py-3 border-t border-border bg-muted/20">
            <p className="text-xs text-muted-foreground">
              Showing{" "}
              <span className="font-medium text-foreground">
                {sortedTrades.length}
              </span>{" "}
              trades
            </p>
          </div>

        </div>
      )}

    </div>
  );
}

// ── Empty state (no trades at all) ──────────────────────────────────────────

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card shadow-sm px-6 py-20 flex flex-col items-center text-center">
      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-muted mb-4">
        <ClipboardX size={22} className="text-muted-foreground" />
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-1">
        No trades logged yet
      </h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs">
        Start by logging your first trade to begin tracking your performance and
        building your journal.
      </p>
      <Button asChild>
        <Link href="/trades/new">
          <Plus size={14} />
          Log Trade
        </Link>
      </Button>
    </div>
  );
}

// ── No results (trades exist but filters exclude all of them) ───────────────

function NoResults({ onClear }: { onClear: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card shadow-sm px-6 py-16 flex flex-col items-center text-center">
      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-muted mb-4">
        <Search size={20} className="text-muted-foreground" />
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-1">
        No trades match your filters
      </h3>
      <p className="text-sm text-muted-foreground mb-5 max-w-xs">
        Try adjusting the filters or search query.
      </p>
      <button
        onClick={onClear}
        className="text-sm font-medium text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
      >
        Clear all filters
      </button>
    </div>
  );
}

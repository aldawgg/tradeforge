"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  ClipboardX,
  Filter,
  Eye,
  Pencil,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
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
import { MOCK_TRADES } from "@/lib/mock-data";
import { INSTRUMENTS, SETUP_TAGS } from "@/lib/constants";
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
  const Icon = isActive ? (activeDir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
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

// ── Page ────────────────────────────────────────────────────────────────────

function sortTrades(trades: Trade[], sortKey: SortKey | null, sortDir: SortDir): Trade[] {
  if (!sortKey) return trades;
  const dir = sortDir === "asc" ? 1 : -1;
  return [...trades].sort((a, b) => {
    switch (sortKey) {
      case "date":      return dir * (new Date(a.date).getTime() - new Date(b.date).getTime());
      case "account":   return dir * a.account.localeCompare(b.account);
      case "setup":     return dir * a.setupType.localeCompare(b.setupType);
      case "pnl":       return dir * ((a.pnl ?? -Infinity) - (b.pnl ?? -Infinity));
      case "rMultiple": return dir * ((a.rMultiple ?? -Infinity) - (b.rMultiple ?? -Infinity));
      default:          return 0;
    }
  });
}

export default function TradesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  }

  const filtered = MOCK_TRADES.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      t.setupType.toLowerCase().includes(q) ||
      t.account.toLowerCase().includes(q) ||
      t.instrument.toLowerCase().includes(q)
    );
  });

  const sortedTrades = sortTrades(filtered, sortKey, sortDir);
  const hasTrades = MOCK_TRADES.length > 0;

  return (
    <div className="p-6 md:p-8">

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Trade History</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Review, filter, and analyse your logged trades.
          </p>
        </div>
        <Link
          href="/trades/new"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 active:bg-primary/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Plus size={14} />
          Log Trade
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Trades" value="42" />
        <StatCard label="Total P/L" value="+$8,400" valueColor="green" />
        <StatCard label="Win Rate" value="60%" />
        <StatCard label="Average R" value="+1.2R" valueColor="green" />
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-border bg-card shadow-sm px-5 py-4 mb-5">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={13} className="text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Filters
          </span>
        </div>
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

          <Select>
            <SelectTrigger className="w-36 h-8 text-sm">
              <SelectValue placeholder="Instrument" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All instruments</SelectItem>
              {INSTRUMENTS.map((inst) => (
                <SelectItem key={inst} value={inst}>{inst}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select>
            <SelectTrigger className="w-32 h-8 text-sm">
              <SelectValue placeholder="Outcome" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All outcomes</SelectItem>
              <SelectItem value="profit">Profit</SelectItem>
              <SelectItem value="loss">Loss</SelectItem>
              <SelectItem value="breakeven">Break even</SelectItem>
              <SelectItem value="open">Open</SelectItem>
            </SelectContent>
          </Select>

          <Select>
            <SelectTrigger className="w-44 h-8 text-sm">
              <SelectValue placeholder="Setup" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All setups</SelectItem>
              {SETUP_TAGS.map((tag) => (
                <SelectItem key={tag} value={tag.toLowerCase().replace(/\s+/g, "-")}>{tag}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select>
            <SelectTrigger className="w-40 h-8 text-sm">
              <SelectValue placeholder="Account" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All accounts</SelectItem>
              {Array.from(new Set(MOCK_TRADES.map((t) => t.account))).map((acc) => (
                <SelectItem key={acc} value={acc.toLowerCase().replace(/\s+/g, "-")}>{acc}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select>
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

        </div>
      </div>

      {/* Table or empty state */}
      {hasTrades ? (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">

          {/* Table meta bar */}
          <div className="px-5 py-3 border-b border-border">
            <p className="text-xs text-muted-foreground">
              Showing <span className="font-medium text-foreground">{sortedTrades.length}</span> of{" "}
              <span className="font-medium text-foreground">42</span> trades
            </p>
          </div>

          <Table className="table-fixed">
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border bg-muted/30">
                <SortHead className="w-[13%] pl-5" sortKey="date"      activeKey={sortKey} activeDir={sortDir} onSort={handleSort}>Date</SortHead>
                <SortHead className="w-[14%]"       sortKey="account"   activeKey={sortKey} activeDir={sortDir} onSort={handleSort}>Account</SortHead>
                <TableHead className="w-[7%] text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Instrument
                </TableHead>
                <TableHead className="w-[8%] text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Direction
                </TableHead>
                <SortHead className="w-[17%]"       sortKey="setup"     activeKey={sortKey} activeDir={sortDir} onSort={handleSort}>Setup</SortHead>
                <TableHead className="w-[10%] text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Outcome
                </TableHead>
                <SortHead className="w-[10%]"       sortKey="pnl"       activeKey={sortKey} activeDir={sortDir} onSort={handleSort}>P/L</SortHead>
                <SortHead className="w-[9%]"        sortKey="rMultiple" activeKey={sortKey} activeDir={sortDir} onSort={handleSort}>R</SortHead>
                <TableHead className="w-[8%] text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Status
                </TableHead>
                <TableHead className="w-[4%] text-xs font-medium text-muted-foreground uppercase tracking-wide" />
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
                    {trade.date}
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
                        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium",
                        DIRECTION_BADGE[trade.direction]
                      )}
                    >
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
                        trade.outcome === "Profit" && "text-emerald-600 dark:text-emerald-400",
                        trade.outcome === "Loss"   && "text-red-500 dark:text-red-400",
                        (trade.outcome === "Break even" || trade.outcome === "Open") &&
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
                    </div>
                  </TableCell>

                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Table footer */}
          <div className="px-5 py-3 border-t border-border bg-muted/20">
            <p className="text-xs text-muted-foreground">
              Showing <span className="font-medium text-foreground">{sortedTrades.length}</span> trades
            </p>
          </div>

        </div>
      ) : (
        <EmptyState />
      )}

    </div>
  );
}

// ── Empty state ─────────────────────────────────────────────────────────────

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
        Start by logging your first trade to begin tracking your performance and building your journal.
      </p>
      <Link
        href="/trades/new"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 active:bg-primary/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <Plus size={14} />
        Log Trade
      </Link>
    </div>
  );
}

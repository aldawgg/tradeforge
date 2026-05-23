// ── Primitive union types ──────────────────────────────────────────────────

export type TradeDirection = "Long" | "Short";

export type TradingSession = "Asia" | "London" | "New York AM" | "New York PM" | "Other";

export type TradeOutcome = "Profit" | "Loss" | "Break even" | "Open";

export type TradeStatus = "Closed" | "Open";

export type EvaluationStatus = "Not Started" | "In Eval" | "Passed" | "Funded" | "Breached";

// ── Tag union types ────────────────────────────────────────────────────────

export type SetupTag =
  | "VWAP bounce"
  | "VWAP reclaim"
  | "Liquidity sweep"
  | "FVG continuation"
  | "Inverse FVG"
  | "Rejection block"
  | "Breakout retest"
  | "Failed breakout"
  | "Trend continuation"
  | "Reversal trade"
  | "News trade"
  | "Other";

export type ImprovementTag =
  | "Entered too early"
  | "Moved stop loss"
  | "Overtraded"
  | "Revenge traded"
  | "Ignored news"
  | "No clear setup"
  | "Took profit too early"
  | "Held loser too long"
  | "Oversized"
  | "Broke daily loss limit"
  | "FOMO entry"
  | "Other";

export type PositiveReviewTag =
  | "Waited for confirmation"
  | "Followed trading plan"
  | "Respected stop loss"
  | "Good risk/reward"
  | "Entered at key level"
  | "Good trade management"
  | "Correct position size"
  | "Managed emotions well"
  | "Avoided overtrading"
  | "Took partials correctly"
  | "Let winner run"
  | "Followed session rules"
  | "Other";

// ── Core entity interfaces ─────────────────────────────────────────────────

/** Canonical trade shape — matches the future Supabase schema. */
export interface Trade {
  id: string;
  date: string;
  account: string;
  instrument: string;
  direction: TradeDirection;
  session: TradingSession;
  entryPrice: number;
  exitPrice: number | null;
  stopLoss: number;
  target: number;
  contracts: number;
  setupType: string;
  mistakeTags: string[];
  positiveTags: string[];
  notes: string;
  screenshots: string[];
  pnl: number | null;
  rMultiple: number | null;
  outcome: TradeOutcome;
  status: TradeStatus;
}

export interface TradeAccount {
  id: string;
  name: string;
  firm: string;
  accountSize: number;
}

/** Canonical evaluation account shape — matches the future Supabase schema. */
export interface EvaluationAccount {
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
  status: EvaluationStatus;
  consistency: number | null;
  consistencyThreshold: number | null;
  notes: string;
}

// ── Dashboard data shapes ──────────────────────────────────────────────────

export interface DashboardPeriodData {
  pl: string;
  plColor: "green" | "red" | "default";
  winRate: string;
  winRateSubtitle: string;
  trades: string;
}

export interface StreakData {
  type: "win" | "loss" | "none";
  count: number;
}

export interface BestSetupData {
  name: string;
  winRate: number;
  trades: number;
  totalPnl: string;
}

export interface ConsistencyData {
  value: number;
  target: number;
}

// ── Analytics data shapes ──────────────────────────────────────────────────

export interface SetupStat {
  name: string;
  trades: number;
  wins: number;
  pnl: number;
  avgR: number;
}

export interface SessionStat {
  name: string;
  trades: number;
  wins: number;
  pnl: number;
  avgR: number;
}

export interface TagStat {
  name: string;
  count: number;
  pnl: number;
}

// ── Chart data shapes ──────────────────────────────────────────────────────

/** One data point on the account growth chart. Dynamic keys allow any account. */
export interface AccountGrowthPoint {
  date: string;
  [accountKey: string]: number | string;
}

export interface AccountChartConfig {
  key: string;
  label: string;
  color: string;
}

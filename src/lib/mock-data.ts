import type {
  Trade,
  EvaluationAccount,
  DashboardPeriodData,
  StreakData,
  BestSetupData,
  ConsistencyData,
  SetupStat,
  SessionStat,
  TagStat,
  AccountGrowthPoint,
  AccountChartConfig,
} from "./types";

// ── Trades ─────────────────────────────────────────────────────────────────

export const MOCK_TRADES: Trade[] = [
  {
    id: "1",
    date: "May 16, 2026",
    account: "Apex 50K #1",
    instrument: "MNQ",
    direction: "Long",
    session: "New York AM",
    entryPrice: 21450.25,
    exitPrice: 21487.5,
    stopLoss: 21425.0,
    target: 21500.0,
    contracts: 2,
    setupType: "VWAP Bounce",
    mistakeTags: ["Took profit too early"],
    positiveTags: ["Waited for confirmation", "Followed trading plan", "Respected stop loss"],
    notes:
      "Clean VWAP bounce after liquidity sweep. Entry was patient, but exit could have been held closer to target.",
    screenshots: [],
    pnl: 250,
    rMultiple: 1.8,
    outcome: "Profit",
    status: "Closed",
  },
  {
    id: "2",
    date: "May 16, 2026",
    account: "Topstep 50K",
    instrument: "MES",
    direction: "Short",
    session: "New York AM",
    entryPrice: 5285.5,
    exitPrice: 5289.5,
    stopLoss: 5289.0,
    target: 5277.0,
    contracts: 1,
    setupType: "Liquidity Sweep",
    mistakeTags: ["FOMO entry"],
    positiveTags: [],
    notes: "",
    screenshots: [],
    pnl: -90,
    rMultiple: -0.7,
    outcome: "Loss",
    status: "Closed",
  },
  {
    id: "3",
    date: "May 15, 2026",
    account: "Apex 50K #2",
    instrument: "NQ",
    direction: "Long",
    session: "London",
    entryPrice: 20985.0,
    exitPrice: 20985.0,
    stopLoss: 20960.0,
    target: 21035.0,
    contracts: 1,
    setupType: "FVG Continuation",
    mistakeTags: [],
    positiveTags: ["Respected stop loss"],
    notes: "",
    screenshots: [],
    pnl: 0,
    rMultiple: 0,
    outcome: "Break even",
    status: "Closed",
  },
  {
    id: "4",
    date: "May 15, 2026",
    account: "Tradeify 25K",
    instrument: "MNQ",
    direction: "Short",
    session: "New York PM",
    entryPrice: 21380.0,
    exitPrice: 21352.0,
    stopLoss: 21400.0,
    target: 21340.0,
    contracts: 1,
    setupType: "Rejection Block",
    mistakeTags: [],
    positiveTags: ["Followed trading plan", "Waited for confirmation"],
    notes: "",
    screenshots: [],
    pnl: 180,
    rMultiple: 1.4,
    outcome: "Profit",
    status: "Closed",
  },
  {
    id: "5",
    date: "May 14, 2026",
    account: "Apex 50K #1",
    instrument: "MES",
    direction: "Long",
    session: "New York AM",
    entryPrice: 5280.0,
    exitPrice: null,
    stopLoss: 5275.0,
    target: 5295.0,
    contracts: 1,
    setupType: "VWAP Reclaim",
    mistakeTags: [],
    positiveTags: [],
    notes: "",
    screenshots: [],
    pnl: null,
    rMultiple: null,
    outcome: "Open",
    status: "Open",
  },
];

// ── Evaluation accounts ────────────────────────────────────────────────────

export const MOCK_EVAL_ACCOUNTS: EvaluationAccount[] = [
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
    consistencyThreshold: 30,
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
    consistencyThreshold: 30,
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
    consistencyThreshold: 30,
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
    consistencyThreshold: 30,
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
    consistencyThreshold: 30,
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
    consistencyThreshold: 35,
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
    consistencyThreshold: 35,
    notes: "",
  },
];

// ── Dashboard mock data ────────────────────────────────────────────────────

export const MOCK_TOTAL_PNL = "+$8,400";

export const MOCK_DASHBOARD_PERIOD_DATA: Record<"1D" | "1W" | "1M" | "YTD", DashboardPeriodData> =
  {
    "1D":  { pl: "+$250",   plColor: "green", winRate: "60%", winRateSubtitle: "3 of 5 trades",     trades: "5"   },
    "1W":  { pl: "+$780",   plColor: "green", winRate: "55%", winRateSubtitle: "12 of 22 trades",   trades: "22"  },
    "1M":  { pl: "+$2,150", plColor: "green", winRate: "58%", winRateSubtitle: "50 of 87 trades",   trades: "87"  },
    "YTD": { pl: "+$8,400", plColor: "green", winRate: "52%", winRateSubtitle: "162 of 312 trades", trades: "312" },
  };

export const MOCK_STREAK: StreakData = { type: "win", count: 4 };

export const MOCK_BEST_SETUP: BestSetupData = {
  name: "VWAP Bounce",
  winRate: 73,
  trades: 15,
  totalPnl: "+$1,840",
};

export const MOCK_CONSISTENCY: ConsistencyData = { value: 28, target: 30 };

// Total balance and change derived from the last chart data point (May)
export const MOCK_TOTAL_BALANCE         = 154250;
export const MOCK_TOTAL_BALANCE_CHANGE  = 4250;
export const MOCK_TOTAL_BALANCE_PCT     = "2.83";
export const MOCK_TRACKED_ACCOUNT_COUNT = 4;

// ── Account growth chart ───────────────────────────────────────────────────

export const MOCK_CHART_ACCOUNTS: AccountChartConfig[] = [
  { key: "apex1",    label: "Apex 50K #1",  color: "var(--color-chart-1)" },
  { key: "apex2",    label: "Apex 50K #2",  color: "var(--color-chart-2)" },
  { key: "topstep",  label: "Topstep 50K",  color: "var(--color-chart-3)" },
  { key: "tradeify", label: "Tradeify 25K", color: "var(--color-chart-4)" },
];

export const MOCK_GROWTH_DATA: AccountGrowthPoint[] = [
  { date: "Dec",  apex1: 50000, apex2: 50000, topstep: 50000, tradeify: 25000 },
  { date: "Jan",  apex1: 51500, apex2: 50800, topstep: 48200, tradeify: 25600 },
  { date: "Feb",  apex1: 52800, apex2: 51200, topstep: 46800, tradeify: 26400 },
  { date: "Mar",  apex1: 53600, apex2: 50400, topstep: 42100, tradeify: 27800 },
  { date: "Apr",  apex1: 51900, apex2: 49600, topstep: 38700, tradeify: 28500 },
  { date: "May",  apex1: 52000, apex2: 48500, topstep: 35500, tradeify: 18250 },
];

// ── Analytics mock data ────────────────────────────────────────────────────

export const MOCK_SETUP_STATS: SetupStat[] = [
  { name: "VWAP Bounce",      trades: 28, wins: 20, pnl:  1840, avgR:  1.4 },
  { name: "Liquidity Sweep",  trades: 18, wins: 10, pnl:   620, avgR:  0.9 },
  { name: "FVG Continuation", trades: 14, wins:  9, pnl:   540, avgR:  1.1 },
  { name: "Rejection Block",  trades: 11, wins:  6, pnl:   210, avgR:  0.7 },
  { name: "Failed Breakout",  trades:  8, wins:  2, pnl:  -380, avgR: -0.8 },
];

export const MOCK_INSTRUMENT_STATS: SetupStat[] = [
  { name: "MNQ", trades: 48, wins: 31, pnl:  2640, avgR:  1.3 },
  { name: "MES", trades: 22, wins: 12, pnl:   480, avgR:  0.8 },
  { name: "NQ",  trades:  8, wins:  3, pnl:  -120, avgR: -0.4 },
  { name: "ES",  trades:  5, wins:  2, pnl:   -60, avgR: -0.3 },
];

export const MOCK_SESSION_STATS: SessionStat[] = [
  { name: "New York AM", trades: 42, wins: 27, pnl:  2340, avgR:  1.3 },
  { name: "London",      trades: 18, wins:  9, pnl:   480, avgR:  0.7 },
  { name: "New York PM", trades: 12, wins:  6, pnl:   120, avgR:  0.4 },
  { name: "Asia",        trades:  6, wins:  2, pnl:  -210, avgR: -0.8 },
  { name: "Other",       trades:  5, wins:  3, pnl:    90, avgR:  0.6 },
];

export const MOCK_MISTAKE_STATS: TagStat[] = [
  { name: "Entered too early",     count: 8, pnl:  -520 },
  { name: "Took profit too early", count: 6, pnl:  -250 },
  { name: "FOMO entry",            count: 5, pnl:  -410 },
  { name: "Moved stop loss",       count: 3, pnl:  -300 },
  { name: "Overtraded",            count: 3, pnl:  -180 },
];

export const MOCK_BEHAVIOUR_STATS: TagStat[] = [
  { name: "Respected stop loss",     count: 15, pnl:  760 },
  { name: "Followed trading plan",   count: 12, pnl: 1200 },
  { name: "Waited for confirmation", count:  9, pnl:  850 },
  { name: "Managed emotions well",   count:  7, pnl:  430 },
];

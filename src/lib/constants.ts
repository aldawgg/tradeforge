export const INSTRUMENTS = ["MES", "MNQ", "ES", "NQ"] as const;

export const DIRECTIONS = ["Long", "Short"] as const;

export const SESSIONS = ["Asia", "London", "New York AM", "New York PM", "Other"] as const;

export const SETUP_TAGS = [
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
  "Other",
] as const;

export const MISTAKE_TAGS = [
  "Entered too early",
  "Moved stop loss",
  "Overtraded",
  "Revenge traded",
  "Ignored news",
  "No clear setup",
  "Took profit too early",
  "Held loser too long",
  "Oversized",
  "Broke daily loss limit",
  "FOMO entry",
  "Other",
] as const;

export const POSITIVE_REVIEW_TAGS = [
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

export const EVAL_STATUSES = [
  "Not Started",
  "In Eval",
  "Passed",
  "Funded",
  "Breached",
] as const;

export const PROP_FIRMS = [
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

export const ACCOUNT_SIZE_OPTIONS = [
  { label: "$25,000",  value: "25000"  },
  { label: "$50,000",  value: "50000"  },
  { label: "$75,000",  value: "75000"  },
  { label: "$100,000", value: "100000" },
  { label: "$150,000", value: "150000" },
  { label: "$200,000", value: "200000" },
] as const;

/** Dollar value per point for each supported instrument. */
export const POINT_VALUES: Record<string, number> = {
  MES: 5,
  MNQ: 2,
  ES: 12.5,
  NQ: 20,
};

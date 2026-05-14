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

export const EVAL_STATUSES = [
  "Not started",
  "In progress",
  "Passed",
  "Failed",
  "Funded",
] as const;

export type Direction = "Long" | "Short";

export type Session = "Asia" | "London" | "New York AM" | "New York PM" | "Other";

export type EvalStatus = "Not started" | "In progress" | "Passed" | "Failed" | "Funded";

export interface Trade {
  id: string;
  date: string;
  instrument: string;
  direction: Direction;
  session: Session;
  entryPrice: number;
  exitPrice: number;
  stopLoss: number;
  target: number;
  contracts: number;
  setupType: string;
  mistakeTags: string[];
  notes: string;
  screenshots: string[];
  pnl: number;
  rMultiple: number;
}

export interface EvalAccount {
  id: string;
  propFirmName: string;
  accountName: string;
  accountSize: number;
  startingBalance: number;
  currentBalance: number;
  profitTarget: number;
  maxDrawdown: number;
  dailyLossLimit: number;
  minTradingDays: number;
  completedTradingDays: number;
  status: EvalStatus;
  notes: string;
}

export interface DashboardStats {
  totalPnl: number;
  dailyPnl: number;
  weeklyPnl: number;
  monthlyPnl: number;
  annualPnl: number;
  dailyWinRate: number;
  weeklyWinRate: number;
  monthlyWinRate: number;
  annualWinRate: number;
  currentWinStreak: number;
  currentLossStreak: number;
  totalTrades: number;
  bestSetup: string;
  worstSetup: string;
}

import { cn } from "@/lib/utils";

interface SetupRow {
  name: string;
  winRate: number;
  trades: number;
}

const WIN_THRESHOLD = 50;

interface SetupPerformanceProps {
  setups: SetupRow[];
}

export function SetupPerformance({ setups }: SetupPerformanceProps) {
  const sorted = [...setups].sort((a, b) => b.winRate - a.winRate);

  return (
    <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
      {sorted.map((setup, i) => (
        <div
          key={setup.name}
          className="flex items-center gap-4 px-4 py-3 bg-card hover:bg-muted/50 transition-colors"
        >
          <span className="text-xs text-muted-foreground w-4 tabular-nums shrink-0 select-none">
            {i + 1}
          </span>

          <span className="text-sm font-medium text-foreground flex-1 min-w-0 truncate">
            {setup.name}
          </span>

          <div className="w-24 h-1.5 bg-muted rounded-full shrink-0 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full",
                setup.winRate >= WIN_THRESHOLD ? "bg-emerald-500" : "bg-red-400"
              )}
              style={{ width: `${setup.winRate}%` }}
            />
          </div>

          <span
            className={cn(
              "text-sm font-semibold tabular-nums w-10 text-right shrink-0",
              setup.winRate >= WIN_THRESHOLD ? "text-emerald-600" : "text-red-500"
            )}
          >
            {setup.winRate}%
          </span>

          <span className="text-xs text-muted-foreground tabular-nums w-16 text-right shrink-0">
            {setup.trades} trades
          </span>
        </div>
      ))}
    </div>
  );
}

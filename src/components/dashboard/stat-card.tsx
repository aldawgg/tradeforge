import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  subtitle?: string;
  valueColor?: "green" | "red" | "default";
  action?: React.ReactNode;
  tint?: "green" | "red";
  meter?: number;
}

export function StatCard({
  label,
  value,
  subtitle,
  valueColor = "default",
  action,
  tint,
  meter,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border px-5 py-4 shadow-sm",
        tint === "green" && "bg-emerald-500/[0.05] dark:bg-emerald-500/[0.07] border-emerald-500/20",
        tint === "red"   && "bg-red-500/[0.05] dark:bg-red-500/[0.07] border-red-500/20",
        !tint            && "bg-card border-border"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
        {action && <div className="shrink-0 ml-2">{action}</div>}
      </div>
      <p
        className={cn(
          "text-2xl font-bold tabular-nums leading-none",
          valueColor === "green" && "text-emerald-600 dark:text-emerald-400",
          valueColor === "red" && "text-red-500 dark:text-red-400",
          valueColor === "default" && "text-foreground"
        )}
      >
        {value}
      </p>
      {meter !== undefined && (
        <div className="h-1 rounded-full bg-muted/60 overflow-hidden mt-2.5">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              meter >= 60 ? "bg-emerald-500" : meter >= 40 ? "bg-amber-400" : "bg-red-400"
            )}
            style={{ width: `${Math.min(meter, 100)}%` }}
          />
        </div>
      )}
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-2">{subtitle}</p>
      )}
    </div>
  );
}

import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  subtitle?: string;
  valueColor?: "green" | "red" | "default";
  action?: React.ReactNode;
}

export function StatCard({
  label,
  value,
  subtitle,
  valueColor = "default",
  action,
}: StatCardProps) {
  return (
    <div className="rounded-xl border bg-card px-5 py-4 shadow-sm">
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
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-2">{subtitle}</p>
      )}
    </div>
  );
}

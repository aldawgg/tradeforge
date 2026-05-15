import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  subtitle?: string;
  valueColor?: "green" | "red" | "default";
}

export function StatCard({
  label,
  value,
  subtitle,
  valueColor = "default",
}: StatCardProps) {
  return (
    <div className="rounded-xl border bg-card px-5 py-4 shadow-sm">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
        {label}
      </p>
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

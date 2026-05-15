import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  subtitle?: string;
  valueColor?: "green" | "red" | "default";
  size?: "default" | "hero";
}

export function StatCard({
  label,
  value,
  subtitle,
  valueColor = "default",
  size = "default",
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card px-5 py-4 shadow-sm",
        size === "hero" && "bg-primary/5 border-primary/20 px-6 py-5"
      )}
    >
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
        {label}
      </p>
      <p
        className={cn(
          "font-bold tabular-nums leading-none",
          size === "default" ? "text-2xl" : "text-4xl",
          valueColor === "green" && "text-emerald-600",
          valueColor === "red" && "text-red-500",
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

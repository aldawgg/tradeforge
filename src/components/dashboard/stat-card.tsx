import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  valueColor?: "green" | "red" | "default";
}

export function StatCard({ label, value, valueColor = "default" }: StatCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p
          className={cn(
            "text-2xl font-bold",
            valueColor === "green" && "text-emerald-600",
            valueColor === "red" && "text-red-500",
            valueColor === "default" && "text-zinc-900"
          )}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

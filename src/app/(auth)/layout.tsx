import { TrendingUp } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary">
          <TrendingUp size={20} className="text-primary-foreground" />
        </div>
        <span className="text-xl font-semibold tracking-tight text-foreground">
          TradeForge
        </span>
      </div>
      {children}
    </div>
  );
}

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900">TradeForge</h1>
        <p className="text-base text-zinc-500 max-w-sm">
          A futures trading journal for MES and MNQ traders.
        </p>
        <Link href="/dashboard">
          <Button size="lg" className="mt-2">Go to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}

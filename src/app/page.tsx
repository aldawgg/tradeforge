import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4">
      <div className="text-center space-y-4 max-w-sm">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">TradeForge</h1>
        <p className="text-base text-muted-foreground">
          A futures trading journal for MES and MNQ traders.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link href="/login">
            <Button size="lg" className="w-full sm:w-auto">Sign in</Button>
          </Link>
          <Link href="/register">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">Create account</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

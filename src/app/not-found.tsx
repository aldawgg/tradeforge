import Link from "next/link";
import { TrendingUp } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 gap-4">
      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary">
        <TrendingUp size={20} className="text-primary-foreground" />
      </div>
      <h1 className="text-4xl font-bold text-foreground tabular-nums">404</h1>
      <p className="text-sm text-muted-foreground max-w-xs text-center">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="mt-2 inline-flex items-center px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
      >
        Back to home
      </Link>
    </div>
  );
}

"use client";

import { AlertCircle } from "lucide-react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 gap-3">
      <AlertCircle size={22} className="text-destructive" />
      <p className="text-sm font-medium text-foreground">
        Something went wrong
      </p>
      <p className="text-sm text-muted-foreground max-w-xs text-center">
        {error.message || "An unexpected error occurred."}
      </p>
      <button
        onClick={reset}
        className="mt-1 text-sm text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}

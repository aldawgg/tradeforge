"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="p-6 md:p-8 flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <AlertCircle size={22} className="text-destructive" />
      <p className="text-sm font-medium text-foreground">
        Something went wrong
      </p>
      <p className="text-sm text-muted-foreground max-w-xs text-center">
        {error.message || "An unexpected error occurred."}
      </p>
      <Button variant="outline" size="sm" onClick={reset} className="mt-1">
        Try again
      </Button>
    </div>
  );
}

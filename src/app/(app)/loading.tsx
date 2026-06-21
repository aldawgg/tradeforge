import { Loader2 } from "lucide-react";

export default function AppLoading() {
  return (
    <div className="p-6 md:p-8 flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <Loader2 size={22} className="text-muted-foreground animate-spin" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  );
}

import { Loader2 } from "lucide-react";

export default function AuthLoading() {
  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <Loader2 size={22} className="text-muted-foreground animate-spin" />
    </div>
  );
}

"use client";

import { useRef, useState } from "react";
import { UploadCloud, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// ── Constants ──────────────────────────────────────────────────────────────

export const SCREENSHOT_TYPES = [
  "Entry",
  "Exit",
  "Before trade",
  "After trade",
  "Higher timeframe",
  "Marked-up review",
] as const;

export type ScreenshotType = (typeof SCREENSHOT_TYPES)[number];

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_MIME = ["image/png", "image/jpeg", "image/webp"];

// ── Types ──────────────────────────────────────────────────────────────────

export interface PendingScreenshot {
  id: string;
  file: File;
  type: ScreenshotType;
  previewUrl: string;
}

// ── Component ──────────────────────────────────────────────────────────────

interface ScreenshotUploaderProps {
  pending: PendingScreenshot[];
  onChange: (pending: PendingScreenshot[]) => void;
  disabled?: boolean;
}

export function ScreenshotUploader({
  pending,
  onChange,
  disabled = false,
}: ScreenshotUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileErrors, setFileErrors] = useState<string[]>([]);

  function handleFiles(files: File[]) {
    const errors: string[] = [];
    const valid: File[] = [];

    for (const f of files) {
      if (!ACCEPTED_MIME.includes(f.type)) {
        errors.push(`"${f.name}": unsupported type. Use PNG, JPG, or WEBP.`);
        continue;
      }
      if (f.size > MAX_SIZE_BYTES) {
        errors.push(`"${f.name}": exceeds the 5 MB limit.`);
        continue;
      }
      valid.push(f);
    }

    setFileErrors(errors);
    if (!valid.length) return;

    const uid = () =>
      typeof crypto?.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const newItems: PendingScreenshot[] = valid.map((f) => ({
      id: uid(),
      file: f,
      type: "Entry",
      previewUrl: URL.createObjectURL(f),
    }));

    onChange([...pending, ...newItems]);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    handleFiles(Array.from(e.target.files ?? []));
    e.target.value = "";
  }

  function handleRemove(id: string) {
    const item = pending.find((p) => p.id === id);
    if (item) URL.revokeObjectURL(item.previewUrl);
    onChange(pending.filter((p) => p.id !== id));
  }

  function handleTypeChange(id: string, type: ScreenshotType) {
    onChange(pending.map((p) => (p.id === id ? { ...p, type } : p)));
  }

  return (
    <div className="space-y-3">
      {/* Previews grid */}
      {pending.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {pending.map((p) => (
            <div
              key={p.id}
              className="rounded-lg border border-border bg-muted/20 overflow-hidden"
            >
              {/* Image preview */}
              <div className="aspect-video bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.previewUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Type selector + remove */}
              <div className="px-2.5 py-2 flex items-center justify-between gap-2">
                <Select
                  value={p.type}
                  onValueChange={(v) => handleTypeChange(p.id, v as ScreenshotType)}
                  disabled={disabled}
                >
                  <SelectTrigger className="flex-1 min-w-0 h-7 text-xs border-0 shadow-none px-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SCREENSHOT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <button
                  type="button"
                  onClick={() => handleRemove(p.id)}
                  disabled={disabled}
                  aria-label="Remove screenshot"
                  className="shrink-0 p-0.5 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
                >
                  <X size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
        multiple
        className="hidden"
        onChange={handleInputChange}
        disabled={disabled}
      />

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        className={cn(
          "w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg",
          "border border-dashed border-border text-sm text-muted-foreground",
          "hover:text-foreground hover:bg-muted/40 transition-colors",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        <UploadCloud size={15} />
        Choose images
        <span className="text-xs text-muted-foreground/50 ml-0.5">
          PNG, JPG, WEBP · max 5 MB each
        </span>
      </button>

      {/* Validation errors */}
      {fileErrors.length > 0 && (
        <div className="space-y-1">
          {fileErrors.map((err, i) => (
            <p key={i} className="text-xs text-destructive">
              {err}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

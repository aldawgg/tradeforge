"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  TradeForm,
  FormState,
  OutcomeField,
  TradeStatusField,
  ExistingScreenshot,
} from "@/components/trades/trade-form";
import type { PendingScreenshot } from "@/components/trades/screenshot-uploader";

// ── Row → FormState conversion ──────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToFormState(row: any): FormState {
  // Instrument: "Custom" in DB → "Other / Custom" in the select dropdown
  const instrument =
    row.instrument === "Custom" ? "Other / Custom" : (row.instrument ?? "");
  const customInstrument =
    row.instrument === "Custom" ? (row.custom_instrument ?? "") : "";

  // Setup: "Custom" in DB → "Other / Custom" in the select dropdown
  const setup =
    row.setup === "Custom" ? "Other / Custom" : (row.setup ?? "");
  const customSetup =
    row.setup === "Custom" ? (row.custom_setup ?? "") : "";

  // Outcome: "Open" in DB means the trade is still open — no outcome selected in the form
  const outcome: OutcomeField | "" =
    row.outcome === "Open" || row.outcome == null
      ? ""
      : (row.outcome as OutcomeField);

  // Price fields: the DB stores 0 when left blank during create — show blank in the form
  const toPrice = (val: unknown) =>
    val != null && Number(val) !== 0 ? String(val) : "";

  return {
    date: row.date ?? "",
    accounts: row.account_id ? [row.account_id as string] : [],
    instrument,
    customInstrument,
    direction: (row.direction ?? "") as "Long" | "Short" | "",
    session: row.session ?? "",
    setup,
    customSetup,
    tradeStatus: (row.status ?? "") as TradeStatusField | "",
    outcome,
    contracts: row.contracts ? String(row.contracts) : "",
    pl: row.pnl != null ? String(row.pnl) : "",
    rMultiple: row.r_multiple != null ? String(row.r_multiple) : "",
    positiveTags: (row.positive_review_tags as string[]) ?? [],
    improvements: (row.improvement_tags as string[]) ?? [],
    notes: row.notes ?? "",
    entryPrice: toPrice(row.entry_price),
    exitPrice: row.exit_price != null ? String(row.exit_price) : "",
    stopLoss: toPrice(row.stop_loss),
    target: toPrice(row.target),
  };
}

// Build the subtitle shown under "Edit Trade" in the header.
function buildSubtitle(row: any): string { // eslint-disable-line @typescript-eslint/no-explicit-any
  const instrument =
    row.instrument === "Custom"
      ? (row.custom_instrument ?? "Custom")
      : row.instrument;
  const date = new Date(row.date + "T00:00:00").toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  return `${instrument} ${row.direction} — ${date}`;
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function EditTradePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  // ── Fetch state ────────────────────────────────────────────────────────
  const [initialValues, setInitialValues] = useState<FormState | null>(null);
  const [subtitle, setSubtitle] = useState("");
  const [loadError, setLoadError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [availableAccounts, setAvailableAccounts] = useState<{ id: string; name: string }[]>([]);
  const [availableInstruments, setAvailableInstruments] = useState<string[]>([]);
  const [availableSetups, setAvailableSetups] = useState<string[]>([]);

  // ── Screenshot state ───────────────────────────────────────────────────
  const [existingScreenshots, setExistingScreenshots] = useState<ExistingScreenshot[]>([]);

  // ── Save state ─────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // ── Load the trade on mount ────────────────────────────────────────────
  useEffect(() => {
    async function loadTrade() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const [tradeResult, accountsResult, instrumentsResult, setupsResult] = await Promise.all([
        supabase
          .from("trades")
          .select("*")
          .eq("id", id)
          .eq("user_id", user.id)
          .single(),
        supabase
          .from("evaluation_accounts")
          .select("id, account_name")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true }),
        supabase
          .from("custom_instruments")
          .select("name")
          .eq("user_id", user.id)
          .order("name"),
        supabase
          .from("custom_setups")
          .select("name")
          .eq("user_id", user.id)
          .order("name"),
      ]);

      if (tradeResult.error) {
        // PGRST116 = no rows returned — trade not found or belongs to another user
        if (tradeResult.error.code === "PGRST116") {
          setNotFound(true);
        } else {
          setLoadError(tradeResult.error.message);
        }
        setLoading(false);
        return;
      }

      if (!tradeResult.data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      if (accountsResult.data) {
        setAvailableAccounts(
          accountsResult.data.map((row) => ({ id: row.id, name: row.account_name }))
        );
      }

      if (instrumentsResult.data && instrumentsResult.data.length > 0) {
        const names = instrumentsResult.data.map((r) => r.name);
        // If the trade's stored instrument is not in the user's list, append it so the
        // edit form can still display the current value correctly.
        const tradeInstrument = tradeResult.data?.instrument;
        if (tradeInstrument && tradeInstrument !== "Custom" && !names.includes(tradeInstrument)) {
          names.push(tradeInstrument);
        }
        setAvailableInstruments(names);
      }

      if (setupsResult.data && setupsResult.data.length > 0) {
        const names = setupsResult.data.map((r) => r.name);
        const tradeSetup = tradeResult.data?.setup;
        if (tradeSetup && tradeSetup !== "Custom" && !names.includes(tradeSetup)) {
          names.push(tradeSetup);
        }
        setAvailableSetups(names);
      }

      // Load existing screenshots — use public storage URLs (no signed URL needed).
      const { data: screenshotRows } = await supabase
        .from("trade_screenshots")
        .select("id, storage_path, screenshot_type")
        .eq("trade_id", id)
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (screenshotRows && screenshotRows.length > 0) {
        const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
        setExistingScreenshots(
          screenshotRows.map((row) => ({
            id: row.id,
            storage_path: row.storage_path,
            screenshot_type: row.screenshot_type,
            publicUrl: `${base}/storage/v1/object/public/trade-screenshots/${row.storage_path}`,
          }))
        );
      }

      setInitialValues(rowToFormState(tradeResult.data));
      setSubtitle(buildSubtitle(tradeResult.data));
      setLoading(false);
    }

    loadTrade();
  }, [id, router]);

  // ── Handle form submission ─────────────────────────────────────────────
  async function handleSave(form: FormState, screenshots: PendingScreenshot[]) {
    setSaving(true);
    setSaveError("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaveError("You must be logged in to update a trade.");
      setSaving(false);
      return;
    }

    const isCustomInstrument = form.instrument === "Other / Custom";
    const isCustomSetup = form.setup === "Other / Custom";
    const isOpen = form.tradeStatus === "Open";

    const payload = {
      date: form.date,
      account_id: form.accounts[0] ?? null,
      instrument: isCustomInstrument ? "Custom" : form.instrument,
      custom_instrument: isCustomInstrument ? form.customInstrument.trim() : null,
      direction: form.direction,
      session: form.session,
      setup: isCustomSetup ? "Custom" : form.setup,
      custom_setup: isCustomSetup ? form.customSetup.trim() : null,
      status: form.tradeStatus,
      outcome: isOpen ? "Open" : form.outcome,
      pnl: !isOpen && form.pl.trim() ? Number(form.pl) : null,
      r_multiple: !isOpen && form.rMultiple.trim() ? Number(form.rMultiple) : null,
      contracts: form.contracts.trim() ? Number(form.contracts) : 1,
      positive_review_tags: form.positiveTags,
      improvement_tags: form.improvements,
      notes: form.notes,
      entry_price: form.entryPrice.trim() ? Number(form.entryPrice) : 0,
      exit_price: form.exitPrice.trim() ? Number(form.exitPrice) : null,
      stop_loss: form.stopLoss.trim() ? Number(form.stopLoss) : 0,
      target: form.target.trim() ? Number(form.target) : 0,
    };

    const { error: updateError } = await supabase
      .from("trades")
      .update(payload)
      .eq("id", id)
      .eq("user_id", user.id);   // security: prevent editing another user's trade

    if (updateError) {
      setSaveError(updateError.message);
      setSaving(false);
      return;
    }

    // Upload new screenshots via the server-side API route.
    const uploadFailures: string[] = [];
    for (const screenshot of screenshots) {
      const fd = new FormData();
      fd.append("file", screenshot.file);
      fd.append("trade_id", id);
      fd.append("screenshot_type", screenshot.type);

      const res = await fetch("/api/screenshots", { method: "POST", body: fd });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Upload failed" }));
        uploadFailures.push(`"${screenshot.file.name}": ${body.error ?? "Upload failed"}`);
      }
    }

    if (uploadFailures.length > 0) {
      setSaveError(
        `Trade saved, but ${uploadFailures.length} screenshot(s) failed: ${uploadFailures.join(", ")}`
      );
      setSaving(false);
      return;
    }

    router.push(`/trades/${id}`);
  }

  // ── Screenshot delete ──────────────────────────────────────────────────

  async function handleDeleteExistingScreenshot(screenshotId: string, storagePath: string) {
    await fetch("/api/screenshots", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storage_path: storagePath, screenshot_id: screenshotId }),
    });
    setExistingScreenshots((prev) => prev.filter((s) => s.id !== screenshotId));
  }

  // ── Loading state ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-6 md:p-8 flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 size={22} className="text-muted-foreground animate-spin" />
        <p className="text-sm text-muted-foreground">Loading trade...</p>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────

  if (loadError) {
    return (
      <div className="p-6 md:p-8 flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <AlertCircle size={22} className="text-destructive" />
        <p className="text-sm font-medium text-foreground">Failed to load trade</p>
        <p className="text-sm text-muted-foreground max-w-xs text-center">
          {loadError}
        </p>
        <Link
          href="/trades"
          className="mt-1 text-sm text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
        >
          Back to Trade History
        </Link>
      </div>
    );
  }

  // ── Not found state ────────────────────────────────────────────────────

  if (notFound || !initialValues) {
    return (
      <div className="p-6 md:p-8 flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <p className="text-sm font-medium text-foreground">Trade not found.</p>
        <Link
          href="/trades"
          className="text-sm text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
        >
          Back to Trade History
        </Link>
      </div>
    );
  }

  // ── Trade loaded — render the form ─────────────────────────────────────

  return (
    <TradeForm
      mode="edit"
      tradeId={id}
      subtitle={subtitle}
      initialValues={initialValues}
      saving={saving}
      saveError={saveError}
      onSave={handleSave}
      availableAccounts={availableAccounts}
      availableInstruments={availableInstruments}
      availableSetups={availableSetups}
      existingScreenshots={existingScreenshots}
      onDeleteExistingScreenshot={handleDeleteExistingScreenshot}
    />
  );
}

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
} from "@/components/trades/trade-form";

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
    accounts: [],             // account_id not yet linked to named accounts
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

      const { data, error } = await supabase
        .from("trades")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (error) {
        // PGRST116 = no rows returned — trade not found or belongs to another user
        if (error.code === "PGRST116") {
          setNotFound(true);
        } else {
          setLoadError(error.message);
        }
        setLoading(false);
        return;
      }

      if (!data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setInitialValues(rowToFormState(data));
      setSubtitle(buildSubtitle(data));
      setLoading(false);
    }

    loadTrade();
  }, [id, router]);

  // ── Handle form submission ─────────────────────────────────────────────
  async function handleSave(form: FormState) {
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

    // Success — go back to the trade detail page
    router.push(`/trades/${id}`);
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
    />
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { TradeForm, FormState, EMPTY_FORM, INSTRUMENTS, SETUPS } from "@/components/trades/trade-form";
import type { PendingScreenshot } from "@/components/trades/screenshot-uploader";

// ── Helpers ────────────────────────────────────────────────────────────────

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function getTodayLabel(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

// Read last-used defaults from sessionStorage to pre-fill common fields.
function getSessionDefaults(): Partial<FormState> {
  try {
    const raw = sessionStorage.getItem("tradeforge_defaults");
    if (!raw) return {};
    const saved = JSON.parse(raw) as {
      instrument?: string;
      customInstrument?: string;
      session?: string;
      direction?: string;
    };
    return {
      instrument: saved.instrument || "",
      customInstrument: saved.customInstrument || "",
      session: saved.session || "",
      direction: (saved.direction as FormState["direction"]) || "",
    };
  } catch {
    return {};
  }
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function AddTradePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [availableAccounts, setAvailableAccounts] = useState<{ id: string; name: string }[]>([]);
  const [availableInstruments, setAvailableInstruments] = useState<string[]>([]);
  const [availableSetups, setAvailableSetups] = useState<string[]>([]);

  useEffect(() => {
    async function fetchAccounts() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [accountsResult, profileResult, customInstResult, customSetupResult] = await Promise.all([
        supabase
          .from("evaluation_accounts")
          .select("id, account_name")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true }),
        supabase
          .from("profiles")
          .select("hidden_instruments, hidden_setups")
          .eq("id", user.id)
          .single(),
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

      if (accountsResult.data) {
        setAvailableAccounts(accountsResult.data.map((row) => ({ id: row.id, name: row.account_name })));
      }

      const hiddenInst: string[] = (profileResult.data?.hidden_instruments as string[] | null) ?? [];
      const hiddenSetup: string[] = (profileResult.data?.hidden_setups as string[] | null) ?? [];
      const customInstNames: string[] = customInstResult.data?.map((r) => r.name) ?? [];
      const customSetupNames: string[] = customSetupResult.data?.map((r) => r.name) ?? [];

      const defaultInstruments = Array.from(INSTRUMENTS).filter((i) => i !== "Other / Custom");
      const defaultSetups = Array.from(SETUPS).filter((s) => s !== "Other / Custom");

      setAvailableInstruments([
        ...defaultInstruments.filter((i) => !hiddenInst.includes(i)),
        ...customInstNames.filter((n) => !hiddenInst.includes(n)),
      ]);
      setAvailableSetups([
        ...defaultSetups.filter((s) => !hiddenSetup.includes(s)),
        ...customSetupNames.filter((n) => !hiddenSetup.includes(n)),
      ]);
    }
    fetchAccounts();
  }, []);

  // Lazy-initialised so sessionStorage is only read once on client mount.
  const [initialValues] = useState<Partial<FormState>>(() => ({
    ...EMPTY_FORM,
    date: getToday(),
    ...getSessionDefaults(),
  }));

  async function handleSave(form: FormState, screenshots: PendingScreenshot[]) {
    setSaving(true);
    setSaveError("");

    // Persist common fields so the next trade pre-fills them.
    try {
      sessionStorage.setItem(
        "tradeforge_defaults",
        JSON.stringify({
          instrument: form.instrument,
          customInstrument: form.customInstrument,
          session: form.session,
          direction: form.direction,
        })
      );
    } catch {}

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaveError("You must be logged in to save a trade.");
      setSaving(false);
      return;
    }

    const isCustomInstrument = form.instrument === "Other / Custom";
    const isCustomSetup = form.setup === "Other / Custom";
    const isOpen = form.tradeStatus === "Open";

    const payload = {
      user_id: user.id,
      account_id: form.accounts[0] ?? null,
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
      // Price fields default to 0 when left blank (NOT NULL columns).
      entry_price: form.entryPrice.trim() ? Number(form.entryPrice) : 0,
      exit_price: form.exitPrice.trim() ? Number(form.exitPrice) : null,
      stop_loss: form.stopLoss.trim() ? Number(form.stopLoss) : 0,
      target: form.target.trim() ? Number(form.target) : 0,
    };

    const { data: insertResult, error: insertError } = await supabase
      .from("trades")
      .insert(payload)
      .select("id")
      .single();

    if (insertError) {
      setSaveError(insertError.message);
      setSaving(false);
      return;
    }

    const tradeId = insertResult.id as string;

    // Upload screenshots via the server-side API route.
    const uploadFailures: string[] = [];
    for (const screenshot of screenshots) {
      const fd = new FormData();
      fd.append("file", screenshot.file);
      fd.append("trade_id", tradeId);
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

    toast.success("Trade logged");
    router.push(`/trades/${tradeId}`);
  }

  return (
    <TradeForm
      mode="create"
      subtitle={getTodayLabel()}
      description="Log your trade outcome, execution quality, and reflection."
      initialValues={initialValues}
      saving={saving}
      saveError={saveError}
      onSave={handleSave}
      availableAccounts={availableAccounts}
      availableInstruments={availableInstruments}
      availableSetups={availableSetups}
    />
  );
}

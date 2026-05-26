"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TradeForm, FormState, EMPTY_FORM } from "@/components/trades/trade-form";

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

  // Lazy-initialised so sessionStorage is only read once on client mount.
  const [initialValues] = useState<Partial<FormState>>(() => ({
    ...EMPTY_FORM,
    date: getToday(),
    ...getSessionDefaults(),
  }));

  async function handleSave(form: FormState) {
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
      account_id: null,
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

    const { error: insertError } = await supabase.from("trades").insert(payload);

    if (insertError) {
      setSaveError(insertError.message);
      setSaving(false);
      return;
    }

    router.push("/trades");
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
    />
  );
}

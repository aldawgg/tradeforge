"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Loader2,
  Check,
  AlertCircle,
  Plus,
  Trash2,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { INSTRUMENTS, SETUPS } from "@/components/trades/trade-form";

// ── Built-in lists ─────────────────────────────────────────────────────────

const BUILTIN_INSTRUMENTS = Array.from(INSTRUMENTS).filter((i) => i !== "Other / Custom");
const BUILTIN_SETUPS = Array.from(SETUPS).filter((s) => s !== "Other / Custom");

// ── Types ──────────────────────────────────────────────────────────────────

type ThemeMode = "light" | "dark" | "system";

type CustomInstrument = {
  id: string;
  name: string;
  point_value: number;
};

type CustomSetup = {
  id: string;
  name: string;
};

// ── Theme helpers ──────────────────────────────────────────────────────────

function getStoredTheme(): ThemeMode {
  try {
    const stored = localStorage.getItem("theme");
    if (stored === "dark" || stored === "light") return stored;
  } catch {}
  return "system";
}

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  try {
    if (mode === "dark") {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else if (mode === "light") {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      // System: remove stored preference and apply system default
      localStorage.removeItem("theme");
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (systemDark) root.classList.add("dark");
      else root.classList.remove("dark");
    }
  } catch {}
}

// ── Section wrapper ────────────────────────────────────────────────────────

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      {description && (
        <p className="text-xs text-muted-foreground mt-1 mb-4">{description}</p>
      )}
      {!description && <div className="mb-4" />}
      <div className="rounded-xl border border-border bg-card p-5">{children}</div>
    </section>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const router = useRouter();

  // ── Loading ──────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // ── Profile ──────────────────────────────────────────────────────────────
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState("");

  // ── Visibility ───────────────────────────────────────────────────────────
  const [hiddenInstruments, setHiddenInstruments] = useState<string[]>([]);
  const [hiddenSetups, setHiddenSetups] = useState<string[]>([]);
  const [togglingInst, setTogglingInst] = useState<string | null>(null);
  const [togglingSetup, setTogglingSetup] = useState<string | null>(null);

  // ── Custom instruments ───────────────────────────────────────────────────
  const [instruments, setInstruments] = useState<CustomInstrument[]>([]);
  const [newInstName, setNewInstName] = useState("");
  const [newInstPointValue, setNewInstPointValue] = useState("1");
  const [addingInst, setAddingInst] = useState(false);
  const [instError, setInstError] = useState("");
  const [addInstSuccess, setAddInstSuccess] = useState(false);
  const [deletingInstId, setDeletingInstId] = useState<string | null>(null);
  const [confirmDeleteInstId, setConfirmDeleteInstId] = useState<string | null>(null);

  // ── Custom setups ────────────────────────────────────────────────────────
  const [setups, setSetups] = useState<CustomSetup[]>([]);
  const [newSetupName, setNewSetupName] = useState("");
  const [addingSetup, setAddingSetup] = useState(false);
  const [addSetupSuccess, setAddSetupSuccess] = useState(false);
  const [setupError, setSetupError] = useState("");
  const [deletingSetupId, setDeletingSetupId] = useState<string | null>(null);
  const [confirmDeleteSetupId, setConfirmDeleteSetupId] = useState<string | null>(null);

  // ── Appearance ───────────────────────────────────────────────────────────
  const [theme, setTheme] = useState<ThemeMode>("system");

  // ── Initials (derived) ───────────────────────────────────────────────────
  const initials = displayName
    ? displayName.trim().charAt(0).toUpperCase()
    : email
    ? email.charAt(0).toUpperCase()
    : "?";

  // ── Load data on mount ───────────────────────────────────────────────────

  useEffect(() => {
    // Theme is client-only — read from localStorage on mount
    setTheme(getStoredTheme());

    async function loadData() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoadError("Not signed in.");
        setLoading(false);
        return;
      }

      setEmail(user.email ?? "");

      const [profileRes, instRes, setupRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name, hidden_instruments, hidden_setups")
          .eq("id", user.id)
          .single(),
        supabase
          .from("custom_instruments")
          .select("id, name, point_value")
          .eq("user_id", user.id)
          .order("name"),
        supabase
          .from("custom_setups")
          .select("id, name")
          .eq("user_id", user.id)
          .order("name"),
      ]);

      if (!profileRes.error && profileRes.data) {
        setDisplayName(profileRes.data.full_name ?? "");
        setHiddenInstruments((profileRes.data.hidden_instruments as string[] | null) ?? []);
        setHiddenSetups((profileRes.data.hidden_setups as string[] | null) ?? []);
      }
      if (!instRes.error && instRes.data) {
        setInstruments(instRes.data as CustomInstrument[]);
      }
      if (!setupRes.error && setupRes.data) {
        setSetups(setupRes.data as CustomSetup[]);
      }

      if (profileRes.error && profileRes.error.code !== "PGRST116") {
        setLoadError(profileRes.error.message);
      }

      setLoading(false);
    }

    loadData();
  }, []);

  // ── Profile save ─────────────────────────────────────────────────────────

  async function handleSaveProfile() {
    setSavingProfile(true);
    setProfileError("");
    setProfileSuccess(false);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setProfileError("Not signed in.");
      setSavingProfile(false);
      return;
    }

    const trimmed = displayName.trim();

    // Update the profiles table
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ full_name: trimmed })
      .eq("id", user.id);

    if (profileError) {
      setProfileError(profileError.message);
      setSavingProfile(false);
      return;
    }

    // Also update auth user metadata so the sidebar (which reads
    // user.user_metadata.full_name from the server session) reflects the new name.
    const { error: metaError } = await supabase.auth.updateUser({
      data: { full_name: trimmed },
    });

    if (metaError) {
      setProfileError(metaError.message);
      setSavingProfile(false);
      return;
    }

    setProfileSuccess(true);
    setTimeout(() => setProfileSuccess(false), 3000);

    // Re-run the server layout so the sidebar picks up the new name immediately.
    router.refresh();

    setSavingProfile(false);
  }

  // ── Add custom instrument ────────────────────────────────────────────────

  async function handleAddInstrument() {
    const name = newInstName.trim();
    if (!name) {
      setInstError("Name is required.");
      return;
    }
    const pointValue = parseFloat(newInstPointValue);
    if (isNaN(pointValue) || pointValue <= 0) {
      setInstError("Point value must be a positive number.");
      return;
    }

    setAddingInst(true);
    setInstError("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setInstError("Not signed in.");
      setAddingInst(false);
      return;
    }

    const { data, error } = await supabase
      .from("custom_instruments")
      .insert({ user_id: user.id, name, point_value: pointValue })
      .select("id, name, point_value")
      .single();

    if (error) {
      setInstError(
        error.code === "23505" ? `"${name}" already exists.` : error.message
      );
    } else if (data) {
      setInstruments((prev) =>
        [...prev, data as CustomInstrument].sort((a, b) =>
          a.name.localeCompare(b.name)
        )
      );
      setNewInstName("");
      setNewInstPointValue("1");
      setAddInstSuccess(true);
      setTimeout(() => setAddInstSuccess(false), 2000);
    }

    setAddingInst(false);
  }

  // ── Delete custom instrument ─────────────────────────────────────────────

  async function handleDeleteInstrument(id: string) {
    setDeletingInstId(id);
    const supabase = createClient();
    const { error } = await supabase
      .from("custom_instruments")
      .delete()
      .eq("id", id);
    if (!error) {
      setInstruments((prev) => prev.filter((i) => i.id !== id));
    }
    setDeletingInstId(null);
    setConfirmDeleteInstId(null);
  }

  // ── Add custom setup ─────────────────────────────────────────────────────

  async function handleAddSetup() {
    const name = newSetupName.trim();
    if (!name) {
      setSetupError("Name is required.");
      return;
    }

    setAddingSetup(true);
    setSetupError("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSetupError("Not signed in.");
      setAddingSetup(false);
      return;
    }

    const { data, error } = await supabase
      .from("custom_setups")
      .insert({ user_id: user.id, name })
      .select("id, name")
      .single();

    if (error) {
      setSetupError(
        error.code === "23505" ? `"${name}" already exists.` : error.message
      );
    } else if (data) {
      setSetups((prev) =>
        [...prev, data as CustomSetup].sort((a, b) =>
          a.name.localeCompare(b.name)
        )
      );
      setNewSetupName("");
      setAddSetupSuccess(true);
      setTimeout(() => setAddSetupSuccess(false), 2000);
    }

    setAddingSetup(false);
  }

  // ── Delete custom setup ──────────────────────────────────────────────────

  async function handleDeleteSetup(id: string) {
    setDeletingSetupId(id);
    const supabase = createClient();
    const { error } = await supabase
      .from("custom_setups")
      .delete()
      .eq("id", id);
    if (!error) {
      setSetups((prev) => prev.filter((s) => s.id !== id));
    }
    setDeletingSetupId(null);
    setConfirmDeleteSetupId(null);
  }

  // ── Toggle instrument visibility ─────────────────────────────────────────

  async function handleToggleInstrument(name: string) {
    setTogglingInst(name);
    const newHidden = hiddenInstruments.includes(name)
      ? hiddenInstruments.filter((h) => h !== name)
      : [...hiddenInstruments, name];
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase
        .from("profiles")
        .update({ hidden_instruments: newHidden })
        .eq("id", user.id);
      if (!error) setHiddenInstruments(newHidden);
    }
    setTogglingInst(null);
  }

  // ── Toggle setup visibility ───────────────────────────────────────────────

  async function handleToggleSetup(name: string) {
    setTogglingSetup(name);
    const newHidden = hiddenSetups.includes(name)
      ? hiddenSetups.filter((h) => h !== name)
      : [...hiddenSetups, name];
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase
        .from("profiles")
        .update({ hidden_setups: newHidden })
        .eq("id", user.id);
      if (!error) setHiddenSetups(newHidden);
    }
    setTogglingSetup(null);
  }

  // ── Theme change ─────────────────────────────────────────────────────────

  function handleThemeChange(mode: ThemeMode) {
    setTheme(mode);
    applyTheme(mode);
  }

  // ── Loading state ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-6 md:p-8 flex items-center justify-center min-h-[60vh] gap-3">
        <Loader2 size={20} className="animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading settings...</span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-6 md:p-8 flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <AlertCircle size={20} className="text-destructive" />
        <p className="text-sm text-muted-foreground">{loadError}</p>
      </div>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────

  return (
    <div className="p-6 md:p-8 max-w-2xl">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your profile, instruments, setups, and appearance.
        </p>
      </div>

      <div className="space-y-10">

        {/* ── Profile ────────────────────────────────────────────────────── */}
        <Section
          title="Profile"
          description="Update your display name shown in the sidebar."
        >
          <div className="space-y-5">

            {/* Avatar row */}
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted text-foreground text-lg font-semibold shrink-0 select-none cursor-default">
                {initials}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {displayName || <span className="text-muted-foreground italic">No display name</span>}
                </p>
                <p className="text-xs text-muted-foreground">{email}</p>
              </div>
            </div>

            {/* Display name */}
            <div className="space-y-1.5">
              <Label htmlFor="display-name">Display name</Label>
              <Input
                id="display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveProfile()}
                placeholder="Your name"
                className="h-9 max-w-sm"
              />
            </div>

            {/* Email (read-only) */}
            <div className="space-y-1.5">
              <Label htmlFor="settings-email">Email</Label>
              <Input
                id="settings-email"
                value={email}
                readOnly
                disabled
                className="h-9 max-w-sm"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed yet. This will be available in a future update.
              </p>
            </div>

            {/* Save button + feedback */}
            <div className="flex items-center gap-3">
              <Button
                onClick={handleSaveProfile}
                disabled={savingProfile}
                size="lg"
              >
                {savingProfile && (
                  <Loader2 size={14} className="animate-spin mr-1" />
                )}
                Save profile
              </Button>
              {profileSuccess && (
                <span className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
                  <Check size={14} />
                  Saved
                </span>
              )}
              {profileError && (
                <span className="flex items-center gap-1.5 text-sm text-destructive">
                  <AlertCircle size={14} />
                  {profileError}
                </span>
              )}
            </div>

          </div>
        </Section>

        {/* ── Instruments ────────────────────────────────────────────────── */}
        <Section
          title="Instruments"
          description="Choose which instruments appear in the trade form. Toggle to hide or show. Add custom instruments beyond the built-in list."
        >
          <div className="space-y-4">

            {/* Add form */}
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1.5 flex-1 min-w-[140px]">
                <Label htmlFor="new-inst-name">Name</Label>
                <Input
                  id="new-inst-name"
                  value={newInstName}
                  onChange={(e) => {
                    setNewInstName(e.target.value);
                    setInstError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleAddInstrument()}
                  placeholder="e.g. CL, GC, RTY"
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5 w-36 shrink-0">
                <Label htmlFor="new-inst-pv">Point value ($)</Label>
                <Input
                  id="new-inst-pv"
                  type="number"
                  min="0.0001"
                  step="any"
                  value={newInstPointValue}
                  onChange={(e) => {
                    setNewInstPointValue(e.target.value);
                    setInstError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleAddInstrument()}
                  className="h-9"
                />
              </div>
              <Button
                onClick={handleAddInstrument}
                disabled={addingInst}
                size="lg"
                className="shrink-0"
              >
                {addingInst ? (
                  <Loader2 size={14} className="animate-spin mr-1" />
                ) : (
                  <Plus size={14} className="mr-1" />
                )}
                Add
              </Button>
              {addInstSuccess && (
                <span className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400 shrink-0">
                  <Check size={14} />
                  Added
                </span>
              )}
            </div>

            <p className="text-xs text-muted-foreground -mt-1">
              Dollars per full point of price movement. MES = $5, MNQ = $2, ES = $50, NQ = $20.
            </p>

            {instError && (
              <p className="flex items-center gap-1.5 text-xs text-destructive">
                <AlertCircle size={12} />
                {instError}
              </p>
            )}

            {/* Unified list: built-ins + custom */}
            <div className="divide-y divide-border">
              {BUILTIN_INSTRUMENTS.map((name) => {
                const isHidden = hiddenInstruments.includes(name);
                const isToggling = togglingInst === name;
                return (
                  <div key={name} className="flex items-center justify-between py-2.5 gap-3">
                    <span className="text-sm font-medium text-foreground">{name}</span>
                    <button
                      type="button"
                      onClick={() => handleToggleInstrument(name)}
                      disabled={isToggling}
                      className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded-md border transition-colors shrink-0 min-w-[54px] flex items-center justify-center",
                        isHidden
                          ? "border-border text-muted-foreground hover:border-muted-foreground/40"
                          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20"
                      )}
                    >
                      {isToggling ? (
                        <Loader2 size={10} className="animate-spin" />
                      ) : isHidden ? (
                        "Hidden"
                      ) : (
                        "Active"
                      )}
                    </button>
                  </div>
                );
              })}
              {instruments.map((inst) => {
                const isHidden = hiddenInstruments.includes(inst.name);
                const isToggling = togglingInst === inst.name;
                return (
                  <div key={inst.id} className="flex items-center justify-between py-2.5 gap-3">
                    <div>
                      <span className="text-sm font-medium text-foreground">{inst.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ${inst.point_value} / point
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleInstrument(inst.name)}
                        disabled={isToggling}
                        className={cn(
                          "text-xs font-medium px-2 py-0.5 rounded-md border transition-colors min-w-[54px] flex items-center justify-center",
                          isHidden
                            ? "border-border text-muted-foreground hover:border-muted-foreground/40"
                            : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20"
                        )}
                      >
                        {isToggling ? (
                          <Loader2 size={10} className="animate-spin" />
                        ) : isHidden ? (
                          "Hidden"
                        ) : (
                          "Active"
                        )}
                      </button>
                      {confirmDeleteInstId === inst.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Delete?</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteInstrument(inst.id)}
                            disabled={deletingInstId === inst.id}
                            className="text-xs font-semibold text-destructive hover:text-destructive/80 disabled:opacity-50 transition-colors"
                          >
                            {deletingInstId === inst.id ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              "Yes, delete"
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteInstId(null)}
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteInstId(inst.id)}
                          aria-label={`Delete ${inst.name}`}
                          className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Section>

        {/* ── Setups ─────────────────────────────────────────────────────── */}
        <Section
          title="Setups"
          description="Choose which setups appear in the trade form. Toggle to hide or show. Add custom setup tags beyond the built-in list."
        >
          <div className="space-y-4">

            {/* Add form */}
            <div className="flex items-end gap-3">
              <div className="space-y-1.5 flex-1">
                <Label htmlFor="new-setup-name">Setup name</Label>
                <Input
                  id="new-setup-name"
                  value={newSetupName}
                  onChange={(e) => {
                    setNewSetupName(e.target.value);
                    setSetupError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleAddSetup()}
                  placeholder="e.g. Opening range breakout"
                  className="h-9"
                />
              </div>
              <Button
                onClick={handleAddSetup}
                disabled={addingSetup}
                size="lg"
                className="shrink-0"
              >
                {addingSetup ? (
                  <Loader2 size={14} className="animate-spin mr-1" />
                ) : (
                  <Plus size={14} className="mr-1" />
                )}
                Add
              </Button>
              {addSetupSuccess && (
                <span className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400 shrink-0">
                  <Check size={14} />
                  Added
                </span>
              )}
            </div>

            {setupError && (
              <p className="flex items-center gap-1.5 text-xs text-destructive">
                <AlertCircle size={12} />
                {setupError}
              </p>
            )}

            {/* Unified list: built-ins + custom */}
            <div className="divide-y divide-border">
              {BUILTIN_SETUPS.map((name) => {
                const isHidden = hiddenSetups.includes(name);
                const isToggling = togglingSetup === name;
                return (
                  <div key={name} className="flex items-center justify-between py-2.5 gap-3">
                    <span className="text-sm font-medium text-foreground">{name}</span>
                    <button
                      type="button"
                      onClick={() => handleToggleSetup(name)}
                      disabled={isToggling}
                      className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded-md border transition-colors shrink-0 min-w-[54px] flex items-center justify-center",
                        isHidden
                          ? "border-border text-muted-foreground hover:border-muted-foreground/40"
                          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20"
                      )}
                    >
                      {isToggling ? (
                        <Loader2 size={10} className="animate-spin" />
                      ) : isHidden ? (
                        "Hidden"
                      ) : (
                        "Active"
                      )}
                    </button>
                  </div>
                );
              })}
              {setups.map((setup) => {
                const isHidden = hiddenSetups.includes(setup.name);
                const isToggling = togglingSetup === setup.name;
                return (
                  <div key={setup.id} className="flex items-center justify-between py-2.5 gap-3">
                    <span className="text-sm font-medium text-foreground">{setup.name}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleSetup(setup.name)}
                        disabled={isToggling}
                        className={cn(
                          "text-xs font-medium px-2 py-0.5 rounded-md border transition-colors min-w-[54px] flex items-center justify-center",
                          isHidden
                            ? "border-border text-muted-foreground hover:border-muted-foreground/40"
                            : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20"
                        )}
                      >
                        {isToggling ? (
                          <Loader2 size={10} className="animate-spin" />
                        ) : isHidden ? (
                          "Hidden"
                        ) : (
                          "Active"
                        )}
                      </button>
                      {confirmDeleteSetupId === setup.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Delete?</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteSetup(setup.id)}
                            disabled={deletingSetupId === setup.id}
                            className="text-xs font-semibold text-destructive hover:text-destructive/80 disabled:opacity-50 transition-colors"
                          >
                            {deletingSetupId === setup.id ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              "Yes, delete"
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteSetupId(null)}
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteSetupId(setup.id)}
                          aria-label={`Delete ${setup.name}`}
                          className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Section>

        {/* ── Appearance ──────────────────────────────────────────────────── */}
        <Section
          title="Appearance"
          description="Choose your preferred color scheme."
        >
          <div className="flex gap-3 flex-wrap">
            {(["light", "dark", "system"] as ThemeMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => handleThemeChange(mode)}
                className={cn(
                  "flex flex-col items-center gap-2 px-6 py-4 rounded-xl border-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  theme === mode
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground"
                )}
              >
                {mode === "light" && <Sun size={20} />}
                {mode === "dark" && <Moon size={20} />}
                {mode === "system" && <Monitor size={20} />}
                <span className="capitalize">{mode}</span>
              </button>
            ))}
          </div>
        </Section>

      </div>
    </div>
  );
}

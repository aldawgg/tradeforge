"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  ClipboardList,
  Target,
  LineChart,
  ImageIcon,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Layers,
  Menu,
  X,
  Moon,
  Sun,
} from "lucide-react";
import { cn } from "@/lib/utils";

function handleThemeToggle() {
  const isDark = document.documentElement.classList.toggle("dark");
  try {
    localStorage.setItem("theme", isDark ? "dark" : "light");
  } catch {}
}

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Analytics", href: "#analytics" },
  { label: "Eval Tracker", href: "#eval" },
  { label: "Screenshots", href: "#features" },
];

const FEATURES = [
  {
    icon: ClipboardList,
    title: "Trade Journaling",
    description:
      "Log every trade with entry, exit, setup tags, session, P/L, R-multiple, and detailed reflection notes.",
  },
  {
    icon: Target,
    title: "Prop Firm Eval Tracker",
    description:
      "Track multiple evaluation accounts across any firm. Monitor drawdown, daily limits, and progress to target.",
  },
  {
    icon: LineChart,
    title: "Performance Analytics",
    description:
      "Identify which setups work, which sessions are your best, and where your discipline breaks down.",
  },
  {
    icon: ImageIcon,
    title: "Screenshot Reviews",
    description:
      "Attach entry, exit, and marked-up review screenshots directly to each trade for post-session analysis.",
  },
  {
    icon: Layers,
    title: "Custom Instruments & Setups",
    description:
      "Trade MES, MNQ, ES, NQ and more. Tag every trade with your own setup and mistake categories.",
  },
  {
    icon: ShieldCheck,
    title: "Risk & Consistency Tracking",
    description:
      "Monitor win rate, streak data, and daily P/L to surface the habits driving your edge.",
  },
];

const WHY_POINTS = [
  "Built specifically for futures and prop firm traders, not generic stock journaling.",
  "Manual evaluation tracking that adapts to any firm's rules without hardcoded limits.",
  "Mistake tagging that surfaces patterns in your psychology, not just your entries.",
  "Screenshot storage tied directly to each trade for seamless visual review.",
  "Clean, distraction-free interface that gets out of your way during the trading day.",
];

export default function HomePage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary">
              <TrendingUp size={14} className="text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-foreground">
              TradeForge
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 flex-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={handleThemeToggle}
              className="p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              aria-label="Toggle theme"
            >
              <Moon size={15} className="block dark:hidden" />
              <Sun size={15} className="hidden dark:block" />
            </button>
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Log in
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>

          <div className="flex md:hidden items-center gap-1">
            <button
              onClick={handleThemeToggle}
              className="p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              aria-label="Toggle theme"
            >
              <Moon size={15} className="block dark:hidden" />
              <Sun size={15} className="hidden dark:block" />
            </button>
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-border bg-background px-6 py-4 space-y-3">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-2 flex flex-col gap-2">
              <Link href="/login" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" className="w-full" size="sm">
                  Log in
                </Button>
              </Link>
              <Link href="/register" onClick={() => setMobileOpen(false)}>
                <Button className="w-full" size="sm">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 text-center relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          aria-hidden="true"
        >
          <div className="w-[700px] h-[400px] rounded-full bg-primary/[0.07] blur-3xl" />
        </div>

        <div className="relative max-w-2xl mx-auto">
          <p className="text-xs font-medium text-primary mb-5 tracking-wider uppercase">
            Futures Trading Journal
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-5 leading-tight">
            Forge your trading edge.
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-lg mx-auto mb-8 leading-relaxed">
            A focused journal for MES, MNQ, and prop firm traders. Log trades,
            track evaluations, and find the patterns that build your edge.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto gap-2">
                Start Journaling <ArrowRight size={15} />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Log In
              </Button>
            </Link>
          </div>
        </div>

        {/* Dashboard mockup */}
        <div className="mt-16 max-w-3xl mx-auto">
          <div className="rounded-2xl border border-border bg-card shadow-lg shadow-black/5 dark:shadow-black/40 overflow-hidden">
            <div className="h-9 bg-muted/50 border-b border-border flex items-center px-4 gap-2 shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/20" />
              <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/20" />
              <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/20" />
              <span className="text-xs text-muted-foreground/50 ml-2">
                TradeForge — Dashboard
              </span>
            </div>

            <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Total P/L", value: "+$4,820", sub: "All time", green: true },
                { label: "Win Rate", value: "67%", sub: "This month", green: null },
                { label: "Current Streak", value: "🔥 4W", sub: "Win streak", green: null },
                { label: "Total Trades", value: "89", sub: "Logged", green: null },
              ].map((card) => (
                <div
                  key={card.label}
                  className="rounded-lg border border-border bg-background p-3 text-left"
                >
                  <p className="text-xs text-muted-foreground mb-1">{card.label}</p>
                  <p
                    className={cn(
                      "text-base font-semibold",
                      card.green
                        ? "text-emerald-500 dark:text-emerald-400"
                        : "text-foreground"
                    )}
                  >
                    {card.value}
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">{card.sub}</p>
                </div>
              ))}
            </div>

            <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 rounded-lg border border-border bg-background p-3">
                <p className="text-xs text-muted-foreground mb-3">Equity Curve</p>
                <div className="relative h-20 flex items-end gap-[3px]">
                  {[28, 38, 33, 48, 44, 58, 54, 68, 63, 76, 72, 85].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t bg-primary/20"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                  <div className="absolute inset-0 flex items-end pointer-events-none">
                    <svg
                      viewBox="0 0 120 40"
                      className="w-full h-16"
                      preserveAspectRatio="none"
                    >
                      <polyline
                        points="5,29 15,22 25,25 35,17 45,19 55,10 65,13 75,7 85,9 95,4 105,6 115,2"
                        fill="none"
                        stroke="oklch(0.65 0.14 224)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-background p-3">
                <p className="text-xs text-muted-foreground mb-2">Eval Status</p>
                <p className="text-sm font-medium text-foreground mb-1">
                  APEX — Acct #1
                </p>
                <div className="flex items-center gap-1.5 mb-3">
                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                  <span className="text-xs text-muted-foreground">In Progress</span>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Profit target</span>
                    <span>62%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary w-[62%]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-3">
              Everything you need to improve
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Built around the real workflow of a disciplined futures trader.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="rounded-xl border border-border bg-card p-5"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Icon size={15} className="text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-foreground mb-1.5">
                    {feature.title}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why TradeForge */}
      <section id="eval" className="py-20 px-6 bg-muted/30">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-3">
              Why TradeForge
            </h2>
            <p className="text-sm text-muted-foreground">
              Built for how serious futures traders actually work.
            </p>
          </div>
          <div className="space-y-4">
            {WHY_POINTS.map((point) => (
              <div key={point} className="flex items-start gap-3">
                <CheckCircle2
                  size={16}
                  className="text-primary mt-0.5 shrink-0"
                />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {point}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product preview */}
      <section id="analytics" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-3">
              Know your numbers
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Real-time performance stats calculated directly from your logged
              trades.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { label: "Monthly P/L", value: "+$2,340", accent: "green" },
              { label: "Daily Win Rate", value: "71%", accent: "primary" },
              { label: "Win Streak", value: "🔥 6W", accent: null },
              { label: "Best Setup", value: "VWAP Bounce", accent: null },
              { label: "Consistency", value: "82%", accent: "primary" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-border bg-card p-4 text-center"
              >
                <p className="text-xs text-muted-foreground mb-2">
                  {stat.label}
                </p>
                <p
                  className={cn(
                    "text-base font-semibold",
                    stat.accent === "green"
                      ? "text-emerald-500 dark:text-emerald-400"
                      : stat.accent === "primary"
                      ? "text-primary"
                      : "text-foreground"
                  )}
                >
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 text-center relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          aria-hidden="true"
        >
          <div className="w-[500px] h-[300px] rounded-full bg-primary/[0.06] blur-3xl" />
        </div>
        <div className="relative max-w-lg mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-4">
            Ready to build discipline into your trading?
          </h2>
          <p className="text-sm text-muted-foreground mb-8 max-w-sm mx-auto">
            Start logging trades today. No payment required.
          </p>
          <Link href="/register">
            <Button size="lg" className="gap-2">
              Create Free Account <ArrowRight size={15} />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-md bg-primary">
                <TrendingUp size={11} className="text-primary-foreground" />
              </div>
              <span className="text-sm font-semibold text-foreground">
                TradeForge
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              A trading journal for futures and prop firm traders.
            </span>
          </div>
          <div className="flex items-center gap-5">
            <Link
              href="/login"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

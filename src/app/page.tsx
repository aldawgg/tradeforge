"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  TrendingUp,
  Menu,
  X,
  Moon,
  Sun,
} from "lucide-react";
import { DashboardPreview } from "@/components/landing/dashboard-preview";

function handleThemeToggle() {
  const isDark = document.documentElement.classList.toggle("dark");
  try {
    localStorage.setItem("theme", isDark ? "dark" : "light");
  } catch {}
}

const DIFFERENTIATORS = [
  {
    lead: "Built for futures and prop firm traders.",
    detail:
      "Not generic stock journaling that ignores sessions, R-multiples, and evaluation rules.",
  },
  {
    lead: "Evaluation tracking that adapts to any firm.",
    detail:
      "No hardcoded rules. Monitor drawdown, daily limits, and profit targets your way.",
  },
  {
    lead: "Mistake tagging that surfaces patterns.",
    detail:
      "In your psychology, not just your entries. See which habits cost you money.",
  },
  {
    lead: "Screenshots tied to each trade.",
    detail:
      "Attach entry, exit, and review charts for visual post-session analysis.",
  },
  {
    lead: "Distraction-free by design.",
    detail: "Log fast during the session. Review thoroughly after. Nothing else.",
  },
];

export default function HomePage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [mobileOpen]);

  useEffect(() => {
    const sections = document.querySelectorAll(".fade-in-section");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:text-sm focus:font-medium"
      >
        Skip to content
      </a>
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary">
              <TrendingUp size={14} className="text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-foreground">
              TradeForge
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={handleThemeToggle}
              className="min-w-11 min-h-11 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              aria-label="Toggle theme"
            >
              <Moon size={15} className="block dark:hidden" />
              <Sun size={15} className="hidden dark:block" />
            </button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/register">Get Started</Link>
            </Button>
          </div>

          <div className="flex md:hidden items-center gap-1">
            <button
              onClick={handleThemeToggle}
              className="min-w-11 min-h-11 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              aria-label="Toggle theme"
            >
              <Moon size={15} className="block dark:hidden" />
              <Sun size={15} className="hidden dark:block" />
            </button>
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="min-w-11 min-h-11 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-border bg-background px-6 py-4 animate-slide-down">
            <div className="flex flex-col gap-2">
              <Button asChild variant="outline" className="w-full min-h-11" size="sm">
                <Link href="/login" onClick={() => setMobileOpen(false)}>
                  Log in
                </Link>
              </Button>
              <Button asChild className="w-full min-h-11" size="sm">
                <Link href="/register" onClick={() => setMobileOpen(false)}>
                  Get Started
                </Link>
              </Button>
            </div>
          </div>
        )}
      </header>

      <main id="main-content" aria-label="Introduction">
      <section className="pt-36 pb-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="max-w-2xl">
            <h1 className="text-[clamp(2.75rem,2rem+3vw,5rem)] font-bold tracking-tighter text-foreground leading-[1.05]">
              Forge your
              <br className="hidden sm:block" /> trading edge.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-lg leading-relaxed text-pretty">
              A focused journal for MES, MNQ, and prop firm traders. Log trades,
              track evaluations, and find the patterns behind your edge.
            </p>
            <div className="mt-8 flex items-center gap-6">
              <Button asChild size="lg" className="gap-2">
                <Link href="/register">
                  Start Journaling <ArrowRight size={15} />
                </Link>
              </Button>
              <Link
                href="/login"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Log in
              </Link>
            </div>
          </div>
          <div className="mt-16 fade-in-section">
            <DashboardPreview />
          </div>
        </div>
      </section>

      <section id="why" aria-label="Why TradeForge" className="py-20 px-6 border-t border-border/60 fade-in-section">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[16rem_1fr] gap-8 lg:gap-12">
          <h2 className="text-2xl font-bold tracking-tight text-foreground leading-tight">
            Why TradeForge
          </h2>
          <div>
            <div className="space-y-5">
              {DIFFERENTIATORS.map((d, i) => (
                <p key={i} className="text-base leading-relaxed max-w-xl text-pretty">
                  <span className="text-foreground font-medium">{d.lead}</span>{" "}
                  <span className="text-muted-foreground">{d.detail}</span>
                </p>
              ))}
            </div>
            <p className="mt-8 pt-6 border-t border-border/40 text-sm text-muted-foreground">
              Trade journaling · Performance analytics · Eval tracking · Screenshot reviews
            </p>
          </div>
        </div>
      </section>

      <section aria-label="Get started" className="py-20 px-6 border-t border-border/60 fade-in-section">
        <div className="max-w-5xl mx-auto">
          <div className="max-w-lg">
            <h2 className="text-[clamp(1.5rem,1.2rem+1.2vw,2.25rem)] font-bold tracking-tight text-foreground leading-tight mb-4">
              Your next session is the first one you review.
            </h2>
            <p className="text-base text-muted-foreground mb-8 text-pretty">
              Free to start. No credit card, no trial clock.
            </p>
            <Button asChild size="lg" className="gap-2">
              <Link href="/register">
                Start Journaling <ArrowRight size={15} />
              </Link>
            </Button>
          </div>
        </div>
      </section>
      </main>

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
              A trading journal for serious futures traders.
            </span>
          </div>
          <div className="flex items-center gap-5">
            <Link
              href="/login"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  LineChart,
  Target,
  Settings,
  TrendingUp,
  Moon,
  Sun,
  ChevronDown,
  List,
  CalendarDays,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const TOP_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

const BOTTOM_NAV = [
  { href: "/analytics", label: "Analytics", icon: LineChart },
  { href: "/evaluations", label: "Evaluations", icon: Target },
  { href: "/settings", label: "Settings", icon: Settings },
];

const TRADES_SUB = [
  { href: "/trades", label: "Trade History", icon: List },
  { href: "/trades/calendar", label: "Trade Calendar", icon: CalendarDays },
];

function handleThemeToggle() {
  const isDark = document.documentElement.classList.toggle("dark");
  try {
    localStorage.setItem("theme", isDark ? "dark" : "light");
  } catch {}
}

interface SidebarProps {
  userName?: string;
  userEmail?: string;
}

export function Sidebar({ userName, userEmail }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const tradesActive = pathname.startsWith("/trades");
  const [tradesOpen, setTradesOpen] = useState(tradesActive);
  const [mobileOpen, setMobileOpen] = useState(false);
  const tradesExpanded = tradesOpen || tradesActive;

  const displayName = userName || userEmail || "";
  const initials = userName
    ? userName.trim().charAt(0).toUpperCase()
    : userEmail
    ? userEmail.charAt(0).toUpperCase()
    : "?";

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const navContent = (
    <>
      {/* Logo */}
      <div className="px-6 py-5 border-b border-sidebar-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-sidebar-primary">
            <TrendingUp size={14} className="text-sidebar-primary-foreground" />
          </div>
          <span className="text-base font-semibold tracking-tight text-sidebar-foreground">
            TradeForge
          </span>
        </div>
        {/* Close button — mobile only */}
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation"
          className="lg:hidden p-1.5 rounded-md text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-3 space-y-0.5">
        {TOP_NAV.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}

        {/* Expandable Trades section */}
        <button
          type="button"
          onClick={() => setTradesOpen((v) => !v)}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors",
            tradesActive
              ? "bg-sidebar-primary text-sidebar-primary-foreground"
              : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
        >
          <ClipboardList size={16} />
          <span className="flex-1 text-left">Trades</span>
          <ChevronDown
            size={14}
            className={cn(
              "transition-transform duration-200",
              tradesExpanded ? "rotate-180" : "rotate-0"
            )}
          />
        </button>
        {tradesExpanded && (
          <div className="ml-3 pl-3 border-l border-sidebar-border space-y-0.5">
            {TRADES_SUB.map((sub) => {
              const Icon = sub.icon;
              const isActive = pathname === sub.href;
              return (
                <Link
                  key={sub.href}
                  href={sub.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon size={14} />
                  {sub.label}
                </Link>
              );
            })}
          </div>
        )}

        {BOTTOM_NAV.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}

        <button
          onClick={handleThemeToggle}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          <Moon size={16} className="block dark:hidden" />
          <Sun size={16} className="hidden dark:block" />
          <span className="block dark:hidden">Dark mode</span>
          <span className="hidden dark:block">Light mode</span>
        </button>
      </nav>

      {/* User area */}
      <div className="p-3 border-t border-sidebar-border space-y-0.5">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-sidebar-accent text-sidebar-accent-foreground text-xs font-semibold shrink-0">
            {initials}
          </div>
          <span className="text-xs text-sidebar-foreground/70 truncate flex-1">
            {displayName}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile topbar — visible only on mobile */}
      <div className="fixed top-0 left-0 right-0 z-30 h-14 bg-card border-b border-border flex items-center px-4 gap-3 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation"
          className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <Menu size={18} />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded-md bg-sidebar-primary">
            <TrendingUp size={12} className="text-sidebar-primary-foreground" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-foreground">TradeForge</span>
        </div>
      </div>

      {/* Backdrop — mobile only */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — drawer on mobile, sticky on desktop */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-60 shrink-0 border-r border-sidebar-border bg-sidebar flex flex-col",
          "transition-transform duration-200 ease-out",
          "lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {navContent}
      </aside>
    </>
  );
}

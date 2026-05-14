import { StatCard } from "@/components/dashboard/stat-card";

export default function DashboardPage() {
  return (
    <div className="p-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-1">Your trading performance overview</p>
      </div>

      <section className="mb-8">
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">
          Profit &amp; Loss
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <StatCard label="Total P/L" value="+$8,400" valueColor="green" />
          <StatCard label="Daily P/L" value="+$250" valueColor="green" />
          <StatCard label="Weekly P/L" value="+$780" valueColor="green" />
          <StatCard label="Monthly P/L" value="+$2,150" valueColor="green" />
          <StatCard label="Annual P/L" value="+$8,400" valueColor="green" />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">
          Win Rate
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Daily Win Rate" value="60%" />
          <StatCard label="Weekly Win Rate" value="55%" />
          <StatCard label="Monthly Win Rate" value="58%" />
          <StatCard label="Annual Win Rate" value="52%" />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">
          Streaks &amp; Activity
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard label="Current Win Streak" value="4 trades" valueColor="green" />
          <StatCard label="Current Loss Streak" value="0 trades" />
          <StatCard label="Total Trades" value="87" />
        </div>
      </section>

      <section>
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">
          Setup Performance
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard label="Best Setup" value="VWAP Bounce" valueColor="green" />
          <StatCard label="Worst Setup" value="Failed Breakout" valueColor="red" />
        </div>
      </section>
    </div>
  );
}

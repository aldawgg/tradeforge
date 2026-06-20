export function DashboardPreview() {
  return (
    <div
      aria-hidden="true"
      className="rounded-xl border border-border overflow-hidden shadow-xl select-none pointer-events-none"
    >
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-card">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-border" />
          <span className="w-2.5 h-2.5 rounded-full bg-border" />
          <span className="w-2.5 h-2.5 rounded-full bg-border" />
        </div>
        <div className="flex-1 ml-3">
          <div className="max-w-[14rem] mx-auto rounded-md bg-muted px-3 py-1">
            <span className="text-[11px] text-muted-foreground font-mono">
              tradeforge.app/dashboard
            </span>
          </div>
        </div>
        <div className="w-[4rem]" />
      </div>

      <div className="p-5 sm:p-6 bg-background">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="h-3.5 w-36 rounded bg-foreground/15 mb-2" />
            <div className="h-2.5 w-44 rounded bg-foreground/8" />
          </div>
          <div className="h-8 w-[5.5rem] rounded-md bg-primary flex items-center justify-center">
            <span className="text-[11px] font-medium text-primary-foreground">
              Log Trade
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-lg border border-border p-4">
            <div className="h-2.5 w-14 rounded bg-foreground/10 mb-3" />
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums leading-none">
              +$2,847
            </p>
            <div className="h-2 w-32 rounded bg-foreground/8 mt-2.5" />
          </div>
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.05] p-4">
            <div className="h-2.5 w-20 rounded bg-foreground/10 mb-3" />
            <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 leading-tight">
              4 trade win streak
            </p>
            <div className="h-2 w-28 rounded bg-foreground/8 mt-2.5" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="rounded-lg border border-emerald-500/15 bg-emerald-500/[0.04] p-3">
            <div className="h-2 w-12 rounded bg-foreground/10 mb-2" />
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums leading-none">
              +$425
            </p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <div className="h-2 w-12 rounded bg-foreground/10 mb-2" />
            <p className="text-sm font-bold text-foreground tabular-nums leading-none">
              72%
            </p>
            <div className="h-1.5 w-14 rounded bg-foreground/8 mt-1.5" />
          </div>
          <div className="rounded-lg border border-border p-3">
            <div className="h-2 w-10 rounded bg-foreground/10 mb-2" />
            <p className="text-sm font-bold text-foreground tabular-nums leading-none">
              8
            </p>
            <div className="h-1.5 w-10 rounded bg-foreground/8 mt-1.5" />
          </div>
        </div>

        <div className="rounded-lg border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="h-2.5 w-28 rounded bg-foreground/10" />
            <div className="flex gap-1">
              {["1D", "1W", "1M"].map((label) => (
                <span
                  key={label}
                  className="text-[10px] font-medium px-2 py-0.5 rounded text-muted-foreground bg-muted"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
          <svg
            viewBox="0 0 400 64"
            fill="none"
            className="w-full h-auto"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient
                id="chart-fill"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  style={{ stopColor: "var(--chart-positive)" }}
                  stopOpacity="0.15"
                />
                <stop
                  offset="100%"
                  style={{ stopColor: "var(--chart-positive)" }}
                  stopOpacity="0"
                />
              </linearGradient>
            </defs>
            <path
              d="M0 52 L50 44 L100 48 L150 36 L200 28 L250 32 L300 20 L350 16 L400 8 L400 64 L0 64Z"
              fill="url(#chart-fill)"
            />
            <polyline
              points="0,52 50,44 100,48 150,36 200,28 250,32 300,20 350,16 400,8"
              style={{ stroke: "var(--chart-positive)" }}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

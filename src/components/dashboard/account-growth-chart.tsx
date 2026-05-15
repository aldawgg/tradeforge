"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const ACCOUNTS = [
  { key: "apex1",    label: "Apex 50K #1",  color: "#4f86c6" },
  { key: "apex2",    label: "Apex 50K #2",  color: "#34d399" },
  { key: "topstep",  label: "Topstep 50K",  color: "#f59e0b" },
  { key: "tradeify", label: "Tradeify 25K", color: "#a78bfa" },
] as const;

type AccountKey = (typeof ACCOUNTS)[number]["key"];

interface DataPoint {
  date: string;
  apex1: number;
  apex2: number;
  topstep: number;
  tradeify: number;
}

const GROWTH_DATA: DataPoint[] = [
  { date: "Dec",  apex1: 50000, apex2: 50000, topstep: 50000, tradeify: 25000 },
  { date: "Jan",  apex1: 51500, apex2: 50800, topstep: 48200, tradeify: 25600 },
  { date: "Feb",  apex1: 52800, apex2: 51200, topstep: 46800, tradeify: 26400 },
  { date: "Mar",  apex1: 53600, apex2: 50400, topstep: 42100, tradeify: 27800 },
  { date: "Apr",  apex1: 51900, apex2: 49600, topstep: 38700, tradeify: 28500 },
  { date: "May",  apex1: 52000, apex2: 48500, topstep: 35500, tradeify: 18250 },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomLegend({ payload }: any) {
  if (!payload?.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-3">
      {payload.map((entry: { value: string; color: string }) => (
        <div key={entry.value} className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-muted-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const idx = GROWTH_DATA.findIndex((d) => d.date === label);

  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2.5 shadow-lg text-xs min-w-[195px]">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.map(
        (entry: { dataKey: AccountKey; name: string; value: number; color: string }) => {
          const prev = idx > 0 ? GROWTH_DATA[idx - 1][entry.dataKey] : entry.value;
          const change = entry.value - prev;
          const pct = prev > 0 ? ((change / prev) * 100).toFixed(1) : "0.0";
          const isPos = change >= 0;
          return (
            <div key={entry.dataKey} className="flex items-center gap-2 mb-1 last:mb-0">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground flex-1">{entry.name}</span>
              <span className="font-semibold tabular-nums">
                ${entry.value.toLocaleString("en-US")}
              </span>
              <span className={isPos ? "text-emerald-600 tabular-nums" : "text-red-500 tabular-nums"}>
                {isPos ? "+" : ""}{pct}%
              </span>
            </div>
          );
        }
      )}
    </div>
  );
}

export function AccountGrowthChart() {
  return (
    <div className="rounded-xl border border-border bg-card px-5 py-4 shadow-sm h-full">
      <div className="mb-4">
        <p className="text-sm font-semibold text-foreground">Account Growth</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Tracked account balances over time
        </p>
      </div>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={GROWTH_DATA}
            margin={{ top: 4, right: 4, bottom: 0, left: 4 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              width={42}
              domain={[14000, 58000]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
            {ACCOUNTS.map((acc) => (
              <Line
                key={acc.key}
                type="monotone"
                dataKey={acc.key}
                name={acc.label}
                stroke={acc.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3, strokeWidth: 0 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

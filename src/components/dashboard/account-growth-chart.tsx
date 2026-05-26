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
import type { AccountGrowthPoint, AccountChartConfig } from "@/lib/types";

interface AccountGrowthChartProps {
  data: AccountGrowthPoint[];
  accounts: AccountChartConfig[];
}

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

export function AccountGrowthChart({ data, accounts }: AccountGrowthChartProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    const idx = data.findIndex((d: AccountGrowthPoint) => d.date === label);
    return (
      <div className="rounded-lg border border-border bg-popover px-3 py-2.5 shadow-lg text-xs min-w-[195px]">
        <p className="font-semibold text-foreground mb-2">{label}</p>
        {payload.map(
          (entry: { dataKey: string; name: string; value: number; color: string }) => {
            const prevPoint = idx > 0 ? data[idx - 1] : null;
            const prev = prevPoint ? (prevPoint[entry.dataKey] as number) : entry.value;
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

  const allValues = data.flatMap((d) =>
    accounts.map((a) => d[a.key] as number).filter((v): v is number => typeof v === "number")
  );
  const minVal = allValues.length ? Math.min(...allValues) : 0;
  const maxVal = allValues.length ? Math.max(...allValues) : 100000;
  const pad = Math.max((maxVal - minVal) * 0.1, 1000);
  const yDomain: [number, number] = [
    Math.floor((minVal - pad) / 1000) * 1000,
    Math.ceil((maxVal + pad) / 1000) * 1000,
  ];

  return (
    <div className="rounded-xl border border-border bg-card px-5 py-4 shadow-sm">
      <div className="mb-4">
        <p className="text-sm font-semibold text-foreground">Account Growth</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Tracked account balances over time
        </p>
      </div>
      {data.length === 0 ? (
        <div className="h-[360px] flex items-center justify-center">
          <p className="text-sm text-muted-foreground text-center px-4">
            No account data yet. Link trades to evaluation accounts to see growth over time.
          </p>
        </div>
      ) : (
        <div className="h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
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
                domain={yDomain}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
              {accounts.map((acc) => (
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
      )}
    </div>
  );
}

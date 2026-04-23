import "./_group.css";
import React, { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { ChevronDown, ChevronRight, Check } from "lucide-react";
import {
  fmt,
  netWorth,
  netWorthChange,
  netWorthChangePct,
  monthlyIncome,
  monthlyExpenses,
  monthlySurplus,
  savingsRate,
  snapshots,
  categories,
} from "./_mockData";

export function CalmCards() {
  const [breakdownOpen, setBreakdownOpen] = useState(true);

  const chartData = snapshots.map((s) => ({
    label: s.label,
    amount: s.total,
  }));

  // Soft slate-blue/sage accent
  const accentColor = "hsl(215 25% 45%)";
  const positiveColor = "hsl(150 20% 45%)";
  const negativeColor = "hsl(0 20% 50%)";

  return (
    <div className="min-h-screen bg-background font-body text-foreground selection:bg-muted p-8 lg:p-12 overflow-y-auto">
      <div className="mx-auto max-w-4xl space-y-12">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="font-serif text-xl font-medium tracking-tight text-foreground/80">
            NetWorth Tracker
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <button className="hover:text-foreground transition-colors">Overview</button>
            <button className="hover:text-foreground transition-colors">Transactions</button>
            <button className="hover:text-foreground transition-colors">Settings</button>
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-foreground font-medium text-xs ml-2">
              JD
            </div>
          </div>
        </header>

        {/* Hero Card */}
        <section className="rounded-3xl border border-border bg-card p-8 lg:p-12 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.05)]">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
            <div>
              <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground mb-4">
                Total Net Worth
              </h2>
              <div className="flex items-baseline gap-4">
                <span className="font-serif text-6xl lg:text-7xl font-light tracking-tight text-foreground tabular-nums">
                  {fmt(netWorth)}
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-lg font-medium tracking-tight ${
                      netWorthChange >= 0 ? "text-[hsl(150_20%_45%)]" : "text-[hsl(0_20%_50%)]"
                    }`}
                  >
                    {netWorthChange >= 0 ? "+" : ""}
                    {fmt(netWorthChange)}
                  </span>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    {netWorthChangePct >= 0 ? "+" : ""}
                    {netWorthChangePct.toFixed(1)}% past month
                  </span>
                </div>
              </div>
            </div>

            {/* Savings Rate Mini-Arc */}
            <div className="flex items-center gap-4 text-right">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                  Savings Rate
                </span>
                <span className="font-serif text-2xl font-light tabular-nums text-foreground">
                  {Math.round(savingsRate)}%
                </span>
              </div>
              <div className="relative h-14 w-14">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="stroke-muted"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    strokeWidth="3"
                  />
                  <path
                    className="stroke-[hsl(215_25%_45%)]"
                    strokeDasharray={`${savingsRate}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="h-[280px] w-full -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={accentColor} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={accentColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis
                  dataKey="label"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={12}
                  minTickGap={30}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
                          <p className="text-xs text-muted-foreground mb-1">{payload[0].payload.label}</p>
                          <p className="font-mono text-sm font-medium text-foreground">
                            {fmt(payload[0].value as number)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                  cursor={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1, strokeDasharray: "4 4" }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke={accentColor}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorAmount)"
                  activeDot={{ r: 4, fill: accentColor, stroke: "hsl(var(--card))", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* This Month Strip */}
        <section className="flex flex-col sm:flex-row justify-between gap-6 border-y border-border py-8">
          <div className="flex-1">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-2">Income</p>
            <p className="font-mono text-xl tabular-nums text-foreground">{fmt(monthlyIncome)}</p>
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-2">Expenses</p>
            <p className="font-mono text-xl tabular-nums text-foreground">{fmt(monthlyExpenses)}</p>
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-2">Surplus</p>
            <p className="font-mono text-xl tabular-nums text-[hsl(150_20%_45%)]">{fmt(monthlySurplus)}</p>
          </div>
        </section>

        {/* Breakdown & Snapshots */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-4">
          {/* Breakdown */}
          <section>
            <button
              onClick={() => setBreakdownOpen(!breakdownOpen)}
              className="flex items-center gap-2 w-full text-left focus:outline-none group mb-6"
            >
              <h3 className="font-serif text-2xl font-light text-foreground group-hover:text-muted-foreground transition-colors">
                Breakdown
              </h3>
              {breakdownOpen ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )}
            </button>
            
            {breakdownOpen && (
              <div className="space-y-4">
                {categories.map((c) => {
                  const pct = Math.max(0, Math.min(100, Math.abs(c.value) / (netWorth * 0.5) * 100)); // scaled for visual
                  return (
                    <div key={c.id} className="group relative">
                      <div className="flex items-baseline justify-between text-sm py-2">
                        <span className="text-muted-foreground font-medium">{c.name}</span>
                        <span className="font-mono tabular-nums text-foreground">
                          {c.value < 0 && "-"}
                          {fmt(Math.abs(c.value))}
                        </span>
                      </div>
                      <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000 ease-out"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: c.value < 0 ? negativeColor : "hsl(var(--foreground))",
                            opacity: 0.3
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Recent Snapshots */}
          <section>
            <h3 className="font-serif text-2xl font-light text-foreground mb-6">
              Recent Snapshots
            </h3>
            <div className="space-y-3">
              {snapshots.slice().reverse().slice(0, 6).map((s, i) => (
                <div key={s.date} className="flex items-baseline justify-between py-2 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-3">
                    {i === 0 && <Check className="h-4 w-4 text-[hsl(150_20%_45%)]" />}
                    <span className={`text-sm ${i === 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                      {s.label}
                    </span>
                  </div>
                  <span className={`font-mono text-sm tabular-nums ${i === 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                    {fmt(s.total)}
                  </span>
                </div>
              ))}
            </div>
            <button className="mt-6 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors underline decoration-border underline-offset-4">
              View all history
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}

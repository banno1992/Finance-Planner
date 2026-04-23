import "./_group.css";
import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from "recharts";
import { ArrowUpRight, ArrowDownRight, MoreHorizontal } from "lucide-react";
import {
  fmt,
  fmtCompact,
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

function KPI({
  label,
  value,
  changePct,
  changeValue,
  isPositive,
}: {
  label: string;
  value: string;
  changePct?: string;
  changeValue?: string;
  isPositive?: boolean;
}) {
  return (
    <div className="flex flex-col py-2 px-4 border-r border-border last:border-r-0 flex-1">
      <span className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase mb-1">
        {label}
      </span>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-['JetBrains_Mono'] text-foreground tracking-tight">
          {value}
        </span>
        {changePct && (
          <span
            className={`flex items-center text-[11px] font-['JetBrains_Mono'] ${
              isPositive ? "text-emerald-600 dark:text-emerald-500" : "text-red-600 dark:text-red-500"
            }`}
          >
            {isPositive ? <ArrowUpRight size={10} className="mr-0.5" /> : <ArrowDownRight size={10} className="mr-0.5" />}
            {changePct}
          </span>
        )}
      </div>
    </div>
  );
}

export function LedgerGrid() {
  const chartData = snapshots.map((s) => ({
    label: s.label,
    amount: s.total,
  }));

  const recentSnapshots = [...snapshots].reverse().slice(0, 6);

  return (
    <div className="min-h-screen bg-background text-foreground font-body p-6 flex justify-center">
      <div className="w-full max-w-[1200px] flex flex-col gap-6">
        {/* Header */}
        <header className="flex items-end justify-between border-b border-border pb-4">
          <div>
            <h1 className="text-2xl font-serif font-semibold text-foreground tracking-tight">NetWorth Tracker</h1>
            <p className="text-sm text-muted-foreground mt-1">Personal Ledger & Projections</p>
          </div>
          <div className="text-sm font-['JetBrains_Mono'] text-muted-foreground">
            {snapshots[snapshots.length - 1].label}
          </div>
        </header>

        {/* KPI Strip */}
        <div className="flex border border-border rounded-sm bg-card shadow-sm overflow-hidden">
          <KPI
            label="Net Worth"
            value={fmt(netWorth)}
            changePct={`${Math.abs(netWorthChangePct).toFixed(1)}%`}
            isPositive={netWorthChange >= 0}
          />
          <KPI label="Monthly Income" value={fmt(monthlyIncome)} />
          <KPI label="Monthly Expenses" value={fmt(monthlyExpenses)} />
          <KPI label="Surplus" value={fmt(monthlySurplus)} isPositive={monthlySurplus > 0} changePct="+" />
          <KPI label="Savings Rate" value={`${savingsRate.toFixed(1)}%`} />
        </div>

        {/* Main 2-Column Ledger */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Categories */}
          <div className="col-span-4 flex flex-col border border-border bg-card rounded-sm shadow-sm">
            <div className="border-b border-border p-3 bg-muted/30">
              <h2 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                Asset Allocation
              </h2>
            </div>
            <div className="flex flex-col divide-y divide-border">
              {categories.map((c) => {
                const share = (c.value / netWorth) * 100;
                const delta = c.value - c.prevValue;
                const isPos = delta >= 0;
                return (
                  <div key={c.id} className="p-3 flex flex-col gap-2 hover:bg-muted/10 transition-colors">
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm font-medium text-foreground">{c.name}</span>
                      <span className="text-sm font-['JetBrains_Mono'] text-foreground">
                        {fmt(c.value)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center gap-4">
                      <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${Math.max(0, Math.min(100, share))}%` }}
                        />
                      </div>
                      <span
                        className={`text-[10px] font-['JetBrains_Mono'] whitespace-nowrap ${
                          isPos ? "text-emerald-600 dark:text-emerald-500" : "text-red-600 dark:text-red-500"
                        }`}
                      >
                        {isPos ? "+" : ""}
                        {fmt(delta)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Chart & Snapshots */}
          <div className="col-span-8 flex flex-col gap-6">
            {/* Chart */}
            <div className="border border-border bg-card rounded-sm shadow-sm p-4 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                  Trajectory (24M)
                </h2>
                <button className="text-muted-foreground hover:text-foreground">
                  <MoreHorizontal size={14} />
                </button>
              </div>
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="label"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => fmtCompact(v)}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "2px",
                        fontSize: "12px",
                        fontFamily: "var(--font-mono)",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                      }}
                      itemStyle={{ color: "hsl(var(--foreground))" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="hsl(var(--primary))"
                      strokeWidth={1.5}
                      dot={false}
                      activeDot={{ r: 4, fill: "hsl(var(--primary))", stroke: "hsl(var(--card))" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Snapshots Table */}
            <div className="border border-border bg-card rounded-sm shadow-sm overflow-hidden flex flex-col">
              <div className="border-b border-border p-3 bg-muted/30">
                <h2 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                  Recent Ledger
                </h2>
              </div>
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-muted-foreground bg-muted/10">
                    <th className="py-2 px-4 font-normal text-xs uppercase tracking-wider">Month</th>
                    <th className="py-2 px-4 font-normal text-xs uppercase tracking-wider text-right">Total Balance</th>
                    <th className="py-2 px-4 font-normal text-xs uppercase tracking-wider text-right">Net Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentSnapshots.map((s, i) => {
                    const prev = recentSnapshots[i + 1]?.total || s.total; // simplified for mockup
                    const change = s.total - prev;
                    const isPos = change >= 0;
                    return (
                      <tr key={s.date} className="hover:bg-muted/10 transition-colors">
                        <td className="py-2 px-4 text-foreground">{s.label}</td>
                        <td className="py-2 px-4 text-right font-['JetBrains_Mono'] text-foreground">
                          {fmt(s.total)}
                        </td>
                        <td
                          className={`py-2 px-4 text-right font-['JetBrains_Mono'] text-xs ${
                            isPos ? "text-emerald-600 dark:text-emerald-500" : "text-red-600 dark:text-red-500"
                          }`}
                        >
                          {i === recentSnapshots.length - 1 ? "-" : `${isPos ? "+" : ""}${fmt(change)}`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import "./_group.css";
import React from "react";
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
} from "recharts";
import { ArrowUpRight, ArrowDownRight, MoreHorizontal } from "lucide-react";
import {
  fmt, fmtCompact, netWorth, prevNetWorth, netWorthChange, netWorthChangePct,
  monthlyIncome, monthlyExpenses, monthlySurplus, savingsRate,
  snapshots, categories, categoryHistory
} from "./_mockData";

type SparkPoint = Record<string, number | string>;
function Sparkline({ data, dataKey, color, trendUp }: { data: SparkPoint[], dataKey: string, color: string, trendUp: boolean }) {
  return (
    <ResponsiveContainer width="100%" height={32}>
      <LineChart data={data}>
        <Line 
          type="monotone" 
          dataKey={dataKey} 
          stroke={color} 
          strokeWidth={1.5} 
          dot={false} 
          isAnimationActive={false} 
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function MetricCard({ title, value, trendPct, trendUp, sparklineData, sparklineKey }: { title: string, value: string, trendPct: string, trendUp: boolean, sparklineData: SparkPoint[], sparklineKey: string }) {
  return (
    <div className="flex flex-col border-b border-border/50 pb-4 pt-2">
      <div className="text-xs text-muted-foreground mb-1">{title}</div>
      <div className="flex items-end justify-between">
        <div className="flex items-baseline gap-3">
          <div className="font-['JetBrains_Mono'] tabular-nums text-xl text-foreground font-medium">{value}</div>
          <div className={`flex items-center text-xs font-['JetBrains_Mono'] ${trendUp ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"}`}>
            {trendUp ? <ArrowUpRight size={12} className="mr-0.5" /> : <ArrowDownRight size={12} className="mr-0.5" />}
            {trendPct}
          </div>
        </div>
        <div className="w-24 opacity-60">
          <Sparkline data={sparklineData} dataKey={sparklineKey} color={trendUp ? "#16a34a" : "#dc2626"} trendUp={trendUp} />
        </div>
      </div>
    </div>
  );
}

export function Statement() {
  const trajectoryData = snapshots.map(s => ({ label: s.label, amount: s.total }));
  
  // Create mock historical data for metrics that don't have it
  const surplusData = snapshots.map((s, i) => ({ val: monthlySurplus * (1 + (i - 12) * 0.05) }));
  const incomeData = snapshots.map((s, i) => ({ val: monthlyIncome * (1 + (i - 12) * 0.02) }));
  const savingsRateData = snapshots.map((s, i) => ({ val: savingsRate * (1 + (i - 12) * 0.03) }));

  const tableData = categories.map(cat => {
    const history = categoryHistory[cat.id];
    const trend = history.map((val, i) => ({ val }));
    const change = cat.value - cat.prevValue;
    const changePct = (change / Math.abs(cat.prevValue)) * 100;
    return { ...cat, history: trend, change, changePct };
  });

  return (
    <div className="min-h-screen bg-background text-foreground font-body p-8 lg:p-12">
      <div className="mx-auto max-w-5xl">
        
        {/* Header */}
        <header className="flex items-end justify-between border-b border-border pb-8 mb-8">
          <div>
            <div className="text-sm text-muted-foreground mb-3 uppercase tracking-widest font-medium">Private Wealth Statement</div>
            <div className="font-['Source_Serif_4'] text-5xl tracking-tight text-foreground">{fmt(netWorth)}</div>
            <div className="mt-3 flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">As of {snapshots[snapshots.length - 1].label}</span>
              <span className={`flex items-center font-['JetBrains_Mono'] tabular-nums ${netWorthChange >= 0 ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"}`}>
                {netWorthChange >= 0 ? "+" : ""}{fmt(netWorthChange)} ({netWorthChangePct.toFixed(2)}%)
              </span>
            </div>
          </div>
          <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <MoreHorizontal size={20} />
          </button>
        </header>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-6 mb-12">
          <MetricCard 
            title="Monthly Surplus" 
            value={fmt(monthlySurplus)} 
            trendPct="+5.2%" 
            trendUp={true} 
            sparklineData={surplusData} 
            sparklineKey="val" 
          />
          <MetricCard 
            title="Monthly Income" 
            value={fmt(monthlyIncome)} 
            trendPct="+2.1%" 
            trendUp={true} 
            sparklineData={incomeData} 
            sparklineKey="val" 
          />
          <MetricCard 
            title="Savings Rate" 
            value={`${savingsRate.toFixed(1)}%`} 
            trendPct="-1.2%" 
            trendUp={false} 
            sparklineData={savingsRateData} 
            sparklineKey="val" 
          />
        </div>

        {/* Trajectory Chart */}
        <div className="mb-16">
          <div className="text-sm font-medium text-foreground mb-6">Wealth Trajectory</div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trajectoryData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="currentColor" stopOpacity={0.05} className="text-foreground" />
                    <stop offset="95%" stopColor="currentColor" stopOpacity={0} className="text-foreground" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis 
                  dataKey="label" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} 
                  dy={10} 
                  interval="preserveStartEnd"
                  minTickGap={40}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} 
                  tickFormatter={fmtCompact}
                  width={60}
                  dx={-10}
                  domain={['auto', 'auto']}
                />
                <RechartsTooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--background))", 
                    borderColor: "hsl(var(--border))", 
                    borderRadius: "4px",
                    fontFamily: "var(--font-mono)",
                    fontSize: "12px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                  }}
                  itemStyle={{ color: "hsl(var(--foreground))" }}
                  formatter={(value: number) => [fmt(value), "Net Worth"]}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="currentColor" 
                  strokeWidth={1.5} 
                  fill="url(#chartFill)" 
                  className="text-foreground" 
                  activeDot={{ r: 4, fill: "hsl(var(--background))", stroke: "currentColor", strokeWidth: 1.5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Asset Breakdown */}
        <div>
          <div className="text-sm font-medium text-foreground mb-6">Asset Breakdown</div>
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border/50 text-muted-foreground">
                  <th className="pb-3 font-normal">Account / Asset</th>
                  <th className="pb-3 font-normal text-right">Trend (24mo)</th>
                  <th className="pb-3 font-normal text-right">MoM Change</th>
                  <th className="pb-3 font-normal text-right">Current Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {tableData.map((row) => (
                  <tr key={row.id} className="group hover:bg-muted/30 transition-colors">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: row.color }}></div>
                        <span className="text-foreground">{row.name}</span>
                      </div>
                    </td>
                    <td className="py-4 text-right w-32 px-4">
                      <div className="h-6 w-full ml-auto opacity-50 grayscale">
                        <Sparkline data={row.history} dataKey="val" color={row.color} trendUp={row.change >= 0} />
                      </div>
                    </td>
                    <td className="py-4 text-right">
                      <span className={`font-['JetBrains_Mono'] tabular-nums ${row.change >= 0 ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"}`}>
                        {row.change > 0 ? "+" : ""}{fmt(row.change)}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <span className="font-['JetBrains_Mono'] tabular-nums text-foreground">{fmt(row.value)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
      </div>
    </div>
  );
}

import { useState } from "react";
import { useSnapshots, useSettings, useCategories, useCashflows } from "@/hooks/use-finance";
import { ChartContainer } from "@/components/ChartContainer";
import { formatCurrency, getCurrencySymbol } from "@/lib/currency";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import { format, parseISO } from "date-fns";
import { Loader2 } from "lucide-react";

const COLORS = [
  'hsl(var(--chart-accent))',
  'hsl(var(--color-asset))',
  'hsl(var(--color-debt))',
  'hsl(var(--color-income))',
  'hsl(var(--color-expense))',
  'hsl(var(--chart-positive))',
  'hsl(var(--chart-negative))',
];

export default function Analytics() {
  const { data: snapshots, isLoading: snapshotsLoading } = useSnapshots();
  const { data: categories } = useCategories();
  const { data: cashflows } = useCashflows();
  const { data: settings } = useSettings();
  const currency = settings?.currency || "USD";
  
  const [visibleAssets, setVisibleAssets] = useState<Set<string>>(new Set());
  const [visibleDebts, setVisibleDebts] = useState<Set<string>>(new Set());

  const isLoading = snapshotsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px]">
        <Loader2 className="animate-spin text-primary w-12 h-12" />
      </div>
    );
  }

  // Sort snapshots by date
  const sortedSnapshots = [...(snapshots || [])].sort((a, b) => 
    new Date(a.month).getTime() - new Date(b.month).getTime()
  );

  const latestSnapshot = sortedSnapshots[sortedSnapshots.length - 1];

  // Calculate monthly growth
  const growthData = sortedSnapshots.slice(1).map((curr, idx) => {
    const prev = sortedSnapshots[idx];
    const diff = Number(curr.totalNetWorth) - Number(prev.totalNetWorth);
    return {
      date: curr.month,
      growth: diff,
      isPositive: diff >= 0
    };
  });

  // Wealth distribution by category - separate assets and debts
  const { assets, debts } = latestSnapshot && categories ? 
    categories.reduce((acc, cat) => {
      const detail = latestSnapshot.details?.find((d: any) => d.categoryId === cat.id);
      const balance = detail ? Number(detail.balance) : 0;
      if (balance > 0) {
        acc.assets.push({ name: cat.name, value: balance });
      } else if (balance < 0) {
        acc.debts.push({ name: cat.name, value: Math.abs(balance) });
      }
      return acc;
    }, { assets: [] as any[], debts: [] as any[] })
    : { assets: [], debts: [] };

  // Calculate projected metrics from cashflows
  const monthlyIncome = cashflows
    ?.filter(c => c.type === 'income')
    .reduce((sum, c) => sum + Number(c.amount), 0) || 0;
  
  const monthlyExpenses = cashflows
    ?.filter(c => c.type === 'expense')
    .reduce((sum, c) => sum + Number(c.amount), 0) || 0;
  
  const projectedSurplus = monthlyIncome - monthlyExpenses;
  const projectedSavingsRate = monthlyIncome > 0 ? ((projectedSurplus / monthlyIncome) * 100).toFixed(1) : "0";

  // Calculate actual metrics from historical data
  const getTrailingAverage = (months: number) => {
    if (growthData.length < months) return null;
    const recent = growthData.slice(-months);
    return recent.reduce((sum, d) => sum + d.growth, 0) / months;
  };

  const trailing3Mo = getTrailingAverage(3);
  const trailing6Mo = getTrailingAverage(6);
  const trailing12Mo = getTrailingAverage(12);

  // Calculate actual savings rate and surplus from historical data
  let actualSurplus = "N/A";
  let actualSavingsRate = "N/A";
  if (growthData.length > 0) {
    const avgGrowth = growthData.reduce((sum, d) => sum + d.growth, 0) / growthData.length;
    actualSurplus = formatCurrency(avgGrowth, currency);
    
    if (monthlyIncome > 0) {
      const actualRate = (avgGrowth / monthlyIncome * 100).toFixed(1);
      actualSavingsRate = `${actualRate}%`;
    }
  }

  const surplusGap = monthlyIncome > 0 ? (projectedSurplus - (trailing3Mo || 0)).toFixed(0) : "N/A";
  const savingsRateGap = trailing3Mo !== null && monthlyIncome > 0 
    ? (parseFloat(projectedSavingsRate) - (trailing3Mo / monthlyIncome * 100)).toFixed(1) 
    : "N/A";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div>
        <h2 className="font-serif text-3xl md:text-4xl font-light tracking-tight text-foreground">Analytics</h2>
        <p className="text-muted-foreground mt-2">Deep dive into your wealth accumulation</p>
      </div>

      <ChartContainer 
        title="Monthly Net Worth Change" 
        description="The absolute change in your net worth month-over-month."
      >
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={growthData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(val) => format(parseISO(val), 'MMM')}
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickFormatter={(val) => `${getCurrencySymbol(currency)}${(val/1000).toFixed(0)}k`}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip 
              cursor={{ fill: 'hsl(var(--muted) / 0.4)' }}
              contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px', color: 'hsl(var(--foreground))' }}
              itemStyle={{ color: 'hsl(var(--foreground))' }}
              labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
              formatter={(value: any) => [formatCurrency(Number(value), currency), 'Change']}
              labelFormatter={(label) => format(parseISO(label as string), 'MMMM yyyy')}
            />
            <Bar dataKey="growth" fill="hsl(var(--chart-accent))" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {(assets.length > 0 || debts.length > 0) && (
          <ChartContainer 
            title="Assets vs Debts Distribution" 
            description="Inner ring shows assets, outer ring shows debts proportionally."
          >
            {(() => {
              const totalAssets = assets.reduce((sum, a) => sum + a.value, 0);
              const totalDebts = debts.reduce((sum, d) => sum + d.value, 0);
              const total = totalAssets + totalDebts;
              const assetsAngle = (totalAssets / total) * 360;
              const debtsStartAngle = -assetsAngle;
              const debtsEndAngle = -360;
              
              const filteredAssets = visibleAssets.size === 0 ? assets : assets.filter(a => visibleAssets.has(a.name));
              const filteredDebts = visibleDebts.size === 0 ? debts : debts.filter(d => visibleDebts.has(d.name));
              
              return (
                <>
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={filteredAssets}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        label={false}
                        endAngle={-assetsAngle}
                      >
                        {filteredAssets.map((entry, index) => (
                          <Cell key={`asset-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Pie
                        data={filteredDebts}
                        cx="50%"
                        cy="50%"
                        innerRadius={90}
                        outerRadius={120}
                        paddingAngle={2}
                        dataKey="value"
                        label={false}
                        startAngle={debtsStartAngle}
                        endAngle={debtsEndAngle}
                      >
                        {filteredDebts.map((entry, index) => (
                          <Cell key={`debt-${index}`} fill={`hsl(var(--chart-negative))`} opacity={0.4 + (index * 0.15)} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any) => [formatCurrency(Number(value), currency), 'Amount']}
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px', color: 'hsl(var(--foreground))' }}
                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                        labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-[hsl(var(--chart-positive))] mb-2">Assets (Inner Ring) — {((totalAssets / total) * 100).toFixed(0)}%</p>
                      <div className="space-y-1">
                        {assets.map((item, idx) => (
                          <button
                            key={item.name}
                            onClick={() => setVisibleAssets(prev => {
                              const next = new Set(prev);
                              if (next.has(item.name)) next.delete(item.name);
                              else next.add(item.name);
                              return next;
                            })}
                            className="w-full text-left flex items-center justify-between text-xs hover:opacity-80 transition-opacity"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length], opacity: visibleAssets.size === 0 || visibleAssets.has(item.name) ? 1 : 0.4 }}></div>
                              <span className={visibleAssets.size === 0 || visibleAssets.has(item.name) ? "text-muted-foreground" : "text-muted-foreground/50"}>{item.name}</span>
                            </div>
                            <span className="font-mono tabular-nums">{formatCurrency(item.value, currency)}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-[hsl(var(--chart-negative))] mb-2">Debts (Outer Ring) — {((totalDebts / total) * 100).toFixed(0)}%</p>
                      <div className="space-y-1">
                        {debts.map((item, idx) => (
                          <button
                            key={item.name}
                            onClick={() => setVisibleDebts(prev => {
                              const next = new Set(prev);
                              if (next.has(item.name)) next.delete(item.name);
                              else next.add(item.name);
                              return next;
                            })}
                            className="w-full text-left flex items-center justify-between text-xs hover:opacity-80 transition-opacity"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-negative))', opacity: visibleDebts.size === 0 || visibleDebts.has(item.name) ? 1 : 0.4 }}></div>
                              <span className={visibleDebts.size === 0 || visibleDebts.has(item.name) ? "text-muted-foreground" : "text-muted-foreground/50"}>{item.name}</span>
                            </div>
                            <span className="font-mono tabular-nums">{formatCurrency(item.value, currency)}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </ChartContainer>
        )}

        <div className="rounded-3xl border border-border bg-card/60 backdrop-blur-xl p-6 shadow-sm">
          <h3 className="font-serif text-lg font-light tracking-tight">Advanced Insights</h3>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed mb-6">
            Average monthly net-worth change over the last 3, 6 and 12 months — useful for spotting whether your growth is accelerating or slowing.
          </p>
          <div className="space-y-5 text-sm">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-1">3-Month Trailing Avg</p>
              <p className="font-serif text-xl font-light text-foreground tabular-nums">{trailing3Mo !== null ? formatCurrency(trailing3Mo, currency) : "N/A"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-1">6-Month Trailing Avg</p>
              <p className="font-serif text-xl font-light text-foreground tabular-nums">{trailing6Mo !== null ? formatCurrency(trailing6Mo, currency) : "N/A"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-1">12-Month Trailing Avg</p>
              <p className="font-serif text-xl font-light text-foreground tabular-nums">{trailing12Mo !== null ? formatCurrency(trailing12Mo, currency) : "N/A"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {sortedSnapshots.length >= 3 ? (
          <div className="rounded-3xl border border-border bg-card/60 backdrop-blur-xl p-6 shadow-sm">
            <h3 className="font-serif text-lg font-light tracking-tight">Savings Analysis</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed mb-6">
              Compares the surplus your cashflows predict each month against the actual average growth recorded in your snapshots. The gap shows how far behind (or ahead) of plan you are.
            </p>
            <div className="space-y-5 text-sm">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-1">Projected Monthly Surplus</p>
                <p className="font-serif text-xl font-light text-[hsl(var(--chart-positive))] tabular-nums">{formatCurrency(projectedSurplus, currency)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-1">Actual Monthly Surplus (Avg)</p>
                <p className="font-serif text-xl font-light text-foreground tabular-nums">{actualSurplus}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-1">Surplus Gap</p>
                <p className={`font-serif text-xl font-light tabular-nums ${surplusGap === "N/A" || Number(surplusGap) >= 0 ? "text-foreground" : "text-[hsl(var(--chart-negative))]"}`}>
                  {surplusGap === "N/A" ? "N/A" : formatCurrency(Number(surplusGap), currency)}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-border bg-card/60 backdrop-blur-xl p-6 shadow-sm">
            <h3 className="font-serif text-lg font-light tracking-tight mb-4">Savings Analysis</h3>
            <p className="text-muted-foreground text-sm">
              Track at least 3 months of data to see savings analysis and insights.
            </p>
          </div>
        )}
        
        <div className="rounded-3xl border border-border bg-card/60 backdrop-blur-xl p-6 shadow-sm">
          <h3 className="font-serif text-lg font-light tracking-tight">Savings Rate Comparison</h3>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed mb-6">
            Your savings rate is the share of monthly income you keep. This compares the rate your cashflows project versus the rate your snapshots actually achieved.
          </p>
          <div className="space-y-5 text-sm">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-1">Projected Savings Rate</p>
              <p className="font-serif text-xl font-light text-[hsl(var(--chart-positive))] tabular-nums">{projectedSavingsRate}%</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-1">Actual Savings Rate (Avg)</p>
              <p className="font-serif text-xl font-light text-foreground tabular-nums">{actualSavingsRate}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-1">Rate Gap</p>
              <p className={`font-serif text-xl font-light tabular-nums ${savingsRateGap === "N/A" || Number(savingsRateGap) >= 0 ? "text-foreground" : "text-[hsl(var(--chart-negative))]"}`}>
                {savingsRateGap === "N/A" ? "N/A" : `${savingsRateGap}%`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

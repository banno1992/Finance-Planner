import { useSnapshots, useSettings, useCategories, useCashflows } from "@/hooks/use-finance";
import { ChartContainer } from "@/components/ChartContainer";
import { formatCurrency, getCurrencySymbol } from "@/lib/currency";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { format, parseISO } from "date-fns";
import { Loader2 } from "lucide-react";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--destructive))', '#a78bfa', '#fb923c', '#06b6d4', '#ec4899'];

export default function Analytics() {
  const { data: snapshots, isLoading: snapshotsLoading } = useSnapshots();
  const { data: categories } = useCategories();
  const { data: cashflows } = useCashflows();
  const { data: settings } = useSettings();
  const currency = settings?.currency || "USD";

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
        <h2 className="text-3xl font-display font-bold text-white">Analytics</h2>
        <p className="text-muted-foreground mt-1">Deep dive into your wealth accumulation</p>
      </div>

      <ChartContainer 
        title="Monthly Net Worth Change" 
        description="The absolute dollar change in your net worth month-over-month."
      >
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={growthData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(val) => format(parseISO(val), 'MMM')}
              stroke="rgba(255,255,255,0.3)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="rgba(255,255,255,0.3)"
              fontSize={12}
              tickFormatter={(val) => `${getCurrencySymbol(currency)}${(val/1000).toFixed(0)}k`}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip 
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px' }}
              itemStyle={{ color: 'white' }}
              formatter={(value: any) => [formatCurrency(Number(value), currency), 'Change']}
              labelFormatter={(label) => format(parseISO(label as string), 'MMMM yyyy')}
            />
            <Bar dataKey="growth" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {(assets.length > 0 || debts.length > 0) && (
          <ChartContainer 
            title="Assets vs Debts Distribution" 
            description="Inner ring shows assets, outer ring shows debts."
          >
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={assets}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  label={false}
                >
                  {assets.map((entry, index) => (
                    <Cell key={`asset-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Pie
                  data={debts}
                  cx="50%"
                  cy="50%"
                  innerRadius={90}
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="value"
                  label={false}
                >
                  {debts.map((entry, index) => (
                    <Cell key={`debt-${index}`} fill={`hsl(var(--destructive))`} opacity={0.3 + (index * 0.1)} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [formatCurrency(Number(value), currency), 'Amount']}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px' }}
                  itemStyle={{ color: 'white' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-3">
              <div>
                <p className="text-xs font-semibold text-green-400 mb-2">Assets (Inner Ring)</p>
                <div className="space-y-1">
                  {assets.map((item, idx) => (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                        <span className="text-muted-foreground">{item.name}</span>
                      </div>
                      <span className="font-mono">{formatCurrency(item.value, currency)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-red-400 mb-2">Debts (Outer Ring)</p>
                <div className="space-y-1">
                  {debts.map((item, idx) => (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'hsl(var(--destructive))' }}></div>
                        <span className="text-muted-foreground">{item.name}</span>
                      </div>
                      <span className="font-mono">{formatCurrency(item.value, currency)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ChartContainer>
        )}

        <div className="glass-card p-6 rounded-2xl">
          <h3 className="font-display text-lg font-semibold mb-4">Advanced Insights</h3>
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">3-Month Trailing Avg</p>
              <p className="text-base font-semibold text-primary">{trailing3Mo !== null ? formatCurrency(trailing3Mo, currency) : "N/A"}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">6-Month Trailing Avg</p>
              <p className="text-base font-semibold text-primary">{trailing6Mo !== null ? formatCurrency(trailing6Mo, currency) : "N/A"}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">12-Month Trailing Avg</p>
              <p className="text-base font-semibold text-primary">{trailing12Mo !== null ? formatCurrency(trailing12Mo, currency) : "N/A"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {sortedSnapshots.length >= 3 ? (
          <div className="glass-card p-6 rounded-2xl">
            <h3 className="font-display text-lg font-semibold mb-4">Savings Analysis</h3>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Projected Monthly Surplus</p>
                <p className="text-base font-semibold text-green-400">{formatCurrency(projectedSurplus, currency)}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Actual Monthly Surplus (Avg)</p>
                <p className="text-base font-semibold text-blue-400">{actualSurplus}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Surplus Gap</p>
                <p className={`text-base font-semibold ${surplusGap === "N/A" || Number(surplusGap) >= 0 ? "text-primary" : "text-destructive"}`}>
                  {surplusGap === "N/A" ? "N/A" : formatCurrency(Number(surplusGap), currency)}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-card p-6 rounded-2xl">
            <h3 className="font-display text-lg font-semibold mb-4">Savings Analysis</h3>
            <p className="text-muted-foreground text-sm">
              Track at least 3 months of data to see savings analysis and insights.
            </p>
          </div>
        )}
        
        <div className="glass-card p-6 rounded-2xl">
          <h3 className="font-display text-lg font-semibold mb-4">Savings Rate Comparison</h3>
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Projected Savings Rate</p>
              <p className="text-base font-semibold text-green-400">{projectedSavingsRate}%</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Actual Savings Rate (Avg)</p>
              <p className="text-base font-semibold text-blue-400">{actualSavingsRate}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Rate Gap</p>
              <p className={`text-base font-semibold ${savingsRateGap === "N/A" || Number(savingsRateGap) >= 0 ? "text-primary" : "text-destructive"}`}>
                {savingsRateGap === "N/A" ? "N/A" : `${savingsRateGap}%`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

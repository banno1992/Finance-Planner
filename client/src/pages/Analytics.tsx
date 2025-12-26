import { useSnapshots, useSettings } from "@/hooks/use-finance";
import { ChartContainer } from "@/components/ChartContainer";
import { formatCurrency, getCurrencySymbol } from "@/lib/currency";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { format, parseISO } from "date-fns";
import { Loader2 } from "lucide-react";

export default function Analytics() {
  const { data: snapshots, isLoading } = useSnapshots();
  const { data: settings } = useSettings();
  const currency = settings?.currency || "USD";

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

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {sortedSnapshots.length >= 3 ? (
          <div className="glass-card p-6 rounded-2xl">
            <h3 className="font-display text-lg font-semibold mb-4">Insights</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              {growthData.length > 0 && (
                <>
                  <p>Average monthly growth: <span className="text-primary font-semibold">{formatCurrency(growthData.reduce((sum, d) => sum + d.growth, 0) / growthData.length, currency)}</span></p>
                  <p>Best month: <span className="text-green-400 font-semibold">{formatCurrency(Math.max(...growthData.map(d => d.growth)), currency)}</span></p>
                  <p>Total growth: <span className="text-primary font-semibold">{formatCurrency(growthData.reduce((sum, d) => sum + d.growth, 0), currency)}</span></p>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="glass-card p-6 rounded-2xl">
            <h3 className="font-display text-lg font-semibold mb-4">Insights</h3>
            <p className="text-muted-foreground text-sm">
              Track at least 3 months of data to unlock detailed trend analysis and personalized recommendations.
            </p>
          </div>
        )}
        
        <div className="glass-card p-6 rounded-2xl">
           <h3 className="font-display text-lg font-semibold mb-4">Milestone Tracker</h3>
           <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>First {formatCurrency(10000, currency)}</span>
                  <span className="text-primary">Achieved</span>
                </div>
                <div className="h-2 bg-primary/20 rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-full" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>{formatCurrency(100000, currency)} Net Worth</span>
                  <span className="text-muted-foreground">In Progress</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[45%]" />
                </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

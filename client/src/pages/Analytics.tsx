import { useSnapshots } from "@/hooks/use-finance";
import { ChartContainer } from "@/components/ChartContainer";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { format, parseISO } from "date-fns";
import { Loader2 } from "lucide-react";

export default function Analytics() {
  const { data: snapshots, isLoading } = useSnapshots();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px]">
        <Loader2 className="animate-spin text-primary w-12 h-12" />
      </div>
    );
  }

  // Calculate monthly growth
  const growthData = snapshots?.slice(1).map((curr, idx) => {
    const prev = snapshots[idx];
    const diff = Number(curr.totalNetWorth) - Number(prev.totalNetWorth);
    return {
      date: curr.month,
      growth: diff,
      isPositive: diff >= 0
    };
  }) || [];

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
              tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip 
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px' }}
              itemStyle={{ color: 'white' }}
              formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Change']}
              labelFormatter={(label) => format(parseISO(label as string), 'MMMM yyyy')}
            />
            <Bar dataKey="growth" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-card p-6 rounded-2xl">
           <h3 className="font-display text-lg font-semibold mb-4">Insights</h3>
           <p className="text-muted-foreground text-sm">
             Track at least 3 months of data to unlock detailed trend analysis and personalized recommendations.
           </p>
        </div>
        
        <div className="glass-card p-6 rounded-2xl">
           <h3 className="font-display text-lg font-semibold mb-4">Milestone Tracker</h3>
           <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>First $10k</span>
                  <span className="text-primary">Achieved</span>
                </div>
                <div className="h-2 bg-primary/20 rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-full" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>$100k Net Worth</span>
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

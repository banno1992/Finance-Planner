import { useSnapshots, useCashflows, useSettings } from "@/hooks/use-finance";
import { MetricCard } from "@/components/MetricCard";
import { ChartContainer } from "@/components/ChartContainer";
import { SnapshotManager } from "@/components/SnapshotManager";
import { formatCurrency, getCurrencySymbol } from "@/lib/currency";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  ComposedChart, Line, Bar 
} from "recharts";
import { format, addMonths, differenceInMonths, parseISO } from "date-fns";
import { Loader2, TrendingUp, DollarSign, Target, ArrowUpCircle } from "lucide-react";

export default function Dashboard() {
  const { data: snapshots, isLoading: loadingSnapshots } = useSnapshots();
  const { data: cashflows, isLoading: loadingCashflows } = useCashflows();
  const { data: settings } = useSettings();
  const currency = settings?.currency || "USD";

  if (loadingSnapshots || loadingCashflows) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px]">
        <Loader2 className="animate-spin text-primary w-12 h-12" />
      </div>
    );
  }

  // CALCULATIONS
  const sortedSnapshots = [...(snapshots || [])].sort((a, b) => 
    new Date(a.month).getTime() - new Date(b.month).getTime()
  );

  const currentSnapshot = sortedSnapshots[sortedSnapshots.length - 1];
  const previousSnapshot = sortedSnapshots[sortedSnapshots.length - 2];
  
  const currentNetWorth = Number(currentSnapshot?.totalNetWorth || 0);
  const prevNetWorth = Number(previousSnapshot?.totalNetWorth || 0);
  
  const netWorthChange = currentNetWorth - prevNetWorth;
  const netWorthTrend = prevNetWorth !== 0 
    ? ((netWorthChange / prevNetWorth) * 100).toFixed(1) + "%" 
    : "0%";

  // Cashflow calcs
  const monthlyIncome = cashflows
    ?.filter(c => c.type === 'income')
    .reduce((sum, c) => sum + Number(c.amount), 0) || 0;
    
  const monthlyExpenses = cashflows
    ?.filter(c => c.type === 'expense')
    .reduce((sum, c) => sum + Number(c.amount), 0) || 0;
    
  const monthlySurplus = monthlyIncome - monthlyExpenses;
  const savingsRate = monthlyIncome > 0 ? ((monthlySurplus / monthlyIncome) * 100).toFixed(0) + "%" : "0%";

  // PREDICTION DATA
  const projectionMonths = 24;
  const historicalData = sortedSnapshots.map(s => ({
    date: s.month,
    amount: Number(s.totalNetWorth),
    type: 'historical'
  }));

  const lastDate = currentSnapshot ? new Date(currentSnapshot.month) : new Date();
  const predictionData = Array.from({ length: projectionMonths }).map((_, i) => {
    const date = addMonths(lastDate, i + 1);
    return {
      date: format(date, 'yyyy-MM-dd'),
      amount: currentNetWorth + (monthlySurplus * (i + 1)),
      type: 'prediction'
    };
  });

  const chartData = [...historicalData, ...predictionData];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-display font-bold text-white">Dashboard</h2>
        <p className="text-muted-foreground mt-1">Your financial health at a glance</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Net Worth" 
          value={formatCurrency(currentNetWorth, currency)}
          trend={netWorthTrend}
          trendUp={netWorthChange >= 0}
          icon={<Target size={32} />}
          delay={0}
          tooltip="Total of all your assets minus all your debts. This is your overall financial position."
        />
        <MetricCard 
          title="Monthly Surplus" 
          value={formatCurrency(monthlySurplus, currency)}
          trend="Estimated"
          trendUp={monthlySurplus > 0}
          icon={<TrendingUp size={32} />}
          delay={100}
          tooltip="Monthly income minus monthly expenses. This is how much you can potentially save each month."
        />
        <MetricCard 
          title="Monthly Income" 
          value={formatCurrency(monthlyIncome, currency)}
          icon={<DollarSign size={32} />}
          delay={200}
          tooltip="Sum of all your recurring monthly income sources."
        />
        <MetricCard 
          title="Savings Rate" 
          value={savingsRate}
          icon={<ArrowUpCircle size={32} />}
          delay={300}
          tooltip="What percentage of your income you save each month. Higher is better for wealth building."
        />
      </div>

      {/* Main Chart */}
      <ChartContainer 
        title="Wealth Trajectory" 
        description="Historical net worth (solid), projected based on surplus (dashed), and actual monthly growth (dotted)."
        className="min-h-[400px]"
      >
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(val) => format(parseISO(val), 'MMM yy')}
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
              contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px' }}
              itemStyle={{ color: 'white' }}
              formatter={(value: any) => [formatCurrency(Number(value), currency), 'Net Worth']}
              labelFormatter={(label) => format(parseISO(label as string), 'MMMM yyyy')}
            />
            <Area 
              type="monotone" 
              dataKey="amount" 
              stroke="hsl(var(--primary))" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorValue)" 
              name="Net Worth"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Secondary Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartContainer title="Cashflow Breakdown">
          <div className="flex flex-col gap-4">
             {/* Income Bar */}
             <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Income</span>
                  <span className="font-semibold text-green-400">{formatCurrency(monthlyIncome, currency)}</span>
                </div>
                <div className="h-4 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: '100%' }} />
                </div>
             </div>

             {/* Expenses Bar */}
             <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Expenses</span>
                  <span className="font-semibold text-red-400">{formatCurrency(monthlyExpenses, currency)}</span>
                </div>
                <div className="h-4 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-red-500 rounded-full" 
                    style={{ width: `${Math.min((monthlyExpenses / monthlyIncome) * 100, 100)}%` }} 
                  />
                </div>
             </div>

             {/* Surplus Bar */}
             <div className="space-y-2 mt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-white font-medium">Net Surplus</span>
                  <span className="font-semibold text-primary">{formatCurrency(monthlySurplus, currency)}</span>
                </div>
                <div className="h-4 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full" 
                    style={{ width: `${Math.min((monthlySurplus / monthlyIncome) * 100, 100)}%` }} 
                  />
                </div>
             </div>
          </div>
        </ChartContainer>

        <ChartContainer title="Net Worth Snapshots">
          <SnapshotManager />
        </ChartContainer>
      </div>
    </div>
  );
}

import { useState, useMemo, useRef } from "react";
import { useSnapshots, useCashflows, useSettings, useStudentLoans, useMortgages } from "@/hooks/use-finance";
import { MetricCard } from "@/components/MetricCard";
import { ChartContainer } from "@/components/ChartContainer";
import { SnapshotManager } from "@/components/SnapshotManager";
import { formatCurrency, getCurrencySymbol } from "@/lib/currency";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  ComposedChart, Line, Bar, Legend
} from "recharts";
import { format, addMonths, differenceInMonths, parseISO } from "date-fns";
import { Loader2, TrendingUp, DollarSign, Target, ArrowUpCircle, ChevronDown, ChevronUp, PlusCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function Dashboard() {
  const { data: snapshots, isLoading: loadingSnapshots } = useSnapshots();
  const { data: cashflows, isLoading: loadingCashflows } = useCashflows();
  const { data: studentLoans, isLoading: loadingStudentLoans } = useStudentLoans();
  const { data: mortgages, isLoading: loadingMortgages } = useMortgages();
  const { data: settings } = useSettings();
  const currency = settings?.currency || "USD";

  const [includeStudentLoans, setIncludeStudentLoans] = useState(false);
  const [includeMortgage, setIncludeMortgage] = useState(false);
  const [truncateYAxis, setTruncateYAxis] = useState(true);
  const [isCashflowOpen, setIsCashflowOpen] = useState(false);
  
  const snapshotsRef = useRef<HTMLDivElement>(null);

  const scrollToSnapshots = () => {
    snapshotsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loadingSnapshots || loadingCashflows || loadingStudentLoans || loadingMortgages) {
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

  const studentLoanDebt = studentLoans?.reduce((sum, loan) => sum + Number(loan.loanAmount), 0) || 0;
  const mortgageEquity = mortgages?.reduce((sum, mortgage) => sum + (Number(mortgage.propertyValue) - Number(mortgage.loanAmount)), 0) || 0;

  const getAdjustedNetWorth = (baseValue: number) => {
    let adjusted = baseValue;
    if (includeStudentLoans) adjusted -= studentLoanDebt;
    if (includeMortgage) adjusted += mortgageEquity;
    return adjusted;
  };

  const currentSnapshot = sortedSnapshots[sortedSnapshots.length - 1];
  const previousSnapshot = sortedSnapshots[sortedSnapshots.length - 2];
  
  const currentNetWorth = getAdjustedNetWorth(Number(currentSnapshot?.totalNetWorth || 0));
  const prevNetWorth = getAdjustedNetWorth(Number(previousSnapshot?.totalNetWorth || 0));
  
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
    amount: getAdjustedNetWorth(Number(s.totalNetWorth)),
    type: 'historical'
  }));

  // Calculate actual monthly surplus from historical data
  const actualMonthlySurplus = historicalData.length > 1
    ? historicalData.slice(1).reduce((sum, curr, idx) => sum + (curr.amount - historicalData[idx].amount), 0) / (historicalData.length - 1)
    : 0;

  const lastDate = currentSnapshot ? new Date(currentSnapshot.month) : new Date();
  const predictionData = Array.from({ length: projectionMonths }).map((_, i) => {
    const date = addMonths(lastDate, i + 1);
    return {
      date: format(date, 'yyyy-MM-dd'),
      projectedAmount: currentNetWorth + (monthlySurplus * (i + 1)),
      actualAmount: currentNetWorth + (actualMonthlySurplus * (i + 1)),
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

      {/* Info Section */}
      <Collapsible className="glass-card rounded-2xl border border-white/10 overflow-hidden">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-6 hover:bg-white/5 h-auto">
            <div className="flex items-center gap-3 text-left">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <TrendingUp size={20} />
              </div>
              <div>
                <h3 className="font-display font-semibold text-lg">How wealth snapshots work</h3>
                <p className="text-sm text-muted-foreground">Learn how to track your progress effectively</p>
              </div>
            </div>
            <ChevronDown size={20} className="text-muted-foreground" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="px-6 pb-6 pt-2 space-y-4 animate-in slide-in-from-top-2 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h4 className="font-medium text-white flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/20 text-primary text-xs">1</span>
                Record Balances
              </h4>
              <p className="text-sm text-muted-foreground">Once a month, record the current balance of all your accounts (savings, investments, debts).</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-white flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/20 text-primary text-xs">2</span>
                Automatic Calculation
              </h4>
              <p className="text-sm text-muted-foreground">The app sums your assets and subtracts liabilities to calculate your "Net Worth" for that month.</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-white flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/20 text-primary text-xs">3</span>
                Track Growth
              </h4>
              <p className="text-sm text-muted-foreground">Visualize your progress over time on the chart to see if you're hitting your financial goals.</p>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Metrics Grid */}
      <div className="space-y-4">
        <Button 
          onClick={scrollToSnapshots}
          className="w-full h-14 gap-2 text-lg font-semibold shadow-xl hover-elevate bg-gradient-to-r from-white/5 via-white/10 to-transparent border border-white/10 hover:border-primary/40 text-white transition-all duration-300"
          data-testid="button-add-wealth-snapshot-top"
        >
          <PlusCircle size={22} className="text-primary" />
          Add a wealth snapshot
        </Button>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-4">
            <MetricCard 
              title="Net Worth" 
              value={formatCurrency(currentNetWorth, currency)}
              trend={netWorthTrend}
              trendUp={netWorthChange >= 0}
              icon={<Target size={32} />}
              delay={0}
              tooltip="Total of all your assets minus all your debts. This is your overall financial position."
            />
            <div className="flex flex-col gap-2 px-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="student-loans" 
                  checked={includeStudentLoans}
                  onCheckedChange={(checked) => setIncludeStudentLoans(!!checked)}
                />
                <Label htmlFor="student-loans" className="text-xs text-muted-foreground cursor-pointer">Include Student Loans (-{formatCurrency(studentLoanDebt, currency)})</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="mortgage" 
                  checked={includeMortgage}
                  onCheckedChange={(checked) => setIncludeMortgage(!!checked)}
                />
                <Label htmlFor="mortgage" className="text-xs text-muted-foreground cursor-pointer">Include House Equity (+{formatCurrency(mortgageEquity, currency)})</Label>
              </div>
            </div>
          </div>
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
          <div className="space-y-4">
            <MetricCard 
              title="Savings Rate" 
              value={savingsRate}
              icon={<ArrowUpCircle size={32} />}
              delay={300}
              tooltip="What percentage of your income you save each month. Higher is better for wealth building."
            />
            
            <Collapsible
              open={isCashflowOpen}
              onOpenChange={setIsCashflowOpen}
              className="w-full glass-card rounded-xl border border-white/10"
            >
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between hover:bg-white/5 h-10 px-4">
                  <span className="text-sm font-medium">Cashflow Breakdown</span>
                  {isCashflowOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="p-4 pt-0 space-y-4">
                {/* Income Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Income</span>
                    <span className="font-semibold text-green-400">{formatCurrency(monthlyIncome, currency)}</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>

                {/* Expenses Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Expenses</span>
                    <span className="font-semibold text-red-400">{formatCurrency(monthlyExpenses, currency)}</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-500 rounded-full" 
                      style={{ width: `${Math.min((monthlyExpenses / monthlyIncome) * 100, 100)}%` }} 
                    />
                  </div>
                </div>

                {/* Surplus Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-white font-medium">Net Surplus</span>
                    <span className="font-semibold text-primary">{formatCurrency(monthlySurplus, currency)}</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full" 
                      style={{ width: `${Math.min((monthlySurplus / monthlyIncome) * 100, 100)}%` }} 
                    />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <ChartContainer 
        title="Wealth Trajectory" 
        description="Historical net worth (solid), projected based on surplus (dashed), and actual monthly growth (dotted)."
        className="min-h-[400px]"
        headerActions={
          <div className="flex items-center space-x-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
            <Checkbox 
              id="truncate-y" 
              checked={truncateYAxis}
              onCheckedChange={(checked) => setTruncateYAxis(!!checked)}
            />
            <Label htmlFor="truncate-y" className="text-xs text-muted-foreground cursor-pointer">Truncate Y-Axis</Label>
          </div>
        }
      >
        <ResponsiveContainer width="100%" height={450}>
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
              domain={truncateYAxis ? ['auto', 'auto'] : [0, 'auto']}
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
              name="Historical"
            />
            <Line
              type="monotone"
              dataKey="projectedAmount"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              strokeDasharray="8 4"
              dot={false}
              name="Projected (Planned)"
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="actualAmount"
              stroke="#22c55e"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
              name="Projected (Actual)"
              isAnimationActive={false}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              iconType="circle"
              wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Secondary Row */}
      <div className="grid grid-cols-1 gap-8" ref={snapshotsRef}>
        <ChartContainer title="Net Worth Snapshots">
          <SnapshotManager />
        </ChartContainer>
      </div>
    </div>
  );
}

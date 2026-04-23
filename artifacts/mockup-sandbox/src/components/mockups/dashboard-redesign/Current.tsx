import "./_group.css";
import { useState, useRef } from "react";
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ComposedChart, Legend,
} from "recharts";
import {
  TrendingUp, DollarSign, Target, ArrowUpCircle, ArrowUpRight, ArrowDownRight,
  ChevronDown, ChevronUp, PlusCircle, Info, Trash2, Plus, Save, X, ArrowUpDown,
} from "lucide-react";
import {
  fmt, fmtCompact, snapshots as mockSnapshots, categories as mockCategories,
  categoryHistory, projection, netWorth, netWorthChange, netWorthChangePct,
  monthlyIncome, monthlyExpenses, monthlySurplus, savingsRate,
  studentLoanDebt, mortgageEquity, pensionValue, currencySymbol,
  type Category as MockCategory,
} from "./_mockData";

/* ============================================================
   Inlined extracted components (faithful copies of the live app)
   ============================================================ */

type MetricCardProps = {
  title: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  icon?: React.ReactNode;
  className?: string;
  delay?: number;
  tooltip?: string;
};

function MetricCard({
  title, value, trend, trendUp, icon, className = "", delay = 0, tooltip,
}: MetricCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  return (
    <div
      className={`glass-card p-6 rounded-2xl relative overflow-hidden group transition-all duration-300 hover:border-primary/30 hover:shadow-primary/5 ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-primary">
        {icon || <TrendingUp size={48} />}
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-muted-foreground text-sm font-medium uppercase tracking-wider">{title}</h3>
          {tooltip && (
            <button
              onClick={() => setShowTooltip(!showTooltip)}
              className="text-muted-foreground hover:text-primary cursor-help transition-colors flex-shrink-0"
              aria-label={`Toggle ${title} info`}
            >
              {showTooltip ? <ChevronUp size={14} /> : <Info size={14} />}
            </button>
          )}
        </div>
        {tooltip && showTooltip && (
          <p className="text-xs text-muted-foreground mb-3 p-2 bg-white/5 rounded border border-white/10">
            {tooltip}
          </p>
        )}
        <div className="flex items-baseline gap-2">
          <span className="text-3xl md:text-4xl font-bold font-display text-foreground tracking-tight">
            {value}
          </span>
          {trend && (
            <div
              className={`flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border ${
                trendUp
                  ? "bg-green-500/10 text-green-400 border-green-500/20"
                  : "bg-red-500/10 text-red-400 border-red-500/20"
              }`}
            >
              {trendUp ? <ArrowUpRight size={12} className="mr-1" /> : <ArrowDownRight size={12} className="mr-1" />}
              {trend}
            </div>
          )}
        </div>
      </div>
      <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-primary/20 blur-3xl rounded-full group-hover:bg-primary/30 transition-colors" />
    </div>
  );
}

type ChartContainerProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  headerActions?: React.ReactNode;
};

function ChartContainer({ title, description, children, className = "", headerActions }: ChartContainerProps) {
  return (
    <div className={`glass-card rounded-2xl p-6 flex flex-col h-full ${className}`}>
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-lg font-semibold text-foreground">{title}</h3>
          {description && <Info size={14} className="text-muted-foreground" />}
        </div>
        {headerActions && <div>{headerActions}</div>}
      </div>
      <div className="flex-1 w-full min-h-[250px] relative">{children}</div>
    </div>
  );
}

const CATEGORY_TREND_COLORS = [
  "hsl(217, 91%, 60%)", "hsl(142, 71%, 45%)", "hsl(280, 87%, 65%)", "hsl(36, 100%, 50%)",
  "hsl(0, 84%, 60%)",   "hsl(180, 70%, 45%)", "hsl(330, 80%, 60%)", "hsl(60, 70%, 50%)",
  "hsl(200, 80%, 50%)", "hsl(120, 60%, 40%)",
];

type CategoryTrendDatum = { label: string } & Record<`cat_${number}`, number>;

function CategoryTrendChart({ categories }: { categories: MockCategory[] }) {
  const [truncateYAxis, setTruncateYAxis] = useState(true);
  const [visibleCategories, setVisibleCategories] = useState<Set<number>>(
    () => new Set(categories.slice(0, 3).map((c) => c.id))
  );

  const toggleCategory = (id: number) => {
    setVisibleCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const chartData: CategoryTrendDatum[] = mockSnapshots.map((s, i) => {
    const row = { label: s.label } as CategoryTrendDatum;
    for (const c of categories) {
      row[`cat_${c.id}`] = categoryHistory[c.id]?.[i] ?? 0;
    }
    return row;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center space-x-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
          <input
            type="checkbox"
            checked={truncateYAxis}
            onChange={(e) => setTruncateYAxis(e.target.checked)}
            className="accent-primary"
          />
          <label className="text-xs text-muted-foreground cursor-pointer">Truncate Y-Axis</label>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 pb-2">
        {categories.map((c, i) => {
          const active = visibleCategories.has(c.id);
          return (
            <button
              key={c.id}
              onClick={() => toggleCategory(c.id)}
              className={`flex items-center gap-2 rounded-md border border-border bg-card/40 px-3 py-1.5 text-sm ${active ? "" : "opacity-50"}`}
            >
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: CATEGORY_TREND_COLORS[i % CATEGORY_TREND_COLORS.length] }} />
              {c.name}
            </button>
          );
        })}
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="label" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis
            stroke="rgba(255,255,255,0.3)" fontSize={12}
            tickFormatter={(v: number) => `${currencySymbol}${(v / 1000).toFixed(0)}k`}
            tickLine={false} axisLine={false}
            domain={truncateYAxis ? ["auto", "auto"] : [0, "auto"]}
          />
          <Tooltip
            contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "12px" }}
            itemStyle={{ color: "white" }}
          />
          {categories.map((c, i) =>
            visibleCategories.has(c.id) ? (
              <Line
                key={c.id}
                type="monotone"
                dataKey={`cat_${c.id}`}
                stroke={CATEGORY_TREND_COLORS[i % CATEGORY_TREND_COLORS.length]}
                strokeWidth={2}
                dot={{ r: 4, fill: CATEGORY_TREND_COLORS[i % CATEGORY_TREND_COLORS.length] }}
                activeDot={{ r: 6 }}
                name={c.name}
              />
            ) : null
          )}
          <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ paddingTop: "20px", fontSize: "12px" }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function SnapshotManagerStub() {
  const recent = [...mockSnapshots].slice(-6).reverse();
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button className="flex items-center gap-2 rounded-md border border-border bg-card/40 px-3 py-1.5 text-sm text-muted-foreground">
          <ArrowUpDown size={14} /> Sort by date
        </button>
        <button className="flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground">
          <Plus size={14} /> Add snapshot
        </button>
      </div>
      <div className="overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-2 text-left">Month</th>
              <th className="px-4 py-2 text-right">Net Worth</th>
              <th className="px-4 py-2 text-right">Change</th>
              <th className="px-4 py-2 text-right w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((s, i) => {
              const prev = recent[i + 1];
              const delta = prev ? s.total - prev.total : 0;
              return (
                <tr key={s.date} className="border-t border-white/5">
                  <td className="px-4 py-3 text-foreground">{s.label}</td>
                  <td className="px-4 py-3 text-right font-medium text-foreground">{fmt(s.total)}</td>
                  <td className={`px-4 py-3 text-right ${delta >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {delta >= 0 ? "+" : ""}{fmt(delta)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2 text-muted-foreground">
                      <button className="hover:text-primary"><Save size={14} /></button>
                      <button className="hover:text-primary"><X size={14} /></button>
                      <button className="hover:text-red-400"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================================================
   The extracted Dashboard — verbatim structure from the live app
   with hooks replaced by mock data.
   ============================================================ */

export function Current() {
  const [includeStudentLoans, setIncludeStudentLoans] = useState(false);
  const [includeMortgage, setIncludeMortgage] = useState(false);
  const [includePension, setIncludePension] = useState(false);
  const [truncateYAxis, setTruncateYAxis] = useState(true);
  const [isCashflowOpen, setIsCashflowOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const snapshotsRef = useRef<HTMLDivElement>(null);

  // Adjusted net worth (mirrors the live calc)
  let adjustedNetWorth = netWorth;
  if (includeStudentLoans) adjustedNetWorth -= studentLoanDebt;
  if (includeMortgage) adjustedNetWorth += mortgageEquity;
  if (includePension) adjustedNetWorth += pensionValue;

  const proj = projection(24);
  const trajectoryData = [
    ...mockSnapshots.map((s) => ({ label: s.label, amount: s.total })),
    ...proj.map((p) => ({ label: p.label, projectedAmount: p.planned, actualAmount: p.actual })),
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      {/* Background gradients (from Layout.tsx) */}
      <div className="fixed top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none -z-10" />
      <div className="fixed top-[-20%] right-[-10%] w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="fixed bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto p-4 md:p-8 pb-24 lg:pb-8">
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h2 className="text-3xl font-display font-bold text-foreground">Dashboard</h2>
            <p className="text-muted-foreground mt-1">Your financial health at a glance</p>
          </div>

          {/* Info Section */}
          <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
            <button
              onClick={() => setInfoOpen(!infoOpen)}
              className="w-full flex items-center justify-between p-6 hover:bg-white/5 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary"><TrendingUp size={20} /></div>
                <div>
                  <h3 className="font-display font-semibold text-lg text-foreground">How wealth snapshots work</h3>
                  <p className="text-sm text-muted-foreground">Learn how to track your progress effectively</p>
                </div>
              </div>
              {infoOpen ? <ChevronUp size={20} className="text-muted-foreground" /> : <ChevronDown size={20} className="text-muted-foreground" />}
            </button>
            {infoOpen && (
              <div className="px-6 pb-6 pt-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  ["1", "Record Balances", "Once a month, record the current balance of all your accounts."],
                  ["2", "Automatic Calculation", "The app sums your assets and subtracts liabilities."],
                  ["3", "Track Growth", "Visualize your progress over time on the chart."],
                ].map(([n, title, body]) => (
                  <div key={n} className="space-y-2">
                    <h4 className="font-medium text-foreground flex items-center gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/20 text-primary text-xs">{n}</span>
                      {title}
                    </h4>
                    <p className="text-sm text-muted-foreground">{body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Metrics Grid */}
          <div className="space-y-4">
            <button
              onClick={() => snapshotsRef.current?.scrollIntoView({ behavior: "smooth" })}
              className="w-full h-14 inline-flex items-center justify-center gap-2 rounded-xl text-lg font-semibold shadow-xl bg-gradient-to-r from-white/5 via-white/10 to-transparent border border-white/10 hover:border-primary/40 text-foreground transition-all duration-300"
            >
              <PlusCircle size={22} className="text-primary" />
              Add a wealth snapshot
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-4">
                <MetricCard
                  title="Net Worth"
                  value={fmt(adjustedNetWorth)}
                  trend={`${netWorthChangePct >= 0 ? "+" : ""}${netWorthChangePct.toFixed(1)}%`}
                  trendUp={netWorthChange >= 0}
                  icon={<Target size={32} />}
                  delay={0}
                  tooltip="Total of all your assets minus all your debts."
                />
                <div className="flex flex-col gap-2 px-2">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                    <input type="checkbox" checked={includeStudentLoans} onChange={(e) => setIncludeStudentLoans(e.target.checked)} className="accent-primary" />
                    Include Student Loans (-{fmt(studentLoanDebt)})
                  </label>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                    <input type="checkbox" checked={includeMortgage} onChange={(e) => setIncludeMortgage(e.target.checked)} className="accent-primary" />
                    Include House Equity (+{fmt(mortgageEquity)})
                  </label>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                    <input type="checkbox" checked={includePension} onChange={(e) => setIncludePension(e.target.checked)} className="accent-primary" />
                    Include Pension (+{fmt(pensionValue)})
                  </label>
                </div>
              </div>
              <MetricCard
                title="Monthly Surplus"
                value={fmt(monthlySurplus)}
                trend="Estimated"
                trendUp={monthlySurplus > 0}
                icon={<TrendingUp size={32} />}
                delay={100}
                tooltip="Monthly income minus monthly expenses."
              />
              <MetricCard
                title="Monthly Income"
                value={fmt(monthlyIncome)}
                icon={<DollarSign size={32} />}
                delay={200}
                tooltip="Sum of all your recurring monthly income sources."
              />
              <div className="space-y-4">
                <MetricCard
                  title="Savings Rate"
                  value={`${Math.round(savingsRate)}%`}
                  icon={<ArrowUpCircle size={32} />}
                  delay={300}
                  tooltip="What percentage of your income you save each month."
                />
                <div className="w-full glass-card rounded-xl border border-white/10">
                  <button
                    onClick={() => setIsCashflowOpen(!isCashflowOpen)}
                    className="w-full flex items-center justify-between hover:bg-white/5 h-10 px-4 text-foreground"
                  >
                    <span className="text-sm font-medium">Cashflow Breakdown</span>
                    {isCashflowOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {isCashflowOpen && (
                    <div className="p-4 pt-0 space-y-4">
                      {([
                        ["Income", monthlyIncome, "text-green-400", "bg-green-500", 100],
                        ["Expenses", monthlyExpenses, "text-red-400", "bg-red-500", Math.min((monthlyExpenses / monthlyIncome) * 100, 100)],
                        ["Net Surplus", monthlySurplus, "text-primary", "bg-primary", Math.min((monthlySurplus / monthlyIncome) * 100, 100)],
                      ] as const).map(([label, value, textCls, barCls, pct]) => (
                        <div key={label} className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">{label}</span>
                            <span className={`font-semibold ${textCls}`}>{fmt(value)}</span>
                          </div>
                          <div className="h-3 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full ${barCls} rounded-full`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Wealth Trajectory Chart */}
          <ChartContainer
            title="Wealth Trajectory"
            description="Historical net worth, projected based on surplus, and actual monthly growth."
            className="min-h-[400px]"
            headerActions={
              <div className="flex items-center space-x-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                <input
                  type="checkbox"
                  checked={truncateYAxis}
                  onChange={(e) => setTruncateYAxis(e.target.checked)}
                  className="accent-primary"
                />
                <label className="text-xs text-muted-foreground cursor-pointer">Truncate Y-Axis</label>
              </div>
            }
          >
            <ResponsiveContainer width="100%" height={450}>
              <ComposedChart data={trajectoryData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                <defs>
                  <linearGradient id="curColorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="label" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="rgba(255,255,255,0.3)" fontSize={12}
                  tickFormatter={(v: number) => fmtCompact(v)}
                  tickLine={false} axisLine={false}
                  domain={truncateYAxis ? ["auto", "auto"] : [0, "auto"]}
                />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "12px" }} itemStyle={{ color: "white" }} />
                <Area type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#curColorValue)" name="Historical" />
                <Line type="monotone" dataKey="projectedAmount" stroke="hsl(var(--primary))" strokeWidth={2} strokeDasharray="8 4" dot={false} name="Projected (Planned)" />
                <Line type="monotone" dataKey="actualAmount" stroke="#22c55e" strokeWidth={2} strokeDasharray="4 4" dot={false} name="Projected (Actual)" />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ paddingTop: "20px", fontSize: "12px" }} />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartContainer>

          {/* Category Trends Chart */}
          <ChartContainer title="Category Trends" description="Compare how individual asset categories grow over time.">
            <CategoryTrendChart categories={mockCategories} />
          </ChartContainer>

          {/* Snapshots */}
          <div className="grid grid-cols-1 gap-8" ref={snapshotsRef}>
            <ChartContainer title="Net Worth Snapshots">
              <SnapshotManagerStub />
            </ChartContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

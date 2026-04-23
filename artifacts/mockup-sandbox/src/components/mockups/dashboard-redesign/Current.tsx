import "./_group.css";
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ComposedChart, Legend,
} from "recharts";
import {
  TrendingUp, DollarSign, Target, ArrowUpCircle, ArrowUpRight, ArrowDownRight,
  ChevronDown, PlusCircle, Info,
} from "lucide-react";
import {
  fmt, fmtCompact, snapshots, categories, categoryHistory, projection,
  netWorth, netWorthChange, netWorthChangePct, monthlyIncome, monthlyExpenses,
  monthlySurplus, savingsRate, studentLoanDebt, mortgageEquity, pensionValue,
} from "./_mockData";

function Metric({
  title, value, trend, trendUp, icon, tooltip,
}: { title: string; value: string; trend?: string; trendUp?: boolean; icon: React.ReactNode; tooltip?: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-xl shadow-xl">
      <div className="absolute right-4 top-4 text-primary opacity-10">{icon}</div>
      <div className="relative z-10">
        <div className="mb-1 flex items-center gap-2">
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</h3>
          {tooltip && <Info size={12} className="text-muted-foreground" />}
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-display text-3xl font-bold tracking-tight text-foreground">{value}</span>
          {trend && (
            <div
              className={`flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${
                trendUp ? "border-green-500/20 bg-green-500/10 text-green-500" : "border-red-500/20 bg-red-500/10 text-red-500"
              }`}
            >
              {trendUp ? <ArrowUpRight size={12} className="mr-1" /> : <ArrowDownRight size={12} className="mr-1" />}
              {trend}
            </div>
          )}
        </div>
      </div>
      <div className="absolute -bottom-10 -right-10 h-24 w-24 rounded-full bg-primary/20 blur-3xl" />
    </div>
  );
}

export function Current() {
  const proj = projection(24);
  const trajectoryData = [
    ...snapshots.map(s => ({ label: s.label, amount: s.total })),
    ...proj.map(p => ({ label: p.label, projectedAmount: p.planned, actualAmount: p.actual })),
  ];

  const visibleCats = [1, 2, 4];
  const trendData = snapshots.map((s, i) => {
    const row: Record<string, any> = { label: s.label };
    for (const id of visibleCats) row[`cat_${id}`] = categoryHistory[id][i];
    return row;
  });

  return (
    <div className="min-h-screen bg-background p-8 font-body text-foreground">
      <div className="mx-auto max-w-7xl space-y-8">
        <div>
          <h2 className="font-display text-3xl font-bold text-foreground">Dashboard</h2>
          <p className="mt-1 text-muted-foreground">Your financial health at a glance</p>
        </div>

        <div className="rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2 text-primary"><TrendingUp size={20} /></div>
              <div>
                <h3 className="font-display text-lg font-semibold">How wealth snapshots work</h3>
                <p className="text-sm text-muted-foreground">Learn how to track your progress effectively</p>
              </div>
            </div>
            <ChevronDown size={20} className="text-muted-foreground" />
          </div>
        </div>

        <div className="space-y-4">
          <button
            className="flex h-14 w-full items-center justify-center gap-2 rounded-xl border border-border bg-gradient-to-r from-card/60 via-card/80 to-transparent text-lg font-semibold text-foreground shadow-xl"
          >
            <PlusCircle size={22} className="text-primary" /> Add a wealth snapshot
          </button>

          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-4">
              <Metric
                title="Net Worth"
                value={fmt(netWorth)}
                trend={`${netWorthChangePct >= 0 ? "+" : ""}${netWorthChangePct.toFixed(1)}%`}
                trendUp={netWorthChange >= 0}
                icon={<Target size={32} />}
                tooltip="x"
              />
              <div className="space-y-2 px-2 text-xs text-muted-foreground">
                <label className="flex items-center gap-2"><input type="checkbox" /> Include Student Loans (-{fmt(studentLoanDebt)})</label>
                <label className="flex items-center gap-2"><input type="checkbox" /> Include House Equity (+{fmt(mortgageEquity)})</label>
                <label className="flex items-center gap-2"><input type="checkbox" /> Include Pension (+{fmt(pensionValue)})</label>
              </div>
            </div>
            <Metric title="Monthly Surplus" value={fmt(monthlySurplus)} trend="Estimated" trendUp icon={<TrendingUp size={32} />} tooltip="x" />
            <Metric title="Monthly Income" value={fmt(monthlyIncome)} icon={<DollarSign size={32} />} tooltip="x" />
            <div className="space-y-4">
              <Metric title="Savings Rate" value={`${Math.round(savingsRate)}%`} icon={<ArrowUpCircle size={32} />} tooltip="x" />
              <div className="rounded-xl border border-border bg-card/60 px-4 py-2.5 text-sm font-medium backdrop-blur-xl flex items-center justify-between">
                <span>Cashflow Breakdown</span><ChevronDown size={16} />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-xl shadow-xl">
          <div className="mb-6 flex items-start justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-display text-lg font-semibold">Wealth Trajectory</h3>
              <Info size={14} className="text-muted-foreground" />
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card/40 px-3 py-1.5 text-xs text-muted-foreground">
              <input type="checkbox" defaultChecked /> Truncate Y-Axis
            </div>
          </div>
          <ResponsiveContainer width="100%" height={380}>
            <ComposedChart data={trajectoryData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
              <defs>
                <linearGradient id="curColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => fmtCompact(v)} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "12px" }} />
              <Area type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#curColor)" name="Historical" />
              <Line type="monotone" dataKey="projectedAmount" stroke="hsl(var(--primary))" strokeWidth={2} strokeDasharray="8 4" dot={false} name="Projected (Planned)" />
              <Line type="monotone" dataKey="actualAmount" stroke="#22c55e" strokeWidth={2} strokeDasharray="4 4" dot={false} name="Projected (Actual)" />
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ paddingTop: "20px", fontSize: "12px" }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-xl shadow-xl">
          <div className="mb-4 flex items-center gap-2">
            <h3 className="font-display text-lg font-semibold">Category Trends</h3>
            <Info size={14} className="text-muted-foreground" />
          </div>
          <div className="mb-3 flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c.id}
                className={`flex items-center gap-2 rounded-md border border-border px-3 py-1 text-xs ${
                  visibleCats.includes(c.id) ? "bg-card text-foreground" : "bg-card/30 text-muted-foreground opacity-50"
                }`}
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} /> {c.name}
              </button>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => fmtCompact(v)} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "12px" }} />
              {visibleCats.map((id) => {
                const cat = categories.find((c) => c.id === id)!;
                return <Line key={id} type="monotone" dataKey={`cat_${id}`} stroke={cat.color} strokeWidth={2} dot={{ r: 3 }} name={cat.name} />;
              })}
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ paddingTop: "20px", fontSize: "12px" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

import { useState, useMemo, useRef } from "react";
import {
  useSnapshots, useCashflows, useSettings, useStudentLoans,
  useMortgages, usePensions, useCategories,
} from "@/hooks/use-finance";
import { SnapshotManager } from "@/components/SnapshotManager";
import { formatCurrency } from "@/lib/currency";
import {
  AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid, Line, ComposedChart,
} from "recharts";
import { format, addMonths, parseISO } from "date-fns";
import {
  Loader2, ChevronDown, ChevronRight, Check, PlusCircle,
} from "lucide-react";

const ACCENT = "hsl(var(--chart-accent))";
const POSITIVE = "hsl(var(--chart-positive))";
const NEGATIVE = "hsl(var(--chart-negative))";

function CalmToggle({
  checked, onChange, label, testId,
}: { checked: boolean; onChange: (v: boolean) => void; label: string; testId: string }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors group"
      data-testid={testId}
    >
      <span
        className={
          "inline-flex h-4 w-4 items-center justify-center rounded-[4px] border transition-colors " +
          (checked
            ? "border-foreground bg-foreground text-background"
            : "border-muted-foreground/60 bg-transparent group-hover:border-foreground")
        }
      >
        {checked && <Check size={11} strokeWidth={3} />}
      </span>
      <span>{label}</span>
    </button>
  );
}

export default function Dashboard() {
  const { data: snapshots, isLoading: loadingSnapshots } = useSnapshots();
  const { data: cashflows, isLoading: loadingCashflows } = useCashflows();
  const { data: studentLoans, isLoading: loadingStudentLoans } = useStudentLoans();
  const { data: mortgages, isLoading: loadingMortgages } = useMortgages();
  const { data: pensions, isLoading: loadingPensions } = usePensions();
  const { data: categories, isLoading: loadingCategories } = useCategories();
  const { data: settings } = useSettings();
  const currency = settings?.currency || "USD";

  const [includeStudentLoans, setIncludeStudentLoans] = useState(false);
  const [includeMortgage, setIncludeMortgage] = useState(false);
  const [includePension, setIncludePension] = useState(false);
  const [breakdownOpen, setBreakdownOpen] = useState(true);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [showProjection, setShowProjection] = useState(true);
  const snapshotsRef = useRef<HTMLDivElement>(null);

  const isLoading = loadingSnapshots || loadingCashflows || loadingStudentLoans
    || loadingMortgages || loadingPensions || loadingCategories;

  const sortedSnapshots = useMemo(
    () => [...(snapshots || [])].sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime()),
    [snapshots]
  );

  const studentLoanDebt = studentLoans?.reduce((s, l) => s + Number(l.loanAmount), 0) || 0;
  const mortgageEquity = mortgages?.reduce((s, m) => s + (Number(m.propertyValue) - Number(m.loanAmount)), 0) || 0;
  const pension = pensions?.[0];
  const pensionValue = pension ? Number(pension.currentPotValue) : 0;
  const pensionIncludedInNetWorth = pension?.includeInNetWorth === 1;

  const adjust = (base: number) => {
    let v = base;
    if (includeStudentLoans) v -= studentLoanDebt;
    if (includeMortgage) v += mortgageEquity;
    if (includePension || pensionIncludedInNetWorth) v += pensionValue;
    return v;
  };

  const currentSnapshot = sortedSnapshots[sortedSnapshots.length - 1];
  const previousSnapshot = sortedSnapshots[sortedSnapshots.length - 2];
  const currentNetWorth = adjust(Number(currentSnapshot?.totalNetWorth || 0));
  const prevNetWorth = adjust(Number(previousSnapshot?.totalNetWorth || 0));
  const netWorthChange = currentNetWorth - prevNetWorth;
  const netWorthChangePct = prevNetWorth !== 0 ? (netWorthChange / prevNetWorth) * 100 : 0;

  const monthlyIncome = cashflows?.filter(c => c.type === "income").reduce((s, c) => s + Number(c.amount), 0) || 0;
  const monthlyExpenses = cashflows?.filter(c => c.type === "expense").reduce((s, c) => s + Number(c.amount), 0) || 0;
  const monthlySurplus = monthlyIncome - monthlyExpenses;
  const savingsRate = monthlyIncome > 0 ? (monthlySurplus / monthlyIncome) * 100 : 0;

  // Chart data: historical + (optional) projections (calm dashed lines).
  const historicalSeries = sortedSnapshots.map(s => ({
    date: s.month,
    label: format(parseISO(s.month), "MMM yy"),
    amount: adjust(Number(s.totalNetWorth)),
  }));

  const actualMonthlySurplus = historicalSeries.length > 1
    ? historicalSeries.slice(1).reduce((sum, curr, i) => sum + (curr.amount - historicalSeries[i].amount), 0)
      / (historicalSeries.length - 1)
    : 0;

  const projectionSeries = currentSnapshot
    ? Array.from({ length: 12 }).map((_, i) => {
        const date = addMonths(parseISO(currentSnapshot.month), i + 1);
        return {
          date: format(date, "yyyy-MM-dd"),
          label: format(date, "MMM yy"),
          projectedAmount: currentNetWorth + (monthlySurplus * (i + 1)),
          actualAmount: currentNetWorth + (actualMonthlySurplus * (i + 1)),
        };
      })
    : [];

  const chartData = showProjection
    ? [...historicalSeries, ...projectionSeries]
    : historicalSeries;

  // Latest balances by category for the breakdown.
  const latestBalances = new Map<number, number>();
  if (currentSnapshot) {
    for (const d of currentSnapshot.details) {
      latestBalances.set(d.categoryId, Number(d.balance));
    }
  }
  const breakdownItems = (categories || [])
    .map(c => ({ ...c, value: latestBalances.get(c.id) ?? 0 }))
    .filter(c => c.value !== 0)
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  const breakdownScale = Math.max(1, ...breakdownItems.map(c => Math.abs(c.value)));

  const recentSnapshots = [...sortedSnapshots].reverse().slice(0, 6);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px]">
        <Loader2 className="animate-spin text-primary w-12 h-12" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-12 animate-in fade-in duration-700">
      {/* Header */}
      <header>
        <h2 className="font-serif text-3xl font-light tracking-tight text-foreground">Dashboard</h2>
        <p className="text-sm text-muted-foreground mt-1">Your financial health at a glance</p>
      </header>

      {/* Hero Card */}
      <section className="rounded-3xl border border-border bg-card/60 backdrop-blur-xl p-8 lg:p-12 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.4)]">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
          <div>
            <h3 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-4">
              Total Net Worth
            </h3>
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
              <span
                className="font-serif text-6xl lg:text-7xl font-light tracking-tight text-foreground tabular-nums"
                data-testid="text-net-worth"
              >
                {formatCurrency(currentNetWorth, currency)}
              </span>
              {previousSnapshot && (
                <div className="flex items-center gap-2">
                  <span
                    className="text-lg font-medium tracking-tight tabular-nums"
                    style={{ color: netWorthChange >= 0 ? POSITIVE : NEGATIVE }}
                    data-testid="text-net-worth-change"
                  >
                    {netWorthChange >= 0 ? "+" : ""}{formatCurrency(netWorthChange, currency)}
                  </span>
                  <span className="rounded-full bg-muted/60 px-2.5 py-1 text-xs font-medium text-muted-foreground tabular-nums">
                    {netWorthChangePct >= 0 ? "+" : ""}{netWorthChangePct.toFixed(1)}% past month
                  </span>
                </div>
              )}
            </div>

            {/* Subtle include toggles */}
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
              {studentLoanDebt > 0 && (
                <CalmToggle
                  checked={includeStudentLoans}
                  onChange={setIncludeStudentLoans}
                  label={`Include student loans (−${formatCurrency(studentLoanDebt, currency)})`}
                  testId="checkbox-include-student-loans"
                />
              )}
              {mortgageEquity !== 0 && (
                <CalmToggle
                  checked={includeMortgage}
                  onChange={setIncludeMortgage}
                  label={`Include house equity (+${formatCurrency(mortgageEquity, currency)})`}
                  testId="checkbox-include-mortgage"
                />
              )}
              {pensionValue > 0 && !pensionIncludedInNetWorth && (
                <CalmToggle
                  checked={includePension}
                  onChange={setIncludePension}
                  label={`Include pension (+${formatCurrency(pensionValue, currency)})`}
                  testId="checkbox-include-pension"
                />
              )}
              {pensionIncludedInNetWorth && pensionValue > 0 && (
                <span className="text-foreground/80">Pension included (+{formatCurrency(pensionValue, currency)})</span>
              )}
            </div>
          </div>

          {/* Savings Rate Arc */}
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Savings Rate</span>
              <span className="font-serif text-2xl font-light tabular-nums text-foreground" data-testid="text-savings-rate">
                {Math.round(savingsRate)}%
              </span>
            </div>
            <div className="relative h-14 w-14">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none" strokeWidth="3" stroke="hsl(var(--muted))"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none" strokeWidth="3" strokeLinecap="round"
                  stroke={ACCENT}
                  strokeDasharray={`${Math.max(0, Math.min(100, savingsRate))}, 100`}
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Trajectory Chart */}
        <div className="h-[300px] w-full -mx-2">
          {historicalSeries.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Add a wealth snapshot to see your trajectory.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="calmAreaFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={ACCENT} stopOpacity={0.18} />
                    <stop offset="95%" stopColor={ACCENT} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis
                  dataKey="label"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={12}
                  minTickGap={30}
                />
                <Tooltip
                  cursor={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1, strokeDasharray: "4 4" }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const p = payload[0].payload;
                    return (
                      <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
                        <p className="text-xs text-muted-foreground mb-1">{p.label}</p>
                        {payload.map((item) => (
                          <p key={item.dataKey as string} className="font-mono text-sm font-medium text-foreground tabular-nums">
                            {formatCurrency(Number(item.value), currency)}
                            <span className="ml-2 text-xs text-muted-foreground">
                              {item.dataKey === "amount" ? "actual"
                                : item.dataKey === "projectedAmount" ? "planned"
                                : "trend"}
                            </span>
                          </p>
                        ))}
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke={ACCENT}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#calmAreaFill)"
                  activeDot={{ r: 4, fill: ACCENT, stroke: "hsl(var(--card))", strokeWidth: 2 }}
                  isAnimationActive={false}
                  connectNulls
                />
                {showProjection && (
                  <>
                    <Line
                      type="monotone"
                      dataKey="projectedAmount"
                      stroke="hsl(var(--muted-foreground))"
                      strokeWidth={1.5}
                      strokeDasharray="6 4"
                      dot={false}
                      isAnimationActive={false}
                      connectNulls
                    />
                    <Line
                      type="monotone"
                      dataKey="actualAmount"
                      stroke={POSITIVE}
                      strokeWidth={1.5}
                      strokeDasharray="3 4"
                      dot={false}
                      isAnimationActive={false}
                      connectNulls
                    />
                  </>
                )}
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Tiny chart legend / projection toggle */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-0.5 w-6 rounded" style={{ backgroundColor: ACCENT }} />
            Historical
          </span>
          {showProjection && projectionSeries.length > 0 && (
            <>
              <span className="inline-flex items-center gap-2">
                <span className="inline-block h-px w-6 border-t border-dashed border-muted-foreground" />
                Planned (from cashflows)
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="inline-block h-px w-6 border-t border-dashed" style={{ borderColor: POSITIVE }} />
                Trend (past growth)
              </span>
            </>
          )}
          <button
            onClick={() => setShowProjection(v => !v)}
            className="ml-auto underline decoration-border underline-offset-4 hover:text-foreground transition-colors"
            data-testid="button-toggle-projection"
          >
            {showProjection ? "Hide projection" : "Show projection"}
          </button>
        </div>
      </section>

      {/* Add snapshot button */}
      <button
        onClick={() => snapshotsRef.current?.scrollIntoView({ behavior: "smooth" })}
        className="w-full rounded-2xl border border-border bg-card/40 hover:bg-card/70 hover:border-foreground/20 transition-all duration-300 py-4 px-6 text-sm font-medium text-foreground inline-flex items-center justify-center gap-2"
        data-testid="button-add-wealth-snapshot-top"
      >
        <PlusCircle size={18} className="text-muted-foreground" />
        Add a wealth snapshot
      </button>

      {/* This Month Strip */}
      <section className="grid grid-cols-3 gap-3 sm:gap-6 border-y border-border py-8 text-center sm:text-left">
        <div>
          <p className="text-[10px] sm:text-xs font-medium uppercase tracking-widest text-muted-foreground mb-2">Income</p>
          <p className="font-mono text-base sm:text-xl tabular-nums text-foreground break-words" data-testid="text-monthly-income">
            {formatCurrency(monthlyIncome, currency)}
          </p>
        </div>
        <div>
          <p className="text-[10px] sm:text-xs font-medium uppercase tracking-widest text-muted-foreground mb-2">Expenses</p>
          <p className="font-mono text-base sm:text-xl tabular-nums text-foreground break-words" data-testid="text-monthly-expenses">
            {formatCurrency(monthlyExpenses, currency)}
          </p>
        </div>
        <div>
          <p className="text-[10px] sm:text-xs font-medium uppercase tracking-widest text-muted-foreground mb-2">Surplus</p>
          <p
            className="font-mono text-base sm:text-xl tabular-nums break-words"
            style={{ color: monthlySurplus >= 0 ? POSITIVE : NEGATIVE }}
            data-testid="text-monthly-surplus"
          >
            {formatCurrency(monthlySurplus, currency)}
          </p>
        </div>
      </section>

      {/* Breakdown & Recent Snapshots */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-4">
        <section>
          <button
            onClick={() => setBreakdownOpen(!breakdownOpen)}
            className="flex items-center gap-2 w-full text-left focus:outline-none group mb-6"
            data-testid="button-toggle-breakdown"
          >
            <h3 className="font-serif text-2xl font-light text-foreground group-hover:text-muted-foreground transition-colors">
              Breakdown
            </h3>
            {breakdownOpen
              ? <ChevronDown className="h-5 w-5 text-muted-foreground" />
              : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
          </button>

          {breakdownOpen && (
            <div className="space-y-4">
              {breakdownItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">No category balances in your latest snapshot yet.</p>
              ) : breakdownItems.map((c) => {
                const pct = (Math.abs(c.value) / breakdownScale) * 100;
                const isNeg = c.value < 0;
                return (
                  <div key={c.id} className="group" data-testid={`row-breakdown-${c.id}`}>
                    <div className="flex items-baseline justify-between text-sm py-2">
                      <span className="text-muted-foreground font-medium">{c.name}</span>
                      <span className="font-mono tabular-nums text-foreground">
                        {isNeg && "−"}{formatCurrency(Math.abs(c.value), currency)}
                      </span>
                    </div>
                    <div className="h-1 w-full bg-muted/60 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: isNeg ? NEGATIVE : "hsl(var(--foreground))",
                          opacity: isNeg ? 0.5 : 0.35,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section>
          <h3 className="font-serif text-2xl font-light text-foreground mb-6">Recent Snapshots</h3>
          {recentSnapshots.length === 0 ? (
            <p className="text-sm text-muted-foreground">No snapshots recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {recentSnapshots.map((s, i) => (
                <div
                  key={s.id}
                  className="flex items-baseline justify-between py-2 border-b border-border/50 last:border-0"
                  data-testid={`row-recent-snapshot-${s.id}`}
                >
                  <div className="flex items-center gap-3">
                    {i === 0 && <Check className="h-4 w-4" style={{ color: POSITIVE }} />}
                    <span className={`text-sm ${i === 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                      {format(parseISO(s.month), "MMM yy")}
                    </span>
                  </div>
                  <span className={`font-mono text-sm tabular-nums ${i === 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                    {formatCurrency(adjust(Number(s.totalNetWorth)), currency)}
                  </span>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => {
              setShowAllHistory(true);
              setTimeout(() => snapshotsRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
            }}
            className="mt-6 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors underline decoration-border underline-offset-4"
            data-testid="button-view-all-history"
          >
            {showAllHistory ? "Manage all snapshots below" : "View all history"}
          </button>
        </section>
      </div>

      {/* Snapshot Manager (collapsed by default) */}
      <div ref={snapshotsRef}>
        {showAllHistory && (
          <section className="rounded-3xl border border-border bg-card/40 p-6 lg:p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-2xl font-light text-foreground">All Snapshots</h3>
              <button
                onClick={() => setShowAllHistory(false)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                data-testid="button-hide-all-history"
              >
                Hide
              </button>
            </div>
            <SnapshotManager />
          </section>
        )}
        {!showAllHistory && (
          <section className="rounded-3xl border border-border bg-card/40 p-6 lg:p-8">
            <h3 className="font-serif text-2xl font-light text-foreground mb-2">Add a snapshot</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Record this month's balances to keep your trajectory current.
            </p>
            <SnapshotManager />
          </section>
        )}
      </div>
    </div>
  );
}

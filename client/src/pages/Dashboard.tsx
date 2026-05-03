import { useState, useMemo, useRef } from "react";
import {
  useSnapshots, useCashflows, useSettings, useStudentLoans,
  useMortgages, usePensions, useCategories,
} from "@/hooks/use-finance";
import { SnapshotManager } from "@/components/SnapshotManager";
import { formatCurrency } from "@/lib/currency";
import {
  Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Line, ComposedChart,
} from "recharts";
import { format, addMonths, parseISO } from "date-fns";
import {
  Loader2, ChevronDown, ChevronRight, Check, PlusCircle, ArrowUpRight,
} from "lucide-react";
import { Link } from "wouter";

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
  const [showProjection, setShowProjection] = useState(false);
  const [projectionYears, setProjectionYears] = useState(1);
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

  // Forward projections that mirror the dedicated pages: student loans amortise
  // down, mortgage equity grows as the loan balance is paid off, and pensions
  // compound monthly using each plan's medium growth rate (default 5%).
  const studentLoanBalanceAt = useMemo(() => {
    const loans = (studentLoans || []).map(l => ({
      monthlyRate: Number(l.annualInterestRate) / 100 / 12,
      payment: Number(l.monthlyPayment),
      initial: Number(l.loanAmount),
    }));
    return (months: number) => {
      let total = 0;
      for (const l of loans) {
        let bal = l.initial;
        for (let m = 0; m < months && bal > 0.01; m++) {
          const interest = bal * l.monthlyRate;
          const principal = l.payment - interest;
          if (principal <= 0) break; // payment can't cover interest, freeze
          bal = Math.max(0, bal - principal);
        }
        total += bal;
      }
      return total;
    };
  }, [studentLoans]);

  const mortgageEquityAt = useMemo(() => {
    const items = (mortgages || []).map(m => ({
      monthlyRate: Number(m.annualInterestRate) / 100 / 12,
      payment: Number(m.monthlyPayment) + Number(m.overpayment || 0),
      initial: Number(m.loanAmount),
      propertyValue: Number(m.propertyValue),
    }));
    return (months: number) => {
      let equity = 0;
      for (const m of items) {
        let bal = m.initial;
        for (let mo = 0; mo < months && bal > 0.01; mo++) {
          const interest = bal * m.monthlyRate;
          const principal = m.payment - interest;
          if (principal <= 0) break;
          bal = Math.max(0, bal - principal);
        }
        equity += m.propertyValue - bal;
      }
      return equity;
    };
  }, [mortgages]);

  const pensionValueAt = useMemo(() => {
    if (!pension) return (_months: number) => 0;
    const startVal = Number(pension.currentPotValue) || 0;
    const monthlyContrib = (Number(pension.userMonthlyContribution) || 0)
      + (Number(pension.employerMonthlyContribution) || 0);
    const annualRate = (Number(pension.expectedGrowthRate) || 5) / 100;
    const annualContrib = monthlyContrib * 12;
    // Annual compounding (matches Pension page's source-of-truth math) with
    // pro-rata growth + contributions for partial years so the 12-month chart
    // still shows a smooth monthly curve.
    return (months: number) => {
      if (months <= 0) return startVal;
      let v = startVal;
      const wholeYears = Math.floor(months / 12);
      const remainderMonths = months - wholeYears * 12;
      for (let y = 0; y < wholeYears; y++) {
        v = v * (1 + annualRate) + annualContrib;
      }
      if (remainderMonths > 0) {
        const frac = remainderMonths / 12;
        v = v * (1 + annualRate * frac) + annualContrib * frac;
      }
      return v;
    };
  }, [pension]);

  const adjust = (base: number) => {
    let v = base;
    if (includeStudentLoans) v -= studentLoanDebt;
    if (includeMortgage) v += mortgageEquity;
    if (includePension || pensionIncludedInNetWorth) v += pensionValue;
    return v;
  };

  const adjustAtMonth = (base: number, monthsAhead: number) => {
    let v = base;
    if (includeStudentLoans) v -= studentLoanBalanceAt(monthsAhead);
    if (includeMortgage) v += mortgageEquityAt(monthsAhead);
    if (includePension || pensionIncludedInNetWorth) v += pensionValueAt(monthsAhead);
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

  // 50/30/20 verdict — mirrors the calculation on the Cashflow page so the
  // Dashboard pulse matches what users see when they drill in.
  const budgetVerdict = useMemo(() => {
    if (monthlyIncome <= 0) return null;
    const needs = (cashflows || [])
      .filter(c => c.type === "expense" && (c.bucket ?? "needs") === "needs")
      .reduce((s, c) => s + Number(c.amount), 0);
    const wants = (cashflows || [])
      .filter(c => c.type === "expense" && c.bucket === "wants")
      .reduce((s, c) => s + Number(c.amount), 0);
    const savings = monthlyIncome - needs - wants;
    const pctNeeds = (needs / monthlyIncome) * 100;
    const pctWants = (wants / monthlyIncome) * 100;
    const pctSavings = (savings / monthlyIncome) * 100;
    const overNeeds = pctNeeds > 50;
    const overWants = pctWants > 30;
    const underSavings = pctSavings < 20;
    if (savings < 0) return { tone: "negative" as const, text: "Spending more than you earn" };
    if (overNeeds && overWants) return { tone: "negative" as const, text: "Needs & wants over budget" };
    if (overNeeds) return { tone: "negative" as const, text: "Needs over budget" };
    if (overWants) return { tone: "negative" as const, text: "Wants over budget" };
    if (underSavings) return { tone: "warning" as const, text: "Below 20% savings target" };
    return { tone: "positive" as const, text: "On track with 50/30/20" };
  }, [cashflows, monthlyIncome]);

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

  const projectionMonths = projectionYears * 12;
  // Keep the chart readable for long horizons: sample every month up to 2y,
  // every 3 months up to 10y, then every 6 months beyond that.
  const projectionStep = projectionMonths <= 24 ? 1 : projectionMonths <= 120 ? 3 : 6;
  const projectionSeries = currentSnapshot
    ? Array.from(
        { length: Math.ceil(projectionMonths / projectionStep) },
        (_, i) => {
          const monthsAhead = Math.min((i + 1) * projectionStep, projectionMonths);
          const date = addMonths(parseISO(currentSnapshot.month), monthsAhead);
          const baseAmount = Number(currentSnapshot.totalNetWorth);
          return {
            date: format(date, "yyyy-MM-dd"),
            label: format(date, projectionMonths > 24 ? "MMM ''yy" : "MMM yy"),
            projectedAmount: adjustAtMonth(baseAmount + monthlySurplus * monthsAhead, monthsAhead),
            actualAmount: adjustAtMonth(baseAmount + actualMonthlySurplus * monthsAhead, monthsAhead),
          };
        }
      )
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

          {/* Savings Rate Arc — desktop only (mobile version sits under the income strip) */}
          <div className="hidden lg:flex items-center gap-4">
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
                    <stop offset="5%" stopColor={ACCENT} stopOpacity={0.22} />
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
                {/* Hidden Y-axis so the area+lines auto-fit tightly to the visible data range,
                    even when toggling student loans / mortgage / pension dramatically shifts values. */}
                <YAxis
                  hide
                  domain={[
                    (dataMin: number) => {
                      const range = Math.max(1, Math.abs(dataMin)) * 0.08;
                      return Math.floor(dataMin - range);
                    },
                    (dataMax: number) => {
                      const range = Math.max(1, Math.abs(dataMax)) * 0.08;
                      return Math.ceil(dataMax + range);
                    },
                  ]}
                  allowDataOverflow={false}
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
                  baseValue="dataMin"
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
          <div className="ml-auto flex items-center gap-3">
            {showProjection && (
              <div
                className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/30 p-0.5"
                role="radiogroup"
                aria-label="Projection horizon"
                data-testid="group-projection-horizon"
              >
                {[1, 2, 5, 10, 20, 30].map(y => {
                  const active = projectionYears === y;
                  return (
                    <button
                      key={y}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setProjectionYears(y)}
                      className={
                        "rounded-full px-2.5 py-0.5 text-[11px] tabular-nums transition-colors " +
                        (active
                          ? "bg-foreground text-background"
                          : "text-muted-foreground hover:text-foreground")
                      }
                      data-testid={`button-horizon-${y}y`}
                    >
                      {y}y
                    </button>
                  );
                })}
              </div>
            )}
            <button
              onClick={() => setShowProjection(v => !v)}
              className="underline decoration-border underline-offset-4 hover:text-foreground transition-colors"
              data-testid="button-toggle-projection"
            >
              {showProjection ? "Hide projection" : "Show projection"}
            </button>
          </div>
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

      {/* This Month Strip — click-through to Cashflow */}
      <Link href="/cashflow" data-testid="link-cashflow-strip">
        <section className="group grid grid-cols-3 gap-3 sm:gap-6 border-y border-border py-8 text-center sm:text-left cursor-pointer hover:bg-muted/20 transition-colors -mx-2 px-2 rounded-md">
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
            <div className="flex items-center justify-center sm:justify-start gap-1.5 mb-2">
              <p className="text-[10px] sm:text-xs font-medium uppercase tracking-widest text-muted-foreground">
                {monthlySurplus >= 0 ? "Surplus" : "Deficit"}
              </p>
              <ArrowUpRight
                size={12}
                className="text-muted-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-hidden
              />
            </div>
            <p
              className="font-mono text-base sm:text-xl tabular-nums break-words"
              style={{ color: monthlySurplus >= 0 ? POSITIVE : NEGATIVE }}
              data-testid="text-monthly-surplus"
            >
              {formatCurrency(monthlySurplus, currency)}
            </p>
            {budgetVerdict && (
              <span
                className={
                  "mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide " +
                  (budgetVerdict.tone === "positive"
                    ? "bg-[hsl(var(--chart-positive))]/15 text-[hsl(var(--chart-positive))]"
                    : budgetVerdict.tone === "warning"
                    ? "bg-[hsl(var(--chart-accent))]/15 text-[hsl(var(--chart-accent))]"
                    : "bg-[hsl(var(--chart-negative))]/15 text-[hsl(var(--chart-negative))]")
                }
                data-testid="text-budget-verdict-dashboard"
              >
                {budgetVerdict.text}
              </span>
            )}
          </div>
        </section>
      </Link>

      {/* Savings Rate — mobile only (sits under the income / expenses / surplus strip) */}
      <section className="lg:hidden -mt-4 flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-muted/40 px-4 py-3">
        <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          Savings Rate
        </span>
        <div className="flex items-center gap-3">
          <span className="font-serif text-xl font-light tabular-nums text-foreground" data-testid="text-savings-rate-mobile">
            {Math.round(savingsRate)}%
          </span>
          <div className="relative h-9 w-9">
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

export const currency = "GBP";
export const currencySymbol = "£";

export function fmt(n: number): string {
  return currencySymbol + Math.round(n).toLocaleString("en-GB");
}

export function fmtCompact(n: number): string {
  if (Math.abs(n) >= 1000) return currencySymbol + (n / 1000).toFixed(1) + "k";
  return currencySymbol + Math.round(n).toString();
}

export const netWorth = 142680;
export const prevNetWorth = 138420;
export const netWorthChange = netWorth - prevNetWorth;
export const netWorthChangePct = (netWorthChange / prevNetWorth) * 100;

export const monthlyIncome = 5400;
export const monthlyExpenses = 3680;
export const monthlySurplus = monthlyIncome - monthlyExpenses;
export const savingsRate = (monthlySurplus / monthlyIncome) * 100;

export const studentLoanDebt = 18400;
export const mortgageEquity = 64200;
export const pensionValue = 38900;

export type Snapshot = { date: string; label: string; total: number };

const months = [
  "2024-05", "2024-06", "2024-07", "2024-08", "2024-09", "2024-10",
  "2024-11", "2024-12", "2025-01", "2025-02", "2025-03", "2025-04",
  "2025-05", "2025-06", "2025-07", "2025-08", "2025-09", "2025-10",
  "2025-11", "2025-12", "2026-01", "2026-02", "2026-03", "2026-04",
];

const trajectory = [
  98200, 100100, 102450, 104800, 106200, 109500,
  111800, 114200, 116900, 118500, 120800, 123400,
  125100, 127600, 129800, 131400, 133200, 135100,
  136400, 137800, 138800, 139900, 138420, 142680,
];

export const snapshots: Snapshot[] = months.map((m, i) => {
  const [y, mo] = m.split("-");
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return {
    date: m,
    label: `${monthNames[parseInt(mo, 10) - 1]} ${y.slice(2)}`,
    total: trajectory[i],
  };
});

export type Category = {
  id: number;
  name: string;
  value: number;
  prevValue: number;
  color: string;
};

export const categories: Category[] = [
  { id: 1, name: "Cash & Savings",  value: 24250, prevValue: 23420, color: "#3b82f6" },
  { id: 2, name: "Investments (ISA)", value: 48900, prevValue: 46100, color: "#0ea5e9" },
  { id: 3, name: "Crypto",          value: 8200,  prevValue: 9400,  color: "#a855f7" },
  { id: 4, name: "Pension",         value: 38900, prevValue: 37200, color: "#10b981" },
  { id: 5, name: "Property Equity", value: 24280, prevValue: 23920, color: "#f59e0b" },
  { id: 6, name: "Credit Card",     value: -1850, prevValue: -1620, color: "#ef4444" },
];

export const categoryHistory: Record<number, number[]> = {
  1: [16000,16400,16900,17200,17600,17900,18300,18600,18900,19200,19400,19700,19900,20100,20400,20700,21000,21200,21800,22200,22600,23000,23420,24250],
  2: [32000,32800,33500,34200,35000,35800,36900,37800,38600,39400,40400,41300,42100,43000,43900,44600,45400,46200,46500,46900,47200,47500,46100,48900],
  3: [9200,9800,10400,11000,11600,12200,12000,11500,11200,10800,10400,10000,9600,9200,9000,8800,8600,8400,8300,8400,8500,8600,9400,8200],
  4: [25000,25800,26600,27400,28200,29000,29900,30700,31500,32400,33200,34000,34700,35400,36100,36500,36900,37200,37500,37800,38100,38400,37200,38900],
  5: [18000,18800,19600,20400,21200,22000,22600,23200,23900,24300,24700,25100,24800,24600,24400,24200,24000,23800,23700,23600,23500,23400,23920,24280],
  6: [-1200,-1300,-1450,-1500,-1480,-1520,-1600,-1650,-1700,-1720,-1680,-1700,-1750,-1780,-1800,-1820,-1850,-1870,-1850,-1820,-1780,-1750,-1620,-1850],
};

export type Cashflow = { id: number; name: string; amount: number; type: "income" | "expense" };
export const cashflows: Cashflow[] = [
  { id: 1, name: "Salary",        amount: 4800, type: "income" },
  { id: 2, name: "Side projects", amount: 600,  type: "income" },
  { id: 3, name: "Rent",          amount: 1450, type: "expense" },
  { id: 4, name: "Groceries",     amount: 480,  type: "expense" },
  { id: 5, name: "Transport",     amount: 220,  type: "expense" },
  { id: 6, name: "Utilities",     amount: 180,  type: "expense" },
  { id: 7, name: "Subscriptions", amount: 95,   type: "expense" },
  { id: 8, name: "Lifestyle",     amount: 1255, type: "expense" },
];

export const projectionMonths = 24;
export function projection(months = projectionMonths) {
  const last = snapshots[snapshots.length - 1].total;
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const startDate = new Date(snapshots[snapshots.length - 1].date + "-01");
  return Array.from({ length: months }).map((_, i) => {
    const d = new Date(startDate.getFullYear(), startDate.getMonth() + i + 1, 1);
    return {
      date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: `${monthNames[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
      planned: last + monthlySurplus * (i + 1),
      actual:  last + (monthlySurplus * 0.85) * (i + 1),
    };
  });
}

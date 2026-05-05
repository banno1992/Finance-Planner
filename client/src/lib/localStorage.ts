const STORAGE_KEY = 'networth_tracker_data';

export interface Category {
  id: number;
  name: string;
  description: string | null;
  displayOrder: number;
}

export interface SnapshotDetail {
  id: number;
  snapshotId: number;
  categoryId: number;
  balance: string;
}

export interface Snapshot {
  id: number;
  month: string;
  totalNetWorth: string;
  details: SnapshotDetail[];
}

export interface Cashflow {
  id: number;
  name: string;
  amount: string;
  type: 'income' | 'expense';
  // 50/30/20 budget bucket — only meaningful for expenses. Null for income.
  bucket?: 'needs' | 'wants' | null;
  // Position within its type group when the user picks the "Custom" sort mode.
  // Backfilled on read for legacy items.
  displayOrder?: number;
}

export type CashflowSortMode = 'amount' | 'name' | 'custom';

export interface StudentLoan {
  id: number;
  name: string;
  loanAmount: string;
  annualInterestRate: string;
  monthlyPayment: string;
}

export interface Mortgage {
  id: number;
  name: string;
  loanAmount: string;
  annualInterestRate: string;
  monthlyPayment: string;
  overpayment: string;
  propertyValue: string;
}

export interface Pension {
  id: number;
  name: string;
  currentAge: number;
  retirementAge: number;
  currentPotValue: string;
  userMonthlyContribution: string;
  employerMonthlyContribution: string;
  expectedGrowthRate: string;
  lowGrowthRate: string;
  highGrowthRate: string;
  inflationRate: string;
  includeStatePension: number;
  includeInNetWorth: number;
  dateOfBirth?: string;
}

export interface Settings {
  currency: string;
  budgetNeedsPct: number;
  budgetWantsPct: number;
  budgetSavingsPct: number;
  incomeSortMode?: CashflowSortMode;
  expenseSortMode?: CashflowSortMode;
}

export const DEFAULT_BUDGET_PCTS = {
  budgetNeedsPct: 50,
  budgetWantsPct: 30,
  budgetSavingsPct: 20,
} as const;

export interface StorageData {
  categories: Category[];
  snapshots: Snapshot[];
  cashflows: Cashflow[];
  studentLoans: StudentLoan[];
  mortgages: Mortgage[];
  pensions: Pension[];
  settings: Settings;
  nextIds: {
    category: number;
    snapshot: number;
    snapshotDetail: number;
    cashflow: number;
    studentLoan: number;
    mortgage: number;
    pension: number;
  };
}

const defaultData: StorageData = {
  categories: [],
  snapshots: [],
  cashflows: [],
  studentLoans: [],
  mortgages: [],
  pensions: [],
  settings: { currency: 'GBP', ...DEFAULT_BUDGET_PCTS },
  nextIds: {
    category: 1,
    snapshot: 1,
    snapshotDetail: 1,
    cashflow: 1,
    studentLoan: 1,
    mortgage: 1,
    pension: 1,
  },
};

function getData(): StorageData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to parse localStorage data', e);
  }
  return { ...defaultData };
}

function saveData(data: StorageData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export const localDB = {
  getCategories(): Category[] {
    return getData().categories.sort((a, b) => a.displayOrder - b.displayOrder);
  },

  createCategory(category: { name: string; description?: string | null; displayOrder?: number }): Category {
    const data = getData();
    const newCategory: Category = {
      description: null,
      displayOrder: data.categories.length,
      ...category,
      id: data.nextIds.category++,
    };
    data.categories.push(newCategory);
    saveData(data);
    return newCategory;
  },

  reorderCategories(order: Array<{ id: number; displayOrder: number }>): Category[] {
    const data = getData();
    order.forEach(item => {
      const cat = data.categories.find(c => c.id === item.id);
      if (cat) cat.displayOrder = item.displayOrder;
    });
    saveData(data);
    return this.getCategories();
  },

  updateCategory(id: number, updates: Partial<Omit<Category, 'id'>>): Category | null {
    const data = getData();
    const cat = data.categories.find(c => c.id === id);
    if (!cat) return null;
    Object.assign(cat, updates);
    saveData(data);
    return cat;
  },

  deleteCategory(id: number): void {
    const data = getData();
    data.categories = data.categories.filter(c => c.id !== id);
    data.snapshots.forEach(snapshot => {
      snapshot.details = snapshot.details.filter(d => d.categoryId !== id);
      let total = 0;
      snapshot.details.forEach(d => total += parseFloat(d.balance) || 0);
      snapshot.totalNetWorth = total.toString();
    });
    saveData(data);
  },

  getSnapshots(): Snapshot[] {
    return getData().snapshots;
  },

  createSnapshot(month: string, balances: Record<string, string>): Snapshot {
    const data = getData();
    let total = 0;
    const details: SnapshotDetail[] = [];
    
    Object.entries(balances).forEach(([catId, balance]) => {
      const numVal = parseFloat(balance) || 0;
      total += numVal;
      details.push({
        id: data.nextIds.snapshotDetail++,
        snapshotId: data.nextIds.snapshot,
        categoryId: parseInt(catId),
        balance: numVal.toString(),
      });
    });

    const snapshot: Snapshot = {
      id: data.nextIds.snapshot++,
      month,
      totalNetWorth: total.toString(),
      details,
    };
    
    data.snapshots.push(snapshot);
    saveData(data);
    return snapshot;
  },

  updateSnapshot(id: number, balances: Record<string, string>): Snapshot | null {
    const data = getData();
    const snapshot = data.snapshots.find(s => s.id === id);
    if (!snapshot) return null;

    let total = 0;
    const newDetails: SnapshotDetail[] = [];
    
    Object.entries(balances).forEach(([catId, balance]) => {
      const numVal = parseFloat(balance) || 0;
      total += numVal;
      const categoryIdNum = parseInt(catId);
      const existingDetail = snapshot.details.find(d => d.categoryId === categoryIdNum);
      newDetails.push({
        id: existingDetail?.id ?? data.nextIds.snapshotDetail++,
        snapshotId: id,
        categoryId: categoryIdNum,
        balance: numVal.toString(),
      });
    });

    snapshot.totalNetWorth = total.toString();
    snapshot.details = newDetails;
    saveData(data);
    return snapshot;
  },

  deleteSnapshot(id: number): void {
    const data = getData();
    data.snapshots = data.snapshots.filter(s => s.id !== id);
    saveData(data);
  },

  getCashflows(): Cashflow[] {
    // Backfill missing bucket on legacy expenses so the 50/30/20 budget keeps
    // working, and assign a stable displayOrder per type group for legacy
    // items that pre-date custom ordering. Insertion order is the natural
    // fallback so existing users see no visible change. The backfilled
    // displayOrders are persisted once so subsequent createCashflow() calls
    // can compute the correct max+1 even if no manual reorder has happened.
    const data = getData();
    const incomeCounter: { i: number } = { i: 0 };
    const expenseCounter: { i: number } = { i: 0 };
    let mutated = false;
    data.cashflows.forEach(c => {
      if (c.type === 'expense' && c.bucket == null) {
        c.bucket = 'needs';
        mutated = true;
      }
      if (typeof c.displayOrder !== 'number') {
        c.displayOrder = c.type === 'income' ? incomeCounter.i++ : expenseCounter.i++;
        mutated = true;
      } else if (c.type === 'income') {
        incomeCounter.i = Math.max(incomeCounter.i, c.displayOrder + 1);
      } else {
        expenseCounter.i = Math.max(expenseCounter.i, c.displayOrder + 1);
      }
    });
    if (mutated) saveData(data);
    return data.cashflows.map(c => ({ ...c }));
  },

  createCashflow(cashflow: Omit<Cashflow, 'id'>): Cashflow {
    // Read via getCashflows() so any legacy items have been backfilled (and
    // persisted) before we compute the next displayOrder. This guarantees
    // appended items truly land at the end of their type group.
    const existing = this.getCashflows();
    const data = getData();
    const sameTypeOrders = existing
      .filter(c => c.type === cashflow.type)
      .map(c => c.displayOrder ?? 0);
    const nextOrder = sameTypeOrders.length > 0 ? Math.max(...sameTypeOrders) + 1 : 0;
    const newCashflow: Cashflow = {
      ...cashflow,
      bucket: cashflow.type === 'expense' ? (cashflow.bucket ?? 'needs') : null,
      displayOrder: typeof cashflow.displayOrder === 'number' ? cashflow.displayOrder : nextOrder,
      id: data.nextIds.cashflow++,
    };
    data.cashflows.push(newCashflow);
    saveData(data);
    return newCashflow;
  },

  updateCashflow(id: number, updates: Partial<Cashflow>): Cashflow | null {
    const data = getData();
    const cashflow = data.cashflows.find(c => c.id === id);
    if (!cashflow) return null;
    Object.assign(cashflow, updates);
    saveData(data);
    return cashflow;
  },

  reorderCashflows(order: Array<{ id: number; displayOrder: number }>): Cashflow[] {
    const data = getData();
    order.forEach(item => {
      const cf = data.cashflows.find(c => c.id === item.id);
      if (cf) cf.displayOrder = item.displayOrder;
    });
    saveData(data);
    return this.getCashflows();
  },

  deleteCashflow(id: number): void {
    const data = getData();
    data.cashflows = data.cashflows.filter(c => c.id !== id);
    saveData(data);
  },

  getStudentLoans(): StudentLoan[] {
    return getData().studentLoans;
  },

  createStudentLoan(loan: Omit<StudentLoan, 'id'>): StudentLoan {
    const data = getData();
    const newLoan: StudentLoan = {
      ...loan,
      id: data.nextIds.studentLoan++,
    };
    data.studentLoans.push(newLoan);
    saveData(data);
    return newLoan;
  },

  updateStudentLoan(id: number, updates: Partial<StudentLoan>): StudentLoan | null {
    const data = getData();
    const loan = data.studentLoans.find(l => l.id === id);
    if (!loan) return null;
    Object.assign(loan, updates);
    saveData(data);
    return loan;
  },

  deleteStudentLoan(id: number): void {
    const data = getData();
    data.studentLoans = data.studentLoans.filter(l => l.id !== id);
    saveData(data);
  },

  getMortgages(): Mortgage[] {
    return getData().mortgages;
  },

  createMortgage(mortgage: Omit<Mortgage, 'id'>): Mortgage {
    const data = getData();
    const newMortgage: Mortgage = {
      ...mortgage,
      id: data.nextIds.mortgage++,
    };
    data.mortgages.push(newMortgage);
    saveData(data);
    return newMortgage;
  },

  updateMortgage(id: number, updates: Partial<Mortgage>): Mortgage | null {
    const data = getData();
    const mortgage = data.mortgages.find(m => m.id === id);
    if (!mortgage) return null;
    Object.assign(mortgage, updates);
    saveData(data);
    return mortgage;
  },

  deleteMortgage(id: number): void {
    const data = getData();
    data.mortgages = data.mortgages.filter(m => m.id !== id);
    saveData(data);
  },

  getPensions(): Pension[] {
    return getData().pensions;
  },

  createPension(pension: Omit<Pension, 'id'>): Pension {
    const data = getData();
    const newPension: Pension = {
      ...pension,
      id: data.nextIds.pension++,
    };
    data.pensions.push(newPension);
    saveData(data);
    return newPension;
  },

  updatePension(id: number, updates: Partial<Pension>): Pension | null {
    const data = getData();
    const pension = data.pensions.find(p => p.id === id);
    if (!pension) return null;
    Object.assign(pension, updates);
    saveData(data);
    return pension;
  },

  deletePension(id: number): void {
    const data = getData();
    data.pensions = data.pensions.filter(p => p.id !== id);
    saveData(data);
  },

  getSettings(): Settings {
    const s = getData().settings;
    // Backfill budget percentages on legacy data so existing users keep the
    // 50/30/20 defaults until they tweak them in Settings. Sort mode defaults
    // to 'custom' which preserves insertion order (the previous behaviour).
    return {
      currency: s.currency ?? 'GBP',
      budgetNeedsPct: s.budgetNeedsPct ?? DEFAULT_BUDGET_PCTS.budgetNeedsPct,
      budgetWantsPct: s.budgetWantsPct ?? DEFAULT_BUDGET_PCTS.budgetWantsPct,
      budgetSavingsPct: s.budgetSavingsPct ?? DEFAULT_BUDGET_PCTS.budgetSavingsPct,
      incomeSortMode: s.incomeSortMode ?? 'custom',
      expenseSortMode: s.expenseSortMode ?? 'custom',
    };
  },

  updateSettings(updates: Partial<Settings>): Settings {
    const data = getData();
    data.settings = { ...data.settings, ...updates };
    saveData(data);
    return data.settings;
  },

  exportData(): object {
    const data = getData();
    return {
      version: 1,
      timestamp: new Date().toISOString(),
      categories: data.categories,
      cashflows: data.cashflows,
      snapshots: data.snapshots,
      studentLoans: data.studentLoans,
      mortgages: data.mortgages,
      pensions: data.pensions,
      settings: data.settings,
    };
  },

  importData(importedData: any): void {
    const data = getData();
    
    const safeMaxId = (arr: any[], key = 'id'): number => {
      if (!arr || arr.length === 0) return 0;
      const ids = arr.map((item: any) => item[key] || 0);
      return Math.max(...ids);
    };
    
    if (importedData.categories && Array.isArray(importedData.categories)) {
      data.categories = importedData.categories;
      data.nextIds.category = safeMaxId(importedData.categories) + 1;
    }
    if (importedData.cashflows && Array.isArray(importedData.cashflows)) {
      data.cashflows = importedData.cashflows;
      data.nextIds.cashflow = safeMaxId(importedData.cashflows) + 1;
    }
    if (importedData.snapshots && Array.isArray(importedData.snapshots)) {
      data.snapshots = importedData.snapshots;
      data.nextIds.snapshot = safeMaxId(importedData.snapshots) + 1;
      const allDetailIds = importedData.snapshots.flatMap((s: any) => s.details?.map((d: any) => d.id) || []);
      data.nextIds.snapshotDetail = safeMaxId(allDetailIds.map((id: number) => ({ id }))) + 1;
    }
    if (importedData.studentLoans && Array.isArray(importedData.studentLoans)) {
      data.studentLoans = importedData.studentLoans;
      data.nextIds.studentLoan = safeMaxId(importedData.studentLoans) + 1;
    }
    if (importedData.mortgages && Array.isArray(importedData.mortgages)) {
      data.mortgages = importedData.mortgages;
      data.nextIds.mortgage = safeMaxId(importedData.mortgages) + 1;
    }
    if (importedData.pensions && Array.isArray(importedData.pensions)) {
      data.pensions = importedData.pensions;
      data.nextIds.pension = safeMaxId(importedData.pensions) + 1;
    }
    if (importedData.settings) {
      data.settings = importedData.settings;
    }
    
    saveData(data);
  },

  clearAll(): void {
    localStorage.removeItem(STORAGE_KEY);
  },
};

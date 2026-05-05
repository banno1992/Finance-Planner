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
}

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
    // working without forcing a manual migration.
    return getData().cashflows.map(c => ({
      ...c,
      bucket: c.type === 'expense' ? (c.bucket ?? 'needs') : null,
    }));
  },

  createCashflow(cashflow: Omit<Cashflow, 'id'>): Cashflow {
    const data = getData();
    const newCashflow: Cashflow = {
      ...cashflow,
      bucket: cashflow.type === 'expense' ? (cashflow.bucket ?? 'needs') : null,
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
    // 50/30/20 defaults until they tweak them in Settings.
    return {
      currency: s.currency ?? 'GBP',
      budgetNeedsPct: s.budgetNeedsPct ?? DEFAULT_BUDGET_PCTS.budgetNeedsPct,
      budgetWantsPct: s.budgetWantsPct ?? DEFAULT_BUDGET_PCTS.budgetWantsPct,
      budgetSavingsPct: s.budgetSavingsPct ?? DEFAULT_BUDGET_PCTS.budgetSavingsPct,
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

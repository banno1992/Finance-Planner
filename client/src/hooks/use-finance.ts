import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { localDB, type Category, type Cashflow, type StudentLoan, type Mortgage, type Pension, type Snapshot } from "@/lib/localStorage";

const QUERY_KEYS = {
  categories: ['categories'],
  snapshots: ['snapshots'],
  cashflows: ['cashflows'],
  studentLoans: ['studentLoans'],
  mortgages: ['mortgages'],
  pensions: ['pensions'],
  settings: ['settings'],
};

export function useCategories() {
  return useQuery({
    queryKey: QUERY_KEYS.categories,
    queryFn: () => localDB.getCategories(),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Category, "id">) => {
      return Promise.resolve(localDB.createCategory(data));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories }),
  });
}

export function useReorderCategories() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (order: Array<{ id: number; displayOrder: number }>) => {
      return Promise.resolve(localDB.reorderCategories(order));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories }),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => {
      localDB.deleteCategory(id);
      return Promise.resolve();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories }),
  });
}

export function useCashflows() {
  return useQuery({
    queryKey: QUERY_KEYS.cashflows,
    queryFn: () => localDB.getCashflows(),
  });
}

export function useCreateCashflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Cashflow, "id">) => {
      return Promise.resolve(localDB.createCashflow(data));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cashflows }),
  });
}

export function useUpdateCashflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Omit<Cashflow, "id">> }) => {
      const result = localDB.updateCashflow(id, data);
      if (!result) throw new Error("Cashflow not found");
      return Promise.resolve(result);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cashflows }),
  });
}

export function useDeleteCashflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => {
      localDB.deleteCashflow(id);
      return Promise.resolve();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cashflows }),
  });
}

export function useSnapshots() {
  return useQuery({
    queryKey: QUERY_KEYS.snapshots,
    queryFn: () => localDB.getSnapshots(),
  });
}

export function useCreateSnapshot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { month: string; balances: Record<string, string> }) => {
      return Promise.resolve(localDB.createSnapshot(data.month, data.balances));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.snapshots }),
  });
}

export function useUpdateSnapshot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, balances }: { id: number; balances: Record<string, string> }) => {
      const result = localDB.updateSnapshot(id, balances);
      if (!result) throw new Error("Snapshot not found");
      return Promise.resolve(result);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.snapshots }),
  });
}

export function useDeleteSnapshot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => {
      localDB.deleteSnapshot(id);
      return Promise.resolve();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.snapshots }),
  });
}

export function useSettings() {
  return useQuery({
    queryKey: QUERY_KEYS.settings,
    queryFn: () => localDB.getSettings(),
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (currency: string) => {
      return Promise.resolve(localDB.updateSettings(currency));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.settings }),
  });
}

export function useStudentLoans() {
  return useQuery({
    queryKey: QUERY_KEYS.studentLoans,
    queryFn: () => localDB.getStudentLoans(),
  });
}

export function useCreateStudentLoan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<StudentLoan, "id">) => {
      return Promise.resolve(localDB.createStudentLoan(data));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.studentLoans }),
  });
}

export function useUpdateStudentLoan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<StudentLoan> }) => {
      const result = localDB.updateStudentLoan(id, data);
      if (!result) throw new Error("Student loan not found");
      return Promise.resolve(result);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.studentLoans }),
  });
}

export function useDeleteStudentLoan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => {
      localDB.deleteStudentLoan(id);
      return Promise.resolve();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.studentLoans }),
  });
}

export function useMortgages() {
  return useQuery({
    queryKey: QUERY_KEYS.mortgages,
    queryFn: () => localDB.getMortgages(),
  });
}

export function useCreateMortgage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Mortgage, "id">) => {
      return Promise.resolve(localDB.createMortgage(data));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.mortgages }),
  });
}

export function useUpdateMortgage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Mortgage> }) => {
      const result = localDB.updateMortgage(id, data);
      if (!result) throw new Error("Mortgage not found");
      return Promise.resolve(result);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.mortgages }),
  });
}

export function useDeleteMortgage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => {
      localDB.deleteMortgage(id);
      return Promise.resolve();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.mortgages }),
  });
}

export function usePensions() {
  return useQuery({
    queryKey: QUERY_KEYS.pensions,
    queryFn: () => localDB.getPensions(),
  });
}

export function useCreatePension() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Pension, "id">) => {
      return Promise.resolve(localDB.createPension(data));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pensions }),
  });
}

export function useUpdatePension() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Pension> }) => {
      const result = localDB.updatePension(id, data);
      if (!result) throw new Error("Pension not found");
      return Promise.resolve(result);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pensions }),
  });
}

export function useDeletePension() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => {
      localDB.deletePension(id);
      return Promise.resolve();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pensions }),
  });
}

export function useExportData() {
  return () => {
    const data = localDB.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
}

export function useImportData() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => {
      localDB.importData(data);
      return Promise.resolve({ message: "Data imported successfully" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}

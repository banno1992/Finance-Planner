import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { localDB, type Category, type Cashflow, type StudentLoan, type Mortgage, type Pension, type Snapshot } from "@/lib/localStorage";
import { recordBackup, saveFile } from "@/lib/deviceStorage";

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
    mutationFn: (data: { name: string; description?: string | null; displayOrder?: number }) => {
      return Promise.resolve(localDB.createCategory(data));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories, refetchType: 'all' }),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Omit<Category, "id">> }) => {
      const result = localDB.updateCategory(id, data);
      if (!result) throw new Error("Category not found");
      return Promise.resolve(result);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories, refetchType: 'all' }),
  });
}

export function useReorderCategories() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (order: Array<{ id: number; displayOrder: number }>) => {
      return Promise.resolve(localDB.reorderCategories(order));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories, refetchType: 'all' }),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => {
      localDB.deleteCategory(id);
      return Promise.resolve();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories, refetchType: 'all' }),
  });
}

export function useCashflows() {
  return useQuery({
    queryKey: QUERY_KEYS.cashflows,
    queryFn: () => Promise.resolve(localDB.getCashflows()),
  });
}

export function useCreateCashflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Cashflow, "id">) => {
      return Promise.resolve(localDB.createCashflow(data));
    },
    onSuccess: () => {
      queryClient.setQueryData(QUERY_KEYS.cashflows, localDB.getCashflows());
      queryClient.refetchQueries({ queryKey: QUERY_KEYS.cashflows });
    },
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
    onSuccess: () => {
      queryClient.setQueryData(QUERY_KEYS.cashflows, localDB.getCashflows());
    },
  });
}

export function useDeleteCashflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => {
      localDB.deleteCashflow(id);
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.setQueryData(QUERY_KEYS.cashflows, localDB.getCashflows());
    },
  });
}

export function useReorderCashflows() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (order: Array<{ id: number; displayOrder: number }>) => {
      return Promise.resolve(localDB.reorderCashflows(order));
    },
    onSuccess: () => {
      queryClient.setQueryData(QUERY_KEYS.cashflows, localDB.getCashflows());
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cashflows, refetchType: 'all' });
    },
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.snapshots, refetchType: 'all' }),
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.snapshots, refetchType: 'all' }),
  });
}

export function useDeleteSnapshot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => {
      localDB.deleteSnapshot(id);
      return Promise.resolve();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.snapshots, refetchType: 'all' }),
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
    mutationFn: (updates: Partial<import("@/lib/localStorage").Settings>) => {
      return Promise.resolve(localDB.updateSettings(updates));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.settings, refetchType: 'all' }),
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.studentLoans, refetchType: 'all' }),
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.studentLoans, refetchType: 'all' }),
  });
}

export function useDeleteStudentLoan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => {
      localDB.deleteStudentLoan(id);
      return Promise.resolve();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.studentLoans, refetchType: 'all' }),
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.mortgages, refetchType: 'all' }),
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.mortgages, refetchType: 'all' }),
  });
}

export function useDeleteMortgage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => {
      localDB.deleteMortgage(id);
      return Promise.resolve();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.mortgages, refetchType: 'all' }),
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pensions, refetchType: 'all' }),
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pensions, refetchType: 'all' }),
  });
}

export function useDeletePension() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => {
      localDB.deletePension(id);
      return Promise.resolve();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pensions, refetchType: 'all' }),
  });
}

export function useExportData() {
  /** Resolves true if the backup was saved/shared, false if the user cancelled. */
  return async (): Promise<boolean> => {
    const data = localDB.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const saved = await saveFile(blob, `finance_backup_${new Date().toISOString().split('T')[0]}.json`);
    if (saved) recordBackup();
    return saved;
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

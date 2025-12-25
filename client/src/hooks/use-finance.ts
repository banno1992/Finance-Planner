import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type Category, type Cashflow } from "@shared/schema";
import { z } from "zod";

// ============================================
// CATEGORIES
// ============================================

export function useCategories() {
  return useQuery({
    queryKey: [api.categories.list.path],
    queryFn: async () => {
      const res = await fetch(api.categories.list.path);
      if (!res.ok) throw new Error("Failed to fetch categories");
      return api.categories.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<Category, "id">) => {
      const validated = api.categories.create.input.parse(data);
      const res = await fetch(api.categories.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });
      if (!res.ok) throw new Error("Failed to create category");
      return api.categories.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.categories.list.path] }),
  });
}

export function useReorderCategories() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (order: Array<{ id: number; displayOrder: number }>) => {
      const res = await fetch(api.categories.reorder.path, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order),
      });
      if (!res.ok) throw new Error("Failed to reorder categories");
      return await res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.categories.list.path] }),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.categories.delete.path, { id });
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete category");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.categories.list.path] }),
  });
}

// ============================================
// CASHFLOWS (Income/Expenses)
// ============================================

export function useCashflows() {
  return useQuery({
    queryKey: [api.cashflows.list.path],
    queryFn: async () => {
      const res = await fetch(api.cashflows.list.path);
      if (!res.ok) throw new Error("Failed to fetch cashflows");
      return api.cashflows.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateCashflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<Cashflow, "id">) => {
      const validated = api.cashflows.create.input.parse(data);
      const res = await fetch(api.cashflows.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });
      if (!res.ok) throw new Error("Failed to create cashflow");
      return api.cashflows.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.cashflows.list.path] }),
  });
}

export function useUpdateCashflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Omit<Cashflow, "id">> }) => {
      const url = buildUrl(api.cashflows.update.path, { id });
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update cashflow");
      return await res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.cashflows.list.path] }),
  });
}

export function useDeleteCashflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.cashflows.delete.path, { id });
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete cashflow");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.cashflows.list.path] }),
  });
}

// ============================================
// SNAPSHOTS (Net Worth History)
// ============================================

export function useSnapshots() {
  return useQuery({
    queryKey: [api.snapshots.list.path],
    queryFn: async () => {
      const res = await fetch(api.snapshots.list.path);
      if (!res.ok) throw new Error("Failed to fetch snapshots");
      // The schema for snapshots list response is generic z.array(z.any()) in routes,
      // but in practice it returns snapshots with nested details.
      return await res.json();
    },
  });
}

export function useCreateSnapshot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { month: string; balances: Record<string, string> }) => {
      const res = await fetch(api.snapshots.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create snapshot");
      return await res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.snapshots.list.path] }),
  });
}

export function useUpdateSnapshot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, balances }: { id: number; balances: Record<string, string> }) => {
      const url = buildUrl(api.snapshots.update.path, { id });
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ balances }),
      });
      if (!res.ok) throw new Error("Failed to update snapshot");
      return await res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.snapshots.list.path] }),
  });
}

export function useDeleteSnapshot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.snapshots.delete.path, { id });
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete snapshot");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.snapshots.list.path] }),
  });
}

// ============================================
// SETTINGS (Currency, Import/Export)
// ============================================

export function useSettings() {
  return useQuery({
    queryKey: [api.settings.get.path],
    queryFn: async () => {
      const res = await fetch(api.settings.get.path);
      if (!res.ok) throw new Error("Failed to fetch settings");
      return await res.json();
    },
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (currency: string) => {
      const res = await fetch(api.settings.update.path, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currency }),
      });
      if (!res.ok) throw new Error("Failed to update settings");
      return await res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.settings.get.path] }),
  });
}

export function useExportData() {
  return async () => {
    const [categories, cashflows, snapshots] = await Promise.all([
      fetch(api.categories.list.path).then(r => r.json()),
      fetch(api.cashflows.list.path).then(r => r.json()),
      fetch(api.snapshots.list.path).then(r => r.json())
    ]);

    const data = {
      version: 1,
      timestamp: new Date().toISOString(),
      categories,
      cashflows,
      snapshots
    };

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

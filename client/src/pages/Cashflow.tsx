import { useSettings, useUpdateSettings } from "@/hooks/use-finance";
import { AddCashflowDialog } from "@/components/AddCashflowDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, getCurrencySymbol } from "@/lib/currency";
import { Trash2, ArrowUpRight, ArrowDownRight, Save, X, Pencil, PiggyBank, GripVertical, ChevronUp, ChevronDown } from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { localDB, Cashflow as CashflowType, CashflowSortMode } from "@/lib/localStorage";

type Bucket = "needs" | "wants";
type CashflowKind = "income" | "expense";

const SORT_OPTIONS: Array<{ value: CashflowSortMode; label: string }> = [
  { value: "custom", label: "Custom" },
  { value: "name", label: "A→Z" },
  { value: "amount", label: "Amount" },
];

function sortCashflows(items: CashflowType[], mode: CashflowSortMode): CashflowType[] {
  const next = [...items];
  if (mode === "amount") {
    next.sort((a, b) => Number(b.amount) - Number(a.amount));
  } else if (mode === "name") {
    next.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    next.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }
  return next;
}

interface EditValues {
  name: string;
  amount: string;
  bucket: Bucket;
}

const BUDGET_DESCRIPTIONS: Record<"needs" | "wants" | "savings", { label: string; description: string }> = {
  needs: { label: "Needs", description: "Rent, food, utilities, insurance, minimum debt payments" },
  wants: { label: "Wants", description: "Dining out, subscriptions, entertainment, hobbies" },
  savings: { label: "Savings", description: "What's left over after needs and wants" },
};

function SortPillsRow({
  value,
  onChange,
  idPrefix,
}: {
  value: CashflowSortMode;
  onChange: (m: CashflowSortMode) => void;
  idPrefix: string;
}) {
  return (
    <div
      className="flex items-center justify-end gap-1 -mb-1"
      role="radiogroup"
      aria-label="Sort order"
    >
      <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mr-1">Sort</span>
      {SORT_OPTIONS.map(opt => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={
              "rounded-full px-2.5 py-1 text-[11px] tracking-wide transition-colors " +
              (active
                ? "bg-foreground text-background"
                : "bg-muted/50 text-muted-foreground hover:text-foreground border border-border/40")
            }
            data-testid={`button-${idPrefix}-sort-${opt.value}`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function ReorderHandle({
  isFirst,
  isLast,
  onUp,
  onDown,
  idPrefix,
  itemId,
  itemName,
}: {
  isFirst: boolean;
  isLast: boolean;
  onUp: () => void;
  onDown: () => void;
  idPrefix: string;
  itemId: number;
  itemName: string;
}) {
  return (
    <div className="flex items-center gap-1 flex-shrink-0 -ml-1" aria-label={`Reorder ${itemName}`}>
      <GripVertical size={14} className="hidden sm:block text-muted-foreground/60" aria-hidden />
      <div className="flex flex-col items-center -my-1">
        <button
          type="button"
          onClick={onUp}
          disabled={isFirst}
          className="h-5 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background/60 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
          aria-label={`Move ${itemName} up`}
          data-testid={`button-${idPrefix}-move-up-${itemId}`}
        >
          <ChevronUp size={14} />
        </button>
        <button
          type="button"
          onClick={onDown}
          disabled={isLast}
          className="h-5 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background/60 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
          aria-label={`Move ${itemName} down`}
          data-testid={`button-${idPrefix}-move-down-${itemId}`}
        >
          <ChevronDown size={14} />
        </button>
      </div>
    </div>
  );
}

export default function Cashflow() {
  const [cashflows, setCashflows] = useState<CashflowType[]>([]);
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();
  const currency = settings?.currency || "USD";

  const incomeSortMode: CashflowSortMode = settings?.incomeSortMode ?? "custom";
  const expenseSortMode: CashflowSortMode = settings?.expenseSortMode ?? "custom";

  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);

  const needsPct = (settings?.budgetNeedsPct ?? 50) / 100;
  const wantsPct = (settings?.budgetWantsPct ?? 30) / 100;
  const savingsPct = (settings?.budgetSavingsPct ?? 20) / 100;
  const budgetTargets = useMemo(() => ([
    { key: "needs" as const, pct: needsPct, ...BUDGET_DESCRIPTIONS.needs },
    { key: "wants" as const, pct: wantsPct, ...BUDGET_DESCRIPTIONS.wants },
    { key: "savings" as const, pct: savingsPct, ...BUDGET_DESCRIPTIONS.savings },
  ]), [needsPct, wantsPct, savingsPct]);
  const frameworkLabel = `${Math.round(needsPct * 100)}/${Math.round(wantsPct * 100)}/${Math.round(savingsPct * 100)}`;

  const refreshCashflows = useCallback(() => {
    setCashflows(localDB.getCashflows());
  }, []);

  useEffect(() => {
    refreshCashflows();
  }, [refreshCashflows]);

  const handleDelete = (id: number) => {
    localDB.deleteCashflow(id);
    refreshCashflows();
  };

  const handleUpdate = (id: number, data: Partial<CashflowType>) => {
    localDB.updateCashflow(id, data);
    refreshCashflows();
  };

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<EditValues>({ name: "", amount: "", bucket: "needs" });

  const incomeItems = useMemo(
    () => sortCashflows(cashflows.filter(c => c.type === 'income'), incomeSortMode),
    [cashflows, incomeSortMode]
  );
  const expenseItems = useMemo(
    () => sortCashflows(cashflows.filter(c => c.type === 'expense'), expenseSortMode),
    [cashflows, expenseSortMode]
  );

  const totalIncome = incomeItems.reduce((acc, curr) => acc + Number(curr.amount), 0);
  const totalExpense = expenseItems.reduce((acc, curr) => acc + Number(curr.amount), 0);

  const setSortMode = (kind: CashflowKind, mode: CashflowSortMode) => {
    updateSettings.mutate(
      kind === "income" ? { incomeSortMode: mode } : { expenseSortMode: mode }
    );
  };

  // Reorder helper — rewrites displayOrder for all items of the given kind so
  // the persisted positions are tightly packed (0..n-1).
  const persistOrder = (kind: CashflowKind, orderedIds: number[]) => {
    const order = orderedIds.map((id, displayOrder) => ({ id, displayOrder }));
    localDB.reorderCashflows(order);
    refreshCashflows();
  };

  const moveItem = (kind: CashflowKind, id: number, direction: "up" | "down") => {
    const list = (kind === "income" ? incomeItems : expenseItems).map(c => c.id);
    const idx = list.indexOf(id);
    if (idx < 0) return;
    const target = direction === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= list.length) return;
    [list[idx], list[target]] = [list[target], list[idx]];
    persistOrder(kind, list);
  };

  const handleDragStart = (id: number) => () => {
    setDraggingId(id);
  };
  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverId(null);
  };
  const handleDragOver = (id: number) => (e: React.DragEvent) => {
    if (draggingId === null || draggingId === id) return;
    e.preventDefault();
    if (dragOverId !== id) setDragOverId(id);
  };
  const handleDrop = (kind: CashflowKind, targetId: number) => (e: React.DragEvent) => {
    e.preventDefault();
    const sourceId = draggingId;
    handleDragEnd();
    if (sourceId === null || sourceId === targetId) return;
    const list = (kind === "income" ? incomeItems : expenseItems).map(c => c.id);
    const fromIdx = list.indexOf(sourceId);
    const toIdx = list.indexOf(targetId);
    if (fromIdx < 0 || toIdx < 0) return;
    list.splice(fromIdx, 1);
    list.splice(toIdx, 0, sourceId);
    persistOrder(kind, list);
  };

  // Budget computations
  const budget = useMemo(() => {
    const needs = expenseItems
      .filter(e => (e.bucket ?? "needs") === "needs")
      .reduce((s, e) => s + Number(e.amount), 0);
    const wants = expenseItems
      .filter(e => e.bucket === "wants")
      .reduce((s, e) => s + Number(e.amount), 0);
    const savings = totalIncome - needs - wants;
    const pct = (v: number) => totalIncome > 0 ? (v / totalIncome) * 100 : 0;
    return {
      needs,
      wants,
      savings,
      pctNeeds: pct(needs),
      pctWants: pct(wants),
      pctSavings: pct(savings),
    };
  }, [expenseItems, totalIncome]);

  const verdict = useMemo(() => {
    if (totalIncome <= 0) return null;
    const needsTargetPct = needsPct * 100;
    const wantsTargetPct = wantsPct * 100;
    const savingsTargetPct = savingsPct * 100;
    const overNeeds = budget.pctNeeds > needsTargetPct;
    const overWants = budget.pctWants > wantsTargetPct;
    const underSavings = budget.pctSavings < savingsTargetPct;
    if (budget.savings < 0) return { tone: "negative" as const, text: "You're spending more than you earn." };
    if (overNeeds && overWants) return { tone: "negative" as const, text: "Overspending on both needs and wants." };
    if (overNeeds) return { tone: "negative" as const, text: "Needs are over budget." };
    if (overWants) return { tone: "negative" as const, text: "Wants are over budget." };
    if (underSavings) return { tone: "warning" as const, text: `Saving less than the ${Math.round(savingsTargetPct)}% target.` };
    return { tone: "positive" as const, text: `On track with the ${frameworkLabel} framework.` };
  }, [budget, totalIncome, needsPct, wantsPct, savingsPct, frameworkLabel]);

  const handleEdit = (item: CashflowType) => {
    setEditingId(item.id);
    setEditValues({
      name: item.name,
      amount: item.amount.toString(),
      bucket: (item.bucket ?? "needs") as Bucket,
    });
  };

  const handleSave = (id: number, type: "income" | "expense") => {
    if (editValues.name && editValues.amount) {
      handleUpdate(id, {
        name: editValues.name,
        amount: editValues.amount,
        ...(type === "expense" ? { bucket: editValues.bucket } : {}),
      });
      setEditingId(null);
      setEditValues({ name: "", amount: "", bucket: "needs" });
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValues({ name: "", amount: "", bucket: "needs" });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="font-serif text-3xl md:text-4xl font-light tracking-tight text-foreground">Cashflow</h2>
        <p className="text-muted-foreground mt-2">Manage your recurring income and expenses</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Income Column */}
        <div className="rounded-3xl border border-border bg-card/60 backdrop-blur-xl shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[hsl(var(--chart-positive))]/15 flex items-center justify-center text-[hsl(var(--chart-positive))]">
                <ArrowUpRight size={20} />
              </div>
              <div>
                <h3 className="font-serif text-lg font-light tracking-tight">Income</h3>
                <p className="text-xs text-muted-foreground">Recurring monthly inflows</p>
              </div>
            </div>
            <div className="text-right">
              <span className="block font-serif text-2xl font-light text-[hsl(var(--chart-positive))] tabular-nums">{formatCurrency(totalIncome, currency)}</span>
              <span className="text-xs text-muted-foreground">/ month</span>
            </div>
          </div>

          <div className="space-y-2">
            <SortPillsRow
              value={incomeSortMode}
              onChange={(m) => setSortMode("income", m)}
              idPrefix="income"
            />
            {incomeItems.map((item, idx) => {
              const isCustom = incomeSortMode === "custom";
              const isEditing = editingId === item.id;
              const showHandle = isCustom && !isEditing;
              const isDraggable = showHandle;
              const isFirst = idx === 0;
              const isLast = idx === incomeItems.length - 1;
              const isDragOver = showHandle && dragOverId === item.id && draggingId !== null && draggingId !== item.id;
              const isBeingDragged = draggingId === item.id;
              return (
              <div
                key={item.id}
                draggable={isDraggable}
                onDragStart={isDraggable ? handleDragStart(item.id) : undefined}
                onDragOver={isDraggable ? handleDragOver(item.id) : undefined}
                onDrop={isDraggable ? handleDrop("income", item.id) : undefined}
                onDragEnd={isDraggable ? handleDragEnd : undefined}
                className={
                  "flex items-center gap-2 sm:gap-3 p-3 rounded-2xl bg-muted/40 border transition-colors group " +
                  (isEditing ? "flex-wrap " : "") +
                  (isDraggable ? "cursor-grab active:cursor-grabbing " : "") +
                  (isBeingDragged ? "opacity-50 " : "") +
                  (isDragOver
                    ? "border-[hsl(var(--chart-accent))] bg-[hsl(var(--chart-accent))]/10 "
                    : "border-border/60 hover:bg-muted/60")
                }
                data-testid={`row-income-${item.id}`}
              >
                {showHandle && (
                  <ReorderHandle
                    isFirst={isFirst}
                    isLast={isLast}
                    onUp={() => moveItem("income", item.id, "up")}
                    onDown={() => moveItem("income", item.id, "down")}
                    idPrefix="income"
                    itemId={item.id}
                    itemName={item.name}
                  />
                )}
                {isEditing ? (
                  <>
                    <Input
                      value={editValues.name}
                      onChange={(e) => setEditValues(prev => ({ ...prev, name: e.target.value }))}
                      className="basis-full sm:basis-auto sm:flex-1 h-9 sm:h-8 text-sm bg-background/50"
                      placeholder="Name"
                    />
                    <div className="relative flex-1 sm:flex-none sm:w-auto">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">{getCurrencySymbol(currency)}</span>
                      <Input
                        type="number"
                        inputMode="decimal"
                        value={editValues.amount}
                        onChange={(e) => setEditValues(prev => ({ ...prev, amount: e.target.value }))}
                        className="w-full sm:w-24 h-9 sm:h-8 text-sm pl-5 bg-background/50 tabular-nums"
                        placeholder="0.00"
                      />
                    </div>
                    <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-8 sm:w-8 flex-shrink-0 text-[hsl(var(--chart-positive))]" onClick={() => handleSave(item.id, "income")}>
                      <Save size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-8 sm:w-8 flex-shrink-0 text-muted-foreground" onClick={handleCancel}>
                      <X size={14} />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="font-medium flex-1" data-testid={`text-income-name-${item.id}`}>{item.name}</span>
                    <span className="font-mono tabular-nums text-[hsl(var(--chart-positive))]">+{formatCurrency(Number(item.amount), currency)}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleEdit(item)} data-testid={`button-edit-income-${item.id}`}>
                      <Pencil size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-[hsl(var(--chart-negative))]" onClick={() => handleDelete(item.id)} data-testid={`button-delete-income-${item.id}`}>
                      <Trash2 size={14} />
                    </Button>
                  </>
                )}
              </div>
              );
            })}
            {incomeItems.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm italic">
                No income sources added yet
              </div>
            )}
          </div>

          <AddCashflowDialog defaultType="income" onCashflowAdded={refreshCashflows} />
        </div>

        {/* Expenses Column */}
        <div className="rounded-3xl border border-border bg-card/60 backdrop-blur-xl shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[hsl(var(--chart-negative))]/15 flex items-center justify-center text-[hsl(var(--chart-negative))]">
                <ArrowDownRight size={20} />
              </div>
              <div>
                <h3 className="font-serif text-lg font-light tracking-tight">Expenses</h3>
                <p className="text-xs text-muted-foreground">Recurring monthly outflows</p>
              </div>
            </div>
            <div className="text-right">
              <span className="block font-serif text-2xl font-light text-[hsl(var(--chart-negative))] tabular-nums">{formatCurrency(totalExpense, currency)}</span>
              <span className="text-xs text-muted-foreground">/ month</span>
            </div>
          </div>

          <div className="space-y-2">
            <SortPillsRow
              value={expenseSortMode}
              onChange={(m) => setSortMode("expense", m)}
              idPrefix="expense"
            />
            {expenseItems.map((item, idx) => {
              const itemBucket = (item.bucket ?? "needs") as Bucket;
              const isCustom = expenseSortMode === "custom";
              const isEditing = editingId === item.id;
              const showHandle = isCustom && !isEditing;
              const isDraggable = showHandle;
              const isFirst = idx === 0;
              const isLast = idx === expenseItems.length - 1;
              const isDragOver = showHandle && dragOverId === item.id && draggingId !== null && draggingId !== item.id;
              const isBeingDragged = draggingId === item.id;
              return (
                <div
                  key={item.id}
                  draggable={isDraggable}
                  onDragStart={isDraggable ? handleDragStart(item.id) : undefined}
                  onDragOver={isDraggable ? handleDragOver(item.id) : undefined}
                  onDrop={isDraggable ? handleDrop("expense", item.id) : undefined}
                  onDragEnd={isDraggable ? handleDragEnd : undefined}
                  className={
                    "flex items-center gap-2 sm:gap-3 p-3 rounded-2xl bg-muted/40 border transition-colors group " +
                    (isEditing ? "flex-wrap " : "") +
                    (isDraggable ? "cursor-grab active:cursor-grabbing " : "") +
                    (isBeingDragged ? "opacity-50 " : "") +
                    (isDragOver
                      ? "border-[hsl(var(--chart-accent))] bg-[hsl(var(--chart-accent))]/10 "
                      : "border-border/60 hover:bg-muted/60")
                  }
                  data-testid={`row-expense-${item.id}`}
                >
                  {showHandle && (
                    <ReorderHandle
                      isFirst={isFirst}
                      isLast={isLast}
                      onUp={() => moveItem("expense", item.id, "up")}
                      onDown={() => moveItem("expense", item.id, "down")}
                      idPrefix="expense"
                      itemId={item.id}
                      itemName={item.name}
                    />
                  )}
                  {isEditing ? (
                    <>
                      <Input
                        value={editValues.name}
                        onChange={(e) => setEditValues(prev => ({ ...prev, name: e.target.value }))}
                        className="basis-full sm:basis-auto sm:flex-1 h-9 sm:h-8 text-sm bg-background/50"
                        placeholder="Name"
                      />
                      <div
                        className="inline-flex items-center gap-0.5 rounded-full border border-border/60 bg-background/50 p-0.5 flex-shrink-0"
                        role="radiogroup"
                        aria-label="Expense bucket"
                      >
                        {(["needs", "wants"] as const).map(b => {
                          const active = editValues.bucket === b;
                          return (
                            <button
                              key={b}
                              type="button"
                              role="radio"
                              aria-checked={active}
                              onClick={() => setEditValues(prev => ({ ...prev, bucket: b }))}
                              className={
                                "rounded-full px-3 py-1 sm:px-2 sm:py-0.5 text-[11px] capitalize transition-colors " +
                                (active
                                  ? "bg-foreground text-background"
                                  : "text-muted-foreground hover:text-foreground")
                              }
                              data-testid={`button-edit-bucket-${b}-${item.id}`}
                            >
                              {b === "needs" ? "Need" : "Want"}
                            </button>
                          );
                        })}
                      </div>
                      <div className="relative flex-1 sm:flex-none sm:w-auto">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">{getCurrencySymbol(currency)}</span>
                        <Input
                          type="number"
                          inputMode="decimal"
                          value={editValues.amount}
                          onChange={(e) => setEditValues(prev => ({ ...prev, amount: e.target.value }))}
                          className="w-full sm:w-24 h-9 sm:h-8 text-sm pl-5 bg-background/50 tabular-nums"
                          placeholder="0.00"
                        />
                      </div>
                      <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-8 sm:w-8 flex-shrink-0 text-[hsl(var(--chart-positive))]" onClick={() => handleSave(item.id, "expense")}>
                        <Save size={14} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-8 sm:w-8 flex-shrink-0 text-muted-foreground" onClick={handleCancel}>
                        <X size={14} />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="font-medium flex-1" data-testid={`text-expense-name-${item.id}`}>{item.name}</span>
                      <span
                        className={
                          "rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] " +
                          (itemBucket === "needs"
                            ? "border-border/60 bg-muted/40 text-muted-foreground"
                            : "border-[hsl(var(--chart-accent))]/30 bg-[hsl(var(--chart-accent))]/10 text-[hsl(var(--chart-accent))]")
                        }
                        data-testid={`text-expense-bucket-${item.id}`}
                      >
                        {itemBucket === "needs" ? "Need" : "Want"}
                      </span>
                      <span className="font-mono tabular-nums text-[hsl(var(--chart-negative))]">-{formatCurrency(Number(item.amount), currency)}</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleEdit(item)} data-testid={`button-edit-expense-${item.id}`}>
                        <Pencil size={14} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-[hsl(var(--chart-negative))]" onClick={() => handleDelete(item.id)} data-testid={`button-delete-expense-${item.id}`}>
                        <Trash2 size={14} />
                      </Button>
                    </>
                  )}
                </div>
              );
            })}

            {expenseItems.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm italic">
                No expenses added yet
              </div>
            )}
          </div>

          <AddCashflowDialog defaultType="expense" onCashflowAdded={refreshCashflows} />
        </div>
      </div>

      {/* Budget — 50/30/20 */}
      <section className="rounded-3xl border border-border bg-card/60 backdrop-blur-xl shadow-sm p-6 lg:p-8 space-y-6" data-testid="section-budget">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[hsl(var(--chart-accent))]/15 flex items-center justify-center text-[hsl(var(--chart-accent))]">
              <PiggyBank size={20} />
            </div>
            <div>
              <h3 className="font-serif text-lg font-light tracking-tight" data-testid="text-budget-title">Budget — {frameworkLabel}</h3>
              <p className="text-xs text-muted-foreground">Needs, wants, savings against the framework</p>
            </div>
          </div>
          {totalIncome > 0 && verdict && (
            <div
              className={
                "text-xs sm:text-sm font-medium rounded-full px-3 py-1 self-start sm:self-end " +
                (verdict.tone === "positive"
                  ? "bg-[hsl(var(--chart-positive))]/15 text-[hsl(var(--chart-positive))]"
                  : verdict.tone === "warning"
                  ? "bg-[hsl(var(--chart-accent))]/15 text-[hsl(var(--chart-accent))]"
                  : "bg-[hsl(var(--chart-negative))]/15 text-[hsl(var(--chart-negative))]")
              }
              data-testid="text-budget-verdict"
            >
              {verdict.text}
            </div>
          )}
        </div>

        {totalIncome <= 0 ? (
          <div className="text-center py-10 text-sm text-muted-foreground">
            Add at least one income source above to see your {frameworkLabel} breakdown.
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground" data-testid="text-budget-summary">
              You're spending{" "}
              <span className="text-foreground font-medium tabular-nums">{formatCurrency(budget.needs, currency)}</span>{" "}
              ({budget.pctNeeds.toFixed(0)}%) on needs,{" "}
              <span className="text-foreground font-medium tabular-nums">{formatCurrency(budget.wants, currency)}</span>{" "}
              ({budget.pctWants.toFixed(0)}%) on wants, and{" "}
              <span className="text-foreground font-medium tabular-nums">
                {budget.savings >= 0
                  ? `saving ${formatCurrency(budget.savings, currency)}`
                  : `running a ${formatCurrency(Math.abs(budget.savings), currency)} deficit`}
              </span>{" "}
              ({budget.pctSavings.toFixed(0)}%).
            </p>

            <div className="space-y-3">
              {budgetTargets.map(t => {
                const target = totalIncome * t.pct;
                const actual = t.key === "needs" ? budget.needs : t.key === "wants" ? budget.wants : budget.savings;
                const actualPct = t.key === "needs" ? budget.pctNeeds : t.key === "wants" ? budget.pctWants : budget.pctSavings;
                const isSpend = t.key !== "savings";
                // For spend buckets: over target = bad. For savings: under target = bad.
                const overspend = isSpend ? actual > target : actual < target;
                const diff = isSpend ? actual - target : target - actual;
                // Bar fill = % of target, clamped to 100% of the bar's width.
                // Overspending is communicated via the row tint, the red amount
                // colour, and the explicit "Over by" flag rather than by letting
                // the bar overflow.
                const fillPct = target > 0 ? Math.min(100, (actual / target) * 100) : 0;
                const barColor = overspend
                  ? "hsl(var(--chart-negative))"
                  : isSpend
                  ? "hsl(var(--chart-accent))"
                  : "hsl(var(--chart-positive))";

                return (
                  <div
                    key={t.key}
                    className={
                      "rounded-2xl border p-4 space-y-2 transition-colors " +
                      (overspend
                        ? "border-[hsl(var(--chart-negative))]/40 bg-[hsl(var(--chart-negative))]/5"
                        : "border-border/60 bg-muted/40")
                    }
                    data-testid={`row-budget-${t.key}`}
                  >
                    <div className="flex items-baseline justify-between gap-2 flex-wrap">
                      <div className="flex items-baseline gap-2">
                        <span className="font-medium text-foreground">{t.label}</span>
                        <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                          target {(t.pct * 100).toFixed(0)}% · {formatCurrency(target, currency)}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span
                          className="font-mono text-base tabular-nums"
                          style={{ color: overspend ? "hsl(var(--chart-negative))" : "hsl(var(--foreground))" }}
                          data-testid={`text-budget-actual-${t.key}`}
                        >
                          {actual < 0 ? "-" : ""}{formatCurrency(Math.abs(actual), currency)}
                        </span>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          ({actualPct.toFixed(0)}%)
                        </span>
                      </div>
                    </div>

                    {/* Bar */}
                    <div className="relative h-1.5 rounded-full bg-border/60 overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full transition-all"
                        style={{ width: `${Math.max(0, Math.min(100, fillPct))}%`, backgroundColor: barColor }}
                      />
                      {/* Marker at the 100%-of-target point */}
                      <div
                        className="absolute inset-y-0 w-px bg-foreground/40"
                        style={{ left: "100%" }}
                        aria-hidden
                      />
                    </div>

                    <p className="text-xs text-muted-foreground flex items-center justify-between gap-2 flex-wrap">
                      <span>{t.description}</span>
                      {overspend && (
                        <span
                          className="text-[hsl(var(--chart-negative))] font-medium"
                          data-testid={`text-budget-flag-${t.key}`}
                        >
                          {isSpend
                            ? `Over by ${formatCurrency(diff, currency)}`
                            : `Under by ${formatCurrency(diff, currency)}`}
                        </span>
                      )}
                    </p>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

import { useCategories, useCreateCategory, useDeleteCategory, useExportData, useImportData, useReorderCategories, useSettings, useUpdateCategory, useUpdateSettings } from "@/hooks/use-finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useRef, useEffect } from "react";
import { Download, Upload, Plus, Trash2, GripVertical, Loader2, Pencil, Save, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { BulkImportExpenses } from "@/components/BulkImportExpenses";
import { daysSince, getLastBackup, isInstalledApp, isStoragePersistent } from "@/lib/deviceStorage";
import { format } from "date-fns";

const BACKUP_STALE_DAYS = 30;

const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "INR", "JPY"];

export default function Settings() {
  const { data: categories } = useCategories();
  const { data: settings } = useSettings();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const reorderCategories = useReorderCategories();
  const updateSettings = useUpdateSettings();
  const exportData = useExportData();
  const importData = useImportData();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newCatName, setNewCatName] = useState("");
  const [budgetPcts, setBudgetPcts] = useState({ needs: "50", wants: "30", savings: "20" });
  const [budgetDirty, setBudgetDirty] = useState(false);
  const [lastBackup, setLastBackup] = useState<Date | null>(() => getLastBackup());
  const [persistent, setPersistent] = useState<boolean | null>(null);

  useEffect(() => {
    isStoragePersistent().then(setPersistent);
  }, []);

  const handleExport = async () => {
    if (await exportData()) {
      setLastBackup(getLastBackup());
      toast({ title: "Backup saved", description: "Keep the file somewhere private." });
    }
  };

  const backupAge = lastBackup ? daysSince(lastBackup) : null;
  const backupStale = backupAge === null || backupAge >= BACKUP_STALE_DAYS;

  useEffect(() => {
    if (settings && !budgetDirty) {
      setBudgetPcts({
        needs: String(settings.budgetNeedsPct ?? 50),
        wants: String(settings.budgetWantsPct ?? 30),
        savings: String(settings.budgetSavingsPct ?? 20),
      });
    }
  }, [settings, budgetDirty]);

  const budgetNums = {
    needs: Number(budgetPcts.needs),
    wants: Number(budgetPcts.wants),
    savings: Number(budgetPcts.savings),
  };
  const budgetSum = budgetNums.needs + budgetNums.wants + budgetNums.savings;
  const budgetValid =
    Number.isFinite(budgetNums.needs) && budgetNums.needs >= 0 &&
    Number.isFinite(budgetNums.wants) && budgetNums.wants >= 0 &&
    Number.isFinite(budgetNums.savings) && budgetNums.savings >= 0 &&
    Math.round(budgetSum * 100) === 10000;

  const handleSaveBudget = () => {
    if (!budgetValid) {
      toast({
        title: "Percentages must total 100",
        description: `Currently they total ${budgetSum}%.`,
        variant: "destructive",
      });
      return;
    }
    updateSettings.mutate(
      {
        budgetNeedsPct: budgetNums.needs,
        budgetWantsPct: budgetNums.wants,
        budgetSavingsPct: budgetNums.savings,
      },
      {
        onSuccess: () => {
          setBudgetDirty(false);
          toast({ title: "Budget framework updated", description: `${budgetNums.needs}/${budgetNums.wants}/${budgetNums.savings} saved.` });
        },
      }
    );
  };

  const handleResetBudget = () => {
    setBudgetPcts({ needs: "50", wants: "30", savings: "20" });
    setBudgetDirty(true);
  };
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [editingCatId, setEditingCatId] = useState<number | null>(null);
  const [editingCatName, setEditingCatName] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingCatId !== null && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingCatId]);

  const startEdit = (id: number, name: string) => {
    setEditingCatId(id);
    setEditingCatName(name);
  };

  const cancelEdit = () => {
    setEditingCatId(null);
    setEditingCatName("");
  };

  const saveEdit = (id: number) => {
    const trimmed = editingCatName.trim();
    if (!trimmed) {
      toast({
        title: "Name required",
        description: "Category name cannot be empty.",
        variant: "destructive",
      });
      requestAnimationFrame(() => editInputRef.current?.focus());
      return;
    }
    updateCategory.mutate(
      { id, data: { name: trimmed } },
      {
        onSuccess: () => {
          cancelEdit();
          toast({ title: "Category updated", description: `Renamed to "${trimmed}".` });
        },
        onError: (err: any) => {
          toast({ title: "Update failed", description: err.message, variant: "destructive" });
        },
      }
    );
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);
        
        // Basic validation
        if (!data.categories || !data.snapshots) {
          throw new Error("Invalid backup file format");
        }

        if (confirm("This will overwrite all current data. Are you sure?")) {
          await importData.mutateAsync(data);
          toast({
            title: "Success",
            description: "Data imported successfully",
          });
        }
      } catch (err: any) {
        toast({
          title: "Import Failed",
          description: err.message,
          variant: "destructive",
        });
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;
    createCategory.mutate({ name: newCatName }, {
      onSuccess: () => setNewCatName("")
    });
  };

  const handleDragStart = (id: number) => {
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetId: number) => {
    if (!draggedId || draggedId === targetId || !categories) return;
    
    const draggedIndex = categories.findIndex(c => c.id === draggedId);
    const targetIndex = categories.findIndex(c => c.id === targetId);
    
    const newOrder = [...categories];
    [newOrder[draggedIndex], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[draggedIndex]];
    
    const orderData = newOrder.map((cat, idx) => ({ id: cat.id, displayOrder: idx }));
    reorderCategories.mutate(orderData);
    setDraggedId(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div>
        <h2 className="font-serif text-3xl md:text-4xl font-light tracking-tight text-foreground">Settings</h2>
        <p className="text-muted-foreground mt-2">Configure your categories and data</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* Categories & Currency Section */}
        <div className="space-y-6">
          {/* Currency */}
          <div className="rounded-3xl border border-border bg-card/60 backdrop-blur-xl p-6 shadow-sm">
            <h3 className="font-serif text-xl font-light tracking-tight mb-4">Currency</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Select your preferred currency for display.
            </p>
            <Select value={settings?.currency || "USD"} onValueChange={(val) => updateSettings.mutate({ currency: val })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map(curr => (
                  <SelectItem key={curr} value={curr}>{curr}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Budget Framework */}
          <div className="rounded-3xl border border-border bg-card/60 backdrop-blur-xl p-6 shadow-sm" data-testid="section-budget-framework">
            <div className="flex items-center justify-between mb-4 gap-2">
              <h3 className="font-serif text-xl font-light tracking-tight">Budget Framework</h3>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={handleResetBudget}
                data-testid="button-reset-budget"
              >
                Reset to 50/30/20
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Customise the target split for needs, wants and savings. They must add up to 100%.
            </p>
            <div className="grid grid-cols-3 gap-3">
              {([
                { key: "needs" as const, label: "Needs" },
                { key: "wants" as const, label: "Wants" },
                { key: "savings" as const, label: "Savings" },
              ]).map(f => (
                <div key={f.key} className="space-y-1.5">
                  <Label htmlFor={`budget-${f.key}`} className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{f.label}</Label>
                  <div className="relative">
                    <Input
                      id={`budget-${f.key}`}
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={100}
                      step={1}
                      value={budgetPcts[f.key]}
                      onChange={(e) => {
                        setBudgetDirty(true);
                        setBudgetPcts(prev => ({ ...prev, [f.key]: e.target.value }));
                      }}
                      className="bg-background pr-7 tabular-nums"
                      data-testid={`input-budget-${f.key}`}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">%</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-4 gap-3">
              <span
                className={
                  "text-xs tabular-nums " +
                  (budgetValid ? "text-muted-foreground" : "text-[hsl(var(--chart-negative))]")
                }
                data-testid="text-budget-sum"
              >
                Total: {Number.isFinite(budgetSum) ? budgetSum : 0}% {budgetValid ? "" : "(must equal 100%)"}
              </span>
              <Button
                size="sm"
                onClick={handleSaveBudget}
                disabled={!budgetValid || !budgetDirty || updateSettings.isPending}
                data-testid="button-save-budget"
              >
                Save
              </Button>
            </div>
          </div>

          {/* Categories Section */}
          <div className="rounded-3xl border border-border bg-card/60 backdrop-blur-xl p-6 shadow-sm">
            <h3 className="font-serif text-xl font-light tracking-tight mb-4">Asset Categories</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Define categories and drag to reorder them.
            </p>

            <form onSubmit={handleAddCategory} className="flex gap-2 mb-6">
              <Input 
                placeholder="New Category Name" 
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="bg-background"
              />
              <Button type="submit" size="icon" disabled={createCategory.isPending}>
                <Plus size={18} />
              </Button>
            </form>

            <div className="space-y-2">
              {categories?.map((cat) => {
                const isEditing = editingCatId === cat.id;
                const isAnyEditing = editingCatId !== null;
                return (
                  <div
                    key={cat.id}
                    draggable={!isAnyEditing}
                    onDragStart={() => !isAnyEditing && handleDragStart(cat.id)}
                    onDragOver={handleDragOver}
                    onDrop={() => !isAnyEditing && handleDrop(cat.id)}
                    className={`flex items-center gap-2 p-3 rounded-xl bg-muted/40 border border-border/60 transition-colors ${isAnyEditing ? "" : "cursor-move hover:bg-muted/70"}`}
                    data-testid={`row-category-${cat.id}`}
                  >
                    <GripVertical size={16} className="text-muted-foreground flex-shrink-0" />
                    {isEditing ? (
                      <>
                        <Input
                          ref={editInputRef}
                          value={editingCatName}
                          onChange={(e) => setEditingCatName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit(cat.id);
                            if (e.key === "Escape") cancelEdit();
                          }}
                          aria-label={`Edit name for ${cat.name}`}
                          className="flex-1 h-8 text-sm bg-background"
                          data-testid={`input-edit-category-${cat.id}`}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-[hsl(var(--chart-positive))] hover:bg-[hsl(var(--chart-positive))]/10"
                          onClick={() => saveEdit(cat.id)}
                          disabled={updateCategory.isPending}
                          aria-label="Save category name"
                          data-testid={`button-save-category-${cat.id}`}
                        >
                          <Save size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground"
                          onClick={cancelEdit}
                          aria-label="Cancel editing"
                          data-testid={`button-cancel-category-${cat.id}`}
                        >
                          <X size={14} />
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1" data-testid={`text-category-name-${cat.id}`}>{cat.name}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                          onClick={() => startEdit(cat.id, cat.name)}
                          data-testid={`button-edit-category-${cat.id}`}
                          aria-label={`Edit ${cat.name}`}
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-[hsl(var(--chart-negative))] hover:bg-[hsl(var(--chart-negative))]/10"
                          onClick={() => deleteCategory.mutate(cat.id)}
                          data-testid={`button-delete-category-${cat.id}`}
                          aria-label={`Delete ${cat.name}`}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </>
                    )}
                  </div>
                );
              })}
              {categories?.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">No categories yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Data Management Section */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-border bg-card/60 backdrop-blur-xl p-6 shadow-sm">
            <h3 className="font-serif text-xl font-light tracking-tight mb-4">Data Management</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Your data is stored only on this device. Export a backup or import data from a JSON file.
            </p>

            <div className="space-y-2 mb-6 text-sm" data-testid="backup-status">
              <p className={backupStale ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}>
                {lastBackup
                  ? `Last backup: ${format(lastBackup, "d MMM yyyy")} (${backupAge === 0 ? "today" : `${backupAge} day${backupAge === 1 ? "" : "s"} ago`})`
                  : "No backup made from this device yet."}
                {backupStale && " Export a backup soon."}
              </p>
              {persistent === false && (
                <p className="text-amber-600 dark:text-amber-400">
                  {isInstalledApp()
                    ? "Your browser may clear this data if storage runs low. Keep regular backups."
                    : "Your browser may clear this data. Install the app to your Home Screen to protect it, and keep regular backups."}
                </p>
              )}
              {persistent === true && (
                <p className="text-muted-foreground">Storage is protected from automatic clearing.</p>
              )}
            </div>

            <div className="flex flex-col gap-4">
              <Button
                variant="outline"
                className="justify-start h-12 gap-3 border-primary/20 hover:bg-primary/10 hover:text-primary"
                onClick={handleExport}
              >
                <Download size={18} />
                Export Data (JSON)
              </Button>
              
              <Button 
                variant="outline" 
                className="justify-start h-12 gap-3"
                onClick={handleImportClick}
                disabled={importData.isPending}
              >
                {importData.isPending ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                Import Data
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="application/json,.json"
                className="hidden"
              />
            </div>
          </div>

          <BulkImportExpenses />

          <div className="rounded-3xl border border-border bg-card/60 backdrop-blur-xl p-6 shadow-sm">
            <h3 className="font-serif text-xl font-light tracking-tight mb-4">Application</h3>
            <div className="flex items-center justify-between text-sm py-2">
               <span className="text-muted-foreground">Version</span>
               <span className="tabular-nums">v1.0.0</span>
            </div>
            <Separator className="my-2 bg-border" />
            <div className="flex items-center justify-between text-sm py-2">
               <span className="text-muted-foreground">Storage</span>
               <span>Local Storage (Synced)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

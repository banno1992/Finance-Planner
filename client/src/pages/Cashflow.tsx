import { useSettings } from "@/hooks/use-finance";
import { AddCashflowDialog } from "@/components/AddCashflowDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, getCurrencySymbol } from "@/lib/currency";
import { Trash2, ArrowUpRight, ArrowDownRight, Save, X, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useCallback } from "react";
import { localDB, Cashflow as CashflowType } from "@/lib/localStorage";

export default function Cashflow() {
  const [cashflows, setCashflows] = useState<CashflowType[]>([]);
  const { data: settings } = useSettings();
  const currency = settings?.currency || "USD";
  
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
  
  const handleUpdate = (id: number, data: { name: string; amount: string }) => {
    localDB.updateCashflow(id, data);
    refreshCashflows();
  };
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<{ name: string; amount: string }>({ name: "", amount: "" });

  const incomeItems = cashflows?.filter(c => c.type === 'income') || [];
  const expenseItems = cashflows?.filter(c => c.type === 'expense') || [];

  const totalIncome = incomeItems.reduce((acc, curr) => acc + Number(curr.amount), 0);
  const totalExpense = expenseItems.reduce((acc, curr) => acc + Number(curr.amount), 0);

  const handleEdit = (id: number, name: string, amount: string) => {
    setEditingId(id);
    setEditValues({ name, amount });
  };

  const handleSave = (id: number) => {
    if (editValues.name && editValues.amount) {
      handleUpdate(id, { name: editValues.name, amount: editValues.amount });
      setEditingId(null);
      setEditValues({ name: "", amount: "" });
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValues({ name: "", amount: "" });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-display font-bold text-white">Cashflow</h2>
        <p className="text-muted-foreground mt-1">Manage your recurring income and expenses</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Income Column */}
        <div className="glass-card rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                <ArrowUpRight size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Income</h3>
                <p className="text-xs text-muted-foreground">Recurring monthly inflows</p>
              </div>
            </div>
            <div className="text-right">
              <span className="block text-2xl font-bold text-green-400">{formatCurrency(totalIncome, currency)}</span>
              <span className="text-xs text-muted-foreground">/ month</span>
            </div>
          </div>

          <div className="space-y-3">
            {incomeItems.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group">
                {editingId === item.id ? (
                  <>
                    <Input 
                      value={editValues.name}
                      onChange={(e) => setEditValues(prev => ({ ...prev, name: e.target.value }))}
                      className="flex-1 h-8 text-sm bg-background/50"
                      placeholder="Name"
                    />
                    <div className="relative">
                      <span className="absolute left-2 top-1.5 text-muted-foreground text-xs">{getCurrencySymbol(currency)}</span>
                      <Input 
                        type="number"
                        value={editValues.amount}
                        onChange={(e) => setEditValues(prev => ({ ...prev, amount: e.target.value }))}
                        className="w-24 h-8 text-sm pl-5 bg-background/50"
                        placeholder="0.00"
                      />
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-green-400"
                      onClick={() => handleSave(item.id)}
                    >
                      <Save size={14} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground"
                      onClick={handleCancel}
                    >
                      <X size={14} />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="font-medium flex-1">{item.name}</span>
                    <span className="font-mono text-green-400">+{formatCurrency(Number(item.amount), currency)}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      onClick={() => handleEdit(item.id, item.name, item.amount.toString())}
                      data-testid={`button-edit-income-${item.id}`}
                    >
                      <Pencil size={14} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-red-400"
                      onClick={() => handleDelete(item.id)}
                      data-testid={`button-delete-income-${item.id}`}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </>
                )}
              </div>
            ))}
            
            {incomeItems.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm italic">
                No income sources added yet
              </div>
            )}
          </div>
          
          <AddCashflowDialog defaultType="income" onCashflowAdded={refreshCashflows} />
        </div>

        {/* Expenses Column */}
        <div className="glass-card rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-400">
                <ArrowDownRight size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Expenses</h3>
                <p className="text-xs text-muted-foreground">Recurring monthly outflows</p>
              </div>
            </div>
            <div className="text-right">
              <span className="block text-2xl font-bold text-red-400">{formatCurrency(totalExpense, currency)}</span>
              <span className="text-xs text-muted-foreground">/ month</span>
            </div>
          </div>

          <div className="space-y-3">
            {expenseItems.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group">
                {editingId === item.id ? (
                  <>
                    <Input 
                      value={editValues.name}
                      onChange={(e) => setEditValues(prev => ({ ...prev, name: e.target.value }))}
                      className="flex-1 h-8 text-sm bg-background/50"
                      placeholder="Name"
                    />
                    <div className="relative">
                      <span className="absolute left-2 top-1.5 text-muted-foreground text-xs">{getCurrencySymbol(currency)}</span>
                      <Input 
                        type="number"
                        value={editValues.amount}
                        onChange={(e) => setEditValues(prev => ({ ...prev, amount: e.target.value }))}
                        className="w-24 h-8 text-sm pl-5 bg-background/50"
                        placeholder="0.00"
                      />
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-green-400"
                      onClick={() => handleSave(item.id)}
                    >
                      <Save size={14} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground"
                      onClick={handleCancel}
                    >
                      <X size={14} />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="font-medium flex-1">{item.name}</span>
                    <span className="font-mono text-red-400">-{formatCurrency(Number(item.amount), currency)}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      onClick={() => handleEdit(item.id, item.name, item.amount.toString())}
                      data-testid={`button-edit-expense-${item.id}`}
                    >
                      <Pencil size={14} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-red-400"
                      onClick={() => handleDelete(item.id)}
                      data-testid={`button-delete-expense-${item.id}`}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </>
                )}
              </div>
            ))}

            {expenseItems.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm italic">
                No expenses added yet
              </div>
            )}
          </div>
          
          <AddCashflowDialog defaultType="expense" onCashflowAdded={refreshCashflows} />
        </div>
      </div>
    </div>
  );
}

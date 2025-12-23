import { useCashflows, useDeleteCashflow } from "@/hooks/use-finance";
import { AddCashflowDialog } from "@/components/AddCashflowDialog";
import { Button } from "@/components/ui/button";
import { Trash2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Cashflow() {
  const { data: cashflows, isLoading } = useCashflows();
  const deleteCashflow = useDeleteCashflow();

  const incomeItems = cashflows?.filter(c => c.type === 'income') || [];
  const expenseItems = cashflows?.filter(c => c.type === 'expense') || [];

  const totalIncome = incomeItems.reduce((acc, curr) => acc + Number(curr.amount), 0);
  const totalExpense = expenseItems.reduce((acc, curr) => acc + Number(curr.amount), 0);

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
              <span className="block text-2xl font-bold text-green-400">${totalIncome.toLocaleString()}</span>
              <span className="text-xs text-muted-foreground">/ month</span>
            </div>
          </div>

          <div className="space-y-3">
            {incomeItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group">
                <span className="font-medium">{item.name}</span>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-green-400">+${Number(item.amount).toLocaleString()}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => deleteCashflow.mutate(item.id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
            
            {incomeItems.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm italic">
                No income sources added yet
              </div>
            )}
          </div>
          
          <AddCashflowDialog />
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
              <span className="block text-2xl font-bold text-red-400">${totalExpense.toLocaleString()}</span>
              <span className="text-xs text-muted-foreground">/ month</span>
            </div>
          </div>

          <div className="space-y-3">
            {expenseItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group">
                <span className="font-medium">{item.name}</span>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-red-400">-${Number(item.amount).toLocaleString()}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => deleteCashflow.mutate(item.id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}

            {expenseItems.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm italic">
                No expenses added yet
              </div>
            )}
          </div>
          
          <AddCashflowDialog />
        </div>
      </div>
    </div>
  );
}

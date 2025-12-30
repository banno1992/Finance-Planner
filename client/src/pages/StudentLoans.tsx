import { useState } from "react";
import { useStudentLoans, useCreateStudentLoan, useUpdateStudentLoan, useDeleteStudentLoan, useSettings } from "@/hooks/use-finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ChartContainer } from "@/components/ChartContainer";
import { Trash2, Plus, Save, X } from "lucide-react";
import { formatCurrency, getCurrencySymbol } from "@/lib/currency";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { addMonths, format } from "date-fns";

export default function StudentLoans() {
  const { data: settings } = useSettings();
  const currency = settings?.currency || "USD";
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [addingNew, setAddingNew] = useState(false);
  const [newLoan, setNewLoan] = useState({ name: "", loanAmount: "", annualInterestRate: "", monthlyPayment: "" });

  const { data: loans = [] } = useStudentLoans();
  const createLoan = useCreateStudentLoan();
  const updateLoan = useUpdateStudentLoan();
  const deleteLoan = useDeleteStudentLoan();

  const calculateLoanSchedule = (loanAmount: number, annualRate: number, monthlyPayment: number) => {
    let remaining = loanAmount;
    let totalInterest = 0;
    let months = 0;
    const monthlyRate = annualRate / 100 / 12;
    const yearlyBreakdown: any[] = [];
    let currentYear = new Date().getFullYear();
    let yearData = { year: currentYear, principal: 0, interest: 0, balance: loanAmount };
    const maxMonths = 600;
    const chartData: any[] = [];

    while (remaining > 0.01 && months < maxMonths) {
      const interestPayment = remaining * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      
      if (principalPayment <= 0) break;
      
      totalInterest += interestPayment;
      remaining -= principalPayment;
      months++;

      const monthDate = addMonths(new Date(), months);
      const year = monthDate.getFullYear();

      if (year !== yearData.year) {
        yearlyBreakdown.push(yearData);
        yearData = { year, principal: 0, interest: 0, balance: remaining };
      }

      yearData.principal += principalPayment;
      yearData.interest += interestPayment;
      yearData.balance = Math.max(0, remaining);

      if (months % 3 === 0) {
        chartData.push({ month: format(monthDate, 'MMM yy'), remaining: Math.max(0, remaining) });
      }
    }

    if (yearData.principal > 0) {
      yearlyBreakdown.push(yearData);
    }

    const payoffDate = addMonths(new Date(), months);
    return { totalInterest, months, payoffDate, isValid: months < maxMonths, yearlyBreakdown, chartData };
  };

  const handleAddNew = () => {
    if (newLoan.name && newLoan.loanAmount && newLoan.annualInterestRate && newLoan.monthlyPayment) {
      createLoan.mutate(newLoan, {
        onSuccess: () => {
          setNewLoan({ name: "", loanAmount: "", annualInterestRate: "", monthlyPayment: "" });
          setAddingNew(false);
        }
      });
    }
  };

  const handleSave = (id: number) => {
    updateLoan.mutate({ id, data: editValues }, {
      onSuccess: () => {
        setEditingId(null);
        setEditValues({});
      }
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div>
        <h2 className="text-3xl font-display font-bold text-white">Student Loans</h2>
        <p className="text-muted-foreground mt-1">Analyze your student loan repayment schedule</p>
      </div>

      {addingNew && (
        <Card className="p-6 border-primary/20 bg-primary/5">
          <Label className="text-sm font-semibold mb-4 block">Add New Loan</Label>
          <div className="space-y-4">
            <Input
              placeholder="Loan name (e.g., Federal Loan)"
              value={newLoan.name}
              onChange={(e) => setNewLoan(prev => ({ ...prev, name: e.target.value }))}
              className="h-8 text-sm"
            />
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Loan Amount</Label>
                <div className="relative">
                  <span className="absolute left-2 top-1.5 text-muted-foreground text-xs">{getCurrencySymbol(currency)}</span>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={newLoan.loanAmount}
                    onChange={(e) => setNewLoan(prev => ({ ...prev, loanAmount: e.target.value }))}
                    className="h-8 text-sm pl-5"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Annual Rate %</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="5.00"
                  value={newLoan.annualInterestRate}
                  onChange={(e) => setNewLoan(prev => ({ ...prev, annualInterestRate: e.target.value }))}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Monthly Payment</Label>
                <div className="relative">
                  <span className="absolute left-2 top-1.5 text-muted-foreground text-xs">{getCurrencySymbol(currency)}</span>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={newLoan.monthlyPayment}
                    onChange={(e) => setNewLoan(prev => ({ ...prev, monthlyPayment: e.target.value }))}
                    className="h-8 text-sm pl-5"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1" onClick={handleAddNew} disabled={createLoan.isPending}>
                Save Loan
              </Button>
              <Button variant="ghost" size="sm" className="flex-1" onClick={() => setAddingNew(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {loans.map((loan: any) => {
        const loanAmount = Number(loan.loanAmount);
        const annualRate = Number(loan.annualInterestRate);
        const monthlyPayment = Number(loan.monthlyPayment);
        const metrics = calculateLoanSchedule(loanAmount, annualRate, monthlyPayment);
        const isEditing = editingId === loan.id;

        return (
          <div key={loan.id} className="space-y-4">
            {isEditing ? (
              <Card className="p-6">
                <div className="space-y-4">
                  <Input
                    value={editValues.name || ""}
                    onChange={(e) => setEditValues(prev => ({ ...prev, name: e.target.value }))}
                    className="h-8 text-sm"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <div className="relative">
                      <span className="absolute left-2 top-1.5 text-muted-foreground text-xs">{getCurrencySymbol(currency)}</span>
                      <Input
                        type="number"
                        value={editValues.loanAmount || ""}
                        onChange={(e) => setEditValues(prev => ({ ...prev, loanAmount: e.target.value }))}
                        className="h-8 text-sm pl-5"
                      />
                    </div>
                    <Input
                      type="number"
                      step="0.01"
                      value={editValues.annualInterestRate || ""}
                      onChange={(e) => setEditValues(prev => ({ ...prev, annualInterestRate: e.target.value }))}
                      className="h-8 text-sm"
                    />
                    <div className="relative">
                      <span className="absolute left-2 top-1.5 text-muted-foreground text-xs">{getCurrencySymbol(currency)}</span>
                      <Input
                        type="number"
                        value={editValues.monthlyPayment || ""}
                        onChange={(e) => setEditValues(prev => ({ ...prev, monthlyPayment: e.target.value }))}
                        className="h-8 text-sm pl-5"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-green-400" onClick={() => handleSave(loan.id)}>
                      <Save size={14} />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingId(null)}>
                      <X size={14} />
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <>
                <Card className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{loan.name}</h3>
                      <p className="text-sm text-muted-foreground">Initial amount: {formatCurrency(loanAmount, currency)}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => {
                        setEditingId(loan.id);
                        setEditValues(loan);
                      }}>
                        Edit
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400" onClick={() => deleteLoan.mutate(loan.id)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-3 bg-white/5 rounded-lg">
                      <p className="text-xs text-muted-foreground">Months to Payoff</p>
                      <p className="font-semibold text-lg text-green-400">{metrics.months}</p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg">
                      <p className="text-xs text-muted-foreground">Payoff Date</p>
                      <p className="font-semibold text-sm">{format(metrics.payoffDate, 'MMM yyyy')}</p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg">
                      <p className="text-xs text-muted-foreground">Total Interest</p>
                      <p className="font-semibold text-lg text-yellow-400">{formatCurrency(metrics.totalInterest, currency)}</p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg">
                      <p className="text-xs text-muted-foreground">Monthly Payment</p>
                      <p className="font-semibold text-sm">{formatCurrency(monthlyPayment, currency)}</p>
                    </div>
                  </div>

                  {!metrics.isValid && (
                    <div className="p-3 bg-red-400/10 border border-red-400/30 rounded-md mb-4">
                      <p className="text-xs text-red-300">Warning: Monthly payment is too low to cover interest.</p>
                    </div>
                  )}
                </Card>

                {metrics.chartData.length > 0 && (
                  <ChartContainer title="Loan Balance Over Time" description="Remaining loan balance projection">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={metrics.chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" fontSize={12} />
                        <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickFormatter={(val) => `${getCurrencySymbol(currency)}${(val/1000).toFixed(0)}k`} />
                        <Tooltip formatter={(value: any) => [formatCurrency(Number(value), currency), 'Balance']} contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px' }} />
                        <Line type="monotone" dataKey="remaining" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                )}

                {metrics.yearlyBreakdown.length > 0 && (
                  <Card className="p-6">
                    <h4 className="font-semibold mb-4">Year-by-Year Breakdown</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="text-left py-2 text-muted-foreground">Year</th>
                            <th className="text-right py-2 text-muted-foreground">Principal</th>
                            <th className="text-right py-2 text-muted-foreground">Interest</th>
                            <th className="text-right py-2 text-muted-foreground">Remaining Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {metrics.yearlyBreakdown.map((year: any) => (
                            <tr key={year.year} className="border-b border-white/5 hover:bg-white/5">
                              <td className="py-2">{year.year}</td>
                              <td className="text-right">{formatCurrency(year.principal, currency)}</td>
                              <td className="text-right text-yellow-400">{formatCurrency(year.interest, currency)}</td>
                              <td className="text-right font-semibold">{formatCurrency(year.balance, currency)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                )}
              </>
            )}
          </div>
        );
      })}

      {!addingNew && (
        <Button variant="outline" className="w-full" onClick={() => setAddingNew(true)}>
          <Plus size={16} className="mr-2" /> Add Student Loan
        </Button>
      )}
    </div>
  );
}

import { useState } from "react";
import { useMortgages, useCreateMortgage, useUpdateMortgage, useDeleteMortgage, useSettings } from "@/hooks/use-finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ChartContainer } from "@/components/ChartContainer";
import { Trash2, Plus, Save, X } from "lucide-react";
import { formatCurrency, getCurrencySymbol } from "@/lib/currency";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { addMonths, format } from "date-fns";

export default function Mortgage() {
  const { data: settings } = useSettings();
  const currency = settings?.currency || "USD";
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [addingNew, setAddingNew] = useState(false);
  const [newMortgage, setNewMortgage] = useState({ 
    name: "", 
    loanAmount: "", 
    annualInterestRate: "", 
    monthlyPayment: "",
    overpayment: "0",
    propertyValue: ""
  });

  const { data: mortgages = [] } = useMortgages();
  const createMortgage = useCreateMortgage();
  const updateMortgage = useUpdateMortgage();
  const deleteMortgage = useDeleteMortgage();

  const calculateMortgageSchedule = (
    loanAmount: number, 
    annualRate: number, 
    monthlyPayment: number, 
    overpayment: number
  ) => {
    let remainingNormal = loanAmount;
    let remainingOver = loanAmount;
    let totalInterestNormal = 0;
    let totalInterestOver = 0;
    let monthsNormal = 0;
    let monthsOver = 0;
    const monthlyRate = annualRate / 100 / 12;
    const maxMonths = 600;
    const chartData: any[] = [];

    // Normal schedule
    while (remainingNormal > 0.01 && monthsNormal < maxMonths) {
      const interest = remainingNormal * monthlyRate;
      const principal = monthlyPayment - interest;
      if (principal <= 0) break;
      remainingNormal -= principal;
      totalInterestNormal += interest;
      monthsNormal++;
    }

    // Overpayment schedule
    const yearlyBreakdown: any[] = [];
    let currentYear = new Date().getFullYear();
    let yearData = { year: currentYear, principal: 0, interest: 0, balance: loanAmount };

    while (remainingOver > 0.01 && monthsOver < maxMonths) {
      const interest = remainingOver * monthlyRate;
      const principal = (monthlyPayment + overpayment) - interest;
      if (principal <= 0) break;
      remainingOver -= principal;
      totalInterestOver += interest;
      monthsOver++;

      const monthDate = addMonths(new Date(), monthsOver);
      const year = monthDate.getFullYear();

      if (year !== yearData.year) {
        yearlyBreakdown.push(yearData);
        yearData = { year, principal: 0, interest: 0, balance: Math.max(0, remainingOver) };
      }
      yearData.principal += principal;
      yearData.interest += interest;
      yearData.balance = Math.max(0, remainingOver);

      if (monthsOver % 6 === 0 || remainingOver <= 0.01) {
        chartData.push({ 
          month: format(monthDate, 'MMM yy'), 
          remaining: Math.max(0, remainingOver),
          months: monthsOver
        });
      }
    }
    if (yearData.principal > 0) yearlyBreakdown.push(yearData);

    return { 
      totalInterestNormal, 
      totalInterestOver, 
      monthsNormal, 
      monthsOver, 
      payoffDate: addMonths(new Date(), monthsOver),
      interestSaved: totalInterestNormal - totalInterestOver,
      yearsSaved: ((monthsNormal - monthsOver) / 12).toFixed(1),
      yearlyBreakdown,
      chartData,
      isValid: monthsOver < maxMonths
    };
  };

  const handleAddNew = () => {
    if (newMortgage.name && newMortgage.loanAmount && newMortgage.annualInterestRate && newMortgage.monthlyPayment && newMortgage.propertyValue) {
      createMortgage.mutate(newMortgage, {
        onSuccess: () => {
          setNewMortgage({ name: "", loanAmount: "", annualInterestRate: "", monthlyPayment: "", overpayment: "0", propertyValue: "" });
          setAddingNew(false);
        }
      });
    }
  };

  const handleSave = (id: number) => {
    updateMortgage.mutate({ id, data: editValues }, {
      onSuccess: () => {
        setEditingId(null);
        setEditValues({});
      }
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div>
        <h2 className="text-3xl font-display font-bold text-white">Mortgage</h2>
        <p className="text-muted-foreground mt-1">Track your property equity and repayment schedule</p>
      </div>

      {addingNew && (
        <Card className="p-6 border-primary/20 bg-primary/5">
          <Label className="text-sm font-semibold mb-4 block">Add New Mortgage</Label>
          <div className="space-y-4">
            <Input
              placeholder="Mortgage Name (e.g., Main Home)"
              value={newMortgage.name}
              onChange={(e) => setNewMortgage(prev => ({ ...prev, name: e.target.value }))}
              className="h-8 text-sm"
            />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Property Value</Label>
                <div className="relative">
                  <span className="absolute left-2 top-1.5 text-muted-foreground text-xs">{getCurrencySymbol(currency)}</span>
                  <Input
                    type="number"
                    value={newMortgage.propertyValue}
                    onChange={(e) => setNewMortgage(prev => ({ ...prev, propertyValue: e.target.value }))}
                    className="h-8 text-sm pl-5"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Loan Amount</Label>
                <div className="relative">
                  <span className="absolute left-2 top-1.5 text-muted-foreground text-xs">{getCurrencySymbol(currency)}</span>
                  <Input
                    type="number"
                    value={newMortgage.loanAmount}
                    onChange={(e) => setNewMortgage(prev => ({ ...prev, loanAmount: e.target.value }))}
                    className="h-8 text-sm pl-5"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Annual Rate %</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newMortgage.annualInterestRate}
                  onChange={(e) => setNewMortgage(prev => ({ ...prev, annualInterestRate: e.target.value }))}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Monthly Payment</Label>
                <div className="relative">
                  <span className="absolute left-2 top-1.5 text-muted-foreground text-xs">{getCurrencySymbol(currency)}</span>
                  <Input
                    type="number"
                    value={newMortgage.monthlyPayment}
                    onChange={(e) => setNewMortgage(prev => ({ ...prev, monthlyPayment: e.target.value }))}
                    className="h-8 text-sm pl-5"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Overpayment</Label>
                <div className="relative">
                  <span className="absolute left-2 top-1.5 text-muted-foreground text-xs">{getCurrencySymbol(currency)}</span>
                  <Input
                    type="number"
                    value={newMortgage.overpayment}
                    onChange={(e) => setNewMortgage(prev => ({ ...prev, overpayment: e.target.value }))}
                    className="h-8 text-sm pl-5"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1" onClick={handleAddNew} disabled={createMortgage.isPending}>
                Save Mortgage
              </Button>
              <Button variant="ghost" size="sm" className="flex-1" onClick={() => setAddingNew(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {mortgages.map((loan: any) => {
        const loanAmount = Number(loan.loanAmount);
        const annualRate = Number(loan.annualInterestRate);
        const monthlyPayment = Number(loan.monthlyPayment);
        const overpayment = Number(loan.overpayment || 0);
        const propertyValue = Number(loan.propertyValue);
        const ltv = ((loanAmount / propertyValue) * 100).toFixed(1);
        const metrics = calculateMortgageSchedule(loanAmount, annualRate, monthlyPayment, overpayment);
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
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <Input
                      type="number"
                      placeholder="Property Value"
                      value={editValues.propertyValue || ""}
                      onChange={(e) => setEditValues(prev => ({ ...prev, propertyValue: e.target.value }))}
                      className="h-8 text-sm"
                    />
                    <Input
                      type="number"
                      placeholder="Loan Amount"
                      value={editValues.loanAmount || ""}
                      onChange={(e) => setEditValues(prev => ({ ...prev, loanAmount: e.target.value }))}
                      className="h-8 text-sm"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Rate %"
                      value={editValues.annualInterestRate || ""}
                      onChange={(e) => setEditValues(prev => ({ ...prev, annualInterestRate: e.target.value }))}
                      className="h-8 text-sm"
                    />
                    <Input
                      type="number"
                      placeholder="Monthly"
                      value={editValues.monthlyPayment || ""}
                      onChange={(e) => setEditValues(prev => ({ ...prev, monthlyPayment: e.target.value }))}
                      className="h-8 text-sm"
                    />
                    <Input
                      type="number"
                      placeholder="Overpayment"
                      value={editValues.overpayment || ""}
                      onChange={(e) => setEditValues(prev => ({ ...prev, overpayment: e.target.value }))}
                      className="h-8 text-sm"
                    />
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
                      <div className="flex gap-4 mt-1 flex-wrap">
                        <p className="text-sm text-muted-foreground">LTV: <span className="text-white font-medium">{ltv}%</span></p>
                        <p className="text-sm text-muted-foreground">Remaining: <span className="text-orange-400 font-medium">{formatCurrency(loanAmount, currency)}</span></p>
                        <p className="text-sm text-muted-foreground">Equity: <span className="text-green-400 font-medium">{formatCurrency(propertyValue - loanAmount, currency)}</span></p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => {
                        setEditingId(loan.id);
                        setEditValues(loan);
                      }}>Edit</Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400" onClick={() => deleteMortgage.mutate(loan.id)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-3 bg-white/5 rounded-lg">
                      <p className="text-xs text-muted-foreground">Years to Payoff</p>
                      <p className="font-semibold text-lg text-green-400">{(metrics.monthsOver / 12).toFixed(1)}</p>
                      {Number(metrics.yearsSaved) > 0 && <p className="text-[10px] text-green-500">Saved {metrics.yearsSaved} years</p>}
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg">
                      <p className="text-xs text-muted-foreground">Payoff Date</p>
                      <p className="font-semibold text-sm">{format(metrics.payoffDate, 'MMM yyyy')}</p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg">
                      <p className="text-xs text-muted-foreground">Interest Saved</p>
                      <p className="font-semibold text-lg text-yellow-400">{formatCurrency(metrics.interestSaved, currency)}</p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg">
                      <p className="text-xs text-muted-foreground">Monthly + Over</p>
                      <p className="font-semibold text-sm">{formatCurrency(monthlyPayment + overpayment, currency)}</p>
                    </div>
                  </div>
                </Card>

                {metrics.chartData.length > 0 && (
                  <ChartContainer title="Mortgage Balance Projection" description="Remaining balance with overpayments">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={metrics.chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" fontSize={10} />
                        <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickFormatter={(val) => `${getCurrencySymbol(currency)}${(val/1000).toFixed(0)}k`} />
                        <Tooltip formatter={(value: any) => [formatCurrency(Number(value), currency), 'Balance']} contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px' }} />
                        <Line type="monotone" dataKey="remaining" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                )}

                <Card className="p-6">
                  <h4 className="font-semibold mb-4">Amortization Table (Yearly)</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-white/10 text-muted-foreground">
                          <th className="text-left py-2">Year</th>
                          <th className="text-right py-2">Principal Paid</th>
                          <th className="text-right py-2">Interest Paid</th>
                          <th className="text-right py-2">Year-End Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {metrics.yearlyBreakdown.map((year: any) => (
                          <tr key={year.year} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="py-2 text-muted-foreground">{year.year}</td>
                            <td className="text-right">{formatCurrency(year.principal, currency)}</td>
                            <td className="text-right text-yellow-400/80">{formatCurrency(year.interest, currency)}</td>
                            <td className="text-right font-medium">{formatCurrency(year.balance, currency)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </>
            )}
          </div>
        );
      })}

      {!addingNew && (
        <Button variant="outline" className="w-full" onClick={() => setAddingNew(true)}>
          <Plus size={16} className="mr-2" /> Add Mortgage
        </Button>
      )}
    </div>
  );
}

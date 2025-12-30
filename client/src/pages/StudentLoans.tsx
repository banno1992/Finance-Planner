import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Trash2, Plus, Save, X } from "lucide-react";
import { formatCurrency, getCurrencySymbol } from "@/lib/currency";
import { useSettings } from "@/hooks/use-finance";
import { api, buildUrl } from "@shared/routes";
import { insertStudentLoanSchema } from "@shared/schema";

export default function StudentLoans() {
  const { data: settings } = useSettings();
  const currency = settings?.currency || "USD";
  const queryClient = useQueryClient();
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [addingNew, setAddingNew] = useState(false);
  const [newLoan, setNewLoan] = useState({ name: "", loanAmount: "", annualInterestRate: "", monthlyPayment: "" });

  const { data: loans = [] } = useQuery({
    queryKey: ["/api/student-loans"],
    queryFn: () => fetch(api.studentLoans.list.path).then(r => r.json()),
  });

  const createLoan = useMutation({
    mutationFn: (loan: any) => 
      fetch(api.studentLoans.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loan),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/student-loans"] });
      setNewLoan({ name: "", loanAmount: "", annualInterestRate: "", monthlyPayment: "" });
      setAddingNew(false);
    },
  });

  const updateLoan = useMutation({
    mutationFn: (data: any) => 
      fetch(buildUrl(api.studentLoans.update.path, { id: data.id }), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.updates),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/student-loans"] });
      setEditingId(null);
      setEditValues({});
    },
  });

  const deleteLoan = useMutation({
    mutationFn: (id: number) =>
      fetch(buildUrl(api.studentLoans.delete.path, { id }), { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/student-loans"] });
    },
  });

  const calculateLoanMetrics = (loanAmount: number, annualRate: number, monthlyPayment: number) => {
    let remaining = loanAmount;
    let totalInterest = 0;
    let months = 0;
    const monthlyRate = annualRate / 100 / 12;
    const maxMonths = 600; // 50 years safety limit

    while (remaining > 0.01 && months < maxMonths) {
      const interestPayment = remaining * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      
      if (principalPayment <= 0) break; // Payment too low
      
      totalInterest += interestPayment;
      remaining -= principalPayment;
      months++;
    }

    const years = (months / 12).toFixed(1);
    return { totalInterest, months, years, isValid: months < maxMonths };
  };

  const handleEdit = (loan: any) => {
    setEditingId(loan.id);
    setEditValues({
      name: loan.name,
      loanAmount: loan.loanAmount,
      annualInterestRate: loan.annualInterestRate,
      monthlyPayment: loan.monthlyPayment,
    });
  };

  const handleSave = (id: number) => {
    updateLoan.mutate({ id, updates: editValues });
  };

  const handleAddNew = () => {
    if (newLoan.name && newLoan.loanAmount && newLoan.annualInterestRate && newLoan.monthlyPayment) {
      createLoan.mutate(newLoan);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h2 className="text-3xl font-display font-bold text-white">Student Loans</h2>
        <p className="text-muted-foreground mt-1">Track and analyze your student loan repayment</p>
      </div>

      {/* Add New Loan Form */}
      {addingNew && (
        <Card className="p-6 border-primary/20 bg-primary/5">
          <Label className="text-sm font-semibold mb-4 block">New Student Loan</Label>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Loan Name</Label>
              <Input
                placeholder="e.g., Federal Loan"
                value={newLoan.name}
                onChange={(e) => setNewLoan(prev => ({ ...prev, name: e.target.value }))}
                className="h-8 text-sm"
              />
            </div>
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
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                className="flex-1 h-8 text-xs"
                onClick={handleAddNew}
                disabled={createLoan.isPending}
              >
                Save Loan
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 h-8 text-xs"
                onClick={() => setAddingNew(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Loans List */}
      <div className="space-y-4">
        {loans.length === 0 && !addingNew ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="mb-4">No student loans yet. Add one to get started.</p>
          </div>
        ) : (
          loans.map((loan: any) => {
            const loanAmount = Number(loan.loanAmount);
            const annualRate = Number(loan.annualInterestRate);
            const monthlyPayment = Number(loan.monthlyPayment);
            const metrics = calculateLoanMetrics(loanAmount, annualRate, monthlyPayment);
            const isEditing = editingId === loan.id;

            return (
              <Card key={loan.id} className="p-6">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Loan Name</Label>
                      <Input
                        value={editValues.name || ""}
                        onChange={(e) => setEditValues(prev => ({ ...prev, name: e.target.value }))}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">Loan Amount</Label>
                        <div className="relative">
                          <span className="absolute left-2 top-1.5 text-muted-foreground text-xs">{getCurrencySymbol(currency)}</span>
                          <Input
                            type="number"
                            value={editValues.loanAmount || ""}
                            onChange={(e) => setEditValues(prev => ({ ...prev, loanAmount: e.target.value }))}
                            className="h-8 text-sm pl-5"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">Annual Rate %</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={editValues.annualInterestRate || ""}
                          onChange={(e) => setEditValues(prev => ({ ...prev, annualInterestRate: e.target.value }))}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">Monthly Payment</Label>
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
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-green-400"
                        onClick={() => handleSave(loan.id)}
                        disabled={updateLoan.isPending}
                      >
                        <Save size={14} />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground"
                        onClick={() => setEditingId(null)}
                      >
                        <X size={14} />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{loan.name}</h3>
                        <p className="text-sm text-muted-foreground">Current balance: {formatCurrency(loanAmount, currency)}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(loan)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-red-400"
                          onClick={() => deleteLoan.mutate(loan.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Annual Interest Rate</p>
                        <p className="font-semibold">{Number(annualRate).toFixed(2)}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Monthly Payment</p>
                        <p className="font-semibold">{formatCurrency(monthlyPayment, currency)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Total Interest (Projected)</p>
                        <p className="font-semibold text-yellow-400">{formatCurrency(metrics.totalInterest, currency)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Payoff Timeline</p>
                        <p className="font-semibold text-green-400">{metrics.years} years ({metrics.months} months)</p>
                      </div>
                    </div>

                    {!metrics.isValid && (
                      <div className="mt-4 p-3 bg-red-400/10 border border-red-400/30 rounded-md">
                        <p className="text-xs text-red-300">Warning: Monthly payment may be too low to cover interest charges.</p>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {!addingNew && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setAddingNew(true)}
        >
          <Plus size={16} className="mr-2" /> Add Student Loan
        </Button>
      )}
    </div>
  );
}

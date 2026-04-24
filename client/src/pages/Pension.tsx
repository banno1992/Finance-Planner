import { useState, useMemo } from "react";
import { usePensions, useCreatePension, useUpdatePension, useDeletePension, useSettings } from "@/hooks/use-finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/currency";
import { Plus, Trash2, Edit2, Save, X, TrendingUp, PiggyBank, Target, Calculator, Loader2, Info, Landmark, Calendar } from "lucide-react";
import { differenceInYears, parseISO } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart, ReferenceLine } from "recharts";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const UK_STATE_PENSION_WEEKLY_2024 = 221.20;
const UK_STATE_PENSION_AGE = 67;

interface PensionFormData {
  name: string;
  currentAge: number;
  retirementAge: number;
  currentPotValue: string;
  userMonthlyContribution: string;
  employerMonthlyContribution: string;
  expectedGrowthRate: string;
  lowGrowthRate: string;
  highGrowthRate: string;
  inflationRate: string;
  includeStatePension: boolean;
  includeInNetWorth: boolean;
  dateOfBirth: string;
}

function calculateAgeFromDob(dob: string): number {
  try {
    return differenceInYears(new Date(), parseISO(dob));
  } catch {
    return 0;
  }
}

const defaultFormData: PensionFormData = {
  name: "My Pension",
  currentAge: 30,
  retirementAge: 65,
  currentPotValue: "25000",
  userMonthlyContribution: "400",
  employerMonthlyContribution: "200",
  expectedGrowthRate: "5",
  lowGrowthRate: "3",
  highGrowthRate: "7",
  inflationRate: "2.5",
  includeStatePension: true,
  includeInNetWorth: false,
  dateOfBirth: "",
};

export default function Pension() {
  const { data: pensions, isLoading } = usePensions();
  const { data: settings } = useSettings();
  const createPension = useCreatePension();
  const updatePension = useUpdatePension();
  const deletePension = useDeletePension();
  const { toast } = useToast();

  const currency = settings?.currency || "GBP";
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<PensionFormData>(defaultFormData);
  const [sensitivityContribution, setSensitivityContribution] = useState(0);
  const [showInflationAdjusted, setShowInflationAdjusted] = useState(true);
  const [selectedScenario, setSelectedScenario] = useState<"low" | "medium" | "high">("medium");

  const pension = pensions?.[0];

  const projections = useMemo(() => {
    const p = editingId !== null || isAdding ? formData : pension ? {
      currentAge: (pension as any).dateOfBirth ? calculateAgeFromDob((pension as any).dateOfBirth) : pension.currentAge,
      retirementAge: pension.retirementAge,
      currentPotValue: pension.currentPotValue,
      userMonthlyContribution: pension.userMonthlyContribution,
      employerMonthlyContribution: pension.employerMonthlyContribution,
      expectedGrowthRate: pension.expectedGrowthRate,
      lowGrowthRate: pension.lowGrowthRate || "3",
      highGrowthRate: pension.highGrowthRate || "7",
      inflationRate: pension.inflationRate || "2.5",
      includeStatePension: pension.includeStatePension === 1,
    } : null;

    if (!p) return [];

    const yearsToRetirement = p.retirementAge - p.currentAge;
    const data = [];

    for (let year = 0; year <= yearsToRetirement; year++) {
      const age = p.currentAge + year;
      const totalMonthlyContrib = parseFloat(p.userMonthlyContribution) + parseFloat(p.employerMonthlyContribution) + sensitivityContribution;
      const annualContrib = totalMonthlyContrib * 12;

      const calcValue = (rate: number, startValue: number) => {
        let value = startValue;
        for (let y = 0; y < year; y++) {
          value = value * (1 + rate / 100) + annualContrib;
        }
        return value;
      };

      const lowValue = calcValue(parseFloat(p.lowGrowthRate), parseFloat(p.currentPotValue));
      const medValue = calcValue(parseFloat(p.expectedGrowthRate), parseFloat(p.currentPotValue));
      const highValue = calcValue(parseFloat(p.highGrowthRate), parseFloat(p.currentPotValue));

      const inflationRate = parseFloat(p.inflationRate) / 100;
      const inflationFactor = Math.pow(1 + inflationRate, year);

      data.push({
        age,
        year: new Date().getFullYear() + year,
        low: Math.round(lowValue),
        medium: Math.round(medValue),
        high: Math.round(highValue),
        lowReal: Math.round(lowValue / inflationFactor),
        mediumReal: Math.round(medValue / inflationFactor),
        highReal: Math.round(highValue / inflationFactor),
      });
    }

    return data;
  }, [pension, formData, isAdding, editingId, sensitivityContribution]);

  const retirementSummary = useMemo(() => {
    const p = editingId !== null || isAdding ? formData : pension ? {
      retirementAge: pension.retirementAge,
      currentAge: (pension as any).dateOfBirth ? calculateAgeFromDob((pension as any).dateOfBirth) : pension.currentAge,
      inflationRate: pension.inflationRate || "2.5",
      includeStatePension: pension.includeStatePension === 1,
    } : null;

    if (!p || projections.length === 0) return null;

    const finalProjection = projections[projections.length - 1];
    const yearsToRetirement = p.retirementAge - p.currentAge;
    const inflationRate = parseFloat(p.inflationRate) / 100;
    const inflationFactor = Math.pow(1 + inflationRate, yearsToRetirement);

    const drawdownRate = 0.04;
    
    const annualStatePension = UK_STATE_PENSION_WEEKLY_2024 * 52;
    const qualifiesForStatePension = p.retirementAge >= UK_STATE_PENSION_AGE;
    const includeState = p.includeStatePension && qualifiesForStatePension;

    return {
      potLow: finalProjection.low,
      potMedium: finalProjection.medium,
      potHigh: finalProjection.high,
      potLowReal: finalProjection.lowReal,
      potMediumReal: finalProjection.mediumReal,
      potHighReal: finalProjection.highReal,
      annualDrawdownLow: Math.round(finalProjection.low * drawdownRate),
      annualDrawdownMedium: Math.round(finalProjection.medium * drawdownRate),
      annualDrawdownHigh: Math.round(finalProjection.high * drawdownRate),
      monthlyDrawdownLow: Math.round((finalProjection.low * drawdownRate) / 12),
      monthlyDrawdownMedium: Math.round((finalProjection.medium * drawdownRate) / 12),
      monthlyDrawdownHigh: Math.round((finalProjection.high * drawdownRate) / 12),
      statePensionAnnual: includeState ? Math.round(annualStatePension) : 0,
      statePensionMonthly: includeState ? Math.round(annualStatePension / 12) : 0,
      totalAnnualLow: includeState ? Math.round(finalProjection.low * drawdownRate + annualStatePension) : Math.round(finalProjection.low * drawdownRate),
      totalAnnualMedium: includeState ? Math.round(finalProjection.medium * drawdownRate + annualStatePension) : Math.round(finalProjection.medium * drawdownRate),
      totalAnnualHigh: includeState ? Math.round(finalProjection.high * drawdownRate + annualStatePension) : Math.round(finalProjection.high * drawdownRate),
      totalMonthlyLow: includeState ? Math.round((finalProjection.low * drawdownRate + annualStatePension) / 12) : Math.round((finalProjection.low * drawdownRate) / 12),
      totalMonthlyMedium: includeState ? Math.round((finalProjection.medium * drawdownRate + annualStatePension) / 12) : Math.round((finalProjection.medium * drawdownRate) / 12),
      totalMonthlyHigh: includeState ? Math.round((finalProjection.high * drawdownRate + annualStatePension) / 12) : Math.round((finalProjection.high * drawdownRate) / 12),
      totalMonthlyLowReal: includeState ? Math.round((finalProjection.lowReal * drawdownRate + annualStatePension / inflationFactor) / 12) : Math.round((finalProjection.lowReal * drawdownRate) / 12),
      totalMonthlyMediumReal: includeState ? Math.round((finalProjection.mediumReal * drawdownRate + annualStatePension / inflationFactor) / 12) : Math.round((finalProjection.mediumReal * drawdownRate) / 12),
      totalMonthlyHighReal: includeState ? Math.round((finalProjection.highReal * drawdownRate + annualStatePension / inflationFactor) / 12) : Math.round((finalProjection.highReal * drawdownRate) / 12),
    };
  }, [projections, pension, formData, isAdding, editingId]);

  const evaluateExpression = (val: string): string => {
    const trimmed = val.trim();
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) return trimmed;
    if (!/^\d+(\.\d+)?(\s*[+\-]\s*\d+(\.\d+)?)+$/.test(trimmed)) return val;
    const tokens = trimmed.match(/[+\-]|\d+(\.\d+)?/g);
    if (!tokens) return val;
    let result = parseFloat(tokens[0]);
    for (let i = 1; i < tokens.length; i += 2) {
      const op = tokens[i];
      const num = parseFloat(tokens[i + 1]);
      if (isNaN(num)) return val;
      if (op === '+') result += num;
      else if (op === '-') result -= num;
    }
    return String(Math.round(result * 100) / 100);
  };

  const handleSave = async () => {
    try {
      const resolvedPotValue = evaluateExpression(formData.currentPotValue);
      if (isNaN(parseFloat(resolvedPotValue))) {
        toast({ title: "Invalid pot value", description: "Please enter a number or expression like 1000+2000", variant: "destructive" });
        return;
      }
      const effectiveAge = formData.dateOfBirth 
        ? calculateAgeFromDob(formData.dateOfBirth) 
        : formData.currentAge;
      const data: any = {
        name: formData.name,
        currentAge: effectiveAge,
        retirementAge: formData.retirementAge,
        currentPotValue: resolvedPotValue,
        userMonthlyContribution: formData.userMonthlyContribution,
        employerMonthlyContribution: formData.employerMonthlyContribution,
        expectedGrowthRate: formData.expectedGrowthRate,
        lowGrowthRate: formData.lowGrowthRate,
        highGrowthRate: formData.highGrowthRate,
        inflationRate: formData.inflationRate,
        includeStatePension: formData.includeStatePension ? 1 : 0,
        includeInNetWorth: formData.includeInNetWorth ? 1 : 0,
        dateOfBirth: formData.dateOfBirth || undefined,
      };

      if (editingId !== null) {
        await updatePension.mutateAsync({ id: editingId, data });
        toast({ title: "Pension updated" });
      } else {
        await createPension.mutateAsync(data);
        toast({ title: "Pension created" });
      }
      setIsAdding(false);
      setEditingId(null);
      setFormData(defaultFormData);
    } catch (e) {
      toast({ title: "Error saving pension", variant: "destructive" });
    }
  };

  const handleEdit = (p: any) => {
    const dob = p.dateOfBirth || "";
    const age = dob ? calculateAgeFromDob(dob) : p.currentAge;
    setFormData({
      name: p.name,
      currentAge: age,
      retirementAge: p.retirementAge,
      currentPotValue: p.currentPotValue,
      userMonthlyContribution: p.userMonthlyContribution,
      employerMonthlyContribution: p.employerMonthlyContribution,
      expectedGrowthRate: p.expectedGrowthRate,
      lowGrowthRate: p.lowGrowthRate || "3",
      highGrowthRate: p.highGrowthRate || "7",
      inflationRate: p.inflationRate || "2.5",
      includeStatePension: p.includeStatePension === 1,
      includeInNetWorth: p.includeInNetWorth === 1,
      dateOfBirth: dob,
    });
    setEditingId(p.id);
  };

  const handleDelete = async (id: number) => {
    try {
      await deletePension.mutateAsync(id);
      toast({ title: "Pension deleted" });
    } catch (e) {
      toast({ title: "Error deleting pension", variant: "destructive" });
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData(defaultFormData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const showForm = isAdding || editingId !== null;
  const hasPension = pensions && pensions.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="font-serif text-3xl md:text-4xl font-light tracking-tight text-foreground">Pension Tracker</h2>
          <p className="text-muted-foreground mt-2">Plan your retirement with scenario modeling and projections</p>
        </div>
        {!showForm && !hasPension && (
          <Button onClick={() => setIsAdding(true)} data-testid="button-add-pension">
            <Plus size={18} className="mr-2" />
            Add Pension
          </Button>
        )}
      </div>

      {(showForm || hasPension) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1 rounded-3xl border-border bg-card/60 backdrop-blur-xl shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
              <CardTitle className="flex items-center gap-2 font-serif text-lg font-light tracking-tight">
                <Landmark size={18} className="text-primary" />
                Pension Details
              </CardTitle>
              {hasPension && !showForm && (
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" onClick={() => handleEdit(pension)} data-testid="button-edit-pension">
                    <Edit2 size={16} />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(pension!.id)} data-testid="button-delete-pension">
                    <Trash2 size={16} className="text-destructive" />
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {showForm ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Pension Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      data-testid="input-pension-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth (optional)</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => {
                        const dob = e.target.value;
                        const age = dob ? calculateAgeFromDob(dob) : formData.currentAge;
                        setFormData({ ...formData, dateOfBirth: dob, currentAge: age });
                      }}
                      data-testid="input-date-of-birth"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentAge">Current Age</Label>
                      <Input
                        id="currentAge"
                        type="number"
                        value={formData.currentAge}
                        onChange={(e) => setFormData({ ...formData, currentAge: parseInt(e.target.value) || 0, dateOfBirth: "" })}
                        disabled={!!formData.dateOfBirth}
                        data-testid="input-current-age"
                      />
                      {formData.dateOfBirth && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar size={10} /> Calculated from DOB
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="retirementAge">Retirement Age</Label>
                      <Input
                        id="retirementAge"
                        type="number"
                        value={formData.retirementAge}
                        onChange={(e) => setFormData({ ...formData, retirementAge: parseInt(e.target.value) || 0 })}
                        data-testid="input-retirement-age"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currentPot">Current Pot Value</Label>
                    <Input
                      id="currentPot"
                      type="text"
                      inputMode="decimal"
                      value={formData.currentPotValue}
                      onChange={(e) => setFormData({ ...formData, currentPotValue: e.target.value })}
                      onBlur={() => {
                        const resolved = evaluateExpression(formData.currentPotValue);
                        if (resolved !== formData.currentPotValue) {
                          setFormData(prev => ({ ...prev, currentPotValue: resolved }));
                        }
                      }}
                      placeholder="e.g. 1000+2000"
                      data-testid="input-current-pot"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="userContrib">Your Monthly</Label>
                      <Input
                        id="userContrib"
                        type="number"
                        value={formData.userMonthlyContribution}
                        onChange={(e) => setFormData({ ...formData, userMonthlyContribution: e.target.value })}
                        data-testid="input-user-contribution"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="employerContrib">Employer Monthly</Label>
                      <Input
                        id="employerContrib"
                        type="number"
                        value={formData.employerMonthlyContribution}
                        onChange={(e) => setFormData({ ...formData, employerMonthlyContribution: e.target.value })}
                        data-testid="input-employer-contribution"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="lowGrowth" className="text-xs">Low Growth %</Label>
                      <Input
                        id="lowGrowth"
                        type="number"
                        step="0.1"
                        value={formData.lowGrowthRate}
                        onChange={(e) => setFormData({ ...formData, lowGrowthRate: e.target.value })}
                        data-testid="input-low-growth"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="medGrowth" className="text-xs">Medium %</Label>
                      <Input
                        id="medGrowth"
                        type="number"
                        step="0.1"
                        value={formData.expectedGrowthRate}
                        onChange={(e) => setFormData({ ...formData, expectedGrowthRate: e.target.value })}
                        data-testid="input-expected-growth"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="highGrowth" className="text-xs">High %</Label>
                      <Input
                        id="highGrowth"
                        type="number"
                        step="0.1"
                        value={formData.highGrowthRate}
                        onChange={(e) => setFormData({ ...formData, highGrowthRate: e.target.value })}
                        data-testid="input-high-growth"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inflation">Inflation Rate %</Label>
                    <Input
                      id="inflation"
                      type="number"
                      step="0.1"
                      value={formData.inflationRate}
                      onChange={(e) => setFormData({ ...formData, inflationRate: e.target.value })}
                      data-testid="input-inflation"
                    />
                  </div>
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="statePension"
                        checked={formData.includeStatePension}
                        onCheckedChange={(checked) => setFormData({ ...formData, includeStatePension: !!checked })}
                        data-testid="checkbox-state-pension"
                      />
                      <Label htmlFor="statePension" className="text-sm cursor-pointer">
                        Include UK State Pension (full NI)
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="includeNetWorth"
                        checked={formData.includeInNetWorth}
                        onCheckedChange={(checked) => setFormData({ ...formData, includeInNetWorth: !!checked })}
                        data-testid="checkbox-include-net-worth"
                      />
                      <Label htmlFor="includeNetWorth" className="text-sm cursor-pointer">
                        Include in Net Worth
                      </Label>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleSave} className="flex-1" disabled={createPension.isPending || updatePension.isPending} data-testid="button-save-pension">
                      {(createPension.isPending || updatePension.isPending) ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} className="mr-2" />}
                      Save
                    </Button>
                    <Button variant="ghost" onClick={handleCancel} className="flex-1" data-testid="button-cancel-pension">
                      <X size={16} className="mr-2" />
                      Cancel
                    </Button>
                  </div>
                </>
              ) : pension ? (
                <div className="space-y-4">
                  <div className="text-center p-5 bg-primary/10 rounded-2xl border border-primary/20">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Current Pot Value</p>
                    <p className="font-serif text-3xl font-light text-primary tabular-nums mt-2">{formatCurrency(parseFloat(pension.currentPotValue), currency)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 bg-muted/40 rounded-xl border border-border/60">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Current Age</p>
                      <p className="font-serif text-lg font-light text-foreground tabular-nums mt-1">
                        {(pension as any).dateOfBirth ? calculateAgeFromDob((pension as any).dateOfBirth) : pension.currentAge}
                      </p>
                      {(pension as any).dateOfBirth && (
                        <p className="text-xs text-muted-foreground mt-0.5">DOB: {(pension as any).dateOfBirth}</p>
                      )}
                    </div>
                    <div className="p-3 bg-muted/40 rounded-xl border border-border/60">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Retirement Age</p>
                      <p className="font-serif text-lg font-light text-foreground tabular-nums mt-1">{pension.retirementAge}</p>
                    </div>
                    <div className="p-3 bg-muted/40 rounded-xl border border-border/60">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Your Monthly</p>
                      <p className="font-serif text-lg font-light text-foreground tabular-nums mt-1">{formatCurrency(parseFloat(pension.userMonthlyContribution), currency)}</p>
                    </div>
                    <div className="p-3 bg-muted/40 rounded-xl border border-border/60">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Employer Monthly</p>
                      <p className="font-serif text-lg font-light text-foreground tabular-nums mt-1">{formatCurrency(parseFloat(pension.employerMonthlyContribution), currency)}</p>
                    </div>
                  </div>
                  <div className="text-sm space-y-1">
                    <p className="text-muted-foreground">Growth Scenarios: <span className="tabular-nums">{pension.lowGrowthRate || "3"}% / {pension.expectedGrowthRate}% / {pension.highGrowthRate || "7"}%</span></p>
                    <p className="text-muted-foreground">Inflation: <span className="tabular-nums">{pension.inflationRate || "2.5"}%</span></p>
                    {pension.includeStatePension === 1 && pension.retirementAge >= UK_STATE_PENSION_AGE && (
                      <p className="text-[hsl(var(--chart-positive))] text-xs">+ UK State Pension included (from age {UK_STATE_PENSION_AGE})</p>
                    )}
                    {pension.includeStatePension === 1 && pension.retirementAge < UK_STATE_PENSION_AGE && (
                      <p className="text-amber-600 dark:text-amber-400 text-xs">State Pension starts at age {UK_STATE_PENSION_AGE}</p>
                    )}
                    {pension.includeInNetWorth === 1 && (
                      <p className="text-primary text-xs">Included in Net Worth</p>
                    )}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            {projections.length > 0 && (
              <>
                <Card className="rounded-3xl border-border bg-card/60 backdrop-blur-xl shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <CardTitle className="flex items-center gap-2 font-serif text-lg font-light tracking-tight">
                        <TrendingUp size={18} className="text-primary" />
                        Pension Growth Projection
                      </CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs px-2 gap-1"
                        onClick={() => setShowInflationAdjusted(prev => !prev)}
                        data-testid="button-chart-inflation-toggle"
                      >
                        {showInflationAdjusted ? "Real (today's £)" : "Nominal"}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={projections}>
                          <defs>
                            <linearGradient id="colorLow" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--chart-negative))" stopOpacity={0.25}/>
                              <stop offset="95%" stopColor="hsl(var(--chart-negative))" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorMed" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--chart-accent))" stopOpacity={0.35}/>
                              <stop offset="95%" stopColor="hsl(var(--chart-accent))" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--chart-positive))" stopOpacity={0.25}/>
                              <stop offset="95%" stopColor="hsl(var(--chart-positive))" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis 
                            dataKey="age" 
                            stroke="hsl(var(--muted-foreground))"
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis 
                            stroke="hsl(var(--muted-foreground))"
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                            tickLine={false}
                            axisLine={false}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--card))', 
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '12px',
                              color: 'hsl(var(--foreground))'
                            }}
                            itemStyle={{ color: 'hsl(var(--foreground))' }}
                            labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                            formatter={(value: number) => formatCurrency(value, currency)}
                            labelFormatter={(label) => `Age ${label}`}
                          />
                          <Legend />
                          <Area 
                            type="monotone" 
                            dataKey={showInflationAdjusted ? "lowReal" : "low"} 
                            stroke="hsl(var(--chart-negative))" 
                            fill="url(#colorLow)"
                            name="Low (3%)"
                          />
                          <Area 
                            type="monotone" 
                            dataKey={showInflationAdjusted ? "mediumReal" : "medium"} 
                            stroke="hsl(var(--chart-accent))" 
                            fill="url(#colorMed)"
                            name="Medium (5%)"
                            strokeWidth={2}
                          />
                          <Area 
                            type="monotone" 
                            dataKey={showInflationAdjusted ? "highReal" : "high"} 
                            stroke="hsl(var(--chart-positive))" 
                            fill="url(#colorHigh)"
                            name="High (7%)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {retirementSummary && (() => {
                  const scenarioConfig = {
                    low: {
                      label: "Low",
                      color: "text-[hsl(var(--chart-negative))]",
                      borderColor: "border-[hsl(var(--chart-negative))]/30",
                      bgColor: "bg-[hsl(var(--chart-negative))]/10",
                      pot: showInflationAdjusted ? retirementSummary.potLowReal : retirementSummary.potLow,
                      monthly: showInflationAdjusted ? retirementSummary.totalMonthlyLowReal : retirementSummary.totalMonthlyLow,
                      rate: pension?.lowGrowthRate || formData.lowGrowthRate || "3",
                    },
                    medium: {
                      label: "Medium",
                      color: "text-primary",
                      borderColor: "border-primary/30",
                      bgColor: "bg-primary/10",
                      pot: showInflationAdjusted ? retirementSummary.potMediumReal : retirementSummary.potMedium,
                      monthly: showInflationAdjusted ? retirementSummary.totalMonthlyMediumReal : retirementSummary.totalMonthlyMedium,
                      rate: pension?.expectedGrowthRate || formData.expectedGrowthRate || "5",
                    },
                    high: {
                      label: "High",
                      color: "text-[hsl(var(--chart-positive))]",
                      borderColor: "border-[hsl(var(--chart-positive))]/30",
                      bgColor: "bg-[hsl(var(--chart-positive))]/10",
                      pot: showInflationAdjusted ? retirementSummary.potHighReal : retirementSummary.potHigh,
                      monthly: showInflationAdjusted ? retirementSummary.totalMonthlyHighReal : retirementSummary.totalMonthlyHigh,
                      rate: pension?.highGrowthRate || formData.highGrowthRate || "7",
                    },
                  };
                  const s = scenarioConfig[selectedScenario];
                  return (
                    <Card className={`rounded-3xl bg-card/60 backdrop-blur-xl shadow-sm ${s.borderColor}`}>
                      <CardContent className="p-5 space-y-4">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex gap-1">
                            {(["low", "medium", "high"] as const).map((key) => (
                              <Button
                                key={key}
                                variant={selectedScenario === key ? "default" : "outline"}
                                size="sm"
                                className="h-7 text-xs px-3"
                                onClick={() => setSelectedScenario(key)}
                                data-testid={`button-scenario-${key}`}
                              >
                                {scenarioConfig[key].label} ({scenarioConfig[key].rate}%)
                              </Button>
                            ))}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs px-2 gap-1"
                            onClick={() => setShowInflationAdjusted(prev => !prev)}
                            data-testid="button-toggle-nominal-real"
                          >
                            {showInflationAdjusted ? "Real (today's £)" : "Nominal"}
                          </Button>
                        </div>
                        <div className="text-center py-2">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2">{s.label} Scenario — Pot at Retirement</p>
                          <p className={`font-serif text-3xl font-light tabular-nums ${s.color}`}>{formatCurrency(s.pot, currency)}</p>
                          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mt-4">Monthly Income (4% drawdown rule)</p>
                          <p className={`font-serif text-xl font-light tabular-nums mt-1 ${s.color}`}>{formatCurrency(s.monthly, currency)}/mo</p>
                          {showInflationAdjusted && (
                            <p className="text-xs text-muted-foreground mt-3">Values shown in today's purchasing power</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })()}

                <Collapsible>
                  <Card className="rounded-3xl border-border bg-card/60 backdrop-blur-xl shadow-sm">
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/40 rounded-t-3xl">
                        <CardTitle className="flex items-center gap-2 font-serif text-lg font-light tracking-tight">
                          <Calculator size={18} className="text-primary" />
                          Sensitivity Analysis
                          <Info size={14} className="text-muted-foreground ml-auto" />
                        </CardTitle>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">What if you increased your monthly contribution?</p>
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Extra monthly contribution:</span>
                            <span className="font-medium text-primary tabular-nums">+{formatCurrency(sensitivityContribution, currency)}</span>
                          </div>
                          <Slider
                            value={[sensitivityContribution]}
                            onValueChange={([val]) => setSensitivityContribution(val)}
                            max={500}
                            step={25}
                            className="w-full"
                            data-testid="slider-sensitivity"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>+{formatCurrency(0, currency)}</span>
                            <span>+{formatCurrency(500, currency)}</span>
                          </div>
                        </div>
                        {sensitivityContribution > 0 && retirementSummary && (
                          <div className="p-5 bg-primary/10 rounded-2xl border border-primary/20 mt-4">
                            <p className="text-sm text-muted-foreground mb-2">
                              Adding {formatCurrency(sensitivityContribution, currency)}/month could increase your retirement pot by:
                            </p>
                            <p className="font-serif text-2xl font-light text-primary tabular-nums">
                              +{formatCurrency(
                                retirementSummary.potMedium - (projections.length > 0 ? 
                                  (() => {
                                    const p = pension || formData;
                                    const currentAge = pension && (pension as any).dateOfBirth ? calculateAgeFromDob((pension as any).dateOfBirth) : (pension?.currentAge || formData.currentAge);
                                    const years = (pension?.retirementAge || formData.retirementAge) - currentAge;
                                    let value = parseFloat(pension?.currentPotValue || formData.currentPotValue);
                                    const rate = parseFloat(pension?.expectedGrowthRate || formData.expectedGrowthRate);
                                    const contrib = (parseFloat(pension?.userMonthlyContribution || formData.userMonthlyContribution) + 
                                                    parseFloat(pension?.employerMonthlyContribution || formData.employerMonthlyContribution)) * 12;
                                    for (let y = 0; y < years; y++) {
                                      value = value * (1 + rate / 100) + contrib;
                                    }
                                    return Math.round(value);
                                  })() : 0),
                                currency
                              )}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {retirementSummary && retirementSummary.statePensionAnnual > 0 && (
                  <Card className="rounded-3xl border-border bg-card/60 backdrop-blur-xl shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 font-serif text-lg font-light tracking-tight">
                        <PiggyBank size={18} className="text-[hsl(var(--chart-positive))]" />
                        UK State Pension
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 bg-[hsl(var(--chart-positive))]/10 border border-[hsl(var(--chart-positive))]/20 rounded-2xl text-center">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Weekly (2024/25 rate)</p>
                          <p className="font-serif text-xl font-light text-[hsl(var(--chart-positive))] tabular-nums mt-1">{formatCurrency(UK_STATE_PENSION_WEEKLY_2024, currency)}</p>
                        </div>
                        <div className="p-4 bg-[hsl(var(--chart-positive))]/10 border border-[hsl(var(--chart-positive))]/20 rounded-2xl text-center">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Annual</p>
                          <p className="font-serif text-xl font-light text-[hsl(var(--chart-positive))] tabular-nums mt-1">{formatCurrency(retirementSummary.statePensionAnnual, currency)}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-3">
                        Based on full National Insurance contributions. State pension age is currently {UK_STATE_PENSION_AGE}. 
                        This is added to your private pension income in the projections above.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {!showForm && !hasPension && (
        <Card className="rounded-3xl border-border bg-card/60 backdrop-blur-xl shadow-sm">
          <CardContent className="p-12 text-center">
            <Landmark size={48} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="font-serif text-xl font-light tracking-tight text-foreground mb-2">No pension added yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Add your pension details to see projections for retirement, including different growth scenarios and UK state pension integration.
            </p>
            <Button onClick={() => setIsAdding(true)} data-testid="button-add-pension-empty">
              <Plus size={18} className="mr-2" />
              Add Your Pension
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

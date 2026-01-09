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
import { Plus, Trash2, Edit2, Save, X, TrendingUp, PiggyBank, Target, Calculator, Loader2, Info, Landmark } from "lucide-react";
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

  const pension = pensions?.[0];

  const projections = useMemo(() => {
    const p = editingId !== null || isAdding ? formData : pension ? {
      currentAge: pension.currentAge,
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
      currentAge: pension.currentAge,
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
    const includeState = p.includeStatePension;

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
    };
  }, [projections, pension, formData, isAdding, editingId]);

  const handleSave = async () => {
    try {
      const data = {
        name: formData.name,
        currentAge: formData.currentAge,
        retirementAge: formData.retirementAge,
        currentPotValue: formData.currentPotValue,
        userMonthlyContribution: formData.userMonthlyContribution,
        employerMonthlyContribution: formData.employerMonthlyContribution,
        expectedGrowthRate: formData.expectedGrowthRate,
        lowGrowthRate: formData.lowGrowthRate,
        highGrowthRate: formData.highGrowthRate,
        inflationRate: formData.inflationRate,
        includeStatePension: formData.includeStatePension ? 1 : 0,
        includeInNetWorth: formData.includeInNetWorth ? 1 : 0,
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
    setFormData({
      name: p.name,
      currentAge: p.currentAge,
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
          <h2 className="text-3xl font-display font-bold text-white">Pension Tracker</h2>
          <p className="text-muted-foreground mt-1">Plan your retirement with scenario modeling and projections</p>
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
          <Card className="glass-card lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Landmark size={20} className="text-primary" />
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentAge">Current Age</Label>
                      <Input
                        id="currentAge"
                        type="number"
                        value={formData.currentAge}
                        onChange={(e) => setFormData({ ...formData, currentAge: parseInt(e.target.value) || 0 })}
                        data-testid="input-current-age"
                      />
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
                      type="number"
                      value={formData.currentPotValue}
                      onChange={(e) => setFormData({ ...formData, currentPotValue: e.target.value })}
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
                  <div className="text-center p-4 bg-primary/10 rounded-xl">
                    <p className="text-sm text-muted-foreground">Current Pot Value</p>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(parseFloat(pension.currentPotValue), currency)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 bg-white/5 rounded-lg">
                      <p className="text-muted-foreground text-xs">Current Age</p>
                      <p className="font-medium text-white">{pension.currentAge}</p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg">
                      <p className="text-muted-foreground text-xs">Retirement Age</p>
                      <p className="font-medium text-white">{pension.retirementAge}</p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg">
                      <p className="text-muted-foreground text-xs">Your Monthly</p>
                      <p className="font-medium text-white">{formatCurrency(parseFloat(pension.userMonthlyContribution), currency)}</p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg">
                      <p className="text-muted-foreground text-xs">Employer Monthly</p>
                      <p className="font-medium text-white">{formatCurrency(parseFloat(pension.employerMonthlyContribution), currency)}</p>
                    </div>
                  </div>
                  <div className="text-sm space-y-1">
                    <p className="text-muted-foreground">Growth Scenarios: {pension.lowGrowthRate || "3"}% / {pension.expectedGrowthRate}% / {pension.highGrowthRate || "7"}%</p>
                    <p className="text-muted-foreground">Inflation: {pension.inflationRate || "2.5"}%</p>
                    {pension.includeStatePension === 1 && (
                      <p className="text-green-400 text-xs">+ UK State Pension included</p>
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
                <Card className="glass-card">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <TrendingUp size={20} className="text-primary" />
                        Pension Growth Projection
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="inflationToggle"
                          checked={showInflationAdjusted}
                          onCheckedChange={(checked) => setShowInflationAdjusted(!!checked)}
                          data-testid="checkbox-inflation-adjusted"
                        />
                        <Label htmlFor="inflationToggle" className="text-xs cursor-pointer">
                          Show in today's money
                        </Label>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={projections}>
                          <defs>
                            <linearGradient id="colorLow" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorMed" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                          <XAxis 
                            dataKey="age" 
                            stroke="rgba(255,255,255,0.5)"
                            tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                          />
                          <YAxis 
                            stroke="rgba(255,255,255,0.5)"
                            tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--card))', 
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: '8px',
                              color: 'white'
                            }}
                            formatter={(value: number) => formatCurrency(value, currency)}
                            labelFormatter={(label) => `Age ${label}`}
                          />
                          <Legend />
                          <Area 
                            type="monotone" 
                            dataKey={showInflationAdjusted ? "lowReal" : "low"} 
                            stroke="#ef4444" 
                            fill="url(#colorLow)"
                            name="Low (3%)"
                          />
                          <Area 
                            type="monotone" 
                            dataKey={showInflationAdjusted ? "mediumReal" : "medium"} 
                            stroke="hsl(var(--primary))" 
                            fill="url(#colorMed)"
                            name="Medium (5%)"
                            strokeWidth={2}
                          />
                          <Area 
                            type="monotone" 
                            dataKey={showInflationAdjusted ? "highReal" : "high"} 
                            stroke="#22c55e" 
                            fill="url(#colorHigh)"
                            name="High (7%)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {retirementSummary && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="glass-card border-red-500/20">
                      <CardContent className="p-4 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Low Scenario at Retirement</p>
                        <p className="text-xl font-bold text-red-400">{formatCurrency(showInflationAdjusted ? retirementSummary.potLowReal : retirementSummary.potLow, currency)}</p>
                        <p className="text-xs text-muted-foreground mt-2">Monthly Income (4% rule)</p>
                        <p className="text-lg font-semibold text-red-300">{formatCurrency(retirementSummary.totalMonthlyLow, currency)}/mo</p>
                      </CardContent>
                    </Card>
                    <Card className="glass-card border-primary/30">
                      <CardContent className="p-4 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Medium Scenario at Retirement</p>
                        <p className="text-xl font-bold text-primary">{formatCurrency(showInflationAdjusted ? retirementSummary.potMediumReal : retirementSummary.potMedium, currency)}</p>
                        <p className="text-xs text-muted-foreground mt-2">Monthly Income (4% rule)</p>
                        <p className="text-lg font-semibold text-primary">{formatCurrency(retirementSummary.totalMonthlyMedium, currency)}/mo</p>
                      </CardContent>
                    </Card>
                    <Card className="glass-card border-green-500/20">
                      <CardContent className="p-4 text-center">
                        <p className="text-xs text-muted-foreground mb-1">High Scenario at Retirement</p>
                        <p className="text-xl font-bold text-green-400">{formatCurrency(showInflationAdjusted ? retirementSummary.potHighReal : retirementSummary.potHigh, currency)}</p>
                        <p className="text-xs text-muted-foreground mt-2">Monthly Income (4% rule)</p>
                        <p className="text-lg font-semibold text-green-300">{formatCurrency(retirementSummary.totalMonthlyHigh, currency)}/mo</p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                <Collapsible>
                  <Card className="glass-card">
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-white/5 rounded-t-xl">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Calculator size={20} className="text-primary" />
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
                            <span className="font-medium text-primary">+{formatCurrency(sensitivityContribution, currency)}</span>
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
                          <div className="p-4 bg-primary/10 rounded-xl mt-4">
                            <p className="text-sm text-muted-foreground mb-2">
                              Adding {formatCurrency(sensitivityContribution, currency)}/month could increase your retirement pot by:
                            </p>
                            <p className="text-xl font-bold text-primary">
                              +{formatCurrency(
                                retirementSummary.potMedium - (projections.length > 0 ? 
                                  (() => {
                                    const p = pension || formData;
                                    const years = (pension?.retirementAge || formData.retirementAge) - (pension?.currentAge || formData.currentAge);
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
                  <Card className="glass-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <PiggyBank size={20} className="text-green-400" />
                        UK State Pension
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-green-500/10 rounded-xl text-center">
                          <p className="text-xs text-muted-foreground">Weekly (2024/25 rate)</p>
                          <p className="text-xl font-bold text-green-400">{formatCurrency(UK_STATE_PENSION_WEEKLY_2024, currency)}</p>
                        </div>
                        <div className="p-4 bg-green-500/10 rounded-xl text-center">
                          <p className="text-xs text-muted-foreground">Annual</p>
                          <p className="text-xl font-bold text-green-400">{formatCurrency(retirementSummary.statePensionAnnual, currency)}</p>
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
        <Card className="glass-card">
          <CardContent className="p-12 text-center">
            <Landmark size={48} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No pension added yet</h3>
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

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useCreateCashflow, useSettings } from "@/hooks/use-finance";
import { getCurrencySymbol } from "@/lib/currency";

interface AddCashflowDialogProps {
  defaultType?: "income" | "expense";
  onCashflowAdded?: () => void;
}

export function AddCashflowDialog({ defaultType = "expense", onCashflowAdded }: AddCashflowDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"income" | "expense">(defaultType);
  const [bucket, setBucket] = useState<"needs" | "wants">("needs");
  const { data: settings } = useSettings();
  const currency = settings?.currency || "USD";

  const createCashflow = useCreateCashflow();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount) return;

    createCashflow.mutate({
      name,
      amount: amount.toString(),
      type,
      bucket: type === "expense" ? bucket : null,
    }, {
      onSuccess: () => {
        setOpen(false);
        setName("");
        setAmount("");
        setType(defaultType);
        setBucket("needs");
        onCashflowAdded?.();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full justify-start gap-2" variant="outline">
          <Plus size={16} /> Add {type === "income" ? "Income" : "Expense"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl font-light tracking-tight">Add Cashflow Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v: any) => setType(v)}>
              <SelectTrigger data-testid="select-cashflow-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Income Source</SelectItem>
                <SelectItem value="expense">Monthly Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type === "expense" && (
            <div className="space-y-2">
              <Label>Bucket (50/30/20)</Label>
              <div
                className="inline-flex w-full items-center gap-1 rounded-full border border-border/60 bg-muted/30 p-0.5"
                role="radiogroup"
                aria-label="Expense bucket"
              >
                {(["needs", "wants"] as const).map(b => {
                  const active = bucket === b;
                  return (
                    <button
                      key={b}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setBucket(b)}
                      className={
                        "flex-1 rounded-full px-3 py-1 text-xs capitalize transition-colors " +
                        (active
                          ? "bg-foreground text-background"
                          : "text-muted-foreground hover:text-foreground")
                      }
                      data-testid={`button-add-bucket-${b}`}
                    >
                      {b === "needs" ? "Need" : "Want"}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {bucket === "needs"
                  ? "Essentials: rent, food, utilities, insurance, minimum debt payments."
                  : "Lifestyle: dining out, subscriptions, entertainment, hobbies."}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              placeholder={type === "income" ? "e.g. Salary" : "e.g. Rent"}
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-testid="input-cashflow-name"
            />
          </div>

          <div className="space-y-2">
            <Label>Monthly Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-muted-foreground">{getCurrencySymbol(currency)}</span>
              <Input
                type="number"
                placeholder="0.00"
                className="pl-7"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                data-testid="input-cashflow-amount"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={createCashflow.isPending}
            data-testid="button-submit-cashflow"
          >
            {createCashflow.isPending ? "Adding..." : "Add Item"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

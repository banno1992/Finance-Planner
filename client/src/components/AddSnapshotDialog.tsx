import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle } from "lucide-react";
import { useCreateSnapshot, useCategories } from "@/hooks/use-finance";
import { format } from "date-fns";

export function AddSnapshotDialog() {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(format(new Date(), "yyyy-MM-01"));
  const [balances, setBalances] = useState<Record<string, string>>({});
  
  const { data: categories } = useCategories();
  const createSnapshot = useCreateSnapshot();

  const handleBalanceChange = (categoryId: number, value: string) => {
    setBalances(prev => ({ ...prev, [categoryId]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSnapshot.mutate({
      month,
      balances
    }, {
      onSuccess: () => {
        setOpen(false);
        setBalances({});
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
          <PlusCircle className="mr-2 h-4 w-4" /> 
          Track This Month
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-card border-border max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">New Net Worth Snapshot</DialogTitle>
          <DialogDescription>
            Enter your current balances for {format(new Date(month), 'MMMM yyyy')}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input 
                type="date" 
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
            </div>
            
            <div className="border-t border-border pt-4">
              <Label className="text-base font-semibold mb-3 block">Asset & Liability Balances</Label>
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-4">
                  {categories?.map((cat) => (
                    <div key={cat.id} className="grid grid-cols-2 gap-4 items-center">
                      <Label className="text-muted-foreground">{cat.name}</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-muted-foreground text-xs">$</span>
                        <Input 
                          type="number" 
                          placeholder="0.00" 
                          className="pl-6 h-9"
                          value={balances[cat.id] || ""}
                          onChange={(e) => handleBalanceChange(cat.id, e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                  
                  {(!categories || categories.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No categories defined yet. Go to settings to add some.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
          
          <div className="pt-4 border-t border-border mt-auto">
            <Button 
              type="submit" 
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={createSnapshot.isPending || !categories?.length}
            >
              {createSnapshot.isPending ? "Saving..." : "Save Snapshot"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

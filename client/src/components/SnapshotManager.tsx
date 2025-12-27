import { useState } from "react";
import { useSnapshots, useCreateSnapshot, useUpdateSnapshot, useDeleteSnapshot, useCategories, useSettings } from "@/hooks/use-finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatCurrency, getCurrencySymbol } from "@/lib/currency";
import { Trash2, Plus, Save, X, ChevronDown, ChevronUp } from "lucide-react";
import { format, parseISO } from "date-fns";

export function SnapshotManager() {
  const { data: snapshots } = useSnapshots();
  const { data: categories } = useCategories();
  const { data: settings } = useSettings();
  const currency = settings?.currency || "USD";
  const createSnapshot = useCreateSnapshot();
  const updateSnapshot = useUpdateSnapshot();
  const deleteSnapshot = useDeleteSnapshot();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [addingNew, setAddingNew] = useState(false);
  const [newMonth, setNewMonth] = useState(format(new Date(), "yyyy-MM-01"));
  const [newBalances, setNewBalances] = useState<Record<string, string>>({});

  const sortedSnapshots = [...(snapshots || [])].sort((a, b) => 
    new Date(b.month).getTime() - new Date(a.month).getTime()
  );

  const handleEdit = (id: number, details: any) => {
    setEditingId(id);
    const balances: Record<string, string> = {};
    details.forEach((d: any) => {
      balances[d.categoryId] = d.balance;
    });
    setEditValues(balances);
  };

  const handleSave = (id: number) => {
    updateSnapshot.mutate({ id, balances: editValues }, {
      onSuccess: () => {
        setEditingId(null);
        setEditValues({});
      }
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValues({});
  };

  const handleAddNew = () => {
    createSnapshot.mutate({ month: newMonth, balances: newBalances }, {
      onSuccess: () => {
        setAddingNew(false);
        setNewMonth(format(new Date(), "yyyy-MM-01"));
        setNewBalances({});
      }
    });
  };

  return (
    <div className="space-y-3 flex flex-col h-full">
      {addingNew && (
        <div className="border border-primary/20 rounded-lg p-4 bg-primary/5 space-y-3">
          <Label className="text-sm font-semibold">New Snapshot</Label>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Date</Label>
            <Input
              type="date"
              value={newMonth}
              onChange={(e) => setNewMonth(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <ScrollArea className="h-[200px] pr-4">
            <div className="space-y-2">
              {categories?.map((cat) => (
                <div key={cat.id} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground flex-1">{cat.name}</span>
                  <div className="relative">
                    <span className="absolute left-2 top-1 text-muted-foreground text-xs">{getCurrencySymbol(currency)}</span>
                    <Input
                      type="number"
                      value={newBalances[cat.id] || ""}
                      onChange={(e) => setNewBalances(prev => ({ ...prev, [cat.id]: e.target.value }))}
                      className="w-24 h-7 text-xs pl-5 bg-background/50"
                      placeholder="0"
                    />
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="flex gap-2 pt-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 h-8 text-xs"
              onClick={handleAddNew}
              disabled={createSnapshot.isPending}
            >
              Save
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
      )}

      <ScrollArea className="flex-1">
        <div className="space-y-3 pr-4">
          {sortedSnapshots.length === 0 && !addingNew ? (
            <div className="text-center py-8 text-muted-foreground text-sm italic">
              No snapshots yet. Click "Add Snapshot" to get started.
            </div>
          ) : (
            sortedSnapshots.map((snapshot) => (
              <div key={snapshot.id} className="rounded-lg bg-white/5 border border-white/5 overflow-hidden">
                <button
                  onClick={() => setExpandedId(expandedId === snapshot.id ? null : snapshot.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div>
                      <p className="font-semibold">{format(parseISO(snapshot.month), 'MMMM yyyy')}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground">{formatCurrency(Number(snapshot.totalNetWorth), currency)}</p>
                        {sortedSnapshots.length > 1 && (
                          <>
                            {(() => {
                              const currentIdx = sortedSnapshots.findIndex(s => s.id === snapshot.id);
                              const nextSnapshot = currentIdx < sortedSnapshots.length - 1 ? sortedSnapshots[currentIdx + 1] : null;
                              if (!nextSnapshot) return null;
                              const diff = Number(snapshot.totalNetWorth) - Number(nextSnapshot.totalNetWorth);
                              return (
                                <span className={`text-xs font-semibold ${diff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {diff >= 0 ? '+' : ''}{formatCurrency(diff, currency)}
                                </span>
                              );
                            })()}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {expandedId === snapshot.id ? (
                      <ChevronUp size={18} className="text-muted-foreground" />
                    ) : (
                      <ChevronDown size={18} className="text-muted-foreground" />
                    )}
                  </div>
                </button>

                {expandedId === snapshot.id && (
                  <div className="border-t border-white/5 p-4 bg-black/20">
                    {editingId === snapshot.id ? (
                      <div className="space-y-4">
                        <Label className="text-base font-semibold">Edit Balances</Label>
                        <ScrollArea className="h-[300px] pr-4">
                          <div className="space-y-3">
                            {categories?.map((cat) => {
                              const detail = snapshot.details.find((d: any) => d.categoryId === cat.id);
                              return (
                                <div key={cat.id} className="flex items-center gap-3">
                                  <span className="text-sm text-muted-foreground flex-1">{cat.name}</span>
                                  <div className="relative">
                                    <span className="absolute left-2 top-1.5 text-muted-foreground text-xs">{getCurrencySymbol(currency)}</span>
                                    <Input
                                      type="number"
                                      value={editValues[cat.id] || ""}
                                      onChange={(e) => setEditValues(prev => ({ ...prev, [cat.id]: e.target.value }))}
                                      className="w-32 h-8 text-sm pl-5 bg-background/50"
                                      placeholder="0.00"
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </ScrollArea>
                        <div className="flex gap-2 pt-4">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-green-400"
                            onClick={() => handleSave(snapshot.id)}
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
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          {categories?.map((cat) => {
                            const detail = snapshot.details.find((d: any) => d.categoryId === cat.id);
                            const balance = detail ? Number(detail.balance) : 0;
                            return (
                              <div key={cat.id} className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{cat.name}</span>
                                <span className="font-mono">{formatCurrency(balance, currency)}</span>
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex gap-2 pt-4 border-t border-white/5 mt-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex-1 h-8 text-sm"
                            onClick={() => handleEdit(snapshot.id, snapshot.details)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-400 hover:text-red-300"
                            onClick={() => deleteSnapshot.mutate(snapshot.id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {!addingNew && (
        <Button
          variant="outline"
          size="sm"
          className="w-full h-8 text-xs"
          onClick={() => setAddingNew(true)}
        >
          <Plus size={14} className="mr-1" /> Add Snapshot
        </Button>
      )}
    </div>
  );
}

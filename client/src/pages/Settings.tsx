import { useCategories, useCreateCategory, useDeleteCategory, useExportData, useImportData, useReorderCategories, useSettings, useUpdateSettings } from "@/hooks/use-finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useRef } from "react";
import { Download, Upload, Plus, Trash2, GripVertical, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "INR", "JPY"];

export default function Settings() {
  const { data: categories } = useCategories();
  const { data: settings } = useSettings();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();
  const reorderCategories = useReorderCategories();
  const updateSettings = useUpdateSettings();
  const exportData = useExportData();
  const importData = useImportData();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newCatName, setNewCatName] = useState("");
  const [draggedId, setDraggedId] = useState<number | null>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);
        
        // Basic validation
        if (!data.categories || !data.snapshots) {
          throw new Error("Invalid backup file format");
        }

        if (confirm("This will overwrite all current data. Are you sure?")) {
          await importData.mutateAsync(data);
          toast({
            title: "Success",
            description: "Data imported successfully",
          });
        }
      } catch (err: any) {
        toast({
          title: "Import Failed",
          description: err.message,
          variant: "destructive",
        });
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;
    createCategory.mutate({ name: newCatName }, {
      onSuccess: () => setNewCatName("")
    });
  };

  const handleDragStart = (id: number) => {
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetId: number) => {
    if (!draggedId || draggedId === targetId || !categories) return;
    
    const draggedIndex = categories.findIndex(c => c.id === draggedId);
    const targetIndex = categories.findIndex(c => c.id === targetId);
    
    const newOrder = [...categories];
    [newOrder[draggedIndex], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[draggedIndex]];
    
    const orderData = newOrder.map((cat, idx) => ({ id: cat.id, displayOrder: idx }));
    reorderCategories.mutate(orderData);
    setDraggedId(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div>
        <h2 className="text-3xl font-display font-bold text-white">Settings</h2>
        <p className="text-muted-foreground mt-1">Configure your categories and data</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* Categories & Currency Section */}
        <div className="space-y-6">
          {/* Currency */}
          <div className="glass-card p-6 rounded-2xl">
            <h3 className="font-display text-xl font-semibold mb-4">Currency</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Select your preferred currency for display.
            </p>
            <Select value={settings?.currency || "USD"} onValueChange={(val) => updateSettings.mutate(val)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map(curr => (
                  <SelectItem key={curr} value={curr}>{curr}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Categories Section */}
          <div className="glass-card p-6 rounded-2xl">
            <h3 className="font-display text-xl font-semibold mb-4">Asset Categories</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Define categories and drag to reorder them.
            </p>

            <form onSubmit={handleAddCategory} className="flex gap-2 mb-6">
              <Input 
                placeholder="New Category Name" 
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="bg-background/50"
              />
              <Button type="submit" size="icon" disabled={createCategory.isPending}>
                <Plus size={18} />
              </Button>
            </form>

            <div className="space-y-2">
              {categories?.map((cat) => (
                <div 
                  key={cat.id} 
                  draggable
                  onDragStart={() => handleDragStart(cat.id)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(cat.id)}
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5 cursor-move hover:bg-white/10 transition-colors"
                >
                  <GripVertical size={16} className="text-muted-foreground flex-shrink-0" />
                  <span className="flex-1">{cat.name}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                    onClick={() => deleteCategory.mutate(cat.id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
              {categories?.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">No categories yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Data Management Section */}
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-2xl">
            <h3 className="font-display text-xl font-semibold mb-4">Data Management</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Your data is stored locally. Export a backup or import data from a JSON file.
            </p>

            <div className="flex flex-col gap-4">
              <Button 
                variant="outline" 
                className="justify-start h-12 gap-3 border-primary/20 hover:bg-primary/10 hover:text-primary"
                onClick={() => exportData()}
              >
                <Download size={18} />
                Export Data (JSON)
              </Button>
              
              <Button 
                variant="outline" 
                className="justify-start h-12 gap-3"
                onClick={handleImportClick}
                disabled={importData.isPending}
              >
                {importData.isPending ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                Import Data
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json"
                className="hidden"
              />
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl">
            <h3 className="font-display text-xl font-semibold mb-4">Application</h3>
            <div className="flex items-center justify-between text-sm py-2">
               <span className="text-muted-foreground">Version</span>
               <span>v1.0.0</span>
            </div>
            <Separator className="my-2 bg-white/10" />
            <div className="flex items-center justify-between text-sm py-2">
               <span className="text-muted-foreground">Storage</span>
               <span>Local Storage (Synced)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useCategories, useCreateCategory, useDeleteCategory, useExportData } from "@/hooks/use-finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Download, Upload, Plus, Trash2, Save } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function Settings() {
  const { data: categories } = useCategories();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();
  const exportData = useExportData();

  const [newCatName, setNewCatName] = useState("");

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;
    createCategory.mutate({ name: newCatName }, {
      onSuccess: () => setNewCatName("")
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div>
        <h2 className="text-3xl font-display font-bold text-white">Settings</h2>
        <p className="text-muted-foreground mt-1">Configure your categories and data</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* Categories Section */}
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-2xl">
            <h3 className="font-display text-xl font-semibold mb-4">Asset Categories</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Define the categories for your net worth assets (e.g. Cash, Stocks, Real Estate).
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
                <div key={cat.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                  <span>{cat.name}</span>
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
                onClick={() => alert("Import feature coming soon")}
              >
                <Upload size={18} />
                Import Data
              </Button>
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

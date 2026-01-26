import { useState, useMemo, useEffect } from "react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from "recharts";
import { format, parseISO } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatCurrency, getCurrencySymbol } from "@/lib/currency";
import type { Snapshot, Category } from "@/lib/localStorage";

interface CategoryTrendChartProps {
  snapshots: Snapshot[];
  categories: Category[];
  currency: string;
}

const CHART_COLORS = [
  "hsl(217, 91%, 60%)",
  "hsl(142, 71%, 45%)",
  "hsl(280, 87%, 65%)",
  "hsl(36, 100%, 50%)",
  "hsl(0, 84%, 60%)",
  "hsl(180, 70%, 45%)",
  "hsl(330, 80%, 60%)",
  "hsl(60, 70%, 50%)",
  "hsl(200, 80%, 50%)",
  "hsl(120, 60%, 40%)",
];

export function CategoryTrendChart({ snapshots, categories, currency }: CategoryTrendChartProps) {
  const [truncateYAxis, setTruncateYAxis] = useState(true);
  
  const sortedCategories = useMemo(() => 
    [...categories].sort((a, b) => a.displayOrder - b.displayOrder),
    [categories]
  );
  
  const [visibleCategories, setVisibleCategories] = useState<Set<number>>(new Set());
  
  useEffect(() => {
    if (sortedCategories.length > 0) {
      setVisibleCategories(prev => {
        if (prev.size === 0) {
          return new Set(sortedCategories.slice(0, 3).map(c => c.id));
        }
        const validIds = new Set(sortedCategories.map(c => c.id));
        const filtered = new Set(Array.from(prev).filter(id => validIds.has(id)));
        if (filtered.size === 0 && sortedCategories.length > 0) {
          return new Set(sortedCategories.slice(0, 3).map(c => c.id));
        }
        return filtered;
      });
    }
  }, [sortedCategories]);

  const toggleCategory = (categoryId: number) => {
    setVisibleCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const chartData = useMemo(() => {
    const sortedSnapshots = [...snapshots].sort(
      (a, b) => new Date(a.month).getTime() - new Date(b.month).getTime()
    );

    return sortedSnapshots.map(snapshot => {
      const dataPoint: Record<string, any> = {
        date: snapshot.month,
      };

      sortedCategories.forEach(category => {
        const detail = snapshot.details.find(d => d.categoryId === category.id);
        dataPoint[`cat_${category.id}`] = detail ? parseFloat(detail.balance) : 0;
      });

      return dataPoint;
    });
  }, [snapshots, sortedCategories]);

  const getCategoryColor = (index: number) => {
    return CHART_COLORS[index % CHART_COLORS.length];
  };

  if (sortedCategories.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No asset categories to display. Add some categories first.
      </div>
    );
  }

  if (snapshots.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No snapshot data yet. Record some monthly snapshots to see trends.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center space-x-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
          <Checkbox 
            id="truncate-category-y" 
            checked={truncateYAxis}
            onCheckedChange={(checked) => setTruncateYAxis(!!checked)}
            data-testid="checkbox-truncate-category-y"
          />
          <Label htmlFor="truncate-category-y" className="text-xs text-muted-foreground cursor-pointer">
            Truncate Y-Axis
          </Label>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pb-2">
        {sortedCategories.map((category, index) => (
          <Button
            key={category.id}
            variant="outline"
            size="sm"
            onClick={() => toggleCategory(category.id)}
            className={`toggle-elevate ${visibleCategories.has(category.id) ? 'toggle-elevated' : 'opacity-50'}`}
            data-testid={`toggle-category-${category.id}`}
          >
            <span 
              className="w-3 h-3 rounded-full mr-2" 
              style={{ backgroundColor: getCategoryColor(index) }}
            />
            {category.name}
          </Button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
          <XAxis 
            dataKey="date" 
            tickFormatter={(val) => format(parseISO(val), 'MMM yy')}
            stroke="rgba(255,255,255,0.3)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="rgba(255,255,255,0.3)"
            fontSize={12}
            tickFormatter={(val) => `${getCurrencySymbol(currency)}${(val/1000).toFixed(0)}k`}
            tickLine={false}
            axisLine={false}
            domain={truncateYAxis ? ['auto', 'auto'] : [0, 'auto']}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))', 
              borderColor: 'hsl(var(--border))', 
              borderRadius: '12px' 
            }}
            itemStyle={{ color: 'white' }}
            formatter={(value: any, name: string) => {
              const categoryId = parseInt(name.replace('cat_', ''));
              const category = sortedCategories.find(c => c.id === categoryId);
              return [formatCurrency(Number(value), currency), category?.name || 'Unknown'];
            }}
            labelFormatter={(label) => format(parseISO(label as string), 'MMMM yyyy')}
          />
          {sortedCategories.map((category, index) => (
            visibleCategories.has(category.id) && (
              <Line
                key={category.id}
                type="monotone"
                dataKey={`cat_${category.id}`}
                stroke={getCategoryColor(index)}
                strokeWidth={2}
                dot={{ r: 4, fill: getCategoryColor(index) }}
                activeDot={{ r: 6 }}
                name={`cat_${category.id}`}
              />
            )
          ))}
          <Legend 
            verticalAlign="bottom" 
            height={36}
            iconType="circle"
            wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}
            formatter={(value: string) => {
              const categoryId = parseInt(value.replace('cat_', ''));
              const category = sortedCategories.find(c => c.id === categoryId);
              return category?.name || 'Unknown';
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

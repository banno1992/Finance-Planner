import { ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  icon?: React.ReactNode;
  className?: string;
  delay?: number;
}

export function MetricCard({ 
  title, 
  value, 
  trend, 
  trendUp, 
  icon, 
  className,
  delay = 0 
}: MetricCardProps) {
  return (
    <div 
      className={cn(
        "glass-card p-6 rounded-2xl relative overflow-hidden group transition-all duration-300 hover:border-primary/30 hover:shadow-primary/5", 
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-primary">
        {icon || <TrendingUp size={48} />}
      </div>
      
      <div className="relative z-10">
        <h3 className="text-muted-foreground text-sm font-medium mb-1 uppercase tracking-wider">
          {title}
        </h3>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl md:text-4xl font-bold font-display text-foreground tracking-tight">
            {value}
          </span>
          {trend && (
            <div className={cn(
              "flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border",
              trendUp 
                ? "bg-green-500/10 text-green-400 border-green-500/20" 
                : "bg-red-500/10 text-red-400 border-red-500/20"
            )}>
              {trendUp ? <ArrowUpRight size={12} className="mr-1" /> : <ArrowDownRight size={12} className="mr-1" />}
              {trend}
            </div>
          )}
        </div>
      </div>
      
      {/* Decorative gradient blob */}
      <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-primary/20 blur-3xl rounded-full group-hover:bg-primary/30 transition-colors" />
    </div>
  );
}

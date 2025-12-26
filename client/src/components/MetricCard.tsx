import { ArrowUpRight, ArrowDownRight, TrendingUp, Info, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface MetricCardProps {
  title: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  icon?: React.ReactNode;
  className?: string;
  delay?: number;
  tooltip?: string;
}

export function MetricCard({ 
  title, 
  value, 
  trend, 
  trendUp, 
  icon, 
  className,
  delay = 0,
  tooltip
}: MetricCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);

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
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-muted-foreground text-sm font-medium uppercase tracking-wider">
            {title}
          </h3>
          {tooltip && (
            <button
              onClick={() => setShowTooltip(!showTooltip)}
              className="text-muted-foreground hover:text-primary cursor-help transition-colors flex-shrink-0"
              aria-label={`Toggle ${title} info`}
            >
              {showTooltip ? <ChevronUp size={14} /> : <Info size={14} />}
            </button>
          )}
        </div>
        {tooltip && showTooltip && (
          <p className="text-xs text-muted-foreground mb-3 p-2 bg-white/5 rounded border border-white/10">
            {tooltip}
          </p>
        )}
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

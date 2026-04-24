import { ArrowUpRight, ArrowDownRight, TrendingUp, Info, ChevronUp } from "lucide-react";
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
  tooltip,
}: MetricCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className={cn(
        "rounded-3xl border border-border bg-card/60 backdrop-blur-xl p-6 relative overflow-hidden group transition-all duration-300 hover:border-primary/30 shadow-sm",
        className,
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-primary">
        {icon || <TrendingUp size={48} />}
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-muted-foreground text-xs font-medium uppercase tracking-[0.18em]">
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
          <p className="text-xs text-muted-foreground mb-3 p-2 bg-muted/40 rounded border border-border">
            {tooltip}
          </p>
        )}
        <div className="flex items-baseline gap-2">
          <span className="font-serif text-3xl md:text-4xl font-light text-foreground tracking-tight tabular-nums">
            {value}
          </span>
          {trend && (
            <div
              className={cn(
                "flex items-center text-xs font-medium px-2 py-0.5 rounded-full border",
                trendUp
                  ? "bg-[hsl(var(--chart-positive))]/10 text-[hsl(var(--chart-positive))] border-[hsl(var(--chart-positive))]/20"
                  : "bg-[hsl(var(--chart-negative))]/10 text-[hsl(var(--chart-negative))] border-[hsl(var(--chart-negative))]/20",
              )}
            >
              {trendUp ? (
                <ArrowUpRight size={12} className="mr-1" />
              ) : (
                <ArrowDownRight size={12} className="mr-1" />
              )}
              {trend}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

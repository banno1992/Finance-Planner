import { cn } from "@/lib/utils";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

interface ChartContainerProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export function ChartContainer({ 
  title, 
  description, 
  children, 
  className,
  action
}: ChartContainerProps) {
  return (
    <div className={cn("glass-card rounded-2xl p-6 flex flex-col h-full", className)}>
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display text-lg font-semibold text-foreground">{title}</h3>
            {description && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info size={14} className="text-muted-foreground hover:text-primary transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-xs">{description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
        {action && <div>{action}</div>}
      </div>
      
      <div className="flex-1 w-full min-h-[250px] relative">
        {children}
      </div>
    </div>
  );
}

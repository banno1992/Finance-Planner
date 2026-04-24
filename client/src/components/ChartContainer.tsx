import { cn } from "@/lib/utils";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

interface ChartContainerProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
  headerActions?: React.ReactNode;
}

export function ChartContainer({
  title,
  description,
  children,
  className,
  action,
  headerActions,
}: ChartContainerProps) {
  const finalAction = action || headerActions;
  return (
    <div
      className={cn(
        "rounded-3xl border border-border bg-card/60 backdrop-blur-xl p-6 flex flex-col h-full shadow-sm",
        className,
      )}
    >
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-lg font-light tracking-tight text-foreground">
              {title}
            </h3>
            {description && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info
                      size={14}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-xs">{description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
        {finalAction && <div>{finalAction}</div>}
      </div>

      <div className="flex-1 w-full min-h-[250px] relative">{children}</div>
    </div>
  );
}

import { cn } from "@/lib/utils";

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
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="min-w-0">
          <h3 className="font-serif text-lg font-light tracking-tight text-foreground">
            {title}
          </h3>
          {description && (
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {description}
            </p>
          )}
        </div>
        {finalAction && <div className="flex-shrink-0">{finalAction}</div>}
      </div>

      <div className="flex-1 w-full min-h-[250px] relative">{children}</div>
    </div>
  );
}

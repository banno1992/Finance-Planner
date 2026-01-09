import { cn } from "@/lib/utils";
import { LayoutDashboard, Settings, PieChart, TrendingUp, Wallet, ArrowRightLeft, BookOpen, Home, Landmark } from "lucide-react";
import { Link, useLocation } from "wouter";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Analytics", icon: PieChart, href: "/analytics" },
  { label: "Cashflow", icon: ArrowRightLeft, href: "/cashflow" },
  { label: "Pension", icon: Landmark, href: "/pension" },
  { label: "Student Loans", icon: BookOpen, href: "/student-loans" },
  { label: "Mortgage", icon: Home, href: "/mortgage" },
  { label: "Settings", icon: Settings, href: "/settings" },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen fixed left-0 top-0 border-r border-border bg-card/50 backdrop-blur-xl">
      <div className="p-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
            <Wallet size={24} />
          </div>
          <h1 className="font-display font-bold text-2xl tracking-tight text-white">
            Net<span className="text-primary">Worth</span>
          </h1>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer group",
                  isActive 
                    ? "bg-primary text-primary-foreground font-medium shadow-lg shadow-primary/25" 
                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon size={20} className={cn("transition-transform group-hover:scale-110", isActive && "text-primary-foreground")} />
                <span>{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/40" />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-8">
        <div className="glass-card p-4 rounded-xl border border-white/5 bg-gradient-to-br from-white/5 to-transparent">
          <h4 className="text-sm font-medium text-white mb-1">Pro Tip</h4>
          <p className="text-xs text-muted-foreground">Update your snapshot monthly to keep predictions accurate.</p>
        </div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const [location] = useLocation();
  
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 pb-safe">
      <div className="flex justify-around items-center p-4">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                "flex flex-col items-center gap-1 cursor-pointer",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                <item.icon size={24} className={isActive ? "fill-current" : ""} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

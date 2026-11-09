import { cn } from "@/lib/utils";
import { LayoutDashboard, Settings, PieChart, ArrowRightLeft, BookOpen, Home, Landmark, Wallet } from "lucide-react";
import { Link, useLocation } from "wouter";
import { ThemeToggle } from "./ThemeToggle";

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
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center text-primary">
              <Wallet size={22} />
            </div>
            <h1 className="font-serif font-light text-xl tracking-tight text-foreground">
              Net<span className="text-primary">Worth</span>
            </h1>
          </div>
          <ThemeToggle />
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
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                data-testid={`link-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <item.icon size={20} className="transition-transform group-hover:scale-110" />
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-6">
        <div className="p-4 rounded-xl border border-border bg-muted/40">
          <h4 className="text-sm font-medium text-foreground mb-1">Pro Tip</h4>
          <p className="text-xs text-muted-foreground">Update your snapshot monthly to keep predictions accurate.</p>
        </div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const [location] = useLocation();

  return (
    <>
      {/* Floating theme toggle for mobile (sidebar is hidden) */}
      <div className="lg:hidden fixed top-3 right-3 z-50">
        <ThemeToggle />
      </div>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40 pb-safe">
        <div className="grid grid-cols-7 items-start px-1 py-2">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div className={cn(
                  "flex flex-col items-center gap-1 cursor-pointer min-w-0 py-1",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
                  data-testid={`link-mobile-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <item.icon size={20} />
                  <span className="text-[10px] font-medium leading-tight text-center">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

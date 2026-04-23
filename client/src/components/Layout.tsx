import { Sidebar, MobileNav } from "./Sidebar";
import { Toaster } from "@/components/ui/toaster";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar - Desktop */}
      <Sidebar />
      
      {/* Main Content Area */}
      <main className="flex-1 lg:ml-64 w-full relative">
        <div className="max-w-7xl mx-auto p-4 md:p-8 pb-24 lg:pb-8 min-h-screen">
          {children}
        </div>
      </main>

      {/* Mobile Navigation */}
      <MobileNav />
      <Toaster />
    </div>
  );
}

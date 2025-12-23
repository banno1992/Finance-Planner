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
        {/* Background Gradients */}
        <div className="fixed top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none -z-10" />
        <div className="fixed top-[-20%] right-[-10%] w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[100px] pointer-events-none -z-10" />
        <div className="fixed bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none -z-10" />

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

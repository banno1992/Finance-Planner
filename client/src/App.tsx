import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";

// Pages
import Dashboard from "@/pages/Dashboard";
import Cashflow from "@/pages/Cashflow";
import Settings from "@/pages/Settings";
import Analytics from "@/pages/Analytics";
import StudentLoans from "@/pages/StudentLoans";
import Mortgage from "@/pages/Mortgage";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/cashflow" component={Cashflow} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/student-loans" component={StudentLoans} />
        <Route path="/mortgage" component={Mortgage} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

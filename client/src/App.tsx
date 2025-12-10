import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Community from "@/pages/Community";
import Thread from "@/pages/Thread";
import About from "@/pages/About";
import Marketplace from "@/pages/Marketplace";
import Academy from "@/pages/Academy";
import Builder from "@/pages/Builder";
import SurvivalGrid from "@/pages/SurvivalGrid";
import Publishing from "@/pages/Publishing";
import RecoveryDashboard from "@/pages/RecoveryDashboard";
import ProtectedRoute from "@/components/ProtectedRoute";
import NotFound from "@/pages/not-found";
import SasquatchChatWidget from "@/components/SasquatchChatWidget";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/dashboard">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/community" component={Community} />
      <Route path="/community/thread/:id" component={Thread} />
      <Route path="/about" component={About} />
      <Route path="/marketplace" component={Marketplace} />
      <Route path="/academy" component={Academy} />
      <Route path="/builder" component={Builder} />
      <Route path="/survival-grid" component={SurvivalGrid} />
      <Route path="/publishing" component={Publishing} />
      <Route path="/recovery">
        <ProtectedRoute>
          <RecoveryDashboard />
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
        <SasquatchChatWidget />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

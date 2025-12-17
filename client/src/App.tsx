import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import VendorDetailPage from "@/pages/vendor-detail-page";
import MyOrdersPage from "@/pages/my-orders-page";
import ImmediatePickupPage from "@/pages/immediate-pickup-page";
import VendorDashboardPage from "@/pages/vendor-dashboard-page";
import VendorMenuPage from "@/pages/vendor-menu-page";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      
      <ProtectedRoute path="/" component={HomePage} requiredRole="student" />
      <ProtectedRoute path="/vendors/:id" component={VendorDetailPage} requiredRole="student" />
      <ProtectedRoute path="/my-orders" component={MyOrdersPage} requiredRole="student" />
      <ProtectedRoute path="/immediate-pickup" component={ImmediatePickupPage} requiredRole="student" />
      
      <ProtectedRoute path="/vendor/dashboard" component={VendorDashboardPage} requiredRole="vendor" />
      <ProtectedRoute path="/vendor/menu" component={VendorMenuPage} requiredRole="vendor" />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

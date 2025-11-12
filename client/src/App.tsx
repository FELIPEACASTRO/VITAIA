import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import PatientDetail from "./pages/PatientDetail";
import Analytics from "./pages/Analytics";
import AuditLog from "./pages/AuditLog";
import ReportGenerator from "./pages/ReportGenerator";
import ComponentShowcase from "./pages/ComponentShowcase";
import SpectacularShowcase from "./pages/SpectacularShowcase";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/pacientes" component={Dashboard} />
      <Route path="/paciente/:patientId">
        {params => <PatientDetail params={params} />}
      </Route>
      <Route path="/analytics" component={Analytics} />
      <Route path="/auditoria" component={AuditLog} />
      <Route path="/relatorios" component={ReportGenerator} />
      <Route path="/componentes" component={ComponentShowcase} />
      <Route path="/showcase" component={SpectacularShowcase} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import Login from "@/pages/Login";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "@/_core/hooks/useAuth";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import PatientDetail from "./pages/PatientDetail";
import Analytics from "./pages/Analytics";
import AuditLog from "./pages/AuditLog";
import ReportGenerator from "./pages/ReportGenerator";
import ComponentShowcase from "./pages/ComponentShowcase";

function Router() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-full mb-4 animate-pulse">
            <span className="text-2xl font-bold text-white">V</span>
          </div>
          <p className="text-white font-semibold">VITAIA</p>
          <p className="text-gray-400 text-sm mt-2">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/pacientes" component={Dashboard} />
      <Route path="/paciente/:patientId">
        {(params) => <PatientDetail params={params} />}
      </Route>
      <Route path="/analytics" component={Analytics} />
      <Route path="/auditoria" component={AuditLog} />
      <Route path="/relatorios" component={ReportGenerator} />
      <Route path="/componentes" component={ComponentShowcase} />
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

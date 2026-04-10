import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import PatientDetail from "./pages/PatientDetail";
import Offices from "./pages/Offices";
import ProcedureTypes from "./pages/ProcedureTypes";
import Agenda from "./pages/Agenda";
import Settings from "./pages/Settings";
import Reports from "./pages/Reports";
import AuditLogs from "./pages/AuditLogs";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import Login from "./pages/Login";
import RequestAccess from "./pages/RequestAccess";
import ResetPassword from "./pages/ResetPassword";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import GoogleCalendarCallback from "./pages/GoogleCalendarCallback";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">Carregando...</div>;
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">Carregando...</div>;
  if (session) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function SuperAdminHome() {
  const { role } = useAuth();
  if (role === 'super_admin') return <Navigate to="/super-admin" replace />;
  return <Dashboard />;
}

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
    <Route path="/solicitar-acesso" element={<PublicRoute><RequestAccess /></PublicRoute>} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/politica-privacidade" element={<PrivacyPolicy />} />
    <Route path="/google-calendar/callback" element={<GoogleCalendarCallback />} />
    <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
      <Route path="/" element={<SuperAdminHome />} />
      <Route path="/super-admin" element={<SuperAdminDashboard />} />
      <Route path="/agenda" element={<Agenda />} />
      <Route path="/pacientes" element={<Patients />} />
      <Route path="/pacientes/:id" element={<PatientDetail />} />
      <Route path="/consultorios" element={<Offices />} />
      <Route path="/procedimentos" element={<ProcedureTypes />} />
      <Route path="/relatorios" element={<Reports />} />
      <Route path="/auditoria" element={<AuditLogs />} />
      <Route path="/configuracoes" element={<Settings />} />
    </Route>
    <Route path="/cadastro" element={<Navigate to="/solicitar-acesso" replace />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

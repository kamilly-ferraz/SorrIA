import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Pacientes from "./pages/Pacientes";
import Agenda from "./pages/Agenda";
import Financeiro from "./pages/Financeiro";
import Estoque from "./pages/Estoque";
import Relatorios from "./pages/Relatorios";
import Configuracoes from "./pages/Configuracoes";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import RelatorioFinanceiro from "./pages/RelatorioFinanceiro";
import RelatorioAtendimentos from "./pages/RelatorioAtendimentos";
import EstoqueDetalhes from "./pages/EstoqueDetalhes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/pacientes" element={<ProtectedRoute><Pacientes /></ProtectedRoute>} />
            <Route path="/agenda" element={<ProtectedRoute><Agenda /></ProtectedRoute>} />
            <Route path="/financeiro" element={<ProtectedRoute allowedRoles={['admin']}><Financeiro /></ProtectedRoute>} />
            <Route path="/estoque" element={<ProtectedRoute allowedRoles={['admin']}><Estoque /></ProtectedRoute>} />
            <Route path="/relatorios" element={<ProtectedRoute allowedRoles={['admin']}><Relatorios /></ProtectedRoute>} />
            <Route path="/relatorios/financeiro" element={<ProtectedRoute allowedRoles={['admin']}><RelatorioFinanceiro /></ProtectedRoute>} />
            <Route path="/relatorios/atendimentos" element={<ProtectedRoute><RelatorioAtendimentos /></ProtectedRoute>} />
            <Route path="/estoque/detalhes" element={<ProtectedRoute allowedRoles={['admin']}><EstoqueDetalhes /></ProtectedRoute>} />
            <Route path="/configuracoes" element={<ProtectedRoute><Configuracoes /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

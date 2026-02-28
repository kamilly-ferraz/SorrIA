import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { NotificationsProvider } from "@/contexts/NotificationsContext";
import { ApplicationProvider } from "@/application/ApplicationContext";
import Index from "./pages/Index";
import Pacientes from "./pages/Pacientes";
import Agenda from "./pages/Agenda";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import Prontuario from "./pages/Prontuario";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Toaster />
    <BrowserRouter>
      <AuthProvider>
        <NotificationsProvider>
          <ApplicationProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/cadastro" element={<Cadastro />} />
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/pacientes" element={<ProtectedRoute><Pacientes /></ProtectedRoute>} />
              <Route path="/agenda" element={<ProtectedRoute><Agenda /></ProtectedRoute>} />
              <Route path="/pacientes/:pacienteId/prontuario" element={<ProtectedRoute><Prontuario /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ApplicationProvider>
        </NotificationsProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;

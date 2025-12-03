import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// --- CONTEXTOS ---
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";

// --- LAYOUTS (Onde fica o Menu Lateral) ---
import { Layout } from "./components/Layout";
import { PatientLayout } from "./components/layouts/PatientLayout";

// --- GUARDIÃO DE ROTAS ---
import { ProtectedRoute } from "./components/ProtectedRoute";

// --- PÁGINAS ---
import { LoginPage } from "./pages/auth/LoginPage";
import { NotFoundPage } from "./pages/NotFoundPage";

// IMPORTANTE: Verifique se este caminho está exato no seu computador!
// Se sua pasta for "Dashboard" (maiúsculo) ou não tiver pasta, avise.
import DashboardPage from "./pages/dashboard/DashboardPage"; 

import { PatientsPage } from "./pages/patients/PatientsPage";
import { PatientFormPage } from "./pages/patients/PatientFormPage";
import { PatientHistoryPage } from "./pages/patients/PatientHistoryPage";
import { TreatmentTrackingPage } from "./pages/treatments/TreatmentTrackingPage";
import { AppointmentsPage } from "./pages/appointments/AppointmentsPage";
import { AppointmentFormPage } from "./pages/appointments/AppointmentFormPage";
import { TreatmentsPage } from "./pages/treatments/TreatmentsPage";
import { TreatmentFormPage } from "./pages/treatments/TreatmentFormPage";
import { InventoryPage } from "./pages/inventory/InventoryPage";
import { PaymentsPage } from "./pages/payments/PaymentsPage";
import { CashFlowPage } from "./pages/payments/CashFlowPage";

// Portal do Paciente
import PatientHome from "./pages/patients/PatientHome";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <Toaster position="top-right" toastOptions={{ className: "dark:bg-dark-surface dark:text-dark-text" }} />
            
            <Routes>
              {/* === ROTA PÚBLICA === */}
              <Route path="/login" element={<LoginPage />} />

              {/* === 🏥 ÁREA DA CLÍNICA (Admin e Médicos) === */}
              {/* 1. Protege a rota (só logado entra) */}
              <Route element={<ProtectedRoute allowedRoles={['admin', 'medico']} />}>
                
                {/* 2. Aplica o LAYOUT (Aqui que o Menu Lateral é inserido!) */}
                <Route element={<Layout />}>
                  
                  {/* 3. As páginas aparecem DENTRO do Layout */}
                  <Route path="/" element={<DashboardPage />} />
                  
                  <Route path="appointments" element={<AppointmentsPage />} />
                  <Route path="appointments/new" element={<AppointmentFormPage />} />
                  
                  <Route path="patients" element={<PatientsPage />} />
                  <Route path="patients/new" element={<PatientFormPage />} />
                  <Route path="patients/:id/edit" element={<PatientFormPage />} />
                  <Route path="patients/:id/history" element={<PatientHistoryPage />} />
                  <Route path="patients/:id/treatments" element={<TreatmentTrackingPage />} />
                  
                  <Route path="treatments" element={<TreatmentsPage />} />
                  <Route path="treatments/new" element={<TreatmentFormPage />} />
                  
                  <Route path="inventory" element={<InventoryPage />} />
                  <Route path="payments" element={<PaymentsPage />} />
                  <Route path="payments/cash-flow" element={<CashFlowPage />} />
                </Route>
              </Route>

              {/* === 👤 PORTAL DO PACIENTE === */}
              <Route path="/portal" element={<ProtectedRoute allowedRoles={['paciente']} />}>
                <Route element={<PatientLayout />}>
                  <Route index element={<PatientHome />} />
                </Route>
              </Route>

              {/* Rota 404 */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>

          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
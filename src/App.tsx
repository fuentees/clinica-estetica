import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Layout } from "./components/Layout"; // Layout da Clínica
import { ProtectedRoute } from "./components/ProtectedRoute";

// --- NOVOS COMPONENTES DO PACIENTE ---
// Certifique-se de ter criado esses arquivos conforme conversamos
import { PatientLayout } from "./components/layouts/PatientLayout";
import PatientHome from "./pages/patients/PatientHome";

// Páginas de Autenticação e Erro
import { LoginPage } from "./pages/auth/LoginPage";
import { NotFoundPage } from "./pages/NotFoundPage";

// Páginas Administrativas (Clínica)
import DashboardPage from "./pages/dashboard/DashboardPage";
import { PatientsPage } from "./pages/patients/PatientsPage";
import { PatientFormPage } from "./pages/patients/PatientFormPage";
import { PatientHistoryPage } from "./pages/patients/PatientHistoryPage";
import { AppointmentsPage } from "./pages/appointments/AppointmentsPage";
import { AppointmentFormPage } from "./pages/appointments/AppointmentFormPage";
import { TreatmentTrackingPage } from "./pages/treatments/TreatmentTrackingPage";
import { TreatmentsPage } from "./pages/treatments/TreatmentsPage";
import { TreatmentFormPage } from "./pages/treatments/TreatmentFormPage";
import { InventoryPage } from "./pages/inventory/InventoryPage";
import { PaymentsPage } from "./pages/payments/PaymentsPage";
import { CashFlowPage } from "./pages/payments/CashFlowPage";

// Criando o Query Client
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <ThemeProvider>
          <AuthProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                className: "dark:bg-dark-surface dark:text-dark-text",
              }}
            />
            
            <Routes>
              {/* === ROTA PÚBLICA === */}
              <Route path="/login" element={<LoginPage />} />

              {/* === 🏥 ÁREA DA CLÍNICA (Admin e Médicos) === */}
              <Route element={<ProtectedRoute allowedRoles={['admin', 'medico']} />}>
                <Route element={<Layout />}>
                  <Route path="/" element={<DashboardPage />} />
                  
                  {/* Pacientes */}
                  <Route path="patients" element={<PatientsPage />} />
                  <Route path="patients/new" element={<PatientFormPage />} />
                  <Route path="patients/:id/edit" element={<PatientFormPage />} />
                  <Route path="patients/:id/history" element={<PatientHistoryPage />} />
                  <Route path="patients/:id/treatments" element={<TreatmentTrackingPage />} />
                  
                  {/* Agendamentos */}
                  <Route path="appointments" element={<AppointmentsPage />} />
                  <Route path="appointments/new" element={<AppointmentFormPage />} />
                  
                  {/* Tratamentos */}
                  <Route path="treatments" element={<TreatmentsPage />} />
                  <Route path="treatments/new" element={<TreatmentFormPage />} />
                  
                  {/* Estoque e Financeiro */}
                  <Route path="inventory" element={<InventoryPage />} />
                  <Route path="payments" element={<PaymentsPage />} />
                  <Route path="payments/cash-flow" element={<CashFlowPage />} />
                </Route>
              </Route>

              {/* === 👤 PORTAL DO PACIENTE === */}
              <Route path="/portal" element={<ProtectedRoute allowedRoles={['paciente']} />}>
                <Route element={<PatientLayout />}>
                  <Route index element={<PatientHome />} />
                  {/* Futuras rotas do paciente: */}
                  {/* <Route path="agendamentos" element={<PatientAppointments />} /> */}
                  {/* <Route path="perfil" element={<PatientProfile />} /> */}
                </Route>
              </Route>

              {/* === ERRO 404 === */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>

          </AuthProvider>
        </ThemeProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
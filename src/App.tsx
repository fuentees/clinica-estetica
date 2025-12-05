import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// --- CONTEXTOS ---
import { AuthProvider } from "./contexts/AuthContext"; 
import { ThemeProvider } from "./contexts/ThemeContext"; 

// --- LAYOUTS (Menu) ---
import { Layout } from "./components/Layout";
import { PatientLayout } from "./components/layouts/PatientLayout";

// --- GUARDIÃO DE ROTAS ---
import { ProtectedRoute } from "./components/ProtectedRoute";

// --- PÁGINAS GERAIS ---
import { LoginPage } from "./pages/auth/LoginPage";
import { NotFoundPage } from "./pages/NotFoundPage";

// --- PÁGINAS ADMINISTRATIVAS ---
import DashboardPage from "./pages/dashboard/DashboardPage"; 

// Agendamentos
import { AppointmentsPage } from "./pages/appointments/AppointmentsPage";
import { AppointmentFormPage } from "./pages/appointments/AppointmentFormPage";

// Pacientes
import { PatientsPage } from "./pages/patients/PatientsPage";
import { PatientFormPage } from "./pages/patients/PatientFormPage";
import { PatientHistoryPage } from "./pages/patients/PatientHistoryPage";
import { SessionEvolutionPage } from "./pages/patients/SessionEvolutionPage"; // Evolução de Sessão
import { PatientAnamnesisPage } from "./pages/patients/PatientAnamnesisPage"; // <--- NOVA IMPORTAÇÃO DA ANAMNESE


// Tratamentos e Injetáveis
import { TreatmentsPage } from "./pages/treatments/TreatmentsPage";
import { TreatmentFormPage } from "./pages/treatments/TreatmentFormPage";
import { InjectablesPlanningPage } from "./pages/treatments/InjectablesPlanningPage"; 

// Profissionais
import { ProfessionalsPage } from "./pages/professionals/ProfessionalsPage"; 
import { ProfessionalFormPage } from "./pages/professionals/ProfessionalFormPage"; 

// Financeiro e Estoque
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

              {/* === 🏥 ÁREA DA CLÍNICA (Protegida) === */}
              {/* Rotas acessíveis por administradores, médicos e staff */}
              <Route element={<ProtectedRoute allowedRoles={['admin', 'medico', 'professional', 'recepcionista', 'doutor']} />}>
                
                <Route element={<Layout />}>
                  
                  <Route path="/" element={<DashboardPage />} />
                  
                  {/* Agendamentos */}
                  <Route path="appointments" element={<AppointmentsPage />} />
                  <Route path="appointments/new" element={<AppointmentFormPage />} />
                  
                  {/* Pacientes */}
                  <Route path="patients" element={<PatientsPage />} />
                  <Route path="patients/new" element={<PatientFormPage />} />
                  <Route path="patients/:id/edit" element={<PatientFormPage />} />
                  <Route path="patients/:id/history" element={<PatientHistoryPage />} />
                  <Route path="patients/:patientId/sessions/new" element={<SessionEvolutionPage />} />
                  
                  
                  {/* NOVA ROTA DE ANAMNESE */}
                  <Route path="patients/:id/anamnesis" element={<PatientAnamnesisPage />} />

                  {/* Planejamento de Injetáveis */}
                  <Route path="patients/:id/injectables" element={<InjectablesPlanningPage />} />
                  
                  {/* Tratamentos (Catálogo) */}
                  <Route path="treatments" element={<TreatmentsPage />} />
                  <Route path="treatments/new" element={<TreatmentFormPage />} />

                  {/* Profissionais */}
                  <Route path="professionals" element={<ProfessionalsPage />} />
                  <Route path="professionals/new" element={<ProfessionalFormPage />} />
                  <Route path="professionals/:id/edit" element={<ProfessionalFormPage />} />
                  
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
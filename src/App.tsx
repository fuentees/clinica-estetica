import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// --- CONTEXTOS ---
import { AuthProvider } from "./contexts/AuthContext"; 
import { ThemeProvider } from "./contexts/ThemeContext"; 

// --- LAYOUTS ---
import { Layout } from "./components/Layout"; 
import { PatientLayout } from "./components/layouts/PatientLayout"; 
import { PatientDashboardLayout } from "./pages/patients/PatientDashboardLayout"; 
import { ProfessionalDashboardLayout } from "./pages/professionals/ProfessionalDashboardLayout"; 

// --- GUARDIÃO DE ROTAS ---
import { ProtectedRoute } from "./components/ProtectedRoute";

// --- PÁGINAS GERAIS ---
import { LoginPage } from "./pages/auth/LoginPage";
import { NotFoundPage } from "./pages/NotFoundPage";

// --- PÁGINAS ADMINISTRATIVAS ---
// Dashboard Principal (Default Export)
import DashboardPage from "./pages/dashboard/DashboardPage"; 

// Agendamentos (Named Exports)
import { AppointmentsPage } from "./pages/appointments/AppointmentsPage";
import { AppointmentFormPage } from "./pages/appointments/AppointmentFormPage";

// --- PACIENTES ---
import { PatientsListPage } from "./pages/patients/PatientsListPage"; 
import { PatientFormPage } from "./pages/patients/PatientFormPage"; 

// --- IMPORTAÇÕES CORRIGIDAS (SEM CHAVES) ---
import PatientOverviewPage from "./pages/patients/PatientOverviewPage"; 
// ------------------------------------------

import PatientAnamnesisPage from "./pages/patients/PatientAnamnesisPage";
import { PatientBioimpedancePage } from "./pages/patients/PatientBioimpedancePage";
import { PatientEvolutionPage } from "./pages/patients/PatientEvolutionPage";
import { PatientFinancialPage } from "./pages/patients/PatientFinancialPage";
import { PatientPlanningPage } from "./pages/patients/PatientPlanningPage";
import { PatientTermsPage } from "./pages/patients/PatientTermsPage";
import { PatientGalleryPage } from "./pages/patients/PatientGalleryPage";
import { InjectablesPlanningPage } from "./pages/treatments/InjectablesPlanningPage"; 

// Tratamentos
import { TreatmentsPage } from "./pages/treatments/TreatmentsPage";
import { TreatmentFormPage } from "./pages/treatments/TreatmentFormPage"; 

// --- PROFISSIONAIS ---
import { ProfessionalsListPage } from "./pages/professionals/ProfessionalsListPage";
import { ProfessionalAvailabilityPage } from "./pages/professionals/ProfessionalAvailabilityPage";

// Páginas Internas do Profissional (Default Export)
import ProfessionalDetailsPage from "./pages/professionals/ProfessionalDetailsPage"; 
import ProfessionalCommissionPage from "./pages/professionals/ProfessionalCommissionPage";
import ProfessionalHistoryPage from "./pages/professionals/ProfessionalHistoryPage";
import ProfessionalOverviewPage from "./pages/professionals/ProfessionalOverviewPage"; 
import ProfessionalAgendaPage from "./pages/professionals/ProfessionalAgendaPage"; 

// Financeiro
import { InventoryPage } from "./pages/inventory/InventoryPage";
import { PaymentsPage } from "./pages/payments/PaymentsPage";
import { CashFlowPage } from "./pages/payments/CashFlowPage";

// Portal do Paciente
import PatientHome from "./pages/patients/PatientHome";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <ThemeProvider>
          <AuthProvider>
            <Toaster position="top-right" toastOptions={{ className: "dark:bg-gray-800 dark:text-white" }} />
            
            <Routes>
              {/* ROTA PÚBLICA */}
              <Route path="/login" element={<LoginPage />} />

              {/* ÁREA PROTEGIDA (ADMIN/EQUIPE) */}
              <Route element={<ProtectedRoute allowedRoles={[
                  'admin', 'profissional', 'esteta', 'recepcionista', 'medico', 'doutor', 'esteticista', 'professional'
              ]} />}>
                
                <Route element={<Layout />}>
                  
                  {/* Dashboard Principal */}
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  
                  {/* Agendamentos */}
                  <Route path="appointments" element={<AppointmentsPage />} />
                  <Route path="appointments/new" element={<AppointmentFormPage />} />
                  <Route path="appointments/:id/edit" element={<AppointmentFormPage />} /> 
                  
                  {/* Pacientes */}
                  <Route path="patients" element={<PatientsListPage />} /> 
                  <Route path="patients/new" element={<PatientFormPage />} />
                  

                  {/* Prontuário do Paciente (Abas) */}
                  <Route path="patients/:id" element={<PatientDashboardLayout />}>
                      <Route index element={<PatientOverviewPage />} />
                      <Route path="details" element={<PatientFormPage />} /> 
                      <Route path="anamnesis" element={<PatientAnamnesisPage />} />
                      <Route path="bioimpedance" element={<PatientBioimpedancePage />} />
                      <Route path="planning" element={<PatientPlanningPage />} />
                      <Route path="terms" element={<PatientTermsPage />} />
                      <Route path="gallery" element={<PatientGalleryPage />} />
                      <Route path="evolution" element={<PatientEvolutionPage />} />
                      <Route path="financial" element={<PatientFinancialPage />} />
                      <Route path="injectables" element={<InjectablesPlanningPage />} />
                  </Route>
                  
                  {/* Profissionais - LISTAGEM */}
                  <Route path="professionals" element={<ProfessionalsListPage />} /> 
                  <Route path="professionals/new" element={<ProfessionalDetailsPage />} />
                  
                  {/* Dashboard aninhado do Profissional (ID) */}
                  <Route path="professionals/:id" element={<ProfessionalDashboardLayout />}>
                      <Route index element={<ProfessionalOverviewPage />} /> 
                      <Route path="agenda" element={<ProfessionalAgendaPage />} /> 
                      <Route path="details" element={<ProfessionalDetailsPage />} /> 
                      <Route path="availability" element={<ProfessionalAvailabilityPage />} />
                      <Route path="commission" element={<ProfessionalCommissionPage />} /> 
                      <Route path="history" element={<ProfessionalHistoryPage />} />
                  </Route>

                  {/* Outros Módulos */}
                  <Route path="treatments" element={<TreatmentsPage />} />
                  <Route path="treatments/new" element={<TreatmentFormPage />} />
                  <Route path="inventory" element={<InventoryPage />} />
                  <Route path="payments" element={<PaymentsPage />} />
                  <Route path="payments/cash-flow" element={<CashFlowPage />} />
                </Route>
              </Route>

              {/* Portal do Paciente */}
              <Route element={<ProtectedRoute allowedRoles={['paciente']} />}>
                <Route path="/portal" element={<PatientLayout />}>
                  <Route index element={<PatientHome />} />
                </Route>
              </Route>

              {/* Rota 404 */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>

          </AuthProvider>
        </ThemeProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
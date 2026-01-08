import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// --- CONTEXTOS ---
import { AuthProvider } from "./contexts/AuthContext"; 
import { ThemeProvider } from "./contexts/ThemeContext"; 

// --- LAYOUTS GLOBAIS ---
// Certifique-se que o MainLayout/Layout está exportado corretamente
import { Layout } from "./components/layouts/Layout"; 
import { PatientLayout } from "./components/layouts/PatientLayout"; 
import { ProtectedRoute } from "./components/ProtectedRoute";

// --- PÁGINAS GERAIS ---
import { LoginPage } from "./pages/auth/LoginPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import DashboardPage from "./pages/dashboard/DashboardPage"; 
import { SettingsPage } from "./pages/settings/SettingsPage";

// --- AGENDAMENTOS ---
import { AppointmentsPage } from "./pages/appointments/AppointmentsPage";
import { AppointmentFormPage } from "./pages/appointments/AppointmentFormPage";
import AppointmentEditPage from "./pages/appointments/AppointmentEditPage";

// --- PACIENTES ---
import { PatientsListPage } from "./pages/patients/PatientsListPage"; 
import { PatientFormPage } from "./pages/patients/PatientFormPage"; 
import { PatientDashboardLayout } from "./pages/patients/PatientDashboardLayout"; 

// Páginas filhas do Prontuário do Paciente
import PatientOverviewPage from "./pages/patients/PatientOverviewPage";
import PatientAnamnesisPage from "./pages/patients/anamnesis/PatientAnamnesisPage";
import { PatientPlanningPage } from "./pages/patients/PatientPlanningPage";
import { PatientAIAnalysisPage } from "./pages/patients/PatientAIAnalysisPage"; 
import { PatientBioimpedancePage } from "./pages/patients/PatientBioimpedancePage"; 
import { PatientEvolutionPage } from "./pages/patients/PatientEvolutionPage";
import { PatientFinancialPage } from "./pages/patients/PatientFinancialPage";
import { PatientTermsPage } from "./pages/patients/PatientTermsPage";
import { PatientGalleryPage } from "./pages/patients/PatientGalleryPage";
import { PatientPrescriptionsPage } from "./pages/patients/PatientPrescriptionsPage";

// --- PRESCRIÇÕES E TRATAMENTOS ---
import { PrescriptionsPage } from "./pages/prescriptions/PrescriptionsPage";
import { PrescriptionFormPage } from "./pages/prescriptions/PrescriptionFormPage";
import { TreatmentsPage } from "./pages/treatments/TreatmentsPage";
import { TreatmentFormPage } from "./pages/treatments/TreatmentFormPage"; 

// --- ESTOQUE E FINANCEIRO ---
import { InventoryPage } from "./pages/inventory/InventoryPage";
import { InventoryFormPage } from "./pages/inventory/InventoryFormPage"; 
import { PaymentsPage } from "./pages/payments/PaymentsPage";
import { CashFlowPage } from "./pages/payments/CashFlowPage";

// --- PROFISSIONAIS ---
import ProfessionalsListPage from "./pages/professionals/ProfessionalsListPage";
import { ProfessionalFormPage } from "./pages/professionals/ProfessionalFormPage"; 
import { ProfessionalDashboardLayout } from "./pages/professionals/ProfessionalDashboardLayout";
import ProfessionalOverviewPage from "./pages/professionals/ProfessionalOverviewPage"; 
import ProfessionalAgendaPage from "./pages/professionals/ProfessionalAgendaPage"; 
import { ProfessionalAvailabilityPage } from "./pages/professionals/ProfessionalAvailabilityPage";
import ProfessionalCommissionPage from "./pages/professionals/ProfessionalCommissionPage";
import ProfessionalHistoryPage from "./pages/professionals/ProfessionalHistoryPage";

// --- PORTAL DO PACIENTE (HOME) ---
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
              {/* === ROTA PÚBLICA === */}
              <Route path="/login" element={<LoginPage />} />

              {/* === ÁREA CLÍNICA (Admin, Profissional, Recepcionista) === */}
              <Route element={<ProtectedRoute allowedRoles={['admin', 'profissional', 'recepcionista']} />}>
                
                {/* O Layout aqui contém a Sidebar Completa */}
                <Route element={<Layout />}>
                  
                  {/* Dashboard Geral */}
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/settings" element={<SettingsPage />} />

                  {/* Módulo de Agendamentos */}
                  <Route path="appointments" element={<AppointmentsPage />} />
                  <Route path="appointments/new" element={<AppointmentFormPage />} />
                  <Route path="appointments/:id/edit" element={<AppointmentEditPage />} />
                  
                  {/* Módulo de Pacientes (Lista e Cadastro) */}
                  <Route path="patients" element={<PatientsListPage />} /> 
                  <Route path="patients/new" element={<PatientFormPage />} />
                  
                  {/* PRONTUÁRIO ELETRÔNICO (Sub-rotas do Paciente) */}
                  <Route path="patients/:id" element={<PatientDashboardLayout />}>
                      <Route index element={<PatientOverviewPage />} />
                      <Route path="anamnesis" element={<PatientAnamnesisPage />} />
                      <Route path="bioimpedance" element={<PatientBioimpedancePage />} />
                      <Route path="ai-analysis" element={<PatientAIAnalysisPage />} /> 
                      <Route path="treatment-plans" element={<PatientPlanningPage />} />
                      <Route path="prescriptions" element={<PatientPrescriptionsPage />} />
                      <Route path="financial" element={<PatientFinancialPage />} />
                      <Route path="evolution" element={<PatientEvolutionPage />} />
                      <Route path="gallery" element={<PatientGalleryPage />} />
                      <Route path="terms" element={<PatientTermsPage />} />
                      <Route path="details" element={<PatientFormPage />} /> 
                  </Route>

                  {/* Prescrições Gerais */}
                  <Route path="prescriptions" element={<PrescriptionsPage />} />
                  <Route path="prescriptions/new" element={<PrescriptionFormPage />} />
                  
                  {/* Módulo de Profissionais */}
                  <Route path="professionals" element={<ProfessionalsListPage />} /> 
                  <Route path="professionals/new" element={<ProfessionalFormPage />} />
                  
                  <Route path="professionals/:id" element={<ProfessionalDashboardLayout />}>
                      <Route index element={<ProfessionalOverviewPage />} /> 
                      <Route path="details" element={<ProfessionalFormPage />} /> 
                      <Route path="agenda" element={<ProfessionalAgendaPage />} /> 
                      <Route path="availability" element={<ProfessionalAvailabilityPage />} />
                      <Route path="commission" element={<ProfessionalCommissionPage />} /> 
                      <Route path="history" element={<ProfessionalHistoryPage />} />
                  </Route>

                  {/* Serviços e Tratamentos */}
                  <Route path="services" element={<TreatmentsPage />} />
                  <Route path="services/new" element={<TreatmentFormPage />} />
                  
                  {/* Estoque */}
                  <Route path="inventory" element={<InventoryPage />} />
                  <Route path="inventory/new" element={<InventoryFormPage />} />
                  <Route path="inventory/:id/edit" element={<InventoryFormPage />} />

                  {/* Financeiro */}
                  <Route path="payments" element={<PaymentsPage />} />
                  <Route path="payments/cash-flow" element={<CashFlowPage />} />
                </Route>
              </Route>

              {/* === PORTAL DO PACIENTE (Acesso Restrito ao Paciente) === */}
              <Route element={<ProtectedRoute allowedRoles={['paciente']} />}>
                <Route path="/portal" element={<PatientLayout />}>
                  <Route index element={<PatientHome />} />
                  {/* Aqui você pode adicionar rotas como /portal/meus-exames, etc */}
                </Route>
              </Route>

              {/* === ROTA 404 (Página não encontrada) === */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>

          </AuthProvider>
        </ThemeProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
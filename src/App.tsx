import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// --- CONTEXTOS ---
import { AuthProvider } from "./contexts/AuthContext"; 
import { ThemeProvider } from "./contexts/ThemeContext"; 

// --- LAYOUTS GLOBAIS ---
import { Layout } from "./components/layouts/Layout"; 
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

// --- PACIENTES (ESTRUTURA DE LAYOUT ÚNICO) ---
import { PatientsListPage } from "./pages/patients/PatientsListPage"; 
import { PatientFormPage } from "./pages/patients/PatientFormPage"; 
import { PatientDashboardLayout } from "./pages/patients/PatientDashboardLayout"; // A MOLDURA (Header Rosa)

// Páginas filhas do Prontuário (Sem chaves na importação default)
import PatientOverviewPage from "./pages/patients/PatientOverviewPage";
import PatientAnamnesisPage from "./pages/patients/anamnesis/PatientAnamnesisPage";
import { PatientPlanningPage } from "./pages/patients/PatientPlanningPage";// A página de Orçamentos/Planejamento

import { PatientAIAnalysisPage } from "./pages/patients/PatientAIAnalysisPage"; 
import { PatientBioimpedancePage } from "./pages/patients/PatientBioimpedancePage"; // Se não tiver a página wrapper, use o TabBioimpedancia aqui, mas o ideal é ter uma página
import { PatientEvolutionPage } from "./pages/patients/PatientEvolutionPage";
import { PatientFinancialPage } from "./pages/patients/PatientFinancialPage";
import { PatientTermsPage } from "./pages/patients/PatientTermsPage";
import { PatientGalleryPage } from "./pages/patients/PatientGalleryPage";
import { PatientPrescriptionsPage } from "./pages/patients/PatientPrescriptionsPage";

// --- OUTROS MÓDULOS ---
import { PrescriptionsPage } from "./pages/prescriptions/PrescriptionsPage";
import { PrescriptionFormPage } from "./pages/prescriptions/PrescriptionFormPage";
import { TreatmentsPage } from "./pages/treatments/TreatmentsPage";
import { TreatmentFormPage } from "./pages/treatments/TreatmentFormPage"; 
import { InventoryPage } from "./pages/inventory/InventoryPage";
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

// --- PORTAL DO PACIENTE ---
import { PatientLayout } from "./components/layouts/PatientLayout"; 
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

              {/* ÁREA PROTEGIDA (ADMIN, PROFISSIONAL, RECEPCIONISTA) */}
              <Route element={<ProtectedRoute allowedRoles={['admin', 'profissional', 'recepcionista']} />}>
                
                {/* O LAYOUT GLOBAL ENVOLVE TUDO AQUI */}
                <Route element={<Layout />}>
                  
                  {/* Dashboard & Configs */}
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/settings" element={<SettingsPage />} />

                  {/* Agendamentos */}
                  <Route path="appointments" element={<AppointmentsPage />} />
                  <Route path="appointments/new" element={<AppointmentFormPage />} />
                  <Route path="appointments/:id/edit" element={<AppointmentEditPage />} />
                  
                  {/* Lista de Pacientes (Fora do Prontuário) */}
                  <Route path="patients" element={<PatientsListPage />} /> 
                  <Route path="patients/new" element={<PatientFormPage />} />
                  
                  {/* === O PRONTUÁRIO COM LAYOUT ÚNICO === */}
                  <Route path="patients/:id" element={<PatientDashboardLayout />}>
                      <Route index element={<PatientOverviewPage />} /> {/* Visão Geral */}
                      
                      {/* Bloco Clínico */}
                      <Route path="anamnesis" element={<PatientAnamnesisPage />} />
                      <Route path="bioimpedance" element={<PatientBioimpedancePage />} /> {/* Se ainda não tiver essa página, crie ou aponte para um componente temporário */}
                      <Route path="ai-analysis" element={<PatientAIAnalysisPage />} /> 
                      
                      {/* Bloco Comercial/Planejamento */}
                      <Route path="treatment-plans" element={<PatientPlanningPage />} /> {/* Aqui montamos o orçamento */}
                      
                      {/* Bloco Administrativo/Histórico */}
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
                  
                  {/* Profissionais */}
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

                  {/* Financeiro e Estoque */}
                  <Route path="treatments" element={<TreatmentsPage />} />
                  <Route path="treatments/new" element={<TreatmentFormPage />} />
                  <Route path="inventory" element={<InventoryPage />} />
                  <Route path="payments" element={<PaymentsPage />} />
                  <Route path="payments/cash-flow" element={<CashFlowPage />} />
                </Route>
              </Route>

              {/* PORTAL DO PACIENTE (Área Externa) */}
              <Route element={<ProtectedRoute allowedRoles={['paciente']} />}>
                <Route path="/portal" element={<PatientLayout />}>
                  <Route index element={<PatientHome />} />
                </Route>
              </Route>

              {/* ROTA 404 */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>

          </AuthProvider>
        </ThemeProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
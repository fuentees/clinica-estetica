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
import DashboardPage from "./pages/dashboard/DashboardPage"; 

// Agendamentos
import { AppointmentsPage } from "./pages/appointments/AppointmentsPage";
import { AppointmentFormPage } from "./pages/appointments/AppointmentFormPage";
import AppointmentEditPage from "./pages/appointments/AppointmentEditPage";

// Pacientes
import { PatientsListPage } from "./pages/patients/PatientsListPage"; 
import { PatientFormPage } from "./pages/patients/PatientFormPage"; 
import PatientOverviewPage from "./pages/patients/PatientOverviewPage"; 

// --- PÁGINAS DO PRONTUÁRIO (ATUALIZADAS) ---
import { PatientAIAnalysisPage } from "./pages/patients/PatientAIAnalysisPage"; 

// [IMPORTANTE] Caminho atualizado para a nova estrutura modular
import PatientAnamnesisPage from "./pages/patients/anamnesis/PatientAnamnesisPage";

import { PatientBioimpedancePage } from "./pages/patients/PatientBioimpedancePage";
import { PatientEvolutionPage } from "./pages/patients/PatientEvolutionPage";
import { PatientFinancialPage } from "./pages/patients/PatientFinancialPage";
import { PatientPlanningPage } from "./pages/patients/PatientPlanningPage";
import { PatientTermsPage } from "./pages/patients/PatientTermsPage";
import { PatientGalleryPage } from "./pages/patients/PatientGalleryPage";
// Nota: Injectables agora é uma aba dentro da Anamnese, mas mantemos a rota se quiser acesso direto
import { InjectablesPlanningPage } from "./pages/patients/InjectablesPlanningPage";

// Receituário
import { PrescriptionsPage } from "./pages/prescriptions/PrescriptionsPage";
import { PrescriptionFormPage } from "./pages/prescriptions/PrescriptionFormPage";
import { PatientPrescriptionsPage } from "./pages/patients/PatientPrescriptionsPage";

// Tratamentos
import { TreatmentsPage } from "./pages/treatments/TreatmentsPage";
import { TreatmentFormPage } from "./pages/treatments/TreatmentFormPage"; 

// --- PROFISSIONAIS ---
import ProfessionalsListPage from "./pages/professionals/ProfessionalsListPage";
import { ProfessionalFormPage } from "./pages/professionals/ProfessionalFormPage"; 

// Páginas secundárias de Profissionais
import { ProfessionalAvailabilityPage } from "./pages/professionals/ProfessionalAvailabilityPage";
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
                  <Route path="appointments/:id/edit" element={<AppointmentEditPage />} />
                  
                  {/* Pacientes */}
                  <Route path="patients" element={<PatientsListPage />} /> 
                  <Route path="patients/new" element={<PatientFormPage />} />
                  
                  {/* --- PRONTUÁRIO DO PACIENTE (ROTAS ANINHADAS) --- */}
                  <Route path="patients/:id" element={<PatientDashboardLayout />}>
                      <Route index element={<PatientOverviewPage />} />
                      <Route path="details" element={<PatientFormPage />} /> 
                      
                      {/* Rota atualizada com o novo componente Modular */}
                      <Route path="anamnesis" element={<PatientAnamnesisPage />} />
                      
                      {/* Auditoria IA */}
                      <Route path="ai-analysis" element={<PatientAIAnalysisPage />} /> 

                      <Route path="prescriptions" element={<PatientPrescriptionsPage />} />
                      
                      {/* Bioimpedância */}
                      <Route path="bioimpedance" element={<PatientBioimpedancePage />} />
                      
                      <Route path="planning" element={<PatientPlanningPage />} />
                      <Route path="terms" element={<PatientTermsPage />} />
                      <Route path="gallery" element={<PatientGalleryPage />} />
                      <Route path="evolution" element={<PatientEvolutionPage />} />
                      <Route path="financial" element={<PatientFinancialPage />} />
                      
                      {/* Rota legada de injetáveis (agora também existe como aba na anamnese) */}
                      <Route path="injectables" element={<InjectablesPlanningPage />} />
                  </Route>

                  {/* Receituário Geral */}
                  <Route path="prescriptions" element={<PrescriptionsPage />} />
                  <Route path="prescriptions/new" element={<PrescriptionFormPage />} />
                  
                  
                  {/* --- PROFISSIONAIS --- */}
                  <Route path="professionals" element={<ProfessionalsListPage />} /> 
                  
                  {/* Rota para criar NOVO profissional */}
                  <Route path="professionals/new" element={<ProfessionalFormPage />} />
                  
                  {/* Dashboard aninhado do Profissional (ID) */}
                  <Route path="professionals/:id" element={<ProfessionalDashboardLayout />}>
                      <Route index element={<ProfessionalOverviewPage />} /> 
                      
                      {/* Rota para EDITAR profissional existente dentro do dashboard */}
                      <Route path="details" element={<ProfessionalFormPage />} /> 

                      <Route path="agenda" element={<ProfessionalAgendaPage />} /> 
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
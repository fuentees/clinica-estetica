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

// --- PACIENTES ---
import { PatientsListPage } from "./pages/patients/PatientsListPage"; 
import { PatientFormPage } from "./pages/patients/PatientFormPage";
import { PatientOverviewPage } from "./pages/patients/PatientOverviewPage";
import PatientAnamnesisPage from "./pages/patients/PatientAnamnesisPage";
import { PatientBioimpedancePage } from "./pages/patients/PatientBioimpedancePage";
import { PatientEvolutionPage } from "./pages/patients/PatientEvolutionPage";
import { PatientFinancialPage } from "./pages/patients/PatientFinancialPage";
import { PatientPlanningPage } from "./pages/patients/PatientPlanningPage";
import { PatientTermsPage } from "./pages/patients/PatientTermsPage";
import { PatientGalleryPage } from "./pages/patients/PatientGalleryPage";

// Tratamentos
import { TreatmentsPage } from "./pages/treatments/TreatmentsPage";
import { TreatmentFormPage } from "./pages/treatments/TreatmentFormPage"; 
import { InjectablesPlanningPage } from "./pages/treatments/InjectablesPlanningPage"; 

// Profissionais (IMPORTAÇÕES CORRIGIDAS PARA O NOVO DASHBOARD)
import { ProfessionalsPage } from "./pages/professionals/ProfessionalsPage"; 
// ROTAS DO NOVO DASHBOARD
import { ProfessionalDashboardLayout } from "./pages/professionals/ProfessionalDashboardLayout"; // NOVO LAYOUT
import { ProfessionalDetailsPage } from "./pages/professionals/ProfessionalDetailsPage";       // DETALHES (antigo Form)
import { ProfessionalAvailabilityPage } from "./pages/professionals/ProfessionalAvailabilityPage"; // ABA
import { ProfessionalCommissionPage } from "./pages/professionals/ProfessionalCommissionPage";     // ABA


// Financeiro
import { InventoryPage } from "./pages/inventory/InventoryPage";
import { PaymentsPage } from "./pages/payments/PaymentsPage";
import { CashFlowPage } from "./pages/payments/CashFlowPage";

// Portal
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
                  
                  {/* Dashboard */}
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  
                  {/* Agendamentos */}
                  <Route path="appointments" element={<AppointmentsPage />} />
                  <Route path="appointments/new" element={<AppointmentFormPage />} />
                  <Route path="appointments/:id/edit" element={<AppointmentFormPage />} /> 
                  
                  {/* Pacientes */}
                  <Route path="patients" element={<PatientsListPage />} />
                  <Route path="patients/new" element={<PatientFormPage />} />
                  <Route path="patients/:id/edit" element={<PatientFormPage />} /> 

                  {/* Prontuário do Paciente (Rotas aninhadas) */}
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
                  
                  {/* Profissionais - ROTA DO DASHBOARD */}
                  <Route path="professionals" element={<ProfessionalsPage />} /> 
                  <Route path="professionals/new" element={<ProfessionalDetailsPage />} />
                  
                  {/* NOVO DASHBOARD DO PROFISSIONAL (RESOLVE O 404) */}
                  <Route path="professionals/:id" element={<ProfessionalDashboardLayout />}>
                      <Route index element={<ProfessionalDetailsPage />} /> 
                      <Route path="details" element={<ProfessionalDetailsPage />} />
                      <Route path="availability" element={<ProfessionalAvailabilityPage />} />
                      <Route path="commission" element={<ProfessionalCommissionPage />} />
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
              <Route path="/portal" element={<ProtectedRoute allowedRoles={['paciente']} />}>
                <Route element={<PatientLayout />}>
                  <Route index element={<PatientHome />} />
                </Route>
              </Route>

              {/* Rota 404 (Sempre por último) */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>

          </AuthProvider>
        </ThemeProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
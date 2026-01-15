import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// --- CONTEXTOS ---
import { AuthProvider, useAuth } from "./contexts/AuthContext"; 
import { ThemeProvider } from "./contexts/ThemeContext"; 

// --- LAYOUTS ---
import { Layout } from "./components/layouts/Layout"; 
import { ProtectedRoute } from "./components/ProtectedRoute";

// --- PÁGINAS GERAIS ---
import { LoginPage } from "./pages/auth/LoginPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import DashboardPage from "./pages/dashboard/DashboardPage"; 
import { SettingsPage } from "./pages/settings/SettingsPage";

// --- PÁGINAS DE CONFIGURAÇÃO ---
import ConsentTemplatesPage from "./pages/config/ConsentTemplatesPage";

// --- PÁGINAS DE AGENDAMENTO ---
import { AppointmentsPage } from "./pages/appointments/AppointmentsPage";
import { AppointmentFormPage } from "./pages/appointments/AppointmentFormPage";
import AppointmentEditPage from "./pages/appointments/AppointmentEditPage";

// --- PÁGINAS DE PACIENTES (ADM) ---
import { PatientsListPage } from "./pages/patients/PatientsListPage"; 
import { PatientFormPage } from "./pages/patients/PatientFormPage"; 
import { PatientDashboardLayout } from "./pages/patients/PatientDashboardLayout"; 
import PatientOverviewPage from "./pages/patients/PatientOverviewPage";
import PatientAnamnesisPage from "./pages/patients/anamnesis/PatientAnamnesisPage";
import { PatientPlanningPage } from "./pages/patients/PatientPlanningPage";
import PatientAIAnalysisPage from "./pages/patients/PatientAIAnalysisPage";
import { PatientBioimpedancePage } from "./pages/patients/PatientBioimpedancePage"; 
import { PatientEvolutionPage } from "./pages/patients/PatientEvolutionPage";
import { PatientFinancialPage } from "./pages/patients/PatientFinancialPage";
import { PatientTermsPage } from "./pages/patients/PatientTermsPage";
import { PatientGalleryPage } from "./pages/patients/PatientGalleryPage";
import { PatientPrescriptionsPage } from "./pages/patients/PatientPrescriptionsPage";

// --- RECEITAS & TRATAMENTOS ---
import { PrescriptionsPage } from "./pages/prescriptions/PrescriptionsPage";
import { PrescriptionFormPage } from "./pages/prescriptions/PrescriptionFormPage";
import { TreatmentsPage } from "./pages/treatments/TreatmentsPage";
import { TreatmentFormPage } from "./pages/treatments/TreatmentFormPage"; 

// --- ESTOQUE ---
import { InventoryPage } from "./pages/inventory/InventoryPage";
import { InventoryFormPage } from "./pages/inventory/InventoryFormPage"; 
import { ProcedureKits } from "./pages/inventory/ProcedureKits";

// --- FINANCEIRO (ADM) ---
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

// --- PÁGINAS DO PORTAL DO PACIENTE ---
import { PatientLayout } from "./pages/portal/PatientLayout";
import { PatientHomePage } from "./pages/portal/PatientHomePage";
import { PatientLoginPage } from "./pages/portal/PatientLoginPage";
import { PatientProfilePage } from "./pages/portal/PatientProfilePage"; 
import { PatientAppointmentsPage } from "./pages/portal/PatientAppointmentsPage"; 
import { PatientPackagesPage } from "./pages/portal/PatientPackagesPage"; 

// --- ✅ PÁGINAS PÚBLICAS DE ASSINATURA ---
import { SignConsentPage } from "./pages/public/SignConsentPage"; // Termos Específicos
import SignGeneralTermPage from "./pages/public/SignGeneralTermPage"; // ✅ Termo Geral (Novo)

const queryClient = new QueryClient();

function HomeRedirect() {
  const { user, isAdmin, isProfessional, isPatient } = useAuth();
  if (isPatient) return <Navigate to="/portal" replace />;
  if (isProfessional && !isAdmin) return <Navigate to={`/professionals/${user?.id}`} replace />;
  return <Navigate to="/dashboard" replace />;
}

function DashboardResolver() {
  const { user, isAdmin, isProfessional } = useAuth();
  if (isProfessional && !isAdmin) return <Navigate to={`/professionals/${user?.id}`} replace />;
  return <DashboardPage />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <ThemeProvider>
          <AuthProvider>
            <Toaster position="top-right" />
            
            <Routes>
              {/* LOGIN DA CLÍNICA */}
              <Route path="/login" element={<LoginPage />} />

              {/* LOGIN DO PACIENTE */}
              <Route path="/portal/login" element={<PatientLoginPage />} />

              {/* ✅ ROTAS PÚBLICAS DE ASSINATURA (QR CODE / WHATSAPP) */}
              <Route path="/sign" element={<SignConsentPage />} />
              
              {/* ✅ NOVA ROTA PÚBLICA PARA O TERMO GERAL */}
              <Route path="/sign-general/:patientId" element={<SignGeneralTermPage />} />

              {/* ROTA RAIZ */}
              <Route path="/" element={<ProtectedRoute allowedRoles={['admin', 'profissional', 'recepcionista', 'paciente']} />}>
                  <Route index element={<HomeRedirect />} />
              </Route>

              {/* 🏥 BLOCO 1: ÁREA CLÍNICA */}
              <Route element={<ProtectedRoute allowedRoles={['admin', 'profissional', 'recepcionista']} />}>
                <Route element={<Layout />}>
                  <Route path="/dashboard" element={<DashboardResolver />} />
                  
                  <Route path="patients/:id" element={<PatientDashboardLayout />}>
                      <Route index element={<PatientOverviewPage />} />
                      <Route path="anamnesis" element={<PatientAnamnesisPage />} />
                      <Route path="evolution" element={<PatientEvolutionPage />} />
                      <Route path="prescriptions" element={<PatientPrescriptionsPage />} />
                      <Route path="gallery" element={<PatientGalleryPage />} />
                      <Route path="treatment-plans" element={<PatientPlanningPage />} />
                      <Route path="bioimpedance" element={<PatientBioimpedancePage />} />
                      <Route path="terms" element={<PatientTermsPage />} />
                      <Route path="details" element={<PatientFormPage />} /> 
                      <Route path="ai-analysis" element={<PatientAIAnalysisPage />} /> 
                      <Route path="financial" element={<PatientFinancialPage />} />
                  </Route>

                  <Route path="appointments" element={<AppointmentsPage />} />
                  <Route path="appointments/new" element={<AppointmentFormPage />} />
                  <Route path="appointments/:id/edit" element={<AppointmentEditPage />} />
                  <Route path="prescriptions" element={<PrescriptionsPage />} />
                  <Route path="prescriptions/new" element={<PrescriptionFormPage />} />

                  <Route path="professionals/:id" element={<ProfessionalDashboardLayout />}>
                      <Route index element={<ProfessionalOverviewPage />} /> 
                      <Route path="agenda" element={<ProfessionalAgendaPage />} /> 
                      <Route path="availability" element={<ProfessionalAvailabilityPage />} />
                      <Route path="history" element={<ProfessionalHistoryPage />} />
                      <Route path="details" element={<ProfessionalFormPage />} />
                      <Route path="commission" element={<ProfessionalCommissionPage />} />
                  </Route>
                </Route>
              </Route>

              {/* 💼 BLOCO 2: GESTÃO */}
              <Route element={<ProtectedRoute allowedRoles={['admin', 'recepcionista']} />}>
                <Route element={<Layout />}>
                  <Route path="patients" element={<PatientsListPage />} /> 
                  <Route path="patients/new" element={<PatientFormPage />} />
                  
                  <Route path="inventory" element={<InventoryPage />} />
                  <Route path="inventory/new" element={<InventoryFormPage />} />
                  <Route path="inventory/:id/edit" element={<InventoryFormPage />} />
                  <Route path="inventory/kits" element={<ProcedureKits />} />
                  
                  {/* --- ROTAS DE SERVIÇOS --- */}
                  <Route path="services" element={<TreatmentsPage />} />
                  <Route path="services/new" element={<TreatmentFormPage />} />
                  <Route path="services/edit/:id" element={<TreatmentFormPage />} />
                  
                  <Route path="professionals" element={<ProfessionalsListPage />} />
                </Route>
              </Route>

              {/* 🔒 BLOCO 3: SÓ ADMIN */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route element={<Layout />}>
                  <Route path="payments" element={<PaymentsPage />} />
                  <Route path="payments/cash-flow" element={<CashFlowPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  
                  {/* GERENCIADOR DE TERMOS (BIBLIOTECA) */}
                  <Route path="/config/templates" element={<ConsentTemplatesPage />} />
                  
                  <Route path="professionals/new" element={<ProfessionalFormPage />} />
                </Route>
              </Route>

              {/* 👤 BLOCO 4: PORTAL DO PACIENTE */}
              <Route element={<ProtectedRoute allowedRoles={['paciente']} />}>
                <Route path="/portal" element={<PatientLayout />}>
                  <Route index element={<PatientHomePage />} />
                  <Route path="agendamentos" element={<PatientAppointmentsPage />} />
                  <Route path="pacotes" element={<PatientPackagesPage />} /> 
                  <Route path="perfil" element={<PatientProfilePage />} />
                  <Route path="financeiro" element={<div className="p-8 text-center text-gray-400 font-bold uppercase">Financeiro em breve</div>} />
                </Route>
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </AuthProvider>
        </ThemeProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
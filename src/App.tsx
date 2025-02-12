import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/auth/LoginPage';
import { NotFoundPage } from "./pages/NotFoundPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import { PatientsPage } from './pages/patients/PatientsPage';
import { PatientFormPage } from './pages/patients/PatientFormPage';
import { PatientHistoryPage } from './pages/patients/PatientHistoryPage';
import { AppointmentsPage } from './pages/appointments/AppointmentsPage';
import { AppointmentFormPage } from './pages/appointments/AppointmentFormPage';
import { TreatmentTrackingPage } from './pages/treatments/TreatmentTrackingPage';
import { InventoryPage } from './pages/inventory/InventoryPage';
import { PaymentsPage } from './pages/payments/PaymentsPage';
import { CashFlowPage } from './pages/payments/CashFlowPage';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  console.log("🚀 Aplicação carregada!");

  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <Toaster 
            position="top-right"
            toastOptions={{
              className: 'dark:bg-dark-surface dark:text-dark-text',
            }} 
          />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="patients" element={<PatientsPage />} />
              <Route path="patients/new" element={<PatientFormPage />} />
              <Route path="patients/:id/edit" element={<PatientFormPage />} />
              <Route path="patients/:id/history" element={<PatientHistoryPage />} />
              <Route path="patients/:id/treatments" element={<TreatmentTrackingPage />} />
              <Route path="appointments" element={<AppointmentsPage />} />
              <Route path="appointments/new" element={<AppointmentFormPage />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="payments" element={<PaymentsPage />} />
              <Route path="payments/cash-flow" element={<CashFlowPage />} />

              {/* Página de erro para rotas inválidas */}
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;

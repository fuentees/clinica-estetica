import { useEffect, useState } from "react";
import { Outlet, useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import {
  Loader2,
  ArrowLeft,
  User,
  FileText,
  Activity,
  ScrollText,
  DollarSign,
  LayoutDashboard,
  Image as ImageIcon,
  ClipboardList,
  ClipboardCheck,
  BrainCircuit,
  Scale // <--- 1. IMPORTAMOS O ÍCONE AQUI
} from "lucide-react";

// Tipagem básica do Paciente
interface Patient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  cpf?: string;
  avatar_url?: string;
}

export function PatientDashboardLayout() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  // --- CARREGAR DADOS ---
  useEffect(() => {
    async function fetchPatient() {
      if (!id) return;
      try {
        const { data, error } = await supabase
          .from("patients")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        setPatient(data);
      } catch (error) {
        console.error("Erro ao carregar paciente:", error);
        navigate("/patients");
      } finally {
        setLoading(false);
      }
    }
    fetchPatient();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="animate-spin text-rose-600 w-10 h-10" />
      </div>
    );
  }

  if (!patient) return null;

  // --- MENU DE ABAS ---
  const navItems = [
    { label: "Visão Geral", path: "", icon: LayoutDashboard },
    { label: "Dados", path: "details", icon: User },
    
    // Anamnese
    { label: "Anamnese & Plano", path: "anamnesis", icon: ClipboardList },
    
    // IA
    { label: "Auditoria IA", path: "ai-analysis", icon: BrainCircuit }, 

    // 2. ADICIONAMOS A BIOIMPEDÂNCIA AQUI
    { label: "Bioimpedância", path: "bioimpedance", icon: Scale }, 

    { label: "Planos de Tratamento", path: "treatment-plans", icon: ClipboardCheck },
    { label: "Evolução", path: "evolution", icon: Activity },
    { label: "Receitas", path: "prescriptions", icon: ScrollText },
    { label: "Financeiro", path: "financial", icon: DollarSign },
    { label: "Galeria", path: "gallery", icon: ImageIcon },
    { label: "Termos", path: "terms", icon: FileText },
  ];

  const initials = patient.name.substring(0, 2).toUpperCase();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50 dark:bg-gray-900 font-sans">
      
      {/* --- HEADER PREMIUM --- */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
        {/* Barra Colorida Superior */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500"></div>

        <div className="max-w-[1600px] mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            
            <button 
              onClick={() => navigate("/patients")} 
              className="absolute top-6 right-6 md:static md:mr-2 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors"
              title="Voltar para a lista"
            >
              <ArrowLeft size={24} />
            </button>

            {/* AVATAR */}
            <div className="relative">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full p-1 bg-gradient-to-tr from-rose-400 to-purple-500 shadow-lg">
                <div className="w-full h-full rounded-full bg-white dark:bg-gray-800 border-4 border-white dark:border-gray-800 flex items-center justify-center overflow-hidden">
                  {patient.avatar_url ? (
                    <img src={patient.avatar_url} alt={patient.name} className="w-full h-full object-cover"/>
                  ) : (
                    <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-tr from-rose-500 to-purple-600">
                      {initials}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* INFO */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-1">
                {patient.name}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                {patient.cpf && (
                  <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-xs font-mono font-bold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                    CPF: {patient.cpf}
                  </span>
                )}
                {patient.phone && (
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    {patient.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* --- ABAS DE NAVEGAÇÃO --- */}
          <div className="flex items-center gap-1 mt-8 overflow-x-auto custom-scrollbar border-b border-gray-200 dark:border-gray-700">
            {navItems.map((item) => {
              // Lógica para detectar rota ativa
              const isActive = item.path === "" 
                ? location.pathname.endsWith(id!) || location.pathname.endsWith(`${id}/`)
                : location.pathname.includes(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center gap-2 px-5 py-3 border-b-2 text-sm font-medium transition-all whitespace-nowrap
                    ${isActive 
                      ? "border-rose-500 text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-900/10" 
                      : "border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }
                  `}
                >
                  <item.icon size={18} className={isActive ? "text-rose-500" : "text-gray-400"} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* --- CONTEÚDO --- */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto p-6">
        <Outlet context={{ patient }} /> 
      </div>
    </div>
  );
}
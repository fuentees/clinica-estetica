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
  Sparkles,
  BrainCircuit,
  Scale,
  Settings
} from "lucide-react";

import { Button } from "../../components/ui/button";

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
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-pink-600 w-10 h-10" />
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sincronizando Prontuário...</p>
        </div>
      </div>
    );
  }

  if (!patient) return null;

  // ✅ LISTA DE NAVEGAÇÃO OTIMIZADA
  const navItems = [
    { label: "Visão Geral", path: "", icon: LayoutDashboard },
    
    // Bloco Clínico
    { label: "Anamnese", path: "anamnesis", icon: ClipboardList },
    { label: "Bioimpedância", path: "bioimpedance", icon: Scale }, 
    { label: "Auditoria IA", path: "ai-analysis", icon: BrainCircuit }, 
    
    // Bloco Comercial/Tratamento
    { label: "Planejamento", path: "treatment-plans", icon: Sparkles },
    
    // Bloco Administrativo
    { label: "Financeiro", path: "financial", icon: DollarSign },
    { label: "Receitas", path: "prescriptions", icon: ScrollText }, // Rota de receitas
    
    // Bloco Histórico/Docs
    { label: "Evolução", path: "evolution", icon: Activity },
    { label: "Galeria", path: "gallery", icon: ImageIcon },
    { label: "Termos", path: "terms", icon: FileText },
    { label: "Dados", path: "details", icon: User },
  ];

  const initials = patient.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950 font-sans">
      
      {/* --- HEADER FIXO --- */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-40 shadow-sm transition-all">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 opacity-80"></div>

        <div className="max-w-[1600px] mx-auto px-6 pt-6 pb-0">
          
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-6">
            
            <button 
              onClick={() => navigate("/patients")} 
              className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-all group border border-transparent hover:border-pink-100"
              title="Voltar para a lista"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            </button>

            {/* Avatar & Nome */}
            <div className="flex items-center gap-5 flex-1">
                <div className="relative group cursor-pointer">
                    <div className="w-16 h-16 rounded-2xl p-0.5 bg-gradient-to-br from-pink-200 to-purple-200 group-hover:from-pink-500 group-hover:to-purple-600 transition-all">
                        <div className="w-full h-full rounded-2xl bg-white dark:bg-gray-900 flex items-center justify-center overflow-hidden">
                            {patient.avatar_url ? (
                                <img src={patient.avatar_url} alt={patient.name} className="w-full h-full object-cover"/>
                            ) : (
                                <span className="text-xl font-bold text-pink-600 bg-pink-50 w-full h-full flex items-center justify-center">
                                    {initials}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-[3px] border-white dark:border-gray-900 rounded-full"></div>
                </div>

                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight leading-tight">
                        {patient.name}
                    </h1>
                    <div className="flex items-center gap-3 mt-1">
                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-[10px] font-bold text-gray-500 rounded-md uppercase tracking-wider border border-gray-200 dark:border-gray-700">
                            ID: {patient.id.substring(0,6)}
                        </span>
                        {patient.phone && (
                            <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                                <div className="w-1 h-1 rounded-full bg-gray-400"></div> {patient.phone}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="rounded-xl border-gray-200 text-gray-500 hover:bg-gray-50 font-bold text-xs h-10">
                <Settings size={16} className="mr-2"/> Configurar
              </Button>
            </div>
          </div>

          {/* NAVEGAÇÃO POR ABAS */}
          <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar -mb-[1px]">
            {navItems.map((item) => {
              const isActive = item.path === "" 
                ? location.pathname.endsWith(id!) || location.pathname.endsWith(`${id}/`)
                : location.pathname.includes(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    group flex items-center gap-2 px-5 py-4 border-b-[3px] text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap
                    ${isActive 
                      ? "border-pink-500 text-pink-600 dark:text-pink-400 bg-pink-50/50 dark:bg-pink-900/10 rounded-t-xl" 
                      : "border-transparent text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-t-xl"
                    }
                  `}
                >
                  <item.icon 
                    size={16} 
                    className={`transition-colors ${isActive ? "text-pink-500" : "text-gray-400 group-hover:text-gray-500"}`} 
                  />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-[1600px] w-full mx-auto p-6 animate-in fade-in duration-700">
          <Outlet context={{ patient }} /> 
      </main>
    </div>
  );
}
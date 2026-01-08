import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Package, Plus, ChevronRight, Zap, CheckCircle2, AlertCircle } from "lucide-react";

interface PatientPackagesWidgetProps {
  patient_id: string;
}

interface PatientPackage {
  id: string;
  title: string;
  total_sessions: number;
  used_sessions: number;
  status: string;
}

export function PatientPackagesWidget({ patientId }: PatientPackagesWidgetProps) {
  const [packages, setPackages] = useState<PatientPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (patientId) fetchPackages();
  }, [patientId]);

  async function fetchPackages() {
    try {
      // SUA LÓGICA DE BUSCA DO SUPABASE
      const { data, error } = await supabase
        .from('patient_packages')
        .select('*')
        .eq('patient_id', patientId)
        .eq('status', 'active'); // Busca apenas ativos

      if (error) {
         // Se a tabela ainda não existir, usamos dados fictícios para não quebrar o layout
         console.warn("Tabela não encontrada, usando dados mock para visualização.");
         setPackages([
            { id: '1', title: 'Protocolo Glúteo (Mock)', total_sessions: 10, used_sessions: 4, status: 'active' },
            { id: '2', title: 'Botox Preventivo (Mock)', total_sessions: 3, used_sessions: 1, status: 'active' }
         ]);
      } else if (data) {
         setPackages(data);
      }
    } catch (error) {
      console.error("Erro ao buscar pacotes:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-[3rem] p-8 shadow-2xl border border-gray-100 dark:border-gray-800 relative overflow-hidden group hover:border-pink-100 dark:hover:border-gray-700 transition-all">
      
      {/* Decoração de Fundo (Efeito Premium) */}
      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700">
        <Package size={140} className="text-gray-900 dark:text-white" />
      </div>

      <div className="relative z-10">
        {/* Cabeçalho do Widget */}
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] flex items-center gap-3 italic">
             <Zap size={16} className="fill-current" /> Contratos Ativos
          </h3>
          <button className="w-10 h-10 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-rose-500 hover:text-white transition-all shadow-sm hover:shadow-lg hover:shadow-rose-500/30">
            <Plus size={16} />
          </button>
        </div>

        <div className="space-y-8">
          {loading ? (
             // Skeleton Loading (Mais bonito que o spinner)
             [1, 2].map(i => (
               <div key={i} className="animate-pulse space-y-3">
                 <div className="h-3 w-2/3 bg-gray-100 dark:bg-gray-800 rounded-full"></div>
                 <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full"></div>
               </div>
             ))
          ) : packages.length === 0 ? (
            <div className="text-center py-8 bg-gray-50/50 dark:bg-gray-800/50 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
              <AlertCircle size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">Nenhum pacote ativo</p>
              <button className="mt-4 text-[9px] font-black text-rose-500 uppercase tracking-widest hover:underline">
                Vender Novo Plano
              </button>
            </div>
          ) : (
            packages.map((pkg) => {
              const progress = Math.round((pkg.used_sessions / pkg.total_sessions) * 100);
              const isCompleted = progress === 100;
              
              return (
                <div key={pkg.id} className="group/item relative">
                  <div className="flex justify-between items-end mb-3">
                    <div>
                      <h4 className="font-black text-gray-900 dark:text-white text-sm uppercase italic tracking-tighter flex items-center gap-2">
                        {pkg.title}
                        {isCompleted && <CheckCircle2 size={14} className="text-emerald-500" />}
                      </h4>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                        Sessão {pkg.used_sessions} de {pkg.total_sessions}
                      </p>
                    </div>
                    <span className={`text-xs font-black ${isCompleted ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {progress}%
                    </span>
                  </div>
                  
                  {/* Barra de Progresso Customizada (Gradiente Rosa) */}
                  <div className="h-2.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden p-[2px]">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ease-out group-hover/item:brightness-110 shadow-lg ${
                        isCompleted 
                          ? 'bg-gradient-to-r from-emerald-400 to-teal-500' 
                          : 'bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600'
                      }`}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <button className="w-full mt-10 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors group/btn">
          Ver Histórico Completo <ChevronRight size={12} className="group-hover/btn:translate-x-1 transition-transform"/>
        </button>
      </div>
    </div>
  );
}
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { 
  Package, 
  Plus, 
  ChevronRight, 
  Zap, 
  CheckCircle2, 
  AlertCircle,
  MinusCircle, 
  Loader2      
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

interface PatientPackagesWidgetProps {
  patient_id: string;
}

interface Plan {
  id: string;
  nome_plano: string;
  sessoes_totais: number;
  sessoes_restantes: number;
  status: string;
}

export function PatientPackagesWidget({ patient_id }: PatientPackagesWidgetProps) {
  const [packages, setPackages] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [consumingId, setConsumingId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (patient_id) fetchPackages();
  }, [patient_id]);

  async function fetchPackages() {
    try {
      const { data, error } = await supabase
        .from('planos_clientes')
        .select('*')
        .eq('cliente_id', patient_id)
        .eq('status', 'ativo')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPackages(data || []);
    } catch (error) {
      console.error("Erro ao buscar pacotes:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleConsumeSession = async (plan: Plan) => {
    if (plan.sessoes_restantes <= 0) return toast.error("Todas as sessões foram usadas.");
    
    const confirm = window.confirm(`Confirmar realização de 1 sessão de ${plan.nome_plano}?`);
    if (!confirm) return;

    setConsumingId(plan.id);
    try {
      const newRemaining = plan.sessoes_restantes - 1;
      const newStatus = newRemaining === 0 ? 'finalizado' : 'ativo';

      const { error } = await supabase
        .from('planos_clientes')
        .update({ 
            sessoes_restantes: newRemaining,
            status: newStatus
        })
        .eq('id', plan.id);

      if (error) throw error;

      toast.success("Sessão contabilizada!");
      
      if (newStatus === 'finalizado') {
        setPackages(prev => prev.filter(p => p.id !== plan.id));
      } else {
        setPackages(prev => prev.map(p => p.id === plan.id ? { ...p, sessoes_restantes: newRemaining } : p));
      }

    } catch (error) {
      toast.error("Erro ao atualizar saldo.");
    } finally {
      setConsumingId(null);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-[3rem] p-8 shadow-2xl border border-gray-100 dark:border-gray-800 relative overflow-hidden group hover:border-pink-100 dark:hover:border-gray-700 transition-all">
      
      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700">
        <Package size={140} className="text-gray-900 dark:text-white" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] flex items-center gap-3 italic">
             <Zap size={16} className="fill-current" /> Contratos Ativos
          </h3>
          <button 
            onClick={() => navigate("financial")} 
            className="w-10 h-10 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-rose-500 hover:text-white transition-all shadow-sm hover:shadow-lg hover:shadow-rose-500/30"
            title="Nova Venda"
          >
            <Plus size={16} />
          </button>
        </div>

        <div className="space-y-8">
          {loading ? (
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
              <button 
                onClick={() => navigate("financial")} // Atalho para venda
                className="mt-4 text-[9px] font-black text-rose-500 uppercase tracking-widest hover:underline"
              >
                Vender Novo Plano
              </button>
            </div>
          ) : (
            packages.map((pkg) => {
              const usedSessions = pkg.sessoes_totais - pkg.sessoes_restantes;
              const progress = Math.round((usedSessions / pkg.sessoes_totais) * 100);
              const isCompleted = pkg.sessoes_restantes === 0;
              
              return (
                <div key={pkg.id} className="group/item relative">
                  <div className="flex justify-between items-end mb-3">
                    <div>
                      <h4 className="font-black text-gray-900 dark:text-white text-sm uppercase italic tracking-tighter flex items-center gap-2">
                        {pkg.nome_plano}
                        {isCompleted && <CheckCircle2 size={14} className="text-emerald-500" />}
                      </h4>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                        Sessão {usedSessions} de {pkg.sessoes_totais}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className={`text-xs font-black ${isCompleted ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {progress}%
                        </span>
                        
                        {!isCompleted && (
                            <button 
                                onClick={() => handleConsumeSession(pkg)}
                                disabled={consumingId === pkg.id}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all disabled:opacity-50"
                                title="Debitar 1 Sessão"
                            >
                                {consumingId === pkg.id ? <Loader2 size={14} className="animate-spin"/> : <MinusCircle size={16}/>}
                            </button>
                        )}
                    </div>
                  </div>
                  
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

        {/* ✅ BOTÃO CORRIGIDO PARA A ROTA CERTA */}
        <button 
            onClick={() => navigate("financial?tab=pacotes")}
            className="w-full mt-10 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors group/btn"
        >
          Ver Histórico Completo <ChevronRight size={12} className="group-hover/btn:translate-x-1 transition-transform"/>
        </button>
      </div>
    </div>
  );
}
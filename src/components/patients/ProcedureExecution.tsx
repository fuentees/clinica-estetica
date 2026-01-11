import { useState } from 'react';
import { Check, X, AlertCircle, Package, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase'; 
import { toast } from 'react-hot-toast';

interface ProcedureExecutionProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  plan: any; 
}

export default function ProcedureExecution({ isOpen, onClose, onSuccess, plan }: ProcedureExecutionProps) {
  const [loading, setLoading] = useState(false);

  if (!isOpen || !plan) return null;

  // Extração direta dos dados (O modal só abre se esses dados existirem)
  const serviceName = plan.service?.name || plan.title || plan.nome_plano || 'Procedimento';
  const remainingSessions = plan.remaining_sessions || plan.sessoes_restantes || 0;
  
  // O ID já vem garantido pela página pai
  const serviceId = plan.service_id || plan.service?.id || plan.procedure_id;

  const handleExecute = async () => {
    if (!serviceId) {
      toast.error("Erro crítico: Identificador do serviço não encontrado.");
      return;
    }

    setLoading(true);
    try {
      // Chamada RPC para baixar sessão e estoque
      const { error } = await supabase.rpc('execute_procedure_session', {
        p_plan_id: plan.id,
        p_patient_id: plan.patient_id || plan.cliente_id,
        p_service_id: serviceId,
        p_clinic_id: plan.clinic_id
      });
      
      if (error) throw error;

      toast.success("Sessão realizada com sucesso!");
      onSuccess(); 
      onClose();   

    } catch (error: any) {
      console.error('Erro ao executar:', error);
      toast.error('Erro: ' + (error.message || "Falha na comunicação."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-800">
        
        {/* Cabeçalho */}
        <div className="bg-gray-50 dark:bg-gray-800/50 p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
              <Package className="text-emerald-500" size={20} />
              Confirmar Sessão
            </h2>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Baixa de Estoque Automática</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Corpo */}
        <div className="p-6 space-y-6">
          
          <div className="flex items-start gap-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-800 rounded-lg text-emerald-700 dark:text-emerald-300">
              <Clock size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">{serviceName}</h3>
              <p className="text-xs text-gray-500 mt-1">
                Saldo atual: <strong className="text-gray-800 dark:text-gray-200">{remainingSessions}</strong> sessões.
              </p>
              <p className="text-xs text-emerald-600 font-bold mt-1">
                 Saldo após confirmar: {remainingSessions - 1}
              </p>
            </div>
          </div>

          <div className="flex gap-3 items-start p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100">
            <AlertCircle className="text-gray-400 shrink-0" size={16} />
            <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
              O sistema irá descontar 1 sessão deste pacote e consumir os itens do Kit no estoque.
            </p>
          </div>

        </div>

        {/* Rodapé */}
        <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleExecute}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <span className="text-xs font-bold uppercase tracking-widest">Processando...</span>
            ) : (
              <>
                <Check size={16} />
                <span className="text-xs font-bold uppercase tracking-widest">
                  Confirmar Baixa
                </span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
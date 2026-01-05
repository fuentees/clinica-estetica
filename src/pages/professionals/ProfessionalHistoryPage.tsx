import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  CheckSquare, 
  User, 
  Activity, 
} from 'lucide-react';

// --- TIPAGEM (INTEGRAL) ---
type Treatment = {
  id: string;
  data_evolucao: string;
  procedimento_realizado: string;
  patient: { name: string; id: string }; 
};

export default function ProfessionalHistoryPage() {
  const { id } = useParams<{ id: string }>(); 
  const [loading, setLoading] = useState(true);
  const [treatments, setTreatments] = useState<Treatment[]>([]);

  useEffect(() => {
    if (id) {
      fetchProfessionalData(id);
    }
  }, [id]);

  async function fetchProfessionalData(professionalId: string) {
    setLoading(true);
    try {
      // 1. TRATAMENTOS REALIZADOS (Busca na tabela de evoluções/prontuário)
      const { data: treatmentsData, error: treatmentsError } = await supabase
        .from('treatments')
        .select(`
          id, 
          data_evolucao:data_procedimento, 
          procedimento_realizado:tipo_procedimento,
          patient:patient_id (id, name)
        `)
        .eq('professional_id', professionalId) 
        .order('data_evolucao', { ascending: false });

      if (treatmentsError) throw treatmentsError;
      
      // Mapeamento SaaS: Proteção contra dados nulos e normalização de arrays
      const mappedTreatments: Treatment[] = (treatmentsData || []).map((t: any) => {
          const patientData = Array.isArray(t.patient) ? t.patient[0] : t.patient;
          
          return {
              ...t,
              procedimento_realizado: t.procedimento_realizado || 'Procedimento Não Informado',
              patient: {
                  id: patientData?.id || '',
                  name: patientData?.name || 'Paciente Removido',
              }
          };
      });
      
      setTreatments(mappedTreatments);

    } catch (error) {
      console.error("Erro ao buscar histórico do profissional:", error);
    } finally {
      setLoading(false);
    }
  }

  // --- SKELETON LOADING (LAYOUT PRESERVADO) ---
  if (loading) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-xl" />
          <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 animate-in fade-in duration-500">
      
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
        <Activity size={24} className="text-pink-600 dark:text-pink-400" />
        Histórico de Tratamentos Realizados
      </h2>

      <div className="space-y-6">
        {/* GRID DE CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {treatments.length === 0 ? (
              <div className="col-span-2 text-center py-20 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border-2 border-dashed border-gray-100 dark:border-gray-700">
                <User size={48} className="mx-auto text-gray-300 mb-4 opacity-20" />
                <p className="text-gray-500 dark:text-gray-400 font-medium italic">
                  Nenhum procedimento registrado no prontuário para este profissional.
                </p>
              </div>
            ) : (
              treatments.map((t) => (
                <div key={t.id} className="bg-gray-50 dark:bg-gray-700 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all hover:shadow-md hover:border-pink-100 dark:hover:border-pink-900 group">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-green-600 dark:text-green-400 flex items-center gap-1 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-md">
                        <CheckSquare size={12} /> Concluído
                    </p>
                    <p className="text-xs font-bold text-gray-400 dark:text-gray-500 tabular-nums">
                        {new Date(t.data_evolucao).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  
                  <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2 uppercase tracking-tighter italic group-hover:text-pink-600 transition-colors">
                    {t.patient.name}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <div className="p-1.5 bg-white dark:bg-gray-800 rounded-lg shadow-inner">
                        <Activity size={14} className="text-pink-500" />
                      </div>
                      <span className="font-medium">{t.procedimento_realizado}</span>
                  </div>
                </div>
              ))
            )}
          </div>
      </div>
    </div>
  );
}
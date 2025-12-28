import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  CheckSquare, 
  User, 
  Activity, 
} from 'lucide-react';

// Tipagem dos dados do banco
// A tipagem Appointment foi removida.
type Treatment = {
  id: string;
  data_evolucao: string;
  procedimento_realizado: string;
  patient: { name: string; id: string }; 
};

export default function ProfessionalHistoryPage() {
  const { id } = useParams<{ id: string }>(); 
  const [loading, setLoading] = useState(true);
  // O estado appointments foi removido
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  // activeTab foi removido

  useEffect(() => {
    if (id) {
      fetchProfessionalData(id);
    }
  }, [id]);

  async function fetchProfessionalData(professionalId: string) {
    setLoading(true);
    try {
      
      // 1. TRATAMENTOS REALIZADOS (Histórico)
      const { data: treatmentsData, error: treatmentsError } = await supabase
        .from('treatments')
        .select(`
          id, 
          data_evolucao:data_procedimento, 
          procedimento_realizado:tipo_procedimento,
          patient:patient_id (id, name)
        `)
        .eq('professional_id', professionalId) // Ou o nome da sua coluna (ex: realizador_id)
        .order('data_evolucao', { ascending: false });

      if (treatmentsError) throw treatmentsError;
      
      // Mapeamento e Correção da Tipagem
      const mappedTreatments: Treatment[] = treatmentsData.map((t: any) => {
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

  // Componente de carregamento Skeleton
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
    <div className="p-4 sm:p-6 lg:p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
      
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
        <Activity size={24} className="text-pink-600 dark:text-pink-400" />
        Histórico de Tratamentos Realizados
      </h2>

      {/* Conteúdo */}
      <div className="space-y-6">
        
        {/* TRATAMENTOS REALIZADOS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {treatments.length === 0 ? (
              <p className="col-span-2 text-center text-gray-500 dark:text-gray-400 py-10">
                Nenhum tratamento realizado registrado para este profissional.
              </p>
            ) : (
              treatments.map((t) => (
                <div key={t.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 transition-shadow hover:shadow-md">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-green-600 dark:text-green-400 flex items-center gap-1">
                        <CheckSquare size={14} /> Concluído
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(t.data_evolucao).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{t.patient.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1">
                      <User size={14} /> {t.procedimento_realizado}
                  </p>
                </div>
              ))
            )}
          </div>
      </div>
    </div>
  );
}

// O Componente TabButton não é mais necessário e foi removido.
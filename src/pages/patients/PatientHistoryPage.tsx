import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ArrowLeft, Plus, Calendar, FileText, Loader2, Trash2, Sparkles, Clock, FileSignature 
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { BeforeAfter } from '../../components/BeforeAfter';
import { toast } from 'react-hot-toast';

export function PatientHistoryPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, [id]);

  async function fetchData() {
    try {
      setLoading(true);
      // 1. Busca dados do paciente
      const { data: patientData } = await supabase
        .from('patients')
        .select(`*, profiles:profile_id (*)`)
        .eq('id', id)
        .single();
      
      setPatient(patientData);

      // 2. Busca o histórico clínico (tratamentos realizados)
      fetchHistory();

    } catch (error) {
      console.error('Erro ao carregar:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchHistory() {
    // Busca da tabela patient_treatments (sessões realizadas)
    const { data } = await supabase
      .from('patient_treatments')
      .select('*')
      .eq('patient_id', id)
      .order('created_at', { ascending: false });
    
    setHistory(data || []);
  }

  async function handleDelete(recordId: string) {
    if(!confirm("Tem certeza que deseja apagar este registro?")) return;
    await supabase.from('patient_treatments').delete().eq('id', recordId);
    fetchHistory();
    toast.success("Registro apagado.");
  }

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-pink-600" /></div>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 pb-20">
      
      {/* --- CABEÇALHO COM AÇÕES --- */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6 border-b pb-6 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/patients')}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Prontuário Clínico</h1>
            <p className="text-gray-500 dark:text-gray-400">
              {patient?.profiles?.first_name} {patient?.profiles?.last_name}
            </p>
          </div>
        </div>

        {/* BARRA DE AÇÕES */}
        <div className="flex flex-wrap gap-3">
            {/* 1. Botão IA */}
            <Button 
                onClick={() => navigate(`/patients/${id}/injectables`)} 
                className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
            >
                <Sparkles size={18} className="mr-2" /> Planejamento (IA)
            </Button>

            {/* 2. Botão Anamnese (O QUE FALTAVA) */}
            <Button 
                onClick={() => navigate(`/patients/${id}/anamnesis`)} 
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            >
                <FileSignature size={18} className="mr-2" /> Ficha de Anamnese
            </Button>

            {/* 3. Botão Nova Sessão */}
            <Button 
                onClick={() => navigate(`/patients/${id}/sessions/new`)} 
                className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
            >
                <Plus size={18} className="mr-2" /> Nova Sessão
            </Button>
        </div>
      </div>

      {/* --- LINHA DO TEMPO (TIMELINE) --- */}
      <div className="space-y-8">
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
            <Clock size={20} /> Histórico de Sessões
        </h2>

        {history.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
            <FileText className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">Nenhum procedimento registrado neste prontuário.</p>
            <p className="text-xs text-gray-400 mt-1">Clique em "Nova Sessão" para começar.</p>
          </div>
        ) : (
          <div className="relative border-l-2 border-gray-200 dark:border-gray-700 ml-4 space-y-8">
            {history.map((item) => (
              <div key={item.id} className="ml-6 relative group">
                {/* Bolinha da Timeline */}
                <div className="absolute -left-[31px] top-6 h-4 w-4 rounded-full bg-pink-500 border-4 border-white dark:border-gray-900 shadow-sm"></div>
                
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-shadow hover:shadow-md">
                  
                  {/* Botão de Excluir */}
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    title="Excluir registro"
                  >
                    <Trash2 size={16} />
                  </button>

                  {/* Cabeçalho do Card */}
                  <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3 bg-gray-50/50 dark:bg-gray-700/20">
                    <Calendar size={18} className="text-pink-600" />
                    <span className="font-semibold text-gray-700 dark:text-gray-200">
                        {format(new Date(item.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </span>
                    <span className="text-xs text-gray-400 px-2">|</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(item.created_at), "HH:mm", { locale: ptBR })}
                    </span>
                  </div>

                  {/* Conteúdo */}
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Notas */}
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Evolução</h4>
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                        {item.notes || 'Sem anotações.'}
                      </p>
                    </div>

                    {/* Fotos (Se houver) */}
                    {item.photos && (item.photos.before || item.photos.after) ? (
                      <div className="h-48 w-full rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                        <BeforeAfter 
                          beforeImage={item.photos.before || "https://placehold.co/400x300?text=Sem+Foto"}
                          afterImage={item.photos.after || item.photos.before}
                          labelBefore="Antes"
                          labelAfter="Depois"
                        />
                      </div>
                    ) : null}
                  </div>
                  
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
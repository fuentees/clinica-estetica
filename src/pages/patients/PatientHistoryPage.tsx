import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { format, differenceInYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ArrowLeft, Plus, Calendar, FileText, Loader2, Trash2, // Alterado de CalendarDays para Calendar
  Sparkles, Clock, FileSignature, User, Phone, AlertCircle, Edit 
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
    if (id) fetchData();
  }, [id]);

  async function fetchData() {
    try {
      setLoading(true);
      // 1. Busca dados COMPLETOS do paciente para o resumo
      const { data: patientData, error: patError } = await supabase
        .from('patients')
        .select(`*, profiles:profile_id (*)`)
        .eq('id', id)
        .single();
      
      if (patError) throw patError;
      setPatient(patientData);

      // 2. Busca o histórico clínico
      const { data: historyData, error: histError } = await supabase
        .from('patient_treatments')
        .select('*')
        .eq('patient_id', id)
        .order('created_at', { ascending: false });

      if (histError) throw histError;
      setHistory(historyData || []);

    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao carregar prontuário.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(recordId: string) {
    if(!confirm("Tem certeza que deseja apagar este registro?")) return;
    await supabase.from('patient_treatments').delete().eq('id', recordId);
    fetchData(); // Recarrega
    toast.success("Registro apagado.");
  }

  // Auxiliar: Calcula idade
  const getAge = (dateString: string) => {
      if (!dateString) return '-';
      return differenceInYears(new Date(), new Date(dateString));
  };

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-pink-600 w-10 h-10" /></div>;

  return (
    <div className="p-6 max-w-6xl mx-auto pb-20">
      
      {/* --- 1. CABEÇALHO DE NAVEGAÇÃO --- */}
      <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate('/patients')} className="p-2">
            <ArrowLeft size={24} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Prontuário do Paciente</h1>
            <p className="text-sm text-gray-500">Visão Geral e Histórico</p>
          </div>
      </div>

      {/* --- 2. CARTÃO DE RESUMO DO PACIENTE (DADOS) --- */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8 relative overflow-hidden">
          {/* Barra lateral colorida para status */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-pink-500"></div>
          
          <div className="flex flex-col md:flex-row justify-between gap-6">
              {/* Infos Pessoais */}
              <div className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-2xl font-bold text-gray-500 uppercase">
                      {patient?.profiles?.first_name?.charAt(0)}
                  </div>
                  <div>
                      <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                          {patient?.profiles?.first_name} {patient?.profiles?.last_name}
                          <button onClick={() => navigate(`/patients/${id}/edit`)} title="Editar Dados Cadastrais" className="text-gray-400 hover:text-pink-600">
                              <Edit size={16} />
                          </button>
                      </h2>
                      <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600 dark:text-gray-300">
                          <span className="flex items-center gap-1"><User size={14} /> {getAge(patient?.date_of_birth)} anos</span>
                          <span className="flex items-center gap-1"><Phone size={14} /> {patient?.profiles?.phone || 'Sem telefone'}</span>
                          {patient?.cpf && <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-xs">CPF: {patient?.cpf}</span>}
                      </div>
                  </div>
              </div>

              {/* Alertas Rápidos (Baseado no que salvou na Anamnese) */}
              <div className="flex flex-col gap-2 min-w-[200px]">
                  {patient?.alergias_medicamentosas && patient.alergias_medicamentosas.length > 0 && (
                      <div className="bg-red-50 text-red-700 px-3 py-1 rounded-md text-xs font-bold flex items-center gap-2 border border-red-100">
                          <AlertCircle size={14} /> Alérgico: {patient.alergias_medicamentosas}
                      </div>
                  )}
                  {patient?.gestante && (
                      <div className="bg-purple-50 text-purple-700 px-3 py-1 rounded-md text-xs font-bold flex items-center gap-2 border border-purple-100">
                          <AlertCircle size={14} /> Gestante
                      </div>
                  )}
              </div>
          </div>
      </div>

      {/* --- 3. BARRA DE AÇÕES (O Menu Interno) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Botão Anamnese */}
          <Button 
            onClick={() => navigate(`/patients/${id}/anamnesis`)} 
            variant="outline"
            className="h-14 flex items-center justify-center gap-2 border-2 border-blue-100 hover:border-blue-500 hover:bg-blue-50 dark:border-gray-700 dark:hover:bg-gray-800 transition-all"
          >
            <FileSignature className="text-blue-600" /> 
            <div className="text-left">
                <span className="block font-bold text-gray-700 dark:text-gray-200">Anamnese Completa</span>
                <span className="block text-[10px] text-gray-500">Dados de Saúde e Estética</span>
            </div>
          </Button>

          {/* Botão IA */}
          <Button 
            onClick={() => navigate(`/patients/${id}/injectables`)} 
            variant="outline"
            className="h-14 flex items-center justify-center gap-2 border-2 border-purple-100 hover:border-purple-500 hover:bg-purple-50 dark:border-gray-700 dark:hover:bg-gray-800 transition-all"
          >
            <Sparkles className="text-purple-600" /> 
            <div className="text-left">
                <span className="block font-bold text-gray-700 dark:text-gray-200">Planejamento IA</span>
                <span className="block text-[10px] text-gray-500">Sugestões Inteligentes</span>
            </div>
          </Button>

          {/* Botão Nova Sessão (Destaque) */}
          <Button 
            onClick={() => navigate(`/patients/${id}/sessions/new`)} 
            className="h-14 bg-green-600 hover:bg-green-700 text-white shadow-md transition-transform hover:scale-[1.02]"
          >
            <Plus size={20} className="mr-2" /> 
            <div className="text-left">
                <span className="block font-bold">Nova Sessão</span>
                <span className="block text-[10px] opacity-80">Registrar procedimento hoje</span>
            </div>
          </Button>
      </div>

      {/* --- 4. TIMELINE DE HISTÓRICO --- */}
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2 pb-2 border-b dark:border-gray-700">
            <Clock size={20} /> Histórico de Procedimentos
        </h3>

        {history.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
            <FileText className="mx-auto h-10 w-10 text-gray-300 mb-2" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">Nenhum procedimento registrado neste prontuário.</p>
            <p className="text-xs text-gray-400 mt-1">Clique em "Nova Sessão" para começar.</p>
          </div>
        ) : (
          <div className="space-y-6 pl-4 border-l-2 border-gray-200 dark:border-gray-700 ml-2">
            {history.map((item) => (
              <div key={item.id} className="relative pl-8">
                {/* Bolinha da Timeline */}
                <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-pink-500 border-4 border-white dark:border-gray-900 shadow-sm"></div>
                
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-5 relative group">
                  
                  {/* Botão Excluir (Hover) */}
                  <button onClick={() => handleDelete(item.id)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 size={16} />
                  </button>

                  <div className="flex justify-between items-start mb-4">
                      <div>
                          <span className="text-xs font-bold text-pink-600 bg-pink-50 px-2 py-1 rounded-full uppercase">
                              Sessão Realizada
                          </span>
                          <h4 className="text-md font-bold text-gray-800 dark:text-white mt-2">
                              {format(new Date(item.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </h4>
                          <span className="text-xs text-gray-500">{format(new Date(item.created_at), "HH:mm", { locale: ptBR })}</span>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Notas */}
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-md text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {item.notes}
                    </div>

                    {/* Fotos */}
                    {item.photos && (item.photos.before || item.photos.after) && (
                      <div className="h-40 w-full rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                        <BeforeAfter 
                          beforeImage={item.photos.before || "https://placehold.co/400x300?text=Sem+Foto"}
                          afterImage={item.photos.after || item.photos.before}
                          labelBefore="Antes"
                          labelAfter="Depois"
                        />
                      </div>
                    )}
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
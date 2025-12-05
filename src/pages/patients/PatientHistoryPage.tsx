import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { format, differenceInYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ArrowLeft, Plus, Calendar, FileText, Loader2, Trash2, 
  Sparkles, Clock, FileSignature, User, Phone, AlertCircle, 
  Edit, Activity, BarChart3, Pill 
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
  const [latestBio, setLatestBio] = useState<any>(null);
  
  // Abas do Painel
  const [activeTab, setActiveTab] = useState<'historico' | 'bio' | 'anamnese'>('historico');

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  async function fetchData() {
    try {
      setLoading(true);
      
      // 1. Paciente + Perfil
      const { data: patientData, error: patError } = await supabase
        .from('patients')
        .select(`*, profiles:profile_id (*)`)
        .eq('id', id)
        .single();
      if (patError) throw patError;
      setPatient(patientData);

      // 2. Histórico (Tratamentos)
      const { data: historyData, error: histError } = await supabase
        .from('patient_treatments')
        .select('*')
        .eq('patient_id', id)
        .order('created_at', { ascending: false });
      if (histError) throw histError;
      setHistory(historyData || []);

      // 3. Última Bioimpedância (Para o resumo)
      const { data: bioData } = await supabase
        .from('patient_bioimpedance')
        .select('*')
        .eq('patient_id', id)
        .order('data', { ascending: false })
        .limit(1)
        .single();
      setLatestBio(bioData); // Pode ser null se não tiver

    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(recordId: string) {
    if(!confirm("Tem certeza que deseja apagar este registro?")) return;
    await supabase.from('patient_treatments').delete().eq('id', recordId);
    fetchData();
    toast.success("Registro apagado.");
  }

  const getAge = (dateString: string) => {
      if (!dateString) return '-';
      return differenceInYears(new Date(), new Date(dateString));
  };

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-pink-600 w-10 h-10" /></div>;

  return (
    <div className="p-6 max-w-6xl mx-auto pb-20">
      
      {/* --- 1. CABEÇALHO GERAL --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/patients')} className="p-2">
            <ArrowLeft size={24} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                {patient?.profiles?.first_name} {patient?.profiles?.last_name}
            </h1>
            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1"><User size={14}/> {getAge(patient?.date_of_birth)} anos</span>
                <span className="flex items-center gap-1"><Phone size={14}/> {patient?.profiles?.phone}</span>
                <button onClick={() => navigate(`/patients/${id}/edit`)} className="text-blue-500 hover:underline flex items-center gap-1 ml-2">
                    <Edit size={12}/> Editar Dados
                </button>
            </div>
          </div>
        </div>

        {/* Botão de Ação Principal (Sempre visível) */}
        <Button 
            onClick={() => navigate(`/patients/${id}/sessions/new`)} 
            className="bg-green-600 hover:bg-green-700 text-white shadow-lg transition-transform hover:scale-105"
        >
            <Plus size={20} className="mr-2" /> Nova Sessão / Atendimento
        </Button>
      </div>

      {/* --- 2. NAVEGAÇÃO (ABAS) --- */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="flex gap-6">
              <TabButton 
                  active={activeTab === 'historico'} 
                  onClick={() => setActiveTab('historico')} 
                  label="Histórico Clínico" 
                  icon={<Clock size={18} />} 
              />
              <TabButton 
                  active={activeTab === 'bio'} 
                  onClick={() => setActiveTab('bio')} 
                  label="Evolução Corporal" 
                  icon={<Activity size={18} />} 
              />
              <TabButton 
                  active={activeTab === 'anamnese'} 
                  onClick={() => setActiveTab('anamnese')} 
                  label="Ficha de Anamnese" 
                  icon={<FileSignature size={18} />} 
              />
          </nav>
      </div>

      {/* --- CONTEÚDO DAS ABAS --- */}
      
      {/* ABA 1: HISTÓRICO (TIMELINE) */}
      {activeTab === 'historico' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
             <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                 <p className="text-sm text-gray-600 dark:text-gray-300">
                    Visualizando <b>{history.length}</b> atendimentos realizados.
                 </p>
                 <Button 
                    onClick={() => navigate(`/patients/${id}/injectables`)} 
                    variant="outline" 
                    className="text-purple-600 border-purple-200 hover:bg-purple-50"
                 >
                    <Sparkles size={16} className="mr-2" /> Planejamento IA
                 </Button>
             </div>

             {history.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                    <p className="text-gray-400">Nenhum atendimento registrado.</p>
                </div>
             ) : (
                <div className="relative border-l-2 border-gray-200 dark:border-gray-700 ml-4 space-y-8 pb-4">
                    {history.map((item) => (
                        <div key={item.id} className="ml-8 relative">
                            <div className="absolute -left-[41px] top-0 h-5 w-5 rounded-full bg-pink-500 border-4 border-white dark:border-gray-900"></div>
                            
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 group">
                                <button onClick={() => handleDelete(item.id)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
                                
                                <div className="flex items-center gap-2 mb-3">
                                    <Calendar size={16} className="text-pink-600" />
                                    <span className="font-bold text-gray-800 dark:text-white">
                                        {format(new Date(item.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                    </span>
                                    <span className="text-xs text-gray-400">• {format(new Date(item.created_at), "HH:mm", { locale: ptBR })}</span>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
                                        {item.notes}
                                    </div>
                                    {item.photos && (item.photos.before || item.photos.after) && (
                                        <div className="h-40 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                                            <BeforeAfter 
                                                beforeImage={item.photos.before || "https://placehold.co/400x300?text=Sem+Foto"}
                                                afterImage={item.photos.after || item.photos.before}
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
      )}

      {/* ABA 2: BIOIMPEDÂNCIA (EVOLUÇÃO CORPORAL) */}
      {activeTab === 'bio' && (
          <div className="animate-in fade-in slide-in-from-right-4">
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                  {/* Card Resumo */}
                  <div className="md:col-span-1 bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-800">
                      <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-4 flex items-center gap-2">
                          <Activity size={20} /> Última Medição
                      </h3>
                      {latestBio ? (
                          <div className="space-y-3">
                              <div className="flex justify-between text-sm"><span>Gordura:</span> <span className="font-bold">{latestBio.gordura_percentual}%</span></div>
                              <div className="flex justify-between text-sm"><span>Músculo:</span> <span className="font-bold">{latestBio.massa_muscular_kg} kg</span></div>
                              <div className="flex justify-between text-sm"><span>Água:</span> <span className="font-bold">{latestBio.agua_percentual}%</span></div>
                              <div className="flex justify-between text-sm"><span>Visceral:</span> <span className="font-bold">{latestBio.gordura_visceral}</span></div>
                              <div className="text-xs text-gray-400 mt-2">Data: {new Date(latestBio.data).toLocaleDateString()}</div>
                          </div>
                      ) : (
                          <p className="text-sm text-gray-500 italic">Nenhum dado registrado ainda.</p>
                      )}
                      
                      <div className="mt-6 pt-4 border-t border-blue-200 dark:border-blue-800">
                          <Button onClick={() => navigate(`/patients/${id}/sessions/new`)} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                              <Plus size={16} className="mr-2" /> Nova Medição
                          </Button>
                      </div>
                  </div>

                  {/* Ação Principal */}
                  <div className="md:col-span-2 bg-white dark:bg-gray-800 p-8 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center text-center">
                      <BarChart3 size={48} className="text-gray-300 mb-4" />
                      <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Acompanhamento de Evolução</h3>
                      <p className="text-gray-500 max-w-md mb-6">
                          Visualize gráficos detalhados de perda de gordura, ganho de massa magra e idade metabólica.
                      </p>
                      <Button onClick={() => navigate(`/patients/${id}/bioimpedance`)} variant="outline" className="border-pink-200 text-pink-700 hover:bg-pink-50">
                          Ver Gráficos Completos
                      </Button>
                  </div>
              </div>
          </div>
      )}

      {/* ABA 3: ANAMNESE (RESUMO E AÇÕES) */}
      {activeTab === 'anamnese' && (
          <div className="animate-in fade-in slide-in-from-right-4">
              <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                      <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                          <AlertCircle size={18} className="text-red-500" /> Alertas de Saúde
                      </h3>
                      <ul className="space-y-2 text-sm">
                          <li className="flex justify-between border-b pb-1">
                              <span className="text-gray-500">Alergias:</span>
                              <span className="font-medium text-red-600">{patient?.alergias_medicamentosas || 'Nenhuma'}</span>
                          </li>
                          <li className="flex justify-between border-b pb-1">
                              <span className="text-gray-500">Doenças Crônicas:</span>
                              <span className="font-medium">{patient?.doencas_cronicas || 'Nenhuma'}</span>
                          </li>
                          <li className="flex justify-between border-b pb-1">
                              <span className="text-gray-500">Uso de Medicamentos:</span>
                              <span className="font-medium">{patient?.lista_medicacoes || 'Não'}</span>
                          </li>
                          <li className="flex justify-between">
                              <span className="text-gray-500">Gestante/Lactante:</span>
                              <span className="font-medium">{patient?.gestante ? 'SIM' : 'Não'}</span>
                          </li>
                      </ul>
                  </div>

                  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                      <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                          <Sparkles size={18} className="text-purple-500" /> Perfil Estético
                      </h3>
                      <ul className="space-y-2 text-sm">
                          <li className="flex justify-between border-b pb-1">
                              <span className="text-gray-500">Queixa Principal:</span>
                              <span className="font-medium truncate max-w-[200px]">{patient?.queixa_principal || '-'}</span>
                          </li>
                          <li className="flex justify-between border-b pb-1">
                              <span className="text-gray-500">Fototipo:</span>
                              <span className="font-medium">{patient?.fototipo || '-'}</span>
                          </li>
                          <li className="flex justify-between">
                              <span className="text-gray-500">Biotipo:</span>
                              <span className="font-medium">{patient?.biotipo_cutaneo || '-'}</span>
                          </li>
                      </ul>
                  </div>
              </div>
              
              <div className="mt-8 flex justify-center">
                  <Button onClick={() => navigate(`/patients/${id}/anamnesis`)} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg shadow-lg">
                      <FileSignature size={20} className="mr-2" /> Abrir Ficha Completa / Editar
                  </Button>
              </div>
          </div>
      )}

    </div>
  );
}

// Componente de Aba Simples
const TabButton = ({ active, onClick, label, icon }: any) => (
    <button 
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
            active 
            ? 'border-pink-500 text-pink-600 font-bold' 
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
        }`}
    >
        {icon} {label}
    </button>
);
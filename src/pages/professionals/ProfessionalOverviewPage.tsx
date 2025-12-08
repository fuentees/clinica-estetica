import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  ArrowRight, 
  Loader2, 
  Activity,
  Users,
  Sparkles,
  Pencil,
  Ban,
  FileText,
  PlusCircle,
  Lock
} from 'lucide-react';
import { Button } from '../../components/ui/button';

export default function ProfessionalOverviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({
    monthCount: 0,
    commission: 0,
    next: null as any
  });
  
  const [todayList, setTodayList] = useState<any[]>([]);

  // Função para carregar dados
  async function loadDashboard() {
    if (!id) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

      // 1. Total do Mês
      const { count: monthCount } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('professional_id', id)
          .gte('date', monthStart)
          .neq('status', 'cancelled');

      // 2. Próximo Paciente (Futuro imediato)
      const { data: next } = await supabase
          .from('appointments')
          .select(`
              id, date, start_time, 
              patient:patient_id(id, name, profiles(first_name, last_name)),
              treatment:treatment_id(name)
          `)
          .eq('professional_id', id)
          .gte('date', today)
          .eq('status', 'scheduled') // Apenas agendados
          .order('date', { ascending: true })
          .order('start_time', { ascending: true })
          .limit(1)
          .single();

      // 3. Lista de Hoje (Corrigida para trazer nomes profundos)
      const { data: todays } = await supabase
          .from('appointments')
          .select(`
              id, start_time, status, notes,
              patient:patient_id(id, name, profiles(first_name, last_name)), 
              treatment:treatment_id(name)
          `)
          .eq('professional_id', id)
          .eq('date', today)
          .neq('status', 'cancelled') // Ocultar cancelados da lista principal
          .order('start_time');

      // Cálculo Estimado (Ex: Ticket Médio 200 * 30%)
      const estimatedCommission = (monthCount || 0) * 200 * 0.30;

      setStats({ 
          monthCount: monthCount || 0, 
          commission: estimatedCommission, 
          next 
      });
      
      setTodayList(todays || []);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    loadDashboard().then(() => setLoading(false));
  }, [id]);

  // --- AÇÕES ---
  const handleCancel = async (apptId: string) => {
      if (window.confirm("Deseja cancelar este atendimento da agenda de hoje?")) {
          try {
              await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', apptId);
              toast.success("Cancelado!");
              loadDashboard(); // Recarrega
          } catch (e) {
              toast.error("Erro ao cancelar.");
          }
      }
  }

  const handleEdit = (apptId: string) => {
      navigate(`/appointments/${apptId}/edit`);
  }

  // Helper para Nome do Paciente Seguro
  const getPatientName = (appt: any) => {
      const p = Array.isArray(appt.patient) ? appt.patient[0] : appt.patient;
      if (!p) return 'Paciente';
      
      if (p.name && p.name !== 'Paciente') return p.name;
      
      const prof = p.profiles; 
      const profileData = Array.isArray(prof) ? prof[0] : prof;
      
      if (profileData?.first_name) {
          return `${profileData.first_name} ${profileData.last_name || ''}`;
      }
      return p.name || 'Paciente';
  };

  const getPatientId = (appt: any) => {
      const p = Array.isArray(appt.patient) ? appt.patient[0] : appt.patient;
      return p?.id;
  }

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-pink-600 w-10 h-10"/></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 p-2">
      
      {/* --- BLOCO SUPERIOR: DESTAQUE + KPIS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUNA 1: CARD DESTAQUE "PRÓXIMO PACIENTE" */}
        <div className="lg:col-span-1 relative overflow-hidden p-8 rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 text-white shadow-2xl flex flex-col justify-between group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            
            <div>
                <div className="flex items-center gap-2 mb-6">
                    <span className="bg-white/20 p-2 rounded-xl backdrop-blur-sm"><Clock size={20} className="text-pink-300"/></span>
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-300">A Seguir</span>
                </div>

                {stats.next ? (
                    <div className="space-y-4">
                        <div>
                            <h2 className="text-3xl font-bold leading-tight">{getPatientName(stats.next)}</h2>
                            <p className="text-gray-400 text-sm mt-1">{stats.next.treatment?.name || 'Consulta'}</p>
                        </div>
                        
                        <div className="inline-flex items-center gap-3 bg-white/10 p-3 rounded-xl border border-white/5 backdrop-blur-md">
                            <div className="bg-pink-500 rounded-lg p-2 text-white shadow-lg shadow-pink-500/20">
                                <Calendar size={18} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-300 font-medium">Horário Confirmado</p>
                                <p className="text-lg font-bold">{new Date(stats.next.date).toLocaleDateString('pt-BR')} às {stats.next.start_time.slice(0,5)}</p>
                            </div>
                        </div>

                        <Button 
                            onClick={() => navigate(`/patients/${getPatientId(stats.next)}`)}
                            className="w-full bg-white text-gray-900 hover:bg-gray-100 font-bold rounded-xl mt-2"
                        >
                            Abrir Prontuário <ArrowRight size={16} className="ml-2"/>
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                        <Sparkles size={32} className="mb-2 opacity-50"/>
                        <p>Agenda livre por enquanto.</p>
                    </div>
                )}
            </div>
        </div>

        {/* COLUNA 2 & 3: KPIS E ATALHOS */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* KPI 1: MÊS */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-purple-100 dark:border-gray-700 shadow-xl shadow-purple-50 dark:shadow-none hover:-translate-y-1 transition-all">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-2xl text-purple-600"><Activity size={24}/></div>
                    <span className="text-xs font-bold text-gray-400 uppercase">Performance</span>
                </div>
                <h3 className="text-4xl font-black text-gray-900 dark:text-white">{stats.monthCount}</h3>
                <p className="text-sm text-gray-500">Atendimentos este mês</p>
                <div className="mt-4 h-1.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 w-[65%] rounded-full"></div>
                </div>
            </div>

            {/* KPI 2: COMISSÃO */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-green-100 dark:border-gray-700 shadow-xl shadow-green-50 dark:shadow-none hover:-translate-y-1 transition-all">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-2xl text-green-600"><DollarSign size={24}/></div>
                    <span className="text-xs font-bold text-gray-400 uppercase">Financeiro</span>
                </div>
                <h3 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                    <span className="text-lg font-medium text-gray-400 mr-1">R$</span>
                    {stats.commission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h3>
                <p className="text-sm text-gray-500">Comissão estimada</p>
                <div className="mt-4 flex gap-2">
                    <span className="text-[10px] bg-green-50 text-green-700 px-2 py-1 rounded-md font-bold flex items-center gap-1"><TrendingUp size={10}/> +12% vs mês anterior</span>
                </div>
            </div>

            {/* ATALHOS RÁPIDOS */}
            <div className="md:col-span-2 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700 flex gap-4 overflow-x-auto">
                <Button variant="outline" onClick={() => navigate(`agenda`)} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl h-auto py-3 px-4 flex flex-col gap-2 min-w-[100px]">
                    <Calendar size={20} className="text-blue-500"/>
                    <span className="text-xs font-bold">Ver Agenda</span>
                </Button>
                <Button variant="outline" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl h-auto py-3 px-4 flex flex-col gap-2 min-w-[100px]">
                    <Lock size={20} className="text-orange-500"/>
                    <span className="text-xs font-bold">Bloquear</span>
                </Button>
                <Button variant="outline" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl h-auto py-3 px-4 flex flex-col gap-2 min-w-[100px]">
                    <PlusCircle size={20} className="text-pink-500"/>
                    <span className="text-xs font-bold">Extra</span>
                </Button>
            </div>
        </div>
      </div>

      {/* --- AGENDA DE HOJE (LISTA COMPLETA COM AÇÕES) --- */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800">
              <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Activity size={20} className="text-pink-600"/> Agenda de Hoje
                  </h3>
                  <span className="text-xs text-gray-500 mt-1 block">
                      {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </span>
              </div>
              <Button onClick={() => navigate('agenda')} size="sm" className="bg-white dark:bg-gray-700 text-gray-700 dark:text-white border border-gray-200 dark:border-gray-600 shadow-sm hover:bg-gray-50">
                  Ver Completa
              </Button>
          </div>

          <div className="p-6">
              {todayList.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-2xl bg-gray-50/30 dark:bg-gray-900/30">
                      <Sparkles size={40} className="mx-auto mb-3 opacity-50 text-yellow-500"/>
                      <p className="text-lg font-medium text-gray-600 dark:text-gray-300">Dia livre!</p>
                      <p className="text-sm">Nenhum agendamento pendente para hoje.</p>
                  </div>
              ) : (
                  <div className="space-y-3">
                      {todayList.map(appt => (
                          <div key={appt.id} className="group flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-pink-200 hover:shadow-lg transition-all duration-300">
                              
                              {/* Hora */}
                              <div className="flex items-center gap-4 min-w-[100px]">
                                  <div className="bg-pink-50 dark:bg-pink-900/20 text-pink-600 p-3 rounded-xl text-center border border-pink-100 dark:border-pink-900/50 group-hover:bg-pink-600 group-hover:text-white transition-colors">
                                      <span className="block text-xl font-black tracking-tight">{appt.start_time.slice(0,5)}</span>
                                  </div>
                              </div>
                              
                              {/* Info Paciente */}
                              <div className="flex-1">
                                  <h4 className="font-bold text-gray-900 dark:text-white text-lg group-hover:text-pink-600 transition-colors flex items-center gap-2 cursor-pointer" onClick={() => navigate(`/patients/${getPatientId(appt)}`)}>
                                      {getPatientName(appt)}
                                      <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 -ml-2 group-hover:ml-0 transition-all"/>
                                  </h4>
                                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                      <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                                          {appt.treatment?.name || 'Consulta'}
                                      </span>
                                      {appt.notes && <span className="flex items-center gap-1 text-gray-400"><FileText size={10}/> Obs.</span>}
                                  </div>
                              </div>
                              
                              {/* Ações e Status */}
                              <div className="flex items-center gap-3">
                                  {/* Botões de Ação (Só aparecem se não concluído) */}
                                  {appt.status !== 'completed' && appt.status !== 'cancelled' && (
                                      <div className="flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                          <Button 
                                            size="sm" variant="ghost" 
                                            onClick={() => handleEdit(appt.id)}
                                            className="h-9 w-9 p-0 rounded-full text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                            title="Editar"
                                          >
                                              <Pencil size={16}/>
                                          </Button>
                                          <Button 
                                            size="sm" variant="ghost" 
                                            onClick={() => handleCancel(appt.id)}
                                            className="h-9 w-9 p-0 rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                            title="Cancelar"
                                          >
                                              <Ban size={16}/>
                                          </Button>
                                      </div>
                                  )}

                                  <span className={`text-[10px] uppercase font-bold px-3 py-1.5 rounded-lg border ${
                                      appt.status === 'completed' ? 'bg-blue-50 text-blue-700 border-blue-100' : 
                                      appt.status === 'confirmed' ? 'bg-green-50 text-green-700 border-green-100' :
                                      'bg-yellow-50 text-yellow-700 border-yellow-100'
                                  }`}>
                                      {appt.status === 'scheduled' ? 'Agendado' : appt.status}
                                  </span>
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>
      </div>
    </div>
  );
}
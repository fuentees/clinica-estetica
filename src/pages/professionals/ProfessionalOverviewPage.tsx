import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { 
  Calendar, DollarSign, Clock, 
  Loader2, Activity, Sparkles, Pencil, Ban, FileText, 
  Lock, X, AlertCircle, PlusCircle, Play 
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts';

// --- FUNÇÕES DE DATA E HORA SEGURAS ---

// Retorna YYYY-MM-DD para o dia de hoje (Local)
const getTodayDateStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Formata a data para um formato amigável (DD/MM/AAAA ou Hoje/Amanhã)
const formatFriendlyDate = (dateStr: string) => {
    if (!dateStr) return "--/--";
    const today = getTodayDateStr();
    
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const tomorrow = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    if (dateStr === today) return "Hoje";
    if (dateStr === tomorrow) return "Amanhã";
    
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
};

// CORREÇÃO CRÍTICA FINAL: Usa o objeto Date para converter o timestamp do DB para o HH:MM local.
const formatTime = (isoString: string) => {
    if (!isoString) return '';
    
    // Limpa a string para garantir que o construtor do Date consiga ler, 
    // tratando a string como o momento exato em UTC (ou com fuso se estiver presente).
    let cleanIsoString = isoString.replace(' ', 'T'); 
    
    // Cria um objeto Date. Ele converte o ponto no tempo para o fuso local do navegador.
    const date = new Date(cleanIsoString);
    
    // Fallback para dados muito antigos ou mal formatados: extrai HH:MM por string slice.
    if (isNaN(date.getTime())) {
        return cleanIsoString.substring(11, 16) || '--:--';
    }

    // toLocaleTimeString retorna HH:MM no fuso horário do usuário. Isso corrige a exibição.
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};


// FUNÇÃO PARA INSERÇÃO: Retorna o offset de fuso horário local (ex: -03:00)
const getLocalTimezoneOffsetString = () => {
    const offset = new Date().getTimezoneOffset();
    const sign = offset > 0 ? '-' : '+';
    const absOffset = Math.abs(offset);
    const hours = String(Math.floor(absOffset / 60)).padStart(2, '0');
    const minutes = String(absOffset % 60).padStart(2, '0');
    return `${sign}${hours}:${minutes}`;
};


export default function ProfessionalOverviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);

  const [stats, setStats] = useState({
    monthCount: 0,
    commission: 0,
    next: null as any,
    chartData: [] as any[], 
    goalPercent: 0
  });
  
  const [todayList, setTodayList] = useState<any[]>([]);

  const MONTHLY_GOAL = 10000; 

  // --- CARREGAMENTO DE DADOS ---
  async function loadDashboard() {
    if (!id) return;
    
    try {
      const todayStr = getTodayDateStr(); 
      const now = new Date(); 
      // Horário atual para comparação (sem fuso, apenas HH:MM)
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`; 
      const monthStart = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`;

      // 1. Total Mês
      const { count: monthCount } = await supabase.from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('professional_id', id)
          .gte('date', monthStart)
          .neq('status', 'cancelled')
          .neq('status', 'blocked');

      // 2. Próximo Paciente (Lógica JS Robusta)
      const { data: futureAppts } = await supabase.from('appointments')
          .select(`id, date, start_time, status, patient:patient_id(id, name, profiles(first_name, last_name)), treatment:treatment_id(name)`)
          .eq('professional_id', id).gte('date', todayStr).eq('status', 'scheduled').order('date', { ascending: true }).order('start_time', { ascending: true }).limit(10);

      let nextAppt = null;
      if (futureAppts) {
          nextAppt = futureAppts.find((appt: any) => {
              if (appt.date > todayStr) return true;
              // Compara a hora agendada (extraída da string) com a hora atual.
              if (appt.date === todayStr && formatTime(appt.start_time) > currentTime) return true; 
              return false;
          });
      }

      // 3. Agenda de Hoje
      const { data: todays } = await supabase.from('appointments')
          .select(`id, start_time, status, notes, patient:patient_id(id, name, profiles(first_name, last_name)), treatment:treatment_id(name)`)
          .eq('professional_id', id).eq('date', todayStr).neq('status', 'cancelled').order('start_time');

      // 4. Gráfico
      const chartData = [];
      for (let i = 6; i >= 0; i--) {
          const d = new Date(); d.setDate(d.getDate() - i);
          const y = d.getFullYear(); const m = String(d.getMonth() + 1).padStart(2, '0'); const dy = String(d.getDate()).padStart(2, '0');
          const dStr = `${y}-${m}-${dy}`;
          const { count } = await supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('professional_id', id).eq('date', dStr).neq('status', 'cancelled');
          chartData.push({ day: `${dy}/${m}`, appointments: count || 0 });
      }

      const estimatedCommission = (monthCount || 0) * 150 * 0.30; 
      const goalPercent = Math.min((estimatedCommission / MONTHLY_GOAL) * 100, 100);

      setStats({ monthCount: monthCount || 0, commission: estimatedCommission, next: nextAppt, chartData, goalPercent });
      setTodayList(todays || []);

    } catch (error) { console.error(error); } finally { setLoading(false); }
  }

  useEffect(() => { setLoading(true); loadDashboard().then(() => setLoading(false)); }, [id]);

  // --- AÇÕES ---
  const handleCancel = async (e: React.MouseEvent, apptId: string) => {
      e.stopPropagation();
      if (window.confirm("Cancelar este agendamento?")) {
          await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', apptId);
          toast.success("Cancelado!"); loadDashboard();
      }
  }

  const handleEdit = (e: React.MouseEvent, apptId: string) => {
      e.stopPropagation();
      navigate(`/appointments/${apptId}/edit`);
  }
  
  const handleStartAttendance = (e: React.MouseEvent, patientId: string) => {
      e.stopPropagation();
      if(patientId) navigate(`/patients/${patientId}/evolution`);
      else toast.error("Erro: Paciente não identificado");
  }

  // --- HELPERS ---
  const getPatientName = (appt: any) => {
      if (appt.status === 'blocked') return 'Horário Bloqueado';
      const p = Array.isArray(appt.patient) ? appt.patient[0] : appt.patient;
      if (!p) return 'Paciente';
      const prof = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
      return prof?.first_name ? `${prof.first_name} ${prof.last_name || ''}` : p.name || 'Paciente';
  };
  
  const getPatientId = (appt: any) => {
      if (appt.status === 'blocked') return null;
      const p = Array.isArray(appt.patient) ? appt.patient[0] : appt.patient;
      return p?.id;
  }

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-pink-600 w-10 h-10"/></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-700 p-2 relative">
      
      {isBlockModalOpen && <BlockScheduleModal professionalId={id!} onClose={() => setIsBlockModalOpen(false)} onSuccess={() => { setIsBlockModalOpen(false); loadDashboard(); }} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 1. DESTAQUE PRÓXIMO */}
        <div className="lg:col-span-1 relative overflow-hidden p-8 rounded-[2rem] bg-gray-900 text-white shadow-2xl shadow-gray-200 dark:shadow-none flex flex-col justify-between group">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-600/20 to-purple-900/40 opacity-50"></div>
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-8">
                    <span className="bg-white/10 p-2 rounded-xl backdrop-blur-md border border-white/10"><Clock size={20} className="text-pink-300"/></span>
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-300">A Seguir</span>
                </div>

                {stats.next ? (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-3xl font-bold leading-tight line-clamp-2">{getPatientName(stats.next)}</h2>
                            <p className="text-gray-300 text-sm mt-1 flex items-center gap-2"><Sparkles size={12} className="text-yellow-400"/> {stats.next.treatment?.name || 'Consulta'}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="bg-pink-500 rounded-lg p-2.5 text-white shadow-lg shadow-pink-500/30"><Calendar size={20} /></div>
                            <div>
                                <p className="text-xs text-gray-400 font-medium uppercase">Data & Hora</p>
                                <p className="text-xl font-bold tracking-tight">
                                    {formatFriendlyDate(stats.next.date)} às {formatTime(stats.next.start_time)} 
                                </p>
                            </div>
                        </div>
                        <Button onClick={(e) => handleStartAttendance(e, getPatientId(stats.next))} className="w-full h-12 bg-white text-gray-900 hover:bg-gray-100 font-bold rounded-xl shadow-xl transition-all">
                            <Play size={16} className="mr-2 fill-current"/> Iniciar Atendimento
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                        <Sparkles size={32} className="mb-3 opacity-30"/>
                        <p className="font-medium">Agenda livre</p>
                        <p className="text-xs opacity-50">Nenhum paciente aguardando.</p>
                    </div>
                )}
            </div>
        </div>

        {/* 2. DASHBOARD FINANCEIRO E GRÁFICO */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-xl shadow-green-50 dark:shadow-none relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-2xl text-green-600"><DollarSign size={24}/></div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Comissão</span>
                    </div>
                    <h3 className="text-4xl font-black text-gray-900 dark:text-white mb-1">
                        <span className="text-lg font-medium text-gray-400 mr-1">R$</span>{stats.commission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </h3>
                    <div className="mt-4">
                        <div className="flex justify-between text-xs font-bold mb-1.5"><span className="text-gray-400">Meta</span><span className="text-green-600">{stats.goalPercent.toFixed(0)}%</span></div>
                        <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-green-400 to-emerald-600 rounded-full" style={{ width: `${stats.goalPercent}%` }}></div></div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-purple-100 dark:border-gray-700 shadow-xl shadow-purple-50 dark:shadow-none relative overflow-hidden">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-purple-500"></div><span className="text-xs font-bold text-gray-400 uppercase">Atendimentos (7 dias)</span></div>
                    <h4 className="text-2xl font-black text-gray-900 dark:text-white">{stats.monthCount} <span className="text-xs font-medium text-gray-400">Total Mês</span></h4>
                </div>
                <div className="h-24 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.chartData}>
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} cursor={{ stroke: '#8b5cf6' }} />
                            <Area type="monotone" dataKey="appointments" stroke="#8b5cf6" strokeWidth={3} fillOpacity={0.2} fill="#8b5cf6" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="md:col-span-2 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-[1.5rem] border border-dashed border-gray-200 dark:border-gray-700 flex gap-3 overflow-x-auto">
                <ToolButton icon={<Calendar/>} label="Agenda" onClick={() => navigate(`agenda`)} color="blue"/>
                <ToolButton icon={<Lock/>} label="Bloquear" onClick={() => setIsBlockModalOpen(true)} color="orange"/>
                <ToolButton icon={<PlusCircle/>} label="Agendar" onClick={() => navigate('/appointments/new')} color="pink"/>
            </div>
        </div>
      </div>

      {/* --- AGENDA DE HOJE --- */}
      <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2"><Activity size={20} className="text-pink-600"/> Agenda de Hoje</h3>
              <span className="text-xs font-bold bg-white dark:bg-gray-900 px-3 py-1 rounded-full border shadow-sm">{formatFriendlyDate(getTodayDateStr())}</span>
          </div>
          <div className="p-6 space-y-3">
              {todayList.length === 0 ? <p className="text-center text-gray-400 py-10">Agenda livre hoje!</p> : todayList.map(appt => (
                  <div 
                    key={appt.id} 
                    className={`group flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${appt.status === 'blocked' ? 'bg-gray-100 opacity-70 cursor-default' : 'bg-white hover:border-pink-200 hover:shadow-lg'}`}
                    onClick={() => appt.status !== 'blocked' && navigate(`/patients/${getPatientId(appt)}`)}
                  >
                      <div className={`p-3 rounded-xl min-w-[80px] text-center border ${appt.status === 'blocked' ? 'bg-gray-200 text-gray-500 border-gray-300' : 'bg-pink-50 text-pink-600 border-pink-100'}`}>
                          <span className="block text-xl font-black">{formatTime(appt.start_time)}</span> 
                      </div>
                      <div className="flex-1">
                          <h4 className={`font-bold text-lg ${appt.status === 'blocked' ? 'text-gray-500' : 'text-gray-900 group-hover:text-pink-600'}`}>
                              {getPatientName(appt)}
                          </h4>
                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                              {appt.status === 'blocked' ? <span className="flex items-center gap-1 text-orange-600 font-bold"><Lock size={12}/> Bloqueio</span> : <span className="bg-gray-100 px-2 py-0.5 rounded border">{appt.treatment?.name || 'Consulta'}</span>}
                              {appt.notes && <span className="flex items-center gap-1 text-gray-400"><FileText size={10}/> Obs.</span>}
                          </div>
                      </div>
                      
                      {/* BOTÕES DE AÇÃO (Com StopPropagation) */}
                      {appt.status !== 'completed' && appt.status !== 'cancelled' && (
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {appt.status !== 'blocked' && (
                                <Button size="sm" variant="ghost" onClick={(e) => handleEdit(e, appt.id)} className="h-9 w-9 p-0 rounded-full text-blue-500 hover:bg-blue-50"><Pencil size={16}/></Button>
                              )}
                              <Button size="sm" variant="ghost" onClick={(e) => handleCancel(e, appt.id)} className="h-9 w-9 p-0 rounded-full text-red-500 hover:bg-red-50"><Ban size={16}/></Button>
                          </div>
                      )}
                      <span className={`text-[10px] uppercase font-bold px-3 py-1.5 rounded-lg border ${appt.status === 'confirmed' ? 'bg-green-50 text-green-700' : appt.status === 'blocked' ? 'bg-orange-50 text-orange-700' : 'bg-yellow-50 text-yellow-700'}`}>{appt.status === 'scheduled' ? 'Agendado' : appt.status}</span>
                  </div>
              ))}
          </div>
      </div>
    </div>
  );
}

function ToolButton({ icon, label, onClick, color }: any) {
    const colors: any = { blue: 'text-blue-500 hover:border-blue-300', orange: 'text-orange-500 hover:border-orange-300', pink: 'text-pink-500 hover:border-pink-300' };
    return (
        <Button variant="outline" onClick={onClick} className={`bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl h-auto py-3 px-6 flex flex-col gap-2 min-w-[110px] transition-all ${colors[color]}`}>
            {icon} <span className="text-xs font-bold text-gray-600 dark:text-gray-300">{label}</span>
        </Button>
    )
}

function BlockScheduleModal({ professionalId, onClose, onSuccess }: any) {
    const [l, setL] = useState(false);
    const [f, setF] = useState({ date: new Date().toISOString().split('T')[0], start: "", end: "", reason: "" });
    
    // Função auxiliar para offset de fuso horário
    const getLocalTimezoneOffsetString = () => {
        const offset = new Date().getTimezoneOffset(); // Minutos offset de UTC. Ex: 180 para UTC-3
        const sign = offset > 0 ? '-' : '+'; 
        const absOffset = Math.abs(offset);
        const hours = String(Math.floor(absOffset / 60)).padStart(2, '0');
        const minutes = String(absOffset % 60).padStart(2, '0');
        return `${sign}${hours}:${minutes}`; // Ex: -03:00
    };

    const save = async () => {
        if(!f.start || !f.end || !f.reason) return toast.error("Preencha tudo");
        setL(true);

        const offset = getLocalTimezoneOffsetString();

        // SALVA COM OFFSET LOCAL
        await supabase.from('appointments').insert({ 
            professional_id: professionalId, 
            date: f.date, 
            start_time: `${f.date}T${f.start}:00${offset}`, // Adiciona ":00" e o Offset
            end_time: `${f.date}T${f.end}:00${offset}`, 
            status: 'blocked', 
            notes: `BLOQUEIO: ${f.reason}` 
        });

        toast.success("Bloqueado!"); onSuccess(); setL(false);
    }
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl shadow-2xl p-6 relative">
                <div className="flex justify-between mb-6"><h2 className="text-xl font-bold flex gap-2"><Lock className="text-orange-500"/> Bloquear</h2><button onClick={onClose}><X/></button></div>
                <div className="space-y-4">
                    <input type="date" value={f.date} onChange={e=>setF({...f, date:e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl border"/>
                    <div className="grid grid-cols-2 gap-4"><input type="time" value={f.start} onChange={e=>setF({...f, start:e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl border"/><input type="time" value={f.end} onChange={e=>setF({...f, end:e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl border"/></div>
                    <input type="text" placeholder="Motivo" value={f.reason} onChange={e=>setF({...f, reason:e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl border"/>
                    <Button onClick={save} disabled={l} className="w-full bg-orange-500 text-white h-12 rounded-xl">{l ? <Loader2 className="animate-spin"/> : "Confirmar"}</Button>
                </div>
            </div>
        </div>
    )
}
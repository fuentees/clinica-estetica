import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { 
  Calendar, DollarSign, Clock, 
  Loader2, Activity, Sparkles, Pencil, Ban, FileText, 
  Lock, X, PlusCircle, Play, ShieldCheck, Mail, User, Edit 
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ✅ IMPORTAÇÃO DO MODAL DE ACESSO (Certifique-se que o caminho está correto)
import { ProfessionalAccessModal } from '../../components/professionals/ProfessionalAccessModal';

// --- FUNÇÕES DE DATA E HORA SEGURAS ---

const getTodayDateStr = () => {
    const d = new Date();
    return format(d, 'yyyy-MM-dd');
};

const formatFriendlyDate = (dateStr: string) => {
    if (!dateStr) return "--/--";
    const today = getTodayDateStr();
    
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const tomorrow = format(d, 'yyyy-MM-dd');

    if (dateStr === today) return "Hoje";
    if (dateStr === tomorrow) return "Amanhã";
    
    // Corrige problema de fuso horário ao criar data a partir de string YYYY-MM-DD
    // Cria a data como se fosse meio-dia para evitar virada de dia por fuso
    const dateParts = dateStr.split('-');
    const dateObj = new Date(Number(dateParts[0]), Number(dateParts[1]) - 1, Number(dateParts[2]), 12, 0, 0);
    
    return format(dateObj, 'dd/MM/yyyy');
};

const formatTime = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '--:--';
    return format(date, 'HH:mm');
};

export default function ProfessionalOverviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  
  // ✅ ESTADOS NOVOS PARA O ACESSO
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [professionalDetails, setProfessionalDetails] = useState<any>(null);

  const [stats, setStats] = useState({
    monthCount: 0,
    commission: 0,
    next: null as any,
    chartData: [] as any[], 
    goalPercent: 0
  });
  
  const [todayList, setTodayList] = useState<any[]>([]);

  const MONTHLY_GOAL = 10000; 

  async function loadDashboard() {
    if (!id) return;
    
    try {
      // 0. ✅ Busca dados do Profissional (Para o botão de acesso)
      const { data: profData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
        
      if (profData) setProfessionalDetails(profData);

      const todayStr = getTodayDateStr(); 
      const now = new Date(); 
      const monthStart = format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd');

      // 1. Total Mês
      const { count: monthCount } = await supabase.from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('professional_id', id)
          .gte('start_time', `${monthStart}T00:00:00`)
          .neq('status', 'canceled');

      // 2. Próximo Paciente (Apenas agendados futuros)
      const { data: futureAppts } = await supabase.from('appointments')
          .select(`
            id, start_time, status, 
            patient:patients!patient_id(id, name), 
            service:services!service_id(name)
          `)
          .eq('professional_id', id)
          .gte('start_time', now.toISOString())
          .eq('status', 'scheduled')
          .order('start_time', { ascending: true })
          .limit(1);

      const nextAppt = futureAppts?.[0] || null;

      // 3. Agenda de Hoje
      const startToday = `${todayStr}T00:00:00`;
      const endToday = `${todayStr}T23:59:59`;
      
      const { data: todays } = await supabase.from('appointments')
          .select(`
            id, start_time, status, notes, 
            patient:patients!patient_id(id, name), 
            service:services!service_id(name)
          `)
          .eq('professional_id', id)
          .gte('start_time', startToday)
          .lte('start_time', endToday)
          .neq('status', 'canceled')
          .order('start_time');

      // 4. Gráfico (Últimos 7 dias)
      const chartData = [];
      for (let i = 6; i >= 0; i--) {
          const d = new Date(); 
          d.setDate(d.getDate() - i);
          const dStr = format(d, 'yyyy-MM-dd');
          
          const { count } = await supabase.from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('professional_id', id)
            .gte('start_time', `${dStr}T00:00:00`)
            .lte('start_time', `${dStr}T23:59:59`)
            .neq('status', 'canceled');
          
          chartData.push({ day: format(d, 'dd/MM'), appointments: count || 0 });
      }

      // Cálculo estimado de comissão (Valor fixo R$150 por consulta * 30%)
      // Idealmente isso viria do valor real dos serviços
      const estimatedCommission = (monthCount || 0) * 150 * 0.30; 
      const goalPercent = Math.min((estimatedCommission / MONTHLY_GOAL) * 100, 100);

      setStats({ monthCount: monthCount || 0, commission: estimatedCommission, next: nextAppt, chartData, goalPercent });
      setTodayList(todays || []);

    } catch (error) { 
      console.error("Erro Dashboard:", error); 
      toast.error("Erro ao carregar dados do dashboard.");
    } finally { 
      setLoading(false); 
    }
  }

  useEffect(() => { loadDashboard(); }, [id]);

  const handleCancel = async (e: React.MouseEvent, apptId: string) => {
      e.stopPropagation();
      if (window.confirm("Cancelar este agendamento?")) {
          const { error } = await supabase.from('appointments').update({ status: 'canceled' }).eq('id', apptId);
          if (error) {
            toast.error("Erro ao cancelar.");
          } else {
            toast.success("Cancelado!"); 
            loadDashboard();
          }
      }
  }

  const handleEdit = (e: React.MouseEvent, apptId: string) => {
      e.stopPropagation();
      navigate(`/appointments/${apptId}/edit`);
  }
  
  // CORREÇÃO: patient_id (snake_case) vindo do banco, patientId para uso local se necessário
  const handleStartAttendance = (e: React.MouseEvent, patientId: string | null) => {
      e.stopPropagation();
      if(patientId) navigate(`/patients/${patientId}/evolution`);
      else toast.error("Paciente não identificado ou horário bloqueado.");
  }

  const getPatientName = (appt: any) => {
      if (appt.status === 'blocked') return 'Horário Bloqueado';
      // Verificação defensiva se patient é array ou objeto
      const p = Array.isArray(appt.patient) ? appt.patient[0] : appt.patient;
      return p?.name || 'Paciente não identificado';
  };
  
  const getPatientId = (appt: any) => {
      if (appt.status === 'blocked') return null;
      const p = Array.isArray(appt.patient) ? appt.patient[0] : appt.patient;
      return p?.id;
  }

  if (loading && !professionalDetails) return <div className="p-10 flex justify-center h-96 items-center"><Loader2 className="animate-spin text-pink-600" size={40}/></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-700 p-2 relative">
      
      {isBlockModalOpen && (
        <BlockScheduleModal 
          professionalId={id!} 
          onClose={() => setIsBlockModalOpen(false)} 
          onSuccess={() => { setIsBlockModalOpen(false); loadDashboard(); }} 
        />
      )}

      {/* ✅ CABEÇALHO DO PROFISSIONAL */}
      {professionalDetails && (
        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-[2rem] bg-gray-100 dark:bg-gray-700 overflow-hidden border-4 border-white dark:border-gray-800 shadow-xl flex items-center justify-center text-gray-400">
                  {professionalDetails.avatar_url ? (
                    <img src={professionalDetails.avatar_url} alt={professionalDetails.name} className="w-full h-full object-cover" />
                  ) : (
                    <User size={32} />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter italic uppercase">
                        {professionalDetails.name || professionalDetails.first_name}
                    </h1>
                    {/* Badge de Status */}
                    {professionalDetails.user_id ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 text-[9px] font-black uppercase tracking-widest border border-blue-200">
                            <ShieldCheck size={10}/> Acesso Ativo
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 text-[9px] font-black uppercase tracking-widest border border-gray-200">
                            <Lock size={10}/> Sem Acesso
                        </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-500 font-medium">
                    <span className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-900 px-2 py-1 rounded-md border border-gray-100 dark:border-gray-700 uppercase font-bold tracking-wider text-[10px]">
                        {professionalDetails.role || "Especialista"}
                    </span>
                    {professionalDetails.email && <span className="flex items-center gap-1.5"><Mail size={12} className="text-blue-400"/> {professionalDetails.email}</span>}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                {/* BOTÃO DE ACESSO */}
                <Button 
                  onClick={() => setIsAccessModalOpen(true)}
                  className={`h-12 px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl transition-all hover:scale-105 active:scale-95 ${
                    professionalDetails.user_id 
                    ? "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-blue-200 hover:text-blue-600" 
                    : "bg-gray-900 text-white hover:bg-black"
                  }`}
                >
                  {professionalDetails.user_id ? (
                      <><Lock size={14} className="mr-2"/> Redefinir Senha</>
                  ) : (
                      <><ShieldCheck size={14} className="mr-2 text-blue-500"/> Liberar Acesso</>
                  )}
                </Button>
                
                <Button 
                  className="h-12 w-12 p-0 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                  onClick={() => navigate(`../details`)} 
                  title="Editar Perfil"
                >
                  <Edit size={18}/>
                </Button>
              </div>
            </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 1. DESTAQUE PRÓXIMO ATENDIMENTO */}
        <div className="lg:col-span-1 relative overflow-hidden p-8 rounded-[2.5rem] bg-gray-900 text-white shadow-2xl flex flex-col justify-between group border border-white/5 min-h-[380px]">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-600/30 to-purple-900/60 opacity-50"></div>
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-8">
                    <span className="bg-white/10 p-2.5 rounded-2xl backdrop-blur-md border border-white/10 shadow-inner"><Clock size={20} className="text-pink-400"/></span>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Próximo Paciente</span>
                </div>

                {stats.next ? (
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-tight line-clamp-2 group-hover:text-pink-400 transition-colors">{getPatientName(stats.next)}</h2>
                            <div className="flex items-center gap-2 mt-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse"></div>
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">{stats.next.service?.name || 'Protocolo Clínico'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/5">
                            <Calendar size={22} className="text-pink-500" />
                            <div>
                                <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Horário Previsto</p>
                                <p className="text-lg font-black italic tracking-tighter">
                                    {formatFriendlyDate(stats.next.start_time.split('T')[0])} às {formatTime(stats.next.start_time)} 
                                </p>
                            </div>
                        </div>
                        <Button onClick={(e) => handleStartAttendance(e, getPatientId(stats.next))} className="w-full h-14 bg-white text-gray-950 hover:bg-gray-100 font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-2xl transition-all hover:scale-[1.02] active:scale-95">
                            <Play size={16} className="mr-2 fill-current"/> Iniciar Evolução
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-gray-500 border-2 border-dashed border-white/5 rounded-3xl h-full">
                        <Sparkles size={32} className="mb-3 opacity-20"/>
                        <p className="text-xs font-black uppercase tracking-widest">Nenhum agendamento pendente</p>
                    </div>
                )}
            </div>
        </div>

        {/* 2. DASHBOARD FINANCEIRO E GRÁFICO */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group transition-all hover:shadow-xl">
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/30 rounded-3xl text-emerald-600"><DollarSign size={28}/></div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Produção Mensal Estimada</span>
                    </div>
                    <h3 className="text-4xl font-black text-gray-900 dark:text-white italic tracking-tighter mb-2">
                        <span className="text-lg font-bold text-gray-300 mr-1 italic">R$</span>{stats.commission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </h3>
                    <div className="mt-6">
                        <div className="flex justify-between text-[10px] font-black uppercase mb-2"><span className="text-gray-400">Progresso da Meta</span><span className="text-emerald-600">{stats.goalPercent.toFixed(0)}%</span></div>
                        <div className="h-2.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner"><div className="h-full bg-gradient-to-r from-emerald-400 to-green-600 rounded-full transition-all duration-1000" style={{ width: `${stats.goalPercent}%` }}></div></div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group transition-all hover:shadow-xl">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Volume Semanal</span></div>
                    <h4 className="text-2xl font-black text-gray-900 dark:text-white italic tracking-tighter">{stats.monthCount} <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest ml-1">Atend.</span></h4>
                </div>
                <div className="h-32 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.chartData}>
                            <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }} />
                            <Area type="monotone" dataKey="appointments" stroke="#a855f7" strokeWidth={4} fillOpacity={0.15} fill="#a855f7" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="md:col-span-2 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-[2rem] border border-dashed border-gray-200 dark:border-gray-800 flex gap-4 overflow-x-auto no-scrollbar">
                <ToolButton icon={<Calendar size={20}/>} label="Ver Agenda" onClick={() => navigate(`agenda`)} color="blue"/>
                <ToolButton icon={<Lock size={20}/>} label="Bloquear" onClick={() => setIsBlockModalOpen(true)} color="orange"/>
                <ToolButton icon={<PlusCircle size={20}/>} label="Novo Agend." onClick={() => navigate('/appointments/new')} color="pink"/>
            </div>
        </div>
      </div>

      {/* --- LISTAGEM DE AGENDA HOJE --- */}
      <div className="bg-white dark:bg-gray-800 rounded-[3rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mt-8">
          <div className="px-10 py-8 border-b border-gray-50 dark:border-gray-700 flex justify-between items-center bg-gray-50/30 dark:bg-gray-900">
              <div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic flex items-center gap-3"><Activity size={22} className="text-pink-600"/> Cronograma de Hoje</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Sincronizado em tempo real</p>
              </div>
              <span className="text-[10px] font-black text-pink-600 uppercase tracking-widest bg-pink-50 dark:bg-pink-900/20 px-5 py-2 rounded-full border border-pink-100 dark:border-pink-900/30">{formatFriendlyDate(getTodayDateStr())}</span>
          </div>
          <div className="p-8 space-y-4">
              {todayList.length === 0 ? (
                  <div className="text-center py-20 flex flex-col items-center">
                      <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-full mb-4 text-gray-200"><Calendar size={48}/></div>
                      <p className="text-gray-400 font-black uppercase text-xs tracking-widest italic">Agenda sem atendimentos para hoje</p>
                  </div>
              ) : todayList.map(appt => (
                  <div 
                    key={appt.id} 
                    className={`group flex flex-col sm:flex-row sm:items-center gap-6 p-6 rounded-[2rem] border transition-all cursor-pointer ${appt.status === 'blocked' ? 'bg-gray-50/50 dark:bg-gray-900 opacity-70 cursor-default border-dashed' : 'bg-white dark:bg-gray-800 hover:border-pink-200 dark:hover:border-pink-900 hover:shadow-xl'}`}
                    onClick={() => appt.status !== 'blocked' && navigate(`/patients/${getPatientId(appt)}`)}
                  >
                      <div className={`p-4 rounded-2xl min-w-[100px] text-center border-2 ${appt.status === 'blocked' ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 border-pink-100 dark:border-pink-900/30'}`}>
                          <span className="block text-2xl font-black italic tracking-tighter">{formatTime(appt.start_time)}</span> 
                      </div>
                      <div className="flex-1">
                          <h4 className={`font-black text-xl italic tracking-tighter uppercase ${appt.status === 'blocked' ? 'text-gray-400' : 'text-gray-900 dark:text-white group-hover:text-pink-600 transition-colors'}`}>
                              {getPatientName(appt)}
                          </h4>
                          <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">
                              {appt.status === 'blocked' ? <span className="flex items-center gap-1.5 text-orange-600"><Lock size={14}/> Período Indisponível</span> : <span className="bg-gray-50 dark:bg-gray-900 px-3 py-1 rounded-lg border border-gray-100 dark:border-gray-700 italic">{appt.service?.name || 'Consulta Padrão'}</span>}
                              {appt.notes && <span className="flex items-center gap-1.5 opacity-60"><FileText size={12}/> Com observação</span>}
                          </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                          {appt.status !== 'completed' && appt.status !== 'canceled' && (
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                                {appt.status !== 'blocked' && (
                                    <Button size="sm" variant="ghost" onClick={(e) => handleEdit(e, appt.id)} className="h-11 w-11 p-0 rounded-2xl text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all"><Pencil size={18}/></Button>
                                )}
                                <Button size="sm" variant="ghost" onClick={(e) => handleCancel(e, appt.id)} className="h-11 w-11 p-0 rounded-2xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-all"><Ban size={18}/></Button>
                            </div>
                          )}
                          <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-xl border-2 ${appt.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : appt.status === 'blocked' ? 'bg-orange-50 text-orange-700 border-orange-100' : 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:border-amber-800'}`}>{appt.status === 'scheduled' ? 'Confirmado' : appt.status}</span>
                      </div>
                  </div>
              ))}
          </div>
      </div>

      {/* ✅ MODAL DE ACESSO */}
      {isAccessModalOpen && professionalDetails && (
        <ProfessionalAccessModal 
          professional={{
             id: professionalDetails.id,
             name: professionalDetails.name || professionalDetails.first_name,
             email: professionalDetails.email,
             cpf: professionalDetails.cpf,
             phone: professionalDetails.phone,
             role: professionalDetails.role
          }} 
          onClose={() => {
            setIsAccessModalOpen(false);
            loadDashboard(); // Recarrega para atualizar o badge
          }} 
        />
      )}

    </div>
  );
}

function ToolButton({ icon, label, onClick, color }: any) {
    const colors: any = { blue: 'text-blue-500 border-blue-100 hover:bg-blue-50', orange: 'text-orange-500 border-orange-100 hover:bg-orange-50', pink: 'text-pink-500 border-pink-100 hover:bg-pink-50' };
    return (
        <Button variant="outline" onClick={onClick} className={`bg-white dark:bg-gray-800 border-2 rounded-2xl h-auto py-4 px-8 flex flex-col gap-3 min-w-[130px] transition-all hover:scale-105 shadow-sm ${colors[color]}`}>
            <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-900">{icon}</div> 
            <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
        </Button>
    )
}

function BlockScheduleModal({ professionalId, onClose, onSuccess }: any) {
    const [l, setL] = useState(false);
    const [f, setF] = useState({ date: new Date().toISOString().split('T')[0], start: "", end: "", reason: "" });
    
    // Função para calcular o offset local (ex: -03:00) para garantir que o banco salve a hora certa
    const getLocalOffset = () => {
        const offset = new Date().getTimezoneOffset();
        const sign = offset > 0 ? '-' : '+'; 
        const absOffset = Math.abs(offset);
        return `${sign}${String(Math.floor(absOffset / 60)).padStart(2, '0')}:${String(absOffset % 60).padStart(2, '0')}`;
    };

    const save = async () => {
        if(!f.start || !f.end || !f.reason) return toast.error("Preencha todos os campos do bloqueio");
        setL(true);
        const offset = getLocalOffset();
        // Usamos T para separar data e hora e adicionamos o offset do fuso horário
        const { error } = await supabase.from('appointments').insert({ 
            professional_id: professionalId, 
            start_time: `${f.date}T${f.start}:00${offset}`, 
            end_time: `${f.date}T${f.end}:00${offset}`, 
            status: 'blocked', 
            notes: `MOTIVO: ${f.reason}` 
        });
        if(error) {
            toast.error("Erro ao bloquear horário.");
            console.error(error);
        } else { 
            toast.success("Agenda bloqueada!"); 
            onSuccess(); 
        }
        setL(false);
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] p-10 relative border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-center mb-8 border-b border-gray-50 pb-6">
                    <div>
                        <h2 className="text-2xl font-black italic tracking-tighter uppercase flex items-center gap-3"><Lock className="text-orange-500" size={24}/> Bloquear <span className="text-orange-500">Horário</span></h2>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Agenda ficará indisponível no período</p>
                    </div>
                    <button onClick={onClose} className="p-3 bg-gray-50 dark:bg-gray-900 rounded-2xl text-gray-400 hover:text-rose-500 transition-colors"><X size={20}/></button>
                </div>
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Selecione a Data</label>
                        <input type="date" value={f.date} onChange={e=>setF({...f, date:e.target.value})} className="w-full h-12 p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border-0 font-bold focus:ring-2 focus:ring-orange-500 outline-none"/>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">De (Início)</label>
                            <input type="time" value={f.start} onChange={e=>setF({...f, start:e.target.value})} className="w-full h-12 p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border-0 font-bold focus:ring-2 focus:ring-orange-500 outline-none text-center"/>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Até (Fim)</label>
                            <input type="time" value={f.end} onChange={e=>setF({...f, end:e.target.value})} className="w-full h-12 p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border-0 font-bold focus:ring-2 focus:ring-orange-500 outline-none text-center"/>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Justificativa do Bloqueio</label>
                        <input type="text" placeholder="Ex: Consulta Médica, Almoço..." value={f.reason} onChange={e=>setF({...f, reason:e.target.value})} className="w-full h-12 p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border-0 font-bold focus:ring-2 focus:ring-orange-500 outline-none"/>
                    </div>
                    <Button onClick={save} disabled={l} className="w-full h-16 bg-gray-900 hover:bg-black text-white font-black uppercase text-xs tracking-[0.2em] rounded-3xl shadow-2xl transition-all active:scale-95 mt-4">
                        {l ? <Loader2 className="animate-spin"/> : "Confirmar Bloqueio"}
                    </Button>
                </div>
            </div>
        </div>
    )
}
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { 
  Users, CalendarCheck, Loader2, Sparkles, Activity, Clock, User as UserIcon,
  Phone, MessageCircle, Check, PackageCheck, PackageX, Trash2, UserPlus, UserX, Pencil, Play, ChevronLeft, ChevronRight, AlertTriangle, UserCheck, RotateCcw
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { format, subDays, addDays, isPast, isToday, isFuture } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "react-hot-toast";

// 1️⃣ FLUXO DE STATUS
const STATUS_FLOW: Record<string, string[]> = {
  scheduled: ['confirmed', 'arrived', 'completed', 'no_show'],
  confirmed: ['arrived', 'completed', 'no_show', 'scheduled'],
  arrived: ['completed', 'confirmed', 'no_show', 'scheduled'], 
  completed: ['arrived', 'confirmed', 'scheduled'], 
  no_show: ['scheduled', 'confirmed'], 
};

const DAILY_PHRASES_LIST = [
  "Pronto para transformar vidas hoje?",
  "Foco na excelência, o resultado é consequência.",
  "Sua clínica, seu império. Vamos produzir!",
  "A arte de cuidar começa no primeiro clique.",
  "Beleza é a confiança que entregamos hoje."
];

// 2️⃣ COMPONENTES DE APOIO

function StatCard({ title, value, icon, color, customColor }: any) {
    const colors: any = { 
        green: "text-emerald-600 bg-emerald-50", 
        blue: "text-blue-600 bg-blue-50", 
        pink: "text-pink-600 bg-pink-50", 
        red: "text-red-600 bg-red-50 animate-pulse",
        purple: "text-purple-600 bg-purple-50" 
    };
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-[2.5rem] border border-gray-100 shadow-xl flex items-center group transition-all hover:-translate-y-1">
        <div className={`p-4 rounded-2xl shadow-sm ${colors[color]} mr-6`} style={customColor ? {backgroundColor: `${customColor}10`, color: customColor} : {}}>{icon}</div>
        <div className="flex items-center gap-4">
          <h3 className="text-3xl font-black text-gray-900 dark:text-white italic tracking-tighter leading-none">{value}</h3>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{title}</p>
        </div>
      </div>
    );
}

function TimelineSection({ title, color, children }: { title: string, color: string, children: React.ReactNode }) {
    const colors: any = { red: 'text-red-500', purple: 'text-purple-600', gray: 'text-gray-400' };
    return (
      <div className="space-y-6 relative">
        <div className="flex items-center gap-4">
          <div className={`w-2.5 h-2.5 rounded-full bg-current ${colors[color]}`} />
          <h4 className={`text-[10px] font-black uppercase tracking-[0.4em] text-gray-400`}>{title}</h4>
          <div className="flex-1 h-[1px] bg-gray-100" />
        </div>
        <div className="space-y-4 pl-8 border-l-2 border-gray-50 ml-1">{children}</div>
      </div>
    );
}

function TimelineCard({ appt, clinicColor, updatingId, onUpdate, onEdit }: any) {
  const patient = Array.isArray(appt.patients) ? appt.patients[0] : appt.patients;
  const service = Array.isArray(appt.services) ? appt.services[0] : appt.services;
  const prof = Array.isArray(appt.profiles) ? appt.profiles[0] : appt.profiles;
  const apptDate = new Date(appt.start_time);
  
  const isLate = isToday(apptDate) && ['scheduled'].includes(appt.status) && apptDate.getTime() < (Date.now() - 15 * 60 * 1000);

  let statusColor = clinicColor || '#ec4899';
  if (appt.status === 'confirmed') statusColor = '#3b82f6'; 
  if (appt.status === 'arrived') statusColor = '#9333ea';   
  if (appt.status === 'completed') statusColor = '#10b981'; 
  if (appt.status === 'no_show') statusColor = '#ef4444';   

  return (
    <div className={`group flex flex-col md:flex-row md:items-center justify-between p-5 rounded-[2rem] border transition-all ${['arrived', 'confirmed'].includes(appt.status) ? 'bg-white shadow-lg border-l-4 border-l-purple-500' : 'bg-white hover:border-gray-200'} ${appt.status === 'completed' ? 'opacity-70 bg-gray-50' : ''} ${appt.status === 'no_show' ? 'opacity-60 bg-red-50' : ''} mb-4`}>
      <div className="flex items-center gap-6">
        <div className={`w-16 h-16 rounded-[1.2rem] text-white flex flex-col items-center justify-center font-black shadow-lg transition-colors`} style={{ backgroundColor: statusColor }}>
          <span className="text-[9px] opacity-90">{format(apptDate, 'dd/MM')}</span>
          <span className="text-lg italic leading-none">{format(apptDate, 'HH:mm')}</span>
        </div>
        <div>
          <div className="flex items-center gap-3">
            <p className="font-black text-gray-900 uppercase italic text-md leading-tight">{patient?.name || 'Paciente'}</p>
            {isLate && <span className="bg-red-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full animate-pulse">ATRASADO</span>}
            {appt.status === 'confirmed' && <span className="bg-blue-100 text-blue-600 text-[8px] font-black px-2 py-0.5 rounded-full">CONFIRMADO</span>}
            {appt.status === 'arrived' && <span className="bg-purple-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full animate-pulse">NA RECEPÇÃO</span>}
            {appt.status === 'completed' && <span className="bg-emerald-100 text-emerald-600 text-[8px] font-black px-2 py-0.5 rounded-full">REALIZADO</span>}
            {appt.status === 'no_show' && <span className="bg-red-100 text-red-600 text-[8px] font-black px-2 py-0.5 rounded-full">AUSENTE</span>}
          </div>
          <div className="mt-1 flex flex-col">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{service?.name || 'Procedimento'}</p>
            <p className="text-[10px] font-black text-pink-600 uppercase tracking-tighter italic mt-0.5">Prof. {prof?.first_name || 'Profissional'}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-6 md:mt-0">
        {appt.status !== 'completed' && appt.status !== 'no_show' ? (
          <>
            {appt.status !== 'arrived' && (
                <Button disabled={updatingId === appt.id} size="sm" variant="outline" onClick={(e) => onUpdate(e, appt.id, appt.status, 'confirmed')} className={`h-10 w-10 p-0 rounded-xl ${appt.status === 'confirmed' ? 'bg-blue-600 text-white border-blue-600' : 'border-blue-200 text-blue-600 hover:bg-blue-50'}`} title="Confirmar (Whats/Tel)">
                    <Check size={18}/>
                </Button>
            )}
            <Button disabled={updatingId === appt.id} size="sm" variant="outline" onClick={(e) => onUpdate(e, appt.id, appt.status, 'arrived')} className={`h-10 px-3 rounded-xl font-black uppercase text-[10px] tracking-widest ${appt.status === 'arrived' ? 'bg-purple-600 text-white border-purple-600' : 'border-purple-200 text-purple-600 hover:bg-purple-50'}`} title="Marcar Chegada na Clínica">
                <UserCheck size={16} className="mr-1.5"/> Chegou
            </Button>
            <Button disabled={updatingId === appt.id} size="sm" variant="outline" onClick={(e) => onUpdate(e, appt.id, appt.status, 'completed')} className="h-10 px-4 rounded-xl font-black uppercase text-[10px] tracking-widest text-emerald-600 border-emerald-100 hover:bg-emerald-50" title="Iniciar (Baixar Estoque)"><Play size={16} className="mr-2 fill-current"/> Iniciar</Button>
            <Button disabled={updatingId === appt.id} size="sm" variant="outline" onClick={(e) => onUpdate(e, appt.id, appt.status, 'no_show')} className="h-10 w-10 p-0 rounded-xl text-gray-300 border-gray-200 hover:text-red-500" title="Marcar Falta"><UserX size={18}/></Button>
          </>
        ) : (
          <>
             <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl mr-2 ${appt.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                {appt.status === 'completed' ? 'Finalizado' : 'Ausente'}
             </span>
             <Button disabled={updatingId === appt.id} size="sm" variant="outline" onClick={(e) => onUpdate(e, appt.id, appt.status, 'confirmed')} className="h-10 w-10 p-0 rounded-xl border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-200" title="Desfazer / Reabrir">
                <RotateCcw size={16}/>
             </Button>
          </>
        )}
        <Button variant="ghost" size="sm" onClick={onEdit} className="rounded-lg h-10 w-10 text-gray-200 hover:text-pink-600" title="Editar"><Pencil size={16}/></Button>
      </div>
    </div>
  );
}

// 3️⃣ COMPONENTE PRINCIPAL

export default function DashboardPage() {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [clinicData, setClinicData] = useState<any>(null);
  const [dailyPhrase, setDailyPhrase] = useState("");

  const [stats, setStats] = useState({ 
    todayTotal: 0, 
    todayCompleted: 0, 
    todayNoShow: 0 
  });

  const [nextAppointments, setNextAppointments] = useState<any[]>([]);
  const [activeAgendaTab, setActiveAgendaTab] = useState<'pending' | 'completed'>('pending');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [receptionTasks, setReceptionTasks] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'pre' | 'post'>('pre');
  const [criticalItems, setCriticalItems] = useState<any[]>([]);
  const [inventoryStatus, setInventoryStatus] = useState<'ok' | 'warning' | 'critical'>('ok');
  
  const [completedTasks, setCompletedTasks] = useState<string[]>(() => {
    const saved = localStorage.getItem('vilagi_completed_tasks');
    return saved ? JSON.parse(saved) : [];
  });

  const displayName = profile?.fullName?.split(' ')[0] || user?.email?.split('@')[0] || 'Doutor(a)';
  const profilePhoto = profile?.avatarUrl || (profile as any)?.avatar_url; 

  useEffect(() => {
    const day = new Date().getDate();
    setDailyPhrase(DAILY_PHRASES_LIST[day % DAILY_PHRASES_LIST.length]);
    if (profile?.clinic_id) {
      fetchClinicInfo();
      fetchRealDashboardData();
    }
  }, [profile?.clinic_id, completedTasks]);

  async function fetchClinicInfo() {
      try {
          const { data } = await supabase.from('clinics').select('primary_color').eq('id', profile?.clinic_id).single();
          if (data) setClinicData(data);
      } catch (e) { console.error(e); }
  }

  const handleWhatsApp = (mobile: string, msg: string) => {
    if(!mobile) return toast.error("Sem celular.");
    window.open(`https://wa.me/55${mobile.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleCompleteTask = (taskId: string) => {
    const newCompleted = [...completedTasks, taskId];
    setCompletedTasks(newCompleted);
    localStorage.setItem('vilagi_completed_tasks', JSON.stringify(newCompleted));
  };

  const clearCompleted = () => {
    localStorage.removeItem('vilagi_completed_tasks');
    setCompletedTasks([]);
    toast.success("Lista restaurada!");
  };

  const handleUpdateStatus = async (e: React.MouseEvent, apptId: string, currentStatus: string, newStatus: string) => {
    e.stopPropagation();
    if (updatingId) return;

    let targetStatus = newStatus;
    if (currentStatus === 'arrived' && newStatus === 'arrived') targetStatus = 'confirmed';
    if (currentStatus === 'confirmed' && newStatus === 'confirmed') targetStatus = 'scheduled';

    if (!STATUS_FLOW[currentStatus]?.includes(targetStatus)) {
        if (!(currentStatus === 'scheduled' && targetStatus === 'arrived')) {
             console.warn("Transição não padrão.");
        }
    }

    setUpdatingId(apptId);
    try {
        const { error } = await supabase.from('appointments').update({ status: targetStatus }).eq('id', apptId);
        
        if (error) {
            console.error(error);
            if (error.message.includes('check constraint')) toast.error("Banco de dados rejeitou o status.");
            else if (error.message.includes('estoque')) toast.error("Estoque insuficiente!");
            else toast.error("Erro ao atualizar status.");
            return;
        }
        
        if (targetStatus === 'arrived') toast.success("Paciente na Recepção! 🟣");
        else if (targetStatus === 'completed') toast.success("Atendimento Finalizado! 🟢");
        else if (targetStatus === 'confirmed') {
            handleCompleteTask(`pre_${apptId}`);
            toast.success("Confirmado! 🔵");
        } else toast.success("Status atualizado!");
        
        await fetchRealDashboardData();
    } catch (error) { 
        toast.error("Erro desconhecido."); 
    } finally { 
        setUpdatingId(null); 
    }
  };

  async function fetchRealDashboardData() {
    if (!profile?.clinic_id) return;
    try {
      setLoading(true); 
      const startOfToday = new Date(new Date().setHours(0,0,0,0)).toISOString();
      const endOfToday = new Date(new Date().setHours(23,59,59,999)).toISOString();

      const [inv, allAppts] = await Promise.all([
        supabase.from('inventory').select('*').eq('clinic_id', profile.clinic_id),
        supabase.from('appointments').select(`id, start_time, status, patient_id, patients (id, name, phone), services (name), profiles!professional_id (first_name, last_name)`).eq('clinic_id', profile.clinic_id).gte('start_time', subDays(new Date(), 10).toISOString()).order('start_time', { ascending: true })
      ]);

      const crit = (inv.data || []).filter(item => Number(item.quantity) <= Number(item.minimum_quantity));
      setCriticalItems(crit.sort((a, b) => Number(a.quantity) - Number(b.quantity)));
      setInventoryStatus(crit.some(item => Number(item.quantity) <= 0) ? 'critical' : (crit.length > 0 ? 'warning' : 'ok'));
      setNextAppointments(allAppts.data || []);

      // ✅ MENSAGENS PERSONALIZADAS (OPÇÃO B e A)
      const tasksList: any[] = [];
      (allAppts.data || []).forEach((appt: any) => {
          const apptDate = new Date(appt.start_time);
          const patientData: any = Array.isArray(appt.patients) ? appt.patients[0] : appt.patients;
          const serviceName = (Array.isArray(appt.services) ? appt.services[0] : appt.services)?.name || 'procedimento';
          const profName = (Array.isArray(appt.profiles) ? appt.profiles[0] : appt.profiles)?.first_name || 'Especialista';
          const firstName = patientData?.name?.split(' ')[0] || 'Paciente';
          const startFormatted = format(apptDate, "dd/MM 'às' HH:mm", { locale: ptBR });
          
          if (isFuture(apptDate) && appt.status === 'scheduled') {
              // PRÉ - CONSULTIVA (OPÇÃO B)
              const msg = `Oi *${firstName}*, tudo bem? \nTudo certo para sua sessão de *${serviceName}* com o(a) Dr(a)*${profName}*, no dia *${startFormatted}*.\n\nVocê confirma seu horário? Se tiver alguma dúvida sobre o preparo, é só me chamar aqui! <3`;
              tasksList.push({ id: `pre_${appt.id}`, type: 'pre', patientName: patientData?.name, mobile: patientData?.phone, service: serviceName, time: appt.start_time, message: msg });
          } else if (isPast(apptDate) && appt.status === 'completed') {
              // PÓS - ATENCIOSA (OPÇÃO A)
              const msg = `Olá, *${firstName}*! ✨\nComo você está se sentindo após a sua sessão de *${serviceName}* ?\n\n O(a) Dr(a)*${profName}* e toda nossa equipe adoraram te receber. Qualquer dúvida sobre os cuidados pós-procedimento, conte conosco! <3`;
              tasksList.push({ id: `post_${appt.id}`, type: 'post', patientName: patientData?.name, mobile: patientData?.phone, service: serviceName, time: appt.start_time, message: msg });
          }
      });
      setReceptionTasks(tasksList.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()));

      const todayAppts = (allAppts.data || []).filter(a => isToday(new Date(a.start_time)));
      setStats({ 
        todayTotal: todayAppts.length, 
        todayCompleted: todayAppts.filter(a => a.status === 'completed').length,
        todayNoShow: todayAppts.filter(a => a.status === 'no_show').length
      });

    } catch (error) { console.error(error); } finally { setLoading(false); }
  }

  // ✅ FILTROS E ORDENAÇÃO
  const pendingFilter = (nextAppointments || []).filter(a => 
    isFuture(new Date(a.start_time)) || 
    (isToday(new Date(a.start_time)) && a.status !== 'completed' && a.status !== 'no_show')
  );

  const completedFilter = (nextAppointments || []).filter(a => 
    isToday(new Date(a.start_time)) && 
    (a.status === 'completed' || a.status === 'no_show')
  );

  const agendaFiltradaStatus = activeAgendaTab === 'pending' ? pendingFilter : completedFilter;

  const totalPages = Math.ceil(agendaFiltradaStatus.length / itemsPerPage) || 1;
  const currentAgendaPage = agendaFiltradaStatus.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const agendaAgora = currentAgendaPage.filter(a => isToday(new Date(a.start_time)));
  
  const agendaFutura = currentAgendaPage.filter(a => isFuture(new Date(a.start_time)) && !isToday(new Date(a.start_time)));

  const visibleTasks = receptionTasks.filter(t => !completedTasks.includes(t.id) && t.type === activeTab);
  const countPre = receptionTasks.filter(t => !completedTasks.includes(t.id) && t.type === 'pre').length;
  const countPost = receptionTasks.filter(t => !completedTasks.includes(t.id) && t.type === 'post').length;

  if (loading) return <div className="flex h-screen items-center justify-center bg-white"><Loader2 className="animate-spin text-pink-600 w-10 h-10" /></div>;

  return (
    <div className="p-6 max-w-[1600px] mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 space-y-8 animate-in fade-in pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
        <div className="flex items-center gap-6">
          <div className="h-20 w-20 rounded-3xl border-4 border-pink-50 overflow-hidden shadow-inner">
             {profilePhoto ? <img src={profilePhoto} alt="Perfil" className="h-full w-full object-cover" /> : <div className="bg-pink-100 w-full h-full flex items-center justify-center text-pink-600"><UserIcon size={32} /></div>}
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter leading-none">Olá, <span style={{ color: clinicData?.primary_color || '#ec4899' }}>{displayName}</span>!</h1>
            <p className="text-gray-400 font-bold uppercase text-xs tracking-wider mt-2 flex items-center gap-2"><Sparkles size={18} className="text-yellow-500 animate-pulse"/> {dailyPhrase}</p>
          </div>
        </div>
        <div className="flex gap-3">
            <Button onClick={() => navigate('/patients/new')} className="bg-gray-900 hover:bg-black text-white rounded-2xl h-14 px-8 font-black uppercase text-sm tracking-widest shadow-xl"><UserPlus size={20} className="mr-2"/> Novo Paciente</Button>
            <Button onClick={() => navigate('/appointments')} className="text-white rounded-2xl h-14 px-8 font-black uppercase text-sm tracking-widest shadow-xl" style={{ backgroundColor: clinicData?.primary_color || '#ec4899' }}><CalendarCheck size={20} className="mr-2"/> Agenda Completa</Button>
        </div>
      </div>

      {/* KPI - NOVOS INDICADORES DE HOJE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Agendados Hoje (Total)" value={stats.todayTotal} icon={<Clock size={28} />} color="blue" />
        <StatCard title="Realizados Hoje" value={stats.todayCompleted} icon={<Check size={28} />} color="green" />
        <StatCard title="Ausentes Hoje" value={stats.todayNoShow} icon={<UserX size={28} />} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[850px]">
            <div className="px-10 py-8 border-b bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                <h3 className="text-lg font-black uppercase tracking-widest text-gray-900 italic">Cronograma</h3>
                <div className="flex bg-gray-100 p-1.5 rounded-xl">
                  <button onClick={() => { setActiveAgendaTab('pending'); setCurrentPage(1); }} className={`px-8 py-3 rounded-xl text-xs font-black uppercase transition-all ${activeAgendaTab === 'pending' ? 'bg-white text-pink-600 shadow-md' : 'text-gray-400'}`}>Agenda Principal</button>
                  <button onClick={() => { setActiveAgendaTab('completed'); setCurrentPage(1); }} className={`px-8 py-3 rounded-xl text-sm font-black uppercase transition-all ${activeAgendaTab === 'completed' ? 'bg-white text-emerald-600 shadow-md' : 'text-gray-400'}`}>Concluídos</button>
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-10">
                {/* SEÇÃO 1: HOJE (Mostra o que cabe no filtro da aba atual) */}
                {agendaAgora.length > 0 && (
                    <TimelineSection title={activeAgendaTab === 'pending' ? "Hoje / Em Sala" : "Realizados Hoje"} color={activeAgendaTab === 'pending' ? "red" : "purple"}>
                        {agendaAgora.map(appt => (
                            <TimelineCard key={appt.id} appt={appt} clinicColor={clinicData?.primary_color} updatingId={updatingId} onUpdate={handleUpdateStatus} onEdit={() => navigate(`/appointments/${appt.id}/edit`)} />
                        ))}
                    </TimelineSection>
                )}

                {/* SEÇÃO 2: DIAS FUTUROS (Só aparece na aba Pendentes) */}
                {activeAgendaTab === 'pending' && agendaFutura.length > 0 && (
                    <TimelineSection title="Próximos Dias" color="gray">
                        {agendaFutura.map(appt => (
                            <TimelineCard key={appt.id} appt={appt} clinicColor={clinicData?.primary_color} updatingId={updatingId} onUpdate={handleUpdateStatus} onEdit={() => navigate(`/appointments/${appt.id}/edit`)} />
                        ))}
                    </TimelineSection>
                )}

                {agendaAgora.length === 0 && agendaFutura.length === 0 && (
                    <div className="p-20 text-center text-gray-300 font-bold uppercase italic tracking-widest">Nenhum agendamento encontrado</div>
                )}
            </div>

            {totalPages > 1 && (
                <div className="p-4 border-t flex justify-center items-center gap-4 bg-gray-50/50">
                    <Button variant="ghost" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="rounded-xl"><ChevronLeft size={20}/></Button>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Pág {currentPage} / {totalPages}</span>
                    <Button variant="ghost" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="rounded-xl"><ChevronRight size={20}/></Button>
                </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
           {/* ESTOQUE */}
           <div className={`p-8 rounded-[2.5rem] border shadow-xl transition-all ${inventoryStatus === 'ok' ? 'bg-white' : (inventoryStatus === 'critical' ? 'bg-red-50 border-red-200 animate-pulse' : 'bg-amber-50 border-amber-100')}`}>
                <div className="flex items-center gap-3 mb-8">
                   {inventoryStatus === 'ok' ? <PackageCheck className="text-emerald-600" size={24} /> : <PackageX className={inventoryStatus === 'critical' ? 'text-red-600' : 'text-amber-600'} size={24} />}
                   <h4 className="text-xs font-black uppercase tracking-widest text-gray-900">Insumos Críticos</h4>
                </div>
                <div className="space-y-4">
                  {criticalItems.slice(0, 6).map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-gray-50 p-5 rounded-2xl border border-black/5 shadow-sm">
                        <span className="text-sm font-black text-gray-700 uppercase truncate pr-2">{item.name}</span>
                        <span className={`text-[10px] font-black px-3 py-1.5 rounded-lg ${Number(item.quantity) <= 0 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`}>{Number(item.quantity) <= 0 ? 'ZERADO' : `${item.quantity} ${item.unit || ''}`}</span>
                      </div>
                  ))}
                </div>
                <Button onClick={() => navigate('/inventory')} variant="outline" className="w-full mt-8 h-12 rounded-xl border-black/10 font-black uppercase text-[9px] tracking-widest shadow-sm">Almoxarifado</Button>
           </div>

           {/* CRM / RECEPÇÃO ATIVA */}
           <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] border border-gray-100 shadow-2xl flex flex-col min-h-[550px]">
              <div className="flex items-center justify-between mb-8">
                 <h4 className="text-sm font-black uppercase tracking-widest text-gray-400 flex items-center gap-2"><Phone size={18} className="text-pink-600" /> Recepção Ativa</h4>
                 <button onClick={clearCompleted} className="text-gray-300 hover:text-pink-500 transition-colors"><Trash2 size={24}/></button>
              </div>
              <div className="flex bg-gray-50 p-2 rounded-2xl mb-8 shadow-inner">
                  <button onClick={() => setActiveTab('pre')} className={`flex-1 py-4 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'pre' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-400'}`}>Confirmar ({countPre})</button>
                  <button onClick={() => setActiveTab('post')} className={`flex-1 py-4 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'post' ? 'bg-white text-purple-600 shadow-md' : 'text-gray-400'}`}>Pós ({countPost})</button>
              </div>
              <div className="space-y-5 overflow-y-auto no-scrollbar flex-1">
                 {visibleTasks.map(task => (
                    <div key={task.id} className="p-6 rounded-[2rem] bg-gray-50 border border-gray-100 group transition-all hover:bg-white hover:shadow-xl">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <p className="font-black text-gray-900 uppercase italic text-lg leading-tight">{task.patientName?.split(' ')[0]}</p>
                                <p className="text-xs font-bold text-gray-400 uppercase mt-1 line-clamp-1">{task.service}</p>
                            </div>
                            <span className="text-xs font-black bg-gray-200 px-3 py-1.5 rounded-lg text-gray-500">{format(new Date(task.time), 'dd/MM')}</span>
                        </div>
                        <div className="flex gap-3">
                            <Button onClick={() => handleWhatsApp(task.mobile, task.message)} className={`flex-1 h-12 rounded-xl text-white font-black uppercase text-xs ${task.type === 'pre' ? 'bg-blue-500' : 'bg-purple-500'}`} title="Enviar WhatsApp"><MessageCircle size={18} className="mr-2"/> WhatsApp</Button>
                            <Button onClick={() => handleCompleteTask(task.id)} variant="outline" className="h-12 w-12 p-0 rounded-xl border-gray-200 text-gray-400 hover:text-emerald-500" title="Concluir"><Check size={24}/></Button>
                        </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
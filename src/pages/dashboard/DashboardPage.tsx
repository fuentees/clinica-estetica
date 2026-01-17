import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { 
  CalendarCheck, Loader2, Sparkles, Clock, 
  Phone, MessageCircle, Check, PackageCheck, PackageX, Trash2, UserPlus, UserX, 
  Pencil, Play, ChevronLeft, ChevronRight, AlertTriangle, RotateCcw,
  Wallet, ArrowRight, CheckCircle2, AlertCircle, Timer, Activity, Stethoscope, User as UserIcon
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { format, subDays, isToday, isFuture, differenceInMinutes, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "react-hot-toast";

const DAILY_PHRASES_LIST = [
  "Pronto para transformar vidas hoje?",
  "Foco na excelência, o resultado é consequência.",
  "Sua clínica, seu império. Vamos produzir!",
  "A arte de cuidar começa no primeiro clique.",
  "Beleza é a confiança que entregamos hoje."
];

// --- CRONÔMETRO ---
function LiveTimer({ startTime }: { startTime: string }) {
    const [minutes, setMinutes] = useState(0);

    useEffect(() => {
        const calculateTime = () => {
            const now = new Date();
            const start = new Date(startTime);
            const diff = differenceInMinutes(now, start);
            setMinutes(diff > 0 ? diff : 0);
        };
        calculateTime(); 
        const interval = setInterval(calculateTime, 60000); 
        return () => clearInterval(interval);
    }, [startTime]);

    return (
        <div className="flex items-center gap-2 bg-purple-100 border border-purple-200 px-3 py-1 rounded-lg animate-pulse">
            <Timer size={14} className="text-purple-700" /> 
            <span className="text-xs font-black text-purple-700 uppercase">Há {minutes} min</span>
        </div>
    );
}

// 2️⃣ COMPONENTES DE APOIO

function StatCard({ title, value, icon, color, customColor }: any) {
    const colors: any = { 
        green: "text-emerald-600 bg-emerald-50", 
        blue: "text-blue-600 bg-blue-50", 
        pink: "text-pink-600 bg-pink-50", 
        red: "text-red-600 bg-red-50 animate-pulse",
        purple: "text-purple-600 bg-purple-50",
        amber: "text-amber-600 bg-amber-50"
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
    const colors: any = { red: 'text-red-500', purple: 'text-purple-600', gray: 'text-gray-400', green: 'text-emerald-600' };
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

function TimelineCard({ appt, clinicColor, updatingId, onUpdate, onEdit, onNavigateToProfile }: any) {
  const patient = Array.isArray(appt.patients) ? appt.patients[0] : appt.patients;
  const service = Array.isArray(appt.services) ? appt.services[0] : appt.services;
  const prof = Array.isArray(appt.profiles) ? appt.profiles[0] : appt.profiles;
  const apptDate = new Date(appt.start_time);
  const now = new Date();
  
  const diffMinutes = differenceInMinutes(now, apptDate);
  const isLate = isToday(apptDate) && appt.status === 'scheduled' && diffMinutes > 15;
  const isInAttendance = appt.status === 'arrived'; 

  let statusColor = clinicColor || '#ec4899';
  if (appt.status === 'confirmed') statusColor = '#3b82f6'; 
  if (appt.status === 'arrived') statusColor = '#9333ea'; 
  if (appt.status === 'completed') statusColor = '#10b981'; 
  if (appt.status === 'no_show') statusColor = '#ef4444';   

  return (
    <div className={`group flex flex-col md:flex-row md:items-center justify-between p-5 rounded-[2rem] border transition-all 
        ${isInAttendance ? 'bg-purple-50/50 shadow-xl border-purple-200 ring-2 ring-purple-100 scale-[1.01]' : 
          appt.status === 'confirmed' ? 'bg-white shadow-lg border-l-4 border-l-blue-500' : 'bg-white hover:border-gray-200'} 
        ${appt.status === 'completed' ? 'opacity-70 bg-gray-50 border-gray-100' : ''} 
        ${appt.status === 'no_show' ? 'opacity-60 bg-red-50' : ''} mb-4`}>
      
      <div className="flex items-center gap-6">
        <div className={`w-16 h-16 rounded-[1.2rem] text-white flex flex-col items-center justify-center font-black shadow-lg transition-colors`} style={{ backgroundColor: statusColor }}>
          <span className="text-[9px] opacity-90">{format(apptDate, 'dd/MM')}</span>
          <span className="text-lg italic leading-none">{format(apptDate, 'HH:mm')}</span>
        </div>
        
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <p onClick={onNavigateToProfile} className="font-black text-gray-900 uppercase italic text-md leading-tight cursor-pointer hover:text-pink-600 transition-colors hover:underline" title="Ir para o Perfil do Paciente">
                {patient?.name || 'Paciente'}
            </p>

            {isInAttendance && (
                <div className="flex items-center gap-2">
                    <span className="bg-purple-600 text-white text-[9px] font-black px-3 py-1 rounded-full flex items-center gap-1 shadow-md animate-pulse"><Activity size={10} /> EM SESSÃO</span>
                    <LiveTimer startTime={appt.updated_at || appt.start_time} />
                </div>
            )}

            {isLate && !isInAttendance && <span className="bg-red-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1"><AlertCircle size={10}/> ATRASADO</span>}
            {appt.status === 'confirmed' && <span className="bg-blue-100 text-blue-600 text-[8px] font-black px-2 py-0.5 rounded-full">CONFIRMADO</span>}
            {appt.status === 'completed' && <span className="bg-emerald-100 text-emerald-600 text-[8px] font-black px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 size={10}/> CONCLUÍDO</span>}
            {appt.status === 'no_show' && <span className="bg-red-100 text-red-600 text-[8px] font-black px-2 py-0.5 rounded-full">AUSENTE</span>}
          </div>
          
          <div className="mt-1 flex flex-col">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                {isInAttendance && <Stethoscope size={12} className="text-purple-500"/>}
                {service?.name || 'Procedimento'}
            </p>
            <p className="text-[10px] font-black text-pink-600 uppercase tracking-tighter italic mt-0.5">Prof. {prof?.first_name || 'Profissional'}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-6 md:mt-0">
        {appt.status !== 'completed' && appt.status !== 'no_show' ? (
          <>
            {!isInAttendance && (
                <>
                    {appt.status !== 'confirmed' && (
                        <Button disabled={updatingId === appt.id} size="sm" variant="outline" onClick={(e) => onUpdate(e, appt.id, appt.status, 'confirmed')} className={`h-10 w-10 p-0 rounded-xl ${appt.status === 'confirmed' ? 'bg-blue-600 text-white border-blue-600' : 'border-blue-200 text-blue-600 hover:bg-blue-50'}`} title="Confirmar Presença"><Check size={18}/></Button>
                    )}
                    <Button disabled={updatingId === appt.id} size="sm" variant="outline" onClick={(e) => onUpdate(e, appt.id, appt.status, 'no_show')} className="h-10 w-10 p-0 rounded-xl text-gray-300 border-gray-200 hover:text-red-500 hover:bg-red-50" title="Marcar Falta"><UserX size={18}/></Button>
                </>
            )}

            <Button 
                disabled={updatingId === appt.id} 
                size="sm" 
                variant="outline" 
                onClick={(e) => onUpdate(e, appt.id, appt.status, 'start_evolution')} 
                className={`h-10 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-sm transition-all
                ${isInAttendance 
                    ? 'bg-purple-600 text-white border-purple-600 hover:bg-purple-700 hover:scale-105 shadow-purple-200' 
                    : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'}`} 
                title={isInAttendance ? "Voltar para Evolução" : "Iniciar Atendimento"}
            >
                {isInAttendance ? <><Activity size={16} className="mr-2 animate-spin-slow"/> ABRIR PRONTUÁRIO</> : <><Play size={16} className="mr-2 fill-current"/> INICIAR SESSÃO</>}
            </Button>
          </>
        ) : (
          <>
             <div className="flex items-center gap-2">
                 <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl ${appt.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    {appt.status === 'completed' ? 'Finalizado' : 'Ausente'}
                 </span>
                 <Button disabled={updatingId === appt.id} size="sm" variant="outline" onClick={(e) => onUpdate(e, appt.id, appt.status, 'confirmed')} className="h-10 w-10 p-0 rounded-xl border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-200" title="Reabrir Agendamento">
                    <RotateCcw size={16}/>
                 </Button>
             </div>
          </>
        )}
        
        {!isInAttendance && appt.status !== 'completed' && appt.status !== 'no_show' && (
            <Button variant="ghost" size="sm" onClick={onEdit} className="rounded-lg h-10 w-10 text-gray-300 hover:text-pink-600" title="Editar"><Pencil size={16}/></Button>
        )}
      </div>
    </div>
  );
}

// 3️⃣ COMPONENTE PRINCIPAL

export default function DashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [clinicData, setClinicData] = useState<any>(null);
  const [dailyPhrase, setDailyPhrase] = useState("");

  const [stats, setStats] = useState({ 
    todayTotal: 0, todayCompleted: 0, todayNoShow: 0, pendingBudgetsCount: 0 
  });

  const [allAppointments, setAllAppointments] = useState<any[]>([]);
  const [pendingBudgets, setPendingBudgets] = useState<any[]>([]); 
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

  const fetchRealDashboardData = useCallback(async () => {
    if (!profile?.clinic_id) return;
    try {
      const [inv, allAppts, pendingBudgetsData] = await Promise.all([
        supabase.from('inventory').select('*').eq('clinic_id', profile.clinic_id),
        // ✅ QUERY DEFINITIVA: STATUS MANDA
        supabase.from('appointments')
            .select(`id, start_time, status, updated_at, patient_id, professional_id, patients (id, name, phone), services (name), profiles!professional_id (first_name, last_name)`)
            .eq('clinic_id', profile.clinic_id)
            .gte('start_time', subDays(new Date(), 30).toISOString()) 
            .in('status', ['scheduled', 'confirmed', 'arrived', 'completed', 'no_show'])
            .order('start_time', { ascending: true }),
        supabase.from('budgets').select(`id, total, items, created_at, patients (id, name, phone)`).eq('clinic_id', profile.clinic_id).eq('status', 'pending').order('created_at', { ascending: false }).limit(5)
      ]);

      const uniqueAppts = Array.from(new Map(allAppts.data?.map(item => [item.id, item])).values());
      setAllAppointments(uniqueAppts);
      setPendingBudgets(pendingBudgetsData.data || []);

      const crit = (inv.data || []).filter(item => Number(item.quantity) <= Number(item.minimum_quantity));
      setCriticalItems(crit.sort((a, b) => Number(a.quantity) - Number(b.quantity)));
      setInventoryStatus(crit.some(item => Number(item.quantity) <= 0) ? 'critical' : (crit.length > 0 ? 'warning' : 'ok'));

      const tasksList: any[] = [];
      uniqueAppts.forEach((appt: any) => {
          const apptDate = new Date(appt.start_time);
          const patientData: any = Array.isArray(appt.patients) ? appt.patients[0] : appt.patients;
          if (isFuture(apptDate) && appt.status === 'scheduled') {
              tasksList.push({ id: `pre_${appt.id}`, type: 'pre', patientName: patientData?.name, mobile: patientData?.phone, service: (Array.isArray(appt.services) ? appt.services[0] : appt.services)?.name, time: appt.start_time });
          } else if (isPast(apptDate) && appt.status === 'completed') {
              tasksList.push({ id: `post_${appt.id}`, type: 'post', patientName: patientData?.name, mobile: patientData?.phone, service: (Array.isArray(appt.services) ? appt.services[0] : appt.services)?.name, time: appt.start_time });
          }
      });
      setReceptionTasks(tasksList.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()));

      const todayAppts = uniqueAppts.filter(a => isToday(new Date(a.start_time)));
      setStats({ 
        todayTotal: todayAppts.length, 
        todayCompleted: todayAppts.filter(a => a.status === 'completed').length,
        todayNoShow: todayAppts.filter(a => a.status === 'no_show').length,
        pendingBudgetsCount: pendingBudgetsData.data?.length || 0 
      });

    } catch (error) { console.error(error); } finally { setLoading(false); }
  }, [profile?.clinic_id]);

  useEffect(() => {
      fetchRealDashboardData();
  }, [location.pathname, fetchRealDashboardData]);

  // ✅ IMPROVED REALTIME: Listens for INSERT, UPDATE, and DELETE
  useEffect(() => {
    if (!profile?.clinic_id) return;
    const channel = supabase.channel('dashboard-appointments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments', filter: `clinic_id=eq.${profile.clinic_id}` }, 
        (payload) => {
            // Simply re-fetch data on any change to ensure consistency across clients
            // This handles INSERTs that were previously missed by local state updates
            fetchRealDashboardData(); 
        }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile?.clinic_id, fetchRealDashboardData]);

  useEffect(() => {
      const onFocus = () => fetchRealDashboardData();
      window.addEventListener('focus', onFocus);
      return () => window.removeEventListener('focus', onFocus);
  }, [fetchRealDashboardData]);

  useEffect(() => {
    const day = new Date().getDate();
    setDailyPhrase(DAILY_PHRASES_LIST[day % DAILY_PHRASES_LIST.length]);
    if (profile?.clinic_id) {
      supabase.from('clinics').select('primary_color').eq('id', profile?.clinic_id).single().then(({data}) => setClinicData(data));
    }
  }, [profile?.clinic_id]);

  const handleWhatsApp = (mobile: string, msg: string) => {
    if(!mobile) return toast.error("Sem celular.");
    window.open(`https://wa.me/55${mobile.replace(/\D/g, '')}?text=${encodeURIComponent(msg || "Olá!")}`, '_blank');
  };

  const handleCompleteTask = (taskId: string) => {
    const newCompleted = [...completedTasks, taskId];
    setCompletedTasks(newCompleted);
    localStorage.setItem('vilagi_completed_tasks', JSON.stringify(newCompleted));
  };

  const handleUpdateStatus = async (e: React.MouseEvent, apptId: string, currentStatus: string, newStatus: string) => {
    e.stopPropagation();
    if (updatingId) return;

    if (newStatus === 'start_evolution') {
        const appt = allAppointments.find(a => a.id === apptId);
        const pId = Array.isArray(appt?.patients) ? appt?.patients[0]?.id : appt?.patients?.id;
        const profId = appt?.professional_id || user?.id;

        setUpdatingId(apptId);
        try {
            // ✅ LIMPEZA DE SESSÕES ANTIGAS DO MESMO PROFISSIONAL
            await supabase.from('appointments').update({ status: 'completed', updated_at: new Date().toISOString() }).eq('professional_id', profId).eq('status', 'arrived').neq('id', apptId);

            if (currentStatus !== 'arrived') {
                await supabase.from('appointments').update({ status: 'arrived', updated_at: new Date().toISOString() }).eq('id', apptId);
            }
            // ✅ PASSA O ID PARA O HOOK DA EVOLUÇÃO
            navigate(`/patients/${pId}/evolution`, { state: { appointmentId: apptId } });
        } catch (error) { toast.error("Erro ao iniciar."); } finally { setUpdatingId(null); fetchRealDashboardData(); }
        return;
    }

    setUpdatingId(apptId);
    try {
        let targetStatus = newStatus;
        if (currentStatus === 'arrived' && newStatus === 'arrived') targetStatus = 'confirmed'; 
        await supabase.from('appointments').update({ status: targetStatus, updated_at: new Date().toISOString() }).eq('id', apptId);
        toast.success("Status atualizado!");
        fetchRealDashboardData();
    } catch (error) { toast.error("Erro ao atualizar."); } finally { setUpdatingId(null); }
  };

  const patientsInAttendance = useMemo(() => allAppointments.filter(a => a.status === 'arrived'), [allAppointments]);
  
  const pendingList = useMemo(() => allAppointments.filter(a => 
      a.status !== 'arrived' && a.status !== 'completed' && a.status !== 'no_show' && 
      (isFuture(new Date(a.start_time)) || isToday(new Date(a.start_time)))
  ), [allAppointments]);

  const completedList = useMemo(() => allAppointments.filter(a => 
      (a.status === 'completed' || a.status === 'no_show') &&
      (isToday(new Date(a.start_time)) || isToday(new Date(a.updated_at || '')))
  ), [allAppointments]);

  const listToPaginate = activeAgendaTab === 'pending' ? pendingList : completedList;
  const paginatedList = listToPaginate.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(listToPaginate.length / itemsPerPage) || 1;

  const visibleTasks = receptionTasks.filter(t => !completedTasks.includes(t.id) && t.type === activeTab);
  const countPre = receptionTasks.filter(t => !completedTasks.includes(t.id) && t.type === 'pre').length;
  const countPost = receptionTasks.filter(t => !completedTasks.includes(t.id) && t.type === 'post').length;

  if (loading) return <div className="flex h-screen items-center justify-center bg-white"><Loader2 className="animate-spin text-pink-600 w-10 h-10" /></div>;

  return (
    <div className="p-6 max-w-[1600px] mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 space-y-8 animate-in fade-in pb-20">
      
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Agendados Hoje" value={allAppointments.filter(a => isToday(new Date(a.start_time))).length} icon={<Clock size={28} />} color="blue" />
        <StatCard title="Realizados Hoje" value={completedList.length} icon={<Check size={28} />} color="green" />
        <StatCard title="Ausentes Hoje" value={allAppointments.filter(a => isToday(new Date(a.start_time)) && a.status === 'no_show').length} icon={<UserX size={28} />} color="red" />
        <StatCard title="Pendentes Financeiro" value={pendingBudgets.length} icon={<AlertTriangle size={28} />} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
             <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gradient-to-r from-amber-50 to-orange-50">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-white rounded-xl text-amber-600 shadow-sm"><Wallet size={20} /></div>
                   <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Aguardando Pagamento</h3>
                </div>
                <span className="bg-white px-3 py-1 rounded-full text-xs font-bold text-gray-500 shadow-sm border border-gray-100">{pendingBudgets.length} Pendentes</span>
             </div>
             <div className="divide-y divide-gray-50">
                {pendingBudgets.length === 0 ? (
                   <div className="p-8 text-center text-gray-400 flex flex-col items-center">
                      <CheckCircle2 size={32} className="mb-2 text-emerald-200" />
                      <p className="text-xs font-bold uppercase tracking-widest">Nenhuma pendência financeira.</p>
                   </div>
                ) : (
                   pendingBudgets.map((budget: any) => (
                    <div key={budget.id} onClick={() => navigate(`/patients/${budget.patients?.id}/financial?tab=orcamentos`)} className="p-5 flex items-center justify-between hover:bg-amber-50/30 transition-colors cursor-pointer group">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-400">{budget.patients?.name?.charAt(0)}</div>
                            <div>
                                <h4 className="font-bold text-gray-900">{budget.patients?.name}</h4>
                                <p className="text-xs text-amber-600 font-bold uppercase mt-0.5">R$ {budget.total}</p>
                            </div>
                        </div>
                        <Button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-black hover:scale-105 transition-all shadow-lg">Cobrar <ArrowRight size={14} /></Button>
                    </div>
                   ))
                )}
             </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[600px]">
            <div className="px-10 py-8 border-b bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                <h3 className="text-lg font-black uppercase tracking-widest text-gray-900 italic">Cronograma de Atendimentos</h3>
                <div className="flex bg-gray-100 p-1.5 rounded-xl">
                  <button onClick={() => setActiveAgendaTab('pending')} className={`px-8 py-3 rounded-xl text-xs font-black uppercase transition-all ${activeAgendaTab === 'pending' ? 'bg-white text-pink-600 shadow-md' : 'text-gray-400'}`}>Agenda Principal</button>
                  <button onClick={() => setActiveAgendaTab('completed')} className={`px-8 py-3 rounded-xl text-sm font-black uppercase transition-all ${activeAgendaTab === 'completed' ? 'bg-white text-emerald-600 shadow-md' : 'text-gray-400'}`}>Concluídos</button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-10">
                {activeAgendaTab === 'pending' && patientsInAttendance.length > 0 && (
                    <TimelineSection title="EM ATENDIMENTO AGORA" color="purple">
                        {patientsInAttendance.map(appt => (
                            <TimelineCard key={appt.id} appt={appt} clinicColor={clinicData?.primary_color} updatingId={updatingId} onUpdate={handleUpdateStatus} onEdit={() => navigate(`/appointments/${appt.id}/edit`)} onNavigateToProfile={() => navigate(`/patients/${appt.patient_id}`)} />
                        ))}
                    </TimelineSection>
                )}
                {paginatedList.length > 0 ? (
                    <TimelineSection title={activeAgendaTab === 'pending' ? "Próximos / Aguardando" : "Finalizados Hoje"} color={activeAgendaTab === 'pending' ? "red" : "green"}>
                        {paginatedList.map(appt => (
                            <TimelineCard key={appt.id} appt={appt} clinicColor={clinicData?.primary_color} updatingId={updatingId} onUpdate={handleUpdateStatus} onEdit={() => navigate(`/appointments/${appt.id}/edit`)} onNavigateToProfile={() => navigate(`/patients/${appt.patient_id}`)} />
                        ))}
                    </TimelineSection>
                ) : (
                    activeAgendaTab === 'pending' && patientsInAttendance.length === 0 && (
                        <div className="p-20 text-center text-gray-300 font-bold uppercase italic tracking-widest">Agenda livre por enquanto.</div>
                    )
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
           <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] border border-gray-100 shadow-2xl flex flex-col min-h-[550px]">
              <div className="flex items-center justify-between mb-8">
                 <h4 className="text-sm font-black uppercase tracking-widest text-gray-400 flex items-center gap-2"><Phone size={18} className="text-pink-600" /> Recepção Ativa</h4>
                 <button onClick={() => { localStorage.removeItem('vilagi_completed_tasks'); setCompletedTasks([]); }} className="text-gray-300 hover:text-pink-500 transition-colors"><Trash2 size={24}/></button>
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
                            <Button onClick={() => handleWhatsApp(task.mobile, task.message)} className="flex-1 h-12 rounded-xl text-white font-black uppercase text-xs bg-emerald-500 hover:bg-emerald-600"><MessageCircle size={18} className="mr-2"/> WhatsApp</Button>
                            <Button onClick={() => handleCompleteTask(task.id)} variant="outline" className="h-12 w-12 p-0 rounded-xl border-gray-200 text-gray-400 hover:text-emerald-500"><Check size={24}/></Button>
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
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { 
  Users, DollarSign, CalendarCheck, Wallet, ArrowUpRight,
  Loader2, Sparkles, Activity, Clock, ChevronRight, User as UserIcon,
  Phone, MessageCircle, CheckCircle2, CalendarDays, Check, HeartHandshake, PackageCheck, PackageX, Trash2, UserPlus, Target
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from "recharts";
import { Button } from "../../components/ui/button";
import { startOfMonth, format, subDays, addDays, isFuture, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "react-hot-toast";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [clinicData, setClinicData] = useState<{primary_color: string} | null>(null);

  const [stats, setStats] = useState({
    totalPatients: 0,
    appointmentsToday: 0,
    newPatientsMonth: 0,
    revenueMonth: 0,
    chartData: [] as any[]
  });
  
  const [nextAppointments, setNextAppointments] = useState<any[]>([]);

  // --- ESTADOS DA DIREITA ---
  const [receptionTasks, setReceptionTasks] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'pre' | 'post'>('pre');
  const [criticalItems, setCriticalItems] = useState<any[]>([]);
  const [inventoryStatus, setInventoryStatus] = useState<'ok' | 'warning'>('ok');
  
  const [completedTasks, setCompletedTasks] = useState<string[]>(() => {
    const saved = localStorage.getItem('vilagi_completed_tasks');
    return saved ? JSON.parse(saved) : [];
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const displayName = profile?.fullName?.split(' ')[0] || user?.email?.split('@')[0] || 'Doutor(a)';
  const profilePhoto = profile?.avatarUrl || (profile as any)?.avatar_url; 

  // META (Exemplo)
  const MONTHLY_GOAL = 50000; 
  const progressGoal = Math.min((stats.revenueMonth / MONTHLY_GOAL) * 100, 100);

  useEffect(() => {
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

  const clearCompleted = () => {
      localStorage.removeItem('vilagi_completed_tasks');
      setCompletedTasks([]);
      toast.success("Tarefas restauradas!");
      setTimeout(() => fetchRealDashboardData(), 500);
  };

  async function fetchRealDashboardData() {
    if (!profile?.clinic_id) return;

    try {
      setLoading(true); 
      const now = new Date();
      const firstDayMonth = startOfMonth(now).toISOString();
      const startOfToday = new Date(now.setHours(0,0,0,0)).toISOString();
      const endOfToday = new Date(now.setHours(23,59,59,999)).toISOString();

      const [patientsCount, newPatientsCount, apptsTodayCount, revenueData, inventoryData] = await Promise.all([
        supabase.from('patients').select('*', { count: 'exact', head: true }).eq('clinic_id', profile.clinic_id), 
        supabase.from('patients').select('*', { count: 'exact', head: true }).eq('clinic_id', profile.clinic_id).gte('created_at', firstDayMonth),
        supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('clinic_id', profile.clinic_id).gte('start_time', startOfToday).lte('start_time', endOfToday).neq('status', 'canceled'),
        supabase.from('transactions').select('amount').eq('clinic_id', profile.clinic_id).gte('created_at', firstDayMonth),
        supabase.from('inventory').select('name, quantity, minimum_quantity, unit').eq('clinic_id', profile.clinic_id)
      ]);

      const totalRevenue = revenueData.data?.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0) || 0;

      // 1. ESTOQUE
      const critical = inventoryData.data?.filter(item => item.quantity <= item.minimum_quantity) || [];
      setCriticalItems(critical.slice(0, 5));
      setInventoryStatus(critical.length > 0 ? 'warning' : 'ok');

      // 2. AGENDA
      const { data: nextAppts } = await supabase
        .from('appointments')
        .select(`id, start_time, status, patients!patient_id (id, name), services!service_id (name), profiles!professional_id (full_name)`)
        .eq('clinic_id', profile.clinic_id)
        .gte('start_time', new Date().toISOString())
        .neq('status', 'canceled')
        .order('start_time', { ascending: true })
        .limit(5);

      const formattedNextAppts = nextAppts?.map(appt => ({
          id: appt.id,
          startAt: appt.start_time,
          status: appt.status,
          patient: Array.isArray(appt.patients) ? appt.patients[0] : appt.patients,
          service: Array.isArray(appt.services) ? appt.services[0] : appt.services,
          professional: Array.isArray(appt.profiles) ? appt.profiles[0] : appt.profiles
      })) || [];
      setNextAppointments(formattedNextAppts);

      // --- 3. RECEPÇÃO ATIVA ---
      const windowStart = subDays(new Date(), 10).toISOString();
      const windowEnd = addDays(new Date(), 10).toISOString();

      const { data: crmAppts } = await supabase
        .from('appointments')
        .select(`
            id, 
            start_time, 
            status,
            patient_id,
            patients (id, name, phone), 
            services (name)
        `)
        .eq('clinic_id', profile.clinic_id)
        .gte('start_time', windowStart)
        .lte('start_time', windowEnd)
        .neq('status', 'canceled');

      const tasksList: any[] = [];
      
      if (crmAppts) {
          crmAppts.forEach(appt => {
             const apptDate = new Date(appt.start_time);
             
             let patientData: any = Array.isArray(appt.patients) ? appt.patients[0] : appt.patients;
             let hasError = false;

             if (!patientData) {
                 patientData = { id: '000', name: 'PACIENTE DESCONHECIDO', phone: '' };
                 hasError = true;
             }

             const serviceData: any = Array.isArray(appt.services) ? appt.services[0] : appt.services;
             const serviceName = serviceData?.name || 'Procedimento';
             const mobileNumber = patientData.phone || ''; 
             const firstName = patientData.name?.split(' ')[0] || 'Paciente';

             const msgConfirmacao = `Olá ${firstName}! 👋\n\nPassando para confirmar seu horário de *${serviceName}* para o dia ${format(apptDate, 'dd/MM')} às ${format(apptDate, 'HH:mm')}.\n\nPodemos confirmar? 😊`;
             const msgPosVenda = `Olá ${firstName}! ✨\n\nComo você está se sentindo após o *${serviceName}*?\n\nEstamos à disposição se tiver qualquer dúvida sobre a recuperação!`;

             if (isFuture(apptDate)) {
                 tasksList.push({
                     id: `pre_${appt.id}`, 
                     type: 'pre', 
                     patientName: patientData.name,
                     mobile: mobileNumber,
                     service: serviceName,
                     time: appt.start_time,
                     hasError: hasError, 
                     message: msgConfirmacao
                 });
             }

             if (isPast(apptDate)) {
                 tasksList.push({
                     id: `post_${appt.id}`,
                     type: 'post', 
                     patientName: patientData.name,
                     mobile: mobileNumber,
                     service: serviceName,
                     time: appt.start_time,
                     hasError: hasError,
                     message: msgPosVenda
                 });
             }
          });
      }
      
      tasksList.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
      setReceptionTasks(tasksList);

      // GRÁFICO
      const chartData = [];
      for (let i = 6; i >= 0; i--) {
        const targetDate = subDays(new Date(), i);
        const sDay = new Date(targetDate.setHours(0,0,0,0)).toISOString();
        const eDay = new Date(targetDate.setHours(23,59,59,999)).toISOString();
        const { count } = await supabase.from('appointments').select('*', { count: 'exact', head: true })
            .eq('clinic_id', profile.clinic_id).gte('start_time', sDay).lte('start_time', eDay);
        chartData.push({ name: format(targetDate, 'eee', { locale: ptBR }), valor: count || 0 });
      }

      setStats({
        totalPatients: patientsCount.count || 0,
        appointmentsToday: apptsTodayCount.count || 0,
        newPatientsMonth: newPatientsCount.count || 0,
        revenueMonth: totalRevenue,
        chartData
      });
    } catch (error) { console.error(error); } finally { setLoading(false); }
  }

  const handleCompleteTask = (taskId: string) => {
      const newCompleted = [...completedTasks, taskId];
      setCompletedTasks(newCompleted);
      localStorage.setItem('vilagi_completed_tasks', JSON.stringify(newCompleted));
      toast.success("Tarefa concluída!");
  };

  const handleWhatsApp = (mobile: string, msg: string) => {
      if(!mobile) return toast.error("Sem celular.");
      const text = encodeURIComponent(msg);
      window.open(`https://wa.me/55${mobile.replace(/\D/g, '')}?text=${text}`, '_blank');
  };

  const visibleTasks = receptionTasks.filter(t => !completedTasks.includes(t.id) && t.type === activeTab);
  const countPre = receptionTasks.filter(t => !completedTasks.includes(t.id) && t.type === 'pre').length;
  const countPost = receptionTasks.filter(t => !completedTasks.includes(t.id) && t.type === 'post').length;

  if (loading) return <div className="flex h-screen items-center justify-center bg-white dark:bg-gray-900"><Loader2 className="animate-spin text-pink-600 w-10 h-10" /></div>;

  return (
    <div className="p-6 max-w-[1600px] mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 space-y-8 animate-in fade-in duration-700 pb-20">
      
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 md:h-20 md:w-20 rounded-full border-4 border-pink-50 dark:border-pink-900/30 overflow-hidden bg-gray-100 flex items-center justify-center shadow-inner">
             {profilePhoto ? <img src={profilePhoto} alt="Perfil" className="h-full w-full object-cover" /> : <div className="bg-pink-100 dark:bg-pink-900/40 w-full h-full flex items-center justify-center text-pink-600"><UserIcon size={32} /></div>}
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              {greeting}, <span style={{ color: clinicData?.primary_color || '#ec4899' }}>{displayName}</span>! <Sparkles size={24} className="text-yellow-500 animate-pulse"/>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Pronto para transformar vidas hoje?</p>
          </div>
        </div>

        <div className="flex gap-3">
            {/* BOTÕES DE AÇÃO RÁPIDA (Estoque removido daqui) */}
            <Button onClick={() => navigate('/patients/new')} className="hidden sm:flex bg-pink-600 hover:bg-pink-700 text-white rounded-xl shadow-lg shadow-pink-200">
                <UserPlus size={16} className="mr-2"/> Novo Paciente
            </Button>
            <Button onClick={() => navigate('/appointments')} className="text-white shadow-lg rounded-xl transition-all hover:scale-105" style={{ backgroundColor: clinicData?.primary_color || '#ec4899' }}>
                <CalendarCheck size={16} className="mr-2"/> Ver Agenda
            </Button>
        </div>
      </div>

      {/* KPI + META */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* META FINANCEIRA */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-xl relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
               <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600"><DollarSign size={24}/></div>
               <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider flex items-center gap-1"><Target size={12}/> Meta</span>
            </div>
            <div>
               <p className="text-sm text-gray-500 mb-1 font-medium">Faturamento (Pago)</p>
               <h3 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">
                  {stats.revenueMonth.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
               </h3>
            </div>
            <div className="mt-4">
                <div className="flex justify-between text-[10px] font-bold text-gray-400 mb-1">
                    <span>Progresso</span>
                    <span>{progressGoal.toFixed(0)}%</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-400 to-green-600 transition-all duration-1000" style={{ width: `${progressGoal}%` }}></div>
                </div>
            </div>
        </div>

        <StatCardPremium title="Agendamentos Hoje" value={stats.appointmentsToday} sub="Atendimentos dia" icon={<Clock size={24} />} color="blue" />
        <StatCardPremium title="Total Pacientes" value={stats.totalPatients} sub={`+${stats.newPatientsMonth} novos`} icon={<Users size={24} />} color="pink" customColor={clinicData?.primary_color} />
        <StatCardPremium title="Ticket Médio" value={((stats.revenueMonth / (stats.totalPatients || 1)) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} sub="Por paciente" icon={<Wallet size={24} />} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ESQUERDA: GRÁFICO + AGENDA */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
                <Activity size={20} style={{ color: clinicData?.primary_color || '#ec4899' }} /> Fluxo Semanal
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.chartData}>
                  <defs>
                    <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={clinicData?.primary_color || "#ec4899"} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={clinicData?.primary_color || "#ec4899"} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af'}} />
                  <Tooltip />
                  <Area type="monotone" dataKey="valor" stroke={clinicData?.primary_color || "#ec4899"} strokeWidth={3} fill="url(#colorValor)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="text-lg font-bold">Próximos Atendimentos</h3>
                  <Button onClick={() => navigate('/appointments')} variant="ghost" size="sm" style={{ color: clinicData?.primary_color || '#ec4899' }}>Ver todos</Button>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-gray-700">
                  {nextAppointments.length === 0 ? (
                      <div className="p-10 text-center text-gray-400 font-medium">Nenhum agendamento pendente.</div>
                  ) : (
                    nextAppointments.map((appt) => (
                      <div key={appt.id} className="p-5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer" onClick={() => appt.patient?.id ? navigate(`/patients/${appt.patient.id}`) : null}>
                          <div className="flex items-center gap-4">
                              <div className="w-14 h-14 rounded-xl text-white flex flex-col items-center justify-center font-bold shadow-sm" style={{ backgroundColor: clinicData?.primary_color || '#ec4899' }}>
                                  <span className="text-sm">{format(new Date(appt.startAt), 'HH:mm')}</span>
                              </div>
                              <div>
                                  <p className="font-bold text-gray-900 dark:text-white">{appt.patient?.name || 'Sem nome'}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {appt.service?.name || 'Consulta'} • com {appt.professional?.full_name || appt.professional?.fullName || 'Profissional'}
                                  </p>
                              </div>
                          </div>
                          <ChevronRight size={18} className="text-gray-300" />
                      </div>
                    ))
                  )}
              </div>
          </div>
        </div>
        
        {/* DIREITA: ESTOQUE + RECEPÇÃO ATIVA */}
        <div className="lg:col-span-1 space-y-6">
           
           {/* 1. WIDGET DE ESTOQUE (SEMPRE VISÍVEL) */}
           <div className={`p-5 rounded-3xl border shadow-sm relative overflow-hidden transition-all ${inventoryStatus === 'ok' ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-800' : 'bg-amber-50 border-amber-100 dark:bg-amber-900/20 dark:border-amber-800'}`}>
                <div className="flex items-center gap-2 mb-4">
                   {inventoryStatus === 'ok' ? <PackageCheck className="text-emerald-600" size={20} /> : <PackageX className="text-amber-600" size={20} />}
                   <h4 className={`text-xs font-black uppercase tracking-widest ${inventoryStatus === 'ok' ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {inventoryStatus === 'ok' ? 'Estoque Saudável' : 'Reposição Necessária'}
                   </h4>
                </div>
                
                {criticalItems.length > 0 ? (
                   <div className="space-y-3">
                      {criticalItems.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center bg-white dark:bg-gray-800 p-2.5 rounded-xl border border-amber-100/50 shadow-sm">
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-200 line-clamp-1">{item.name}</span>
                            <span className="text-[10px] font-black bg-amber-100 text-amber-700 px-2 py-1 rounded-lg">
                                {item.quantity} {item.unit}
                            </span>
                          </div>
                      ))}
                   </div>
                ) : (
                   <div className="text-center py-2">
                      <p className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">Todos os produtos estão com estoque acima do mínimo.</p>
                   </div>
                )}
                
                <Button onClick={() => navigate('/inventory')} variant="ghost" size="sm" className={`w-full mt-4 text-[10px] font-bold uppercase ${inventoryStatus === 'ok' ? 'text-emerald-600 hover:bg-emerald-100' : 'text-amber-600 hover:bg-amber-100'}`}>
                   Gerenciar Estoque <ArrowUpRight size={12} className="ml-1"/>
                </Button>
           </div>

           {/* 2. RECEPÇÃO ATIVA (CRM) */}
           <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-xl relative overflow-hidden h-full flex flex-col min-h-[400px]">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 to-purple-500"></div>
              
              <div className="flex items-center justify-between mb-4">
                 <h4 className="text-[12px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                    <Phone size={16} className="text-pink-600 animate-bounce" /> Recepção Ativa
                 </h4>
                 <button onClick={clearCompleted} className="text-gray-300 hover:text-pink-500 transition-colors" title="Restaurar Lista">
                    <Trash2 size={16} />
                 </button>
              </div>

              {/* ABAS */}
              <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl mb-4">
                  <button onClick={() => setActiveTab('pre')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${activeTab === 'pre' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}>
                     Confirmar {countPre > 0 && <span className="bg-blue-600 text-white px-1.5 rounded-full text-[9px]">{countPre}</span>}
                  </button>
                  <button onClick={() => setActiveTab('post')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${activeTab === 'post' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400'}`}>
                     Pós-Venda {countPost > 0 && <span className="bg-purple-600 text-white px-1.5 rounded-full text-[9px]">{countPost}</span>}
                  </button>
              </div>

              <div className="space-y-4 overflow-y-auto custom-scrollbar pr-1 flex-1 max-h-[500px]">
                 {visibleTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center opacity-50">
                        <CheckCircle2 size={40} className="text-green-500 mb-2"/>
                        <p className="text-sm font-bold text-gray-500">Tudo em dia!</p>
                        <p className="text-xs text-gray-400 mt-1">Nenhum contato pendente.</p>
                    </div>
                 ) : (
                    visibleTasks.map(task => (
                        <div key={task.id} className={`group p-4 rounded-2xl border hover:shadow-md transition-all ${task.hasError ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100 dark:bg-gray-900/40 dark:border-gray-700'}`}>
                           <div className="flex gap-3">
                              <div className={`p-2 rounded-xl h-fit shrink-0 ${task.type === 'pre' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                                 {task.type === 'pre' ? <CalendarDays size={18}/> : <HeartHandshake size={18}/>}
                              </div>
                              <div className="flex-1">
                                 <div className="flex justify-between items-start">
                                     <p className={`font-bold text-sm line-clamp-1 ${task.hasError ? 'text-red-600' : 'text-gray-800 dark:text-white'}`}>{task.patientName}</p>
                                     <span className="text-[9px] font-bold uppercase text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded">{format(new Date(task.time), 'dd/MM HH:mm')}</span>
                                 </div>
                                 <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mt-0.5">{task.service}</p>
                              </div>
                           </div>
                           
                           <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/50">
                              <Button 
                                size="sm" 
                                className={`flex-1 h-8 text-white rounded-lg text-[10px] font-bold uppercase ${task.type === 'pre' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-purple-500 hover:bg-purple-600'}`}
                                onClick={() => handleWhatsApp(task.mobile, task.message)}
                                disabled={task.hasError}
                              >
                                 <MessageCircle size={14} className="mr-1.5"/> WhatsApp
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="h-8 w-8 p-0 rounded-lg border-gray-200 hover:bg-gray-100 text-gray-400 hover:text-green-600"
                                title="Concluir"
                                onClick={() => handleCompleteTask(task.id)}
                              >
                                 <Check size={16}/>
                              </Button>
                           </div>
                        </div>
                    ))
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function StatCardPremium({ title, value, sub, icon, color, customColor }: any) {
    const colors: any = {
      green: "from-green-500 to-emerald-600 shadow-green-100 text-green-600",
      blue: "from-blue-500 to-indigo-600 shadow-blue-100 text-blue-600",
      pink: "from-pink-500 to-rose-600 shadow-pink-100 text-pink-600",
      purple: "from-purple-500 to-violet-600 shadow-purple-100 text-purple-600",
    };
    const style = colors[color];
    const iconStyle = customColor ? { backgroundColor: customColor } : {};
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-xl transition-transform hover:-translate-y-1">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-2xl text-white shadow-lg ${!customColor ? `bg-gradient-to-br ${style.split(' ').slice(0,2).join(' ')}` : ''}`} style={iconStyle}>{icon}</div>
          <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Métrica</span>
        </div>
        <div>
          <p className="text-sm text-gray-500 mb-1 font-medium">{title}</p>
          <h3 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">{value}</h3>
        </div>
        <div className="mt-4 flex items-center gap-1 text-xs font-bold text-gray-400">
          <ArrowUpRight size={14} className={!customColor ? style.split(' ').pop() : ''} style={customColor ? {color: customColor} : {}} />
          {sub}
        </div>
      </div>
    );
}
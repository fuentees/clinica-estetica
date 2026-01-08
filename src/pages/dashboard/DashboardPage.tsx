import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { 
  Users, DollarSign, CalendarCheck, Wallet, ArrowUpRight,
  Loader2, Sparkles, Activity, Clock, ChevronRight, User as UserIcon
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from "recharts";
import { Button } from "../../components/ui/button";
import { DailyTasksWidget } from "../../components/dashboard/DailyTasksWidget";
import { startOfMonth, format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // Dados da Clínica para cores e temas
  const [clinicData, setClinicData] = useState<{primary_color: string} | null>(null);

  const [stats, setStats] = useState({
    totalPatients: 0,
    appointmentsToday: 0,
    newPatientsMonth: 0,
    revenueMonth: 0,
    chartData: [] as any[]
  });
  
  const [nextAppointments, setNextAppointments] = useState<any[]>([]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  
  // Nome e Foto do Perfil
  const displayName = profile?.fullName?.split(' ')[0] || user?.email?.split('@')[0] || 'Doutor(a)';
  const profilePhoto = profile?.avatarUrl || (profile as any)?.avatar_url; 

  useEffect(() => {
    if (profile?.clinic_id) {
      fetchClinicInfo();
      fetchRealDashboardData();
    }
  }, [profile?.clinic_id]);

  async function fetchClinicInfo() {
      try {
          const { data } = await supabase
            .from('clinics')
            .select('primary_color')
            .eq('id', profile?.clinic_id)
            .single();
          if (data) setClinicData(data);
      } catch (e) { console.error(e); }
  }

  async function fetchRealDashboardData() {
    if (!profile?.clinic_id) return;

    try {
      setLoading(true); 
      const now = new Date();
      const firstDayMonth = startOfMonth(now).toISOString();
      const startOfToday = new Date(now.setHours(0,0,0,0)).toISOString();
      const endOfToday = new Date(now.setHours(23,59,59,999)).toISOString();

      const [patientsCount, newPatientsCount, apptsTodayCount, revenueData] = await Promise.all([
        // Total Pacientes
        supabase.from('patients')
            .select('*', { count: 'exact', head: true })
            .eq('clinic_id', profile.clinic_id), 
        
        // Novos Pacientes (Mês)
        supabase.from('patients')
            .select('*', { count: 'exact', head: true })
            .eq('clinic_id', profile.clinic_id)
            .gte('created_at', firstDayMonth),
        
        // Agendamentos Hoje
        supabase.from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('clinic_id', profile.clinic_id)
            .gte('start_time', startOfToday)
            .lte('start_time', endOfToday)
            .neq('status', 'canceled'),
        
        // Receita
        supabase.from('transactions')
            .select('amount')
            .eq('clinic_id', profile.clinic_id)
            .gte('created_at', firstDayMonth)
      ]);

      const totalRevenue = revenueData.data?.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0) || 0;

      // Busca Próximos Agendamentos com Join Seguro
      const { data: nextAppts, error: apptsError } = await supabase
        .from('appointments')
        .select(`
            id, 
            start_time, 
            status,
            patients!patient_id (id, name),
            services!service_id (name),
            profiles!professional_id (full_name)
        `)
        .eq('clinic_id', profile.clinic_id)
        .gte('start_time', new Date().toISOString())
        .neq('status', 'canceled')
        .order('start_time', { ascending: true })
        .limit(5);

      if (apptsError) console.error("Erro ao buscar agendamentos:", apptsError);

      const formattedNextAppts = nextAppts?.map(appt => ({
          id: appt.id,
          startAt: appt.start_time,
          status: appt.status,
          // Tratamento para garantir objeto único
          patient: Array.isArray(appt.patients) ? appt.patients[0] : appt.patients,
          service: Array.isArray(appt.services) ? appt.services[0] : appt.services,
          professional: Array.isArray(appt.profiles) ? appt.profiles[0] : appt.profiles
      })) || [];

      setNextAppointments(formattedNextAppts);

      // Dados do Gráfico
      const chartData = [];
      for (let i = 6; i >= 0; i--) {
        const targetDate = subDays(new Date(), i);
        const startDay = new Date(targetDate.setHours(0,0,0,0)).toISOString();
        const endDay = new Date(targetDate.setHours(23,59,59,999)).toISOString();
        
        const { count } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('clinic_id', profile.clinic_id)
            .gte('start_time', startDay)
            .lte('start_time', endDay);
            
        chartData.push({ name: format(targetDate, 'eee', { locale: ptBR }), valor: count || 0 });
      }

      setStats({
        totalPatients: patientsCount.count || 0,
        appointmentsToday: apptsTodayCount.count || 0,
        newPatientsMonth: newPatientsCount.count || 0,
        revenueMonth: totalRevenue,
        chartData
      });
    } catch (error) { 
        console.error("Erro fatal no dashboard:", error); 
    } finally { 
        setLoading(false); 
    }
  }

  if (loading) return <div className="flex h-screen items-center justify-center bg-white dark:bg-gray-900"><Loader2 className="animate-spin text-pink-600 w-10 h-10" /></div>;

  return (
    <div className="p-6 max-w-[1600px] mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 space-y-8 animate-in fade-in duration-700">
      
      {/* --- CABEÇALHO --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 md:h-20 md:w-20 rounded-full border-4 border-pink-50 dark:border-pink-900/30 overflow-hidden bg-gray-100 flex items-center justify-center shadow-inner">
             {profilePhoto ? (
                 <img src={profilePhoto} alt="Perfil" className="h-full w-full object-cover" />
             ) : (
                 <div className="bg-pink-100 dark:bg-pink-900/40 w-full h-full flex items-center justify-center text-pink-600">
                    <UserIcon size={32} />
                 </div>
             )}
          </div>

          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              {greeting}, <span style={{ color: clinicData?.primary_color || '#ec4899' }}>{displayName}</span>! <Sparkles size={24} className="text-yellow-500 animate-pulse"/>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Pronto para transformar vidas hoje?
            </p>
          </div>
        </div>

        <div className="flex gap-3">
            <Button onClick={() => navigate('/patients')} variant="outline" className="hidden sm:flex rounded-xl">
                <Users size={16} className="mr-2"/> Pacientes
            </Button>
            <Button 
                onClick={() => navigate('/appointments')} 
                className="text-white shadow-lg rounded-xl transition-all hover:scale-105"
                style={{ backgroundColor: clinicData?.primary_color || '#ec4899' }}
            >
                <CalendarCheck size={16} className="mr-2"/> Ver Agenda
            </Button>
        </div>
      </div>

      {/* --- CARDS DE KPI --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCardPremium title="Receita Mensal" value={stats.revenueMonth.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} sub="Entradas do mês" icon={<DollarSign size={24} />} color="green" />
        <StatCardPremium title="Agendamentos Hoje" value={stats.appointmentsToday} sub="Atendimentos dia" icon={<Clock size={24} />} color="blue" />
        <StatCardPremium title="Total Pacientes" value={stats.totalPatients} sub={`+${stats.newPatientsMonth} novos`} icon={<Users size={24} />} color="pink" customColor={clinicData?.primary_color} />
        <StatCardPremium title="Ticket Médio" value={((stats.revenueMonth / (stats.totalPatients || 1)) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} sub="Por paciente" icon={<Wallet size={24} />} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          
          {/* GRÁFICO */}
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

          {/* LISTA PRÓXIMOS ATENDIMENTOS */}
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
                      <div 
                        key={appt.id} 
                        className="p-5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer" 
                        // ✅ CORREÇÃO: Agora navega para o perfil do paciente
                        onClick={() => appt.patient?.id ? navigate(`/patients/${appt.patient.id}`) : null}
                      >
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
        
        {/* WIDGET LATERAL */}
        <div className="lg:col-span-1">
            <DailyTasksWidget />
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
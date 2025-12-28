import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext"; // Importado para pegar o nome
import { 
  Users, 
  DollarSign, 
  CalendarCheck, 
  Wallet, 
  ArrowUpRight,
  Loader2,
  Sparkles,
  Activity,
  Plus,
  Clock,
  ChevronRight,
  User
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { Button } from "../../components/ui/button";

// Widget de Recepção Ativa
import { DailyTasksWidget } from "../../components/dashboard/DailyTasksWidget";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { profile, user } = useAuth(); // Hook de autenticação para pegar o nome
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({
    totalPatients: 0,
    appointmentsToday: 0,
    newPatientsMonth: 0,
    revenueMonth: 0,
    chartData: [] as any[]
  });
  
  const [nextAppointments, setNextAppointments] = useState<any[]>([]);

  // Lógica de Saudação e Nome
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  
  // Define o nome: Tenta o First Name do perfil -> Email -> ou "Doutor(a)"
  const displayName = profile?.first_name 
    ? profile.first_name 
    : user?.email?.split('@')[0] || 'Doutor(a)';

  useEffect(() => {
    fetchRealDashboardData();
  }, []);

  async function fetchRealDashboardData() {
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const firstDayMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

      // 1. KPIs Principais
      const { count: totalPatients } = await supabase.from('patients').select('*', { count: 'exact', head: true });
      const { count: newPatients } = await supabase.from('patients').select('*', { count: 'exact', head: true }).gte('created_at', firstDayMonth);
      const { count: appointmentsToday } = await supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('date', todayStr).neq('status', 'cancelled');

      // 2. Faturamento
      let totalRevenue = 0;
      const { data: payments } = await supabase.from('payments').select('amount').gte('date', firstDayMonth);
      if (payments) {
        totalRevenue = payments.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
      }

      // 3. Próximos Agendamentos do Dia
      const { data: nextAppts } = await supabase
        .from('appointments')
        .select(`
            id, start_time, status,
            patient:patient_id(id, name, profiles(first_name, last_name)),
            treatment:treatment_id(name),
            professional:professional_id(first_name)
        `)
        .eq('date', todayStr)
        .neq('status', 'cancelled')
        .neq('status', 'completed')
        .order('start_time', { ascending: true })
        .limit(5);

      setNextAppointments(nextAppts || []);

      // 4. Gráfico
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayName = d.toLocaleDateString('pt-BR', { weekday: 'short' });
        
        const { count } = await supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('date', dateStr);
        last7Days.push({ name: dayName, valor: count || 0 });
      }

      setStats({
        totalPatients: totalPatients || 0,
        appointmentsToday: appointmentsToday || 0,
        newPatientsMonth: newPatients || 0,
        revenueMonth: totalRevenue,
        chartData: last7Days
      });

    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-pink-600 w-10 h-10" /></div>;

  const ticketMedio = stats.appointmentsToday > 0 ? stats.revenueMonth / (stats.appointmentsToday * 20) : 0;

  // Helpers para extrair dados seguros do paciente
  const getPatientData = (appt: any) => {
      const p = Array.isArray(appt.patient) ? appt.patient[0] : appt.patient;
      if (!p) return { name: 'Paciente', id: null };
      
      let displayName = p.name || 'Paciente';
      
      const prof = p.profiles; 
      const profileData = Array.isArray(prof) ? prof[0] : prof;
      
      if (profileData && profileData.first_name) {
          displayName = `${profileData.first_name} ${profileData.last_name || ''}`;
      }
      
      return { name: displayName, id: p.id };
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 space-y-8 animate-in fade-in duration-700">
      
      {/* --- CABEÇALHO --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            {greeting}, <span className="text-pink-600">Dr(a). {displayName}</span>! <Sparkles size={24} className="text-yellow-500 animate-pulse"/>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Resumo em tempo real da performance da clínica.
          </p>
        </div>
        <div className="flex gap-3">
            <Button onClick={() => navigate('/patients/new')} variant="outline" className="hidden sm:flex border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                <Plus size={16} className="mr-2"/> Novo Paciente
            </Button>
            <Button onClick={() => navigate('/appointments/new')} className="bg-pink-600 hover:bg-pink-700 text-white shadow-lg shadow-pink-200 dark:shadow-none rounded-xl transition-all hover:scale-105">
                <Plus size={16} className="mr-2"/> Agendar
            </Button>
        </div>
      </div>

      {/* --- CARDS DE KPI --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCardPremium 
          title="Faturamento (Mês)" 
          value={stats.revenueMonth.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} 
          sub="Entradas confirmadas" 
          icon={<DollarSign size={24} />} 
          color="green"
        />
        <StatCardPremium 
          title="Agendamentos Hoje" 
          value={stats.appointmentsToday} 
          sub="Na agenda do dia" 
          icon={<CalendarCheck size={24} />} 
          color="blue"
        />
        <StatCardPremium 
          title="Total Pacientes" 
          value={stats.totalPatients} 
          sub={`+${stats.newPatientsMonth} novos este mês`} 
          icon={<Users size={24} />} 
          color="pink"
        />
        <StatCardPremium 
          title="Ticket Médio (Est.)" 
          value={ticketMedio > 0 ? ticketMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : "R$ 0,00"} 
          sub="Baseado no fluxo" 
          icon={<Wallet size={24} />} 
          color="purple"
        />
      </div>

      {/* --- ÁREA PRINCIPAL --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
        
        {/* COLUNA ESQUERDA (2/3) */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* GRÁFICO */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-pink-500/10 transition-all duration-700"></div>
            <div className="flex justify-between items-center mb-8 relative z-10">
              <div>
                  <h3 className="font-bold text-xl text-gray-900 dark:text-white flex items-center gap-2">
                    <Activity size={20} className="text-pink-600" /> Fluxo de Atendimentos
                  </h3>
                  <p className="text-sm text-gray-500">Volume de pacientes nos últimos 7 dias</p>
              </div>
            </div>
            <div className="h-[300px] w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.5} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
                    itemStyle={{ color: '#db2777', fontWeight: 'bold' }}
                    labelStyle={{ color: '#6b7280', marginBottom: '0.5rem' }}
                    cursor={{ stroke: '#ec4899', strokeWidth: 1, strokeDasharray: '5 5' }}
                  />
                  <Area type="monotone" dataKey="valor" stroke="#ec4899" strokeWidth={4} fillOpacity={1} fill="url(#colorValor)" animationDuration={1500} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* LISTA: PRÓXIMOS DA FILA */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Clock size={20} className="text-blue-500"/> Fila de Atendimento (Hoje)
                  </h3>
                  <Button onClick={() => navigate('/appointments')} variant="ghost" className="text-xs text-blue-600 hover:text-blue-700">Ver Agenda</Button>
              </div>
              <div className="p-4">
                  {nextAppointments.length === 0 ? (
                      <div className="text-center py-10 text-gray-400">
                          <p>Tudo tranquilo! Nenhum paciente aguardando agora.</p>
                      </div>
                  ) : (
                      <div className="space-y-3">
                          {nextAppointments.map((appt) => {
                              const patientInfo = getPatientData(appt);
                              
                              return (
                                  <div 
                                    key={appt.id} 
                                    className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-transparent hover:border-blue-200 transition-all cursor-pointer group" 
                                    onClick={() => patientInfo.id && navigate(`/patients/${patientInfo.id}`)}
                                  >
                                      <div className="text-center min-w-[60px]">
                                          <span className="block text-lg font-bold text-blue-600 bg-blue-100 dark:bg-blue-900/30 rounded-lg py-1">
                                              {appt.start_time.slice(0, 5)}
                                          </span>
                                      </div>
                                      <div className="flex-1">
                                          <h4 className="font-bold text-gray-800 dark:text-white group-hover:text-blue-600 transition-colors flex items-center gap-2">
                                              {patientInfo.name}
                                              <User size={14} className="opacity-0 group-hover:opacity-50 transition-opacity" />
                                          </h4>
                                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                              <span className="font-medium text-gray-700 dark:text-gray-300">
                                                  {appt.treatment?.name || 'Consulta'}
                                              </span>
                                              <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                              <span>{appt.professional?.first_name || 'Profissional'}</span>
                                          </div>
                                      </div>
                                      <div className="flex items-center gap-3">
                                          <span className="text-[10px] uppercase font-bold px-2 py-1 rounded-lg bg-yellow-100 text-yellow-700 border border-yellow-200">
                                              {appt.status === 'scheduled' ? 'Aguardando' : appt.status}
                                          </span>
                                          <ChevronRight size={18} className="text-gray-300 group-hover:text-blue-500"/>
                                      </div>
                                  </div>
                              );
                          })}
                      </div>
                  )}
              </div>
          </div>

        </div>

        {/* COLUNA DIREITA (1/3) */}
        <div className="lg:col-span-1 h-full min-h-[400px]">
           <DailyTasksWidget /> 
        </div>

      </div>
    </div>
  );
}

// --- COMPONENTE VISUAL PREMIUM ---
function StatCardPremium({ title, value, sub, icon, color }: any) {
  const styles: any = {
    green: {
      bg: "bg-white dark:bg-gray-800",
      iconBg: "bg-gradient-to-br from-green-500 to-emerald-600",
      shadow: "shadow-green-100 dark:shadow-none",
      text: "text-emerald-600",
      border: "border-green-100/50",
      glow: "bg-green-500/10"
    },
    blue: {
      bg: "bg-white dark:bg-gray-800",
      iconBg: "bg-gradient-to-br from-blue-500 to-indigo-600",
      shadow: "shadow-blue-100 dark:shadow-none",
      text: "text-blue-600",
      border: "border-blue-100/50",
      glow: "bg-blue-500/10"
    },
    pink: {
      bg: "bg-white dark:bg-gray-800",
      iconBg: "bg-gradient-to-br from-pink-500 to-rose-600",
      shadow: "shadow-pink-100 dark:shadow-none",
      text: "text-pink-600",
      border: "border-pink-100/50",
      glow: "bg-pink-500/10"
    },
    purple: {
      bg: "bg-white dark:bg-gray-800",
      iconBg: "bg-gradient-to-br from-purple-500 to-violet-600",
      shadow: "shadow-purple-100 dark:shadow-none",
      text: "text-purple-600",
      border: "border-purple-100/50",
      glow: "bg-purple-500/10"
    },
  };

  const s = styles[color] || styles.pink;

  return (
    <div className={`relative overflow-hidden p-6 rounded-3xl border ${s.border} dark:border-gray-700 shadow-xl ${s.shadow} group hover:-translate-y-1 transition-all duration-300 ${s.bg}`}>
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500 ${s.glow}`}></div>
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-2xl shadow-lg text-white transform group-hover:scale-110 transition-transform duration-300 ${s.iconBg}`}>
            {icon}
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Mensal</span>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</p>
          <h3 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">{value}</h3>
        </div>
        <div className="mt-4 flex items-center gap-1 text-xs font-medium bg-gray-50 dark:bg-gray-900 w-fit px-2 py-1 rounded-lg border border-gray-100 dark:border-gray-700">
          <ArrowUpRight size={12} className={s.text} />
          <span className={s.text}>{sub}</span>
        </div>
      </div>
    </div>
  );
}
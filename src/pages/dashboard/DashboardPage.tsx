import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { 
  Users, 
  DollarSign, 
  CalendarCheck, 
  TrendingUp, 
  Wallet, 
  ArrowUpRight,
  Loader2
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

// Importando o Widget de Recepção Ativa
import { DailyTasksWidget } from "../../components/dashboard/DailyTasksWidget";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPatients: 0,
    appointmentsToday: 0,
    newPatientsMonth: 0,
    revenueMonth: 0,
    chartData: [] as any[]
  });

  // Saudação baseada no horário
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  useEffect(() => {
    fetchRealDashboardData();
  }, []);

  async function fetchRealDashboardData() {
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      // Data do primeiro dia do mês atual
      const firstDayMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

      // 1. Total de Pacientes
      const { count: totalPatients } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true });

      // 2. Novos Pacientes (Este Mês)
      const { count: newPatients } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', firstDayMonth);

      // 3. Agendamentos Hoje
      const { count: appointmentsToday } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('date', todayStr)
        .neq('status', 'cancelled');

      // 4. Faturamento do Mês
      let totalRevenue = 0;
      // Verifica se a tabela payments existe antes de tentar somar
      const { data: payments, error: paymentError } = await supabase
        .from('payments')
        .select('amount')
        .gte('date', firstDayMonth);
      
      if (!paymentError && payments) {
        totalRevenue = payments.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
      }

      // 5. Dados do Gráfico (Últimos 7 dias)
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayName = d.toLocaleDateString('pt-BR', { weekday: 'short' });
        
        const { count } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('date', dateStr);
            
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

  if (loading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-pink-600 w-10 h-10" /></div>;
  }

  // Cálculo seguro do Ticket Médio (evita divisão por zero)
  const ticketMedio = stats.appointmentsToday > 0 
    ? stats.revenueMonth / (stats.appointmentsToday * 20) // Estimativa baseada no dia (ajuste conforme realidade)
    : 0;

  return (
    <div className="p-6 max-w-[1600px] mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 space-y-8">
      
      {/* --- CABEÇALHO --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            {greeting}, Doutor(a)! 👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Resumo em tempo real da sua clínica.
          </p>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>

      {/* --- CARDS DE KPI --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Faturamento (Mês)" 
          value={stats.revenueMonth.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} 
          sub="Entradas confirmadas" 
          icon={<DollarSign className="text-green-600" />} 
          color="green"
        />
        <StatCard 
          title="Agendamentos Hoje" 
          value={stats.appointmentsToday} 
          sub="Na agenda" 
          icon={<CalendarCheck className="text-blue-600" />} 
          color="blue"
        />
        <StatCard 
          title="Total Pacientes" 
          value={stats.totalPatients} 
          sub={`+${stats.newPatientsMonth} novos este mês`} 
          icon={<Users className="text-pink-600" />} 
          color="pink"
        />
        <StatCard 
          title="Ticket Médio (Est.)" 
          value={ticketMedio > 0 ? ticketMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : "R$ 0,00"} 
          sub="Baseado no fluxo" 
          icon={<Wallet className="text-purple-600" />} 
          color="purple"
        />
      </div>

      {/* --- ÁREA PRINCIPAL --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
        
        {/* COLUNA ESQUERDA (2/3): Gráfico */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
                <TrendingUp size={20} className="text-green-500" /> Volume de Atendimentos
              </h3>
              <select className="bg-gray-50 dark:bg-gray-700 border-none text-sm rounded-lg p-2 outline-none cursor-pointer">
                <option>Últimos 7 dias</option>
              </select>
            </div>
            
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="name" 
                    stroke="#9ca3af" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="#9ca3af" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    allowDecimals={false}
                  />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                    formatter={(value: any) => [value, "Agendamentos"]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="valor" 
                    stroke="#ec4899" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorValor)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA (1/3): Widget de Tarefas */}
        <div className="lg:col-span-1 h-full min-h-[400px]">
           <DailyTasksWidget /> 
        </div>

      </div>
    </div>
  );
}

// Componente Visual do Card
function StatCard({ title, value, sub, icon, color }: any) {
  const colors: any = {
    green: "bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900",
    blue: "bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900",
    pink: "bg-pink-50 dark:bg-pink-900/20 border-pink-100 dark:border-pink-900",
    purple: "bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-900",
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${colors[color]}`}>
          {icon}
        </div>
      </div>
      <div className="mt-4 flex items-center gap-1 text-xs font-medium text-gray-400">
        <ArrowUpRight size={14} className="text-green-500" />
        <span className="text-green-500">{sub}</span>
      </div>
    </div>
  );
}
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Tooltip, XAxis, YAxis, Legend, ResponsiveContainer, Cell 
} from "recharts";
import { 
  Users, Calendar, DollarSign, Package, TrendingUp, Plus, Clock, AlertTriangle, Loader2
} from "lucide-react";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pacientes: 0,
    consultasMes: 0,
    faturamento: 0,
    estoqueBaixo: 0
  });
  const [proximosAtendimentos, setProximosAtendimentos] = useState<any[]>([]);
  const [estoqueCritico, setEstoqueCritico] = useState<any[]>([]);

  // Cores para o gráfico de pizza
  const COLORS = ['#22c55e', '#ef4444', '#f59e0b', '#3b82f6'];

  // Dados para os gráficos (Mistura de Real + Mock para visualização)
  const chartData = {
    revenue: [
      { month: "Jan", revenue: 12000 },
      { month: "Fev", revenue: 19000 },
      { month: "Mar", revenue: 15000 },
      { month: "Abr", revenue: 22000 },
      { month: "Mai", revenue: 28000 },
      { month: "Jun", revenue: stats.faturamento > 0 ? stats.faturamento : 32000 },
    ],
    patients: [
      { month: "Jan", patients: 10 },
      { month: "Fev", patients: 15 },
      { month: "Mar", patients: 20 },
      { month: "Abr", patients: 25 },
      { month: "Mai", patients: 18 },
      { month: "Jun", patients: 12 },
    ],
    // Gráfico de Pizza: Baseado no estoque crítico real vs normal (simulado)
    stock: [
      { name: "Estoque Normal", value: 50 }, 
      { name: "Estoque Baixo", value: stats.estoqueBaixo > 0 ? stats.estoqueBaixo : 5 },
    ],
  };

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        const hoje = new Date();
        const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString();
        const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString();

        // 1. Contar Pacientes
        const { count: countPacientes } = await supabase
          .from('patients')
          .select('*', { count: 'exact', head: true });

        // 2. Contar Consultas do Mês
        const { count: countConsultas } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .gte('start_time', primeiroDiaMes)
          .lte('start_time', ultimoDiaMes);

        // 3. Somar Faturamento
        const { data: pagamentos } = await supabase
          .from('payments')
          .select('amount')
          .eq('status', 'paid')
          .gte('paid_at', primeiroDiaMes);
        
        const totalFaturamento = pagamentos?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;

        // 4. Estoque Baixo
        const { data: produtosBaixo, count: countEstoque } = await supabase
          .from('inventory')
          .select('*', { count: 'exact' })
          .lt('quantity', 5);

        // 5. Próximos Atendimentos
        const { data: agendamentos } = await supabase
          .from('appointments')
          .select(`
            id, start_time, status,
            patients ( first_name, last_name ),
            treatments ( name )
          `)
          .gte('start_time', new Date().toISOString())
          .order('start_time', { ascending: true })
          .limit(5);

        setStats({
          pacientes: countPacientes || 0,
          consultasMes: countConsultas || 0,
          faturamento: totalFaturamento,
          estoqueBaixo: countEstoque || 0
        });

        if (agendamentos) setProximosAtendimentos(agendamentos);
        if (produtosBaixo) setEstoqueCritico(produtosBaixo);

      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 pb-20 max-w-7xl mx-auto">
      
      {/* 1. CABEÇALHO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Visão Geral</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Dados em tempo real.</p>
        </div>
        
        <div className="flex gap-3">
          <Link to="/appointments/new" className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 font-medium transition">
            <Clock size={18} className="mr-2" /> Nova Consulta
          </Link>
          <Link to="/patients/new" className="flex items-center px-4 py-2 bg-pink-600 text-white rounded-lg shadow hover:bg-pink-700 font-medium transition">
            <Plus size={18} className="mr-2" /> Novo Paciente
          </Link>
        </div>
      </div>

      {/* 2. WIDGETS DE NÚMEROS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center">
          <div className="p-3 rounded-lg bg-blue-500 text-white mr-4"><Users size={24} /></div>
          <div>
            <p className="text-sm text-gray-500">Pacientes</p>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{stats.pacientes}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center">
          <div className="p-3 rounded-lg bg-pink-500 text-white mr-4"><Calendar size={24} /></div>
          <div>
            <p className="text-sm text-gray-500">Consultas Mês</p>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{stats.consultasMes}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center">
          <div className="p-3 rounded-lg bg-green-500 text-white mr-4"><DollarSign size={24} /></div>
          <div>
            <p className="text-sm text-gray-500">Faturamento</p>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
              {stats.faturamento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </h3>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center">
          <div className={`p-3 rounded-lg text-white mr-4 ${stats.estoqueBaixo > 0 ? 'bg-red-500' : 'bg-orange-500'}`}>
            <Package size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Alerta Estoque</p>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{stats.estoqueBaixo}</h3>
          </div>
        </div>
      </div>

      {/* 3. GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Faturamento */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-green-500" /> Faturamento
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.revenue}>
                <XAxis dataKey="month" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v/1000}k`} />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribuição de Estoque (AQUI USAMOS O PIECHART, PIE, CELL E LEGEND) */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
             <Package size={20} className="text-orange-500" /> Status do Estoque
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={chartData.stock} 
                  cx="50%" cy="50%" 
                  innerRadius={60} outerRadius={80} 
                  paddingAngle={5} 
                  dataKey="value"
                >
                  {chartData.stock.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. LISTAS E ALERTAS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Lista de Atendimentos */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">Próximos Atendimentos</h2>
            <Link to="/appointments" className="text-sm text-pink-600 hover:underline">Ver agenda</Link>
          </div>
          
          <div className="space-y-3">
            {proximosAtendimentos.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Nenhum agendamento futuro.</p>
            ) : (
              proximosAtendimentos.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center font-bold text-sm uppercase">
                      {item.patients?.first_name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white">
                        {item.patients?.first_name} {item.patients?.last_name}
                      </p>
                      <p className="text-xs text-gray-500">{item.treatments?.name || 'Consulta'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                      <span className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                        {format(new Date(item.start_time), "dd/MM HH:mm", { locale: ptBR })}
                      </span>
                      <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full capitalize">
                        {item.status}
                      </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Alertas */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-1">
            <AlertTriangle size={14} className="text-yellow-500" /> Alertas
          </h3>
          <div className="space-y-3">
             {estoqueCritico.length > 0 ? (
               estoqueCritico.map(prod => (
                 <div key={prod.id} className="p-3 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 text-xs rounded-lg border border-red-100 dark:border-red-800">
                    <b>Repor:</b> {prod.name} (Qtd: {prod.quantity}).
                 </div>
               ))
             ) : (
               <div className="p-3 bg-green-50 text-green-800 text-xs rounded-lg border border-green-100">
                  Estoque OK.
               </div>
             )}
          </div>
        </div>

      </div>
    </div>
  );
}
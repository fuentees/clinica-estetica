import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { format, isToday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Calendar, Users, DollarSign, Package, AlertTriangle, 
  TrendingUp, Clock, ArrowRight, Gift 
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from 'react-hot-toast';

// Componente de Card KPI
const KpiCard = ({ title, value, icon: Icon, color, subtext }: any) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{value}</h3>
      {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
    </div>
    <div className={`p-3 rounded-full ${color}`}>
      <Icon size={24} className="text-white" />
    </div>
  </div>
);

export default function DashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({
    appointmentsToday: 0,
    activePatients: 0,
    monthlyRevenue: 0,
    lowStockItems: 0
  });

  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
  const [birthdays, setBirthdays] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      setLoading(true);
      const todayStr = new Date().toISOString().split('T')[0];
      const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

      // 1. Consultas do Dia
      const { data: appts } = await supabase
        .from('appointments')
        .select('*, patients(profiles(first_name, last_name)), treatments(name)')
        .gte('start_time', `${todayStr}T00:00:00`)
        .lte('start_time', `${todayStr}T23:59:59`)
        .order('start_time');
      
      setTodayAppointments(appts || []);

      // 2. Total de Pacientes
      const { count: patientsCount } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true });

      // 3. Faturamento do Mês (Soma simples de pagamentos 'paid')
      const { data: payments } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'paid')
        .gte('paid_at', firstDayOfMonth);
      
      const revenue = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      // 4. Estoque Baixo
      const { count: stockCount } = await supabase
        .from('inventory')
        .select('*', { count: 'exact', head: true })
        .lte('quantity', 5); // Exemplo: alerta se menos de 5

      // 5. Aniversariantes (Busca simples, idealmente seria filter por mês no banco)
      // Como SQL de data é chato, vamos pegar todos e filtrar no JS por enquanto (para MVP)
      const { data: allPatients } = await supabase
        .from('patients')
        .select('date_of_birth, profiles(first_name, last_name, phone)');
      
      const currentMonth = new Date().getMonth();
      const bdayList = (allPatients || []).filter(p => {
          if (!p.date_of_birth) return false;
          return new Date(p.date_of_birth).getMonth() === currentMonth;
      }).slice(0, 5); // Pega só 5
      
      setBirthdays(bdayList);

      setStats({
        appointmentsToday: appts?.length || 0,
        activePatients: patientsCount || 0,
        monthlyRevenue: revenue,
        lowStockItems: stockCount || 0
      });

    } catch (error) {
      console.error(error);
      // toast.error("Erro ao atualizar dashboard.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto pb-20">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Bom dia, Doutor(a)!</h1>
          <p className="text-gray-500 dark:text-gray-400">Aqui está o resumo da sua clínica hoje.</p>
        </div>
        <div className="flex gap-3">
            <Button onClick={() => navigate('/appointments/new')} className="bg-pink-600 hover:bg-pink-700 text-white shadow-md">
                <Calendar size={18} className="mr-2" /> Agendar
            </Button>
            <Button onClick={() => navigate('/patients/new')} variant="outline" className="border-gray-300 dark:border-gray-600">
                <Users size={18} className="mr-2" /> Novo Paciente
            </Button>
        </div>
      </div>

      {/* --- KPIS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KpiCard 
            title="Agendamentos Hoje" 
            value={stats.appointmentsToday} 
            icon={Calendar} 
            color="bg-blue-500" 
            subtext="Consultas confirmadas"
        />
        <KpiCard 
            title="Faturamento Mês" 
            value={stats.monthlyRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} 
            icon={DollarSign} 
            color="bg-green-500" 
            subtext="Recebimentos efetivados"
        />
        <KpiCard 
            title="Base de Pacientes" 
            value={stats.activePatients} 
            icon={Users} 
            color="bg-purple-500" 
            subtext="Cadastros totais"
        />
        <KpiCard 
            title="Alertas de Estoque" 
            value={stats.lowStockItems} 
            icon={Package} 
            color={stats.lowStockItems > 0 ? "bg-red-500" : "bg-gray-400"} 
            subtext={stats.lowStockItems > 0 ? "Itens acabando!" : "Estoque saudável"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- COLUNA 1: AGENDA DO DIA (66%) --- */}
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Clock className="text-blue-600" size={20} /> Próximos Atendimentos
                    </h2>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/appointments')}>Ver Agenda Completa</Button>
                </div>

                {todayAppointments.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-dashed border-gray-200">
                        Nenhum agendamento para hoje.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {todayAppointments.map((appt) => (
                            <div key={appt.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border-l-4 border-blue-500 hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className="text-center min-w-[60px]">
                                        <span className="block text-lg font-bold text-gray-800 dark:text-white">
                                            {format(parseISO(appt.start_time), 'HH:mm')}
                                        </span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-800 dark:text-white">
                                            {appt.patients?.profiles?.first_name} {appt.patients?.profiles?.last_name}
                                        </h4>
                                        <p className="text-sm text-gray-500">{appt.treatments?.name || 'Consulta'}</p>
                                    </div>
                                </div>
                                <Button 
                                    size="sm" 
                                    onClick={() => navigate(`/patients/${appt.patient_id}/sessions/new`)}
                                    className="bg-green-600 hover:bg-green-700 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    Iniciar
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>

        {/* --- COLUNA 2: NOTIFICAÇÕES E MARKETING (33%) --- */}
        <div className="lg:col-span-1 space-y-6">
            
            {/* Aniversariantes */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <Gift className="text-pink-500" size={20} /> Aniversariantes do Mês
                </h2>
                {birthdays.length === 0 ? (
                    <p className="text-sm text-gray-400">Nenhum aniversariante este mês.</p>
                ) : (
                    <div className="space-y-3">
                        {birthdays.map((b, i) => (
                            <div key={i} className="flex justify-between items-center text-sm p-2 hover:bg-gray-50 dark:hover:bg-gray-900 rounded">
                                <span className="text-gray-700 dark:text-gray-300">{b.profiles?.first_name} {b.profiles?.last_name}</span>
                                <span className="text-gray-400 text-xs">
                                    {format(new Date(b.date_of_birth), 'dd/MM')}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Acesso Rápido Financeiro */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-lg p-6 text-white">
                <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                    <TrendingUp className="text-green-400" /> Performance
                </h3>
                <p className="text-sm text-gray-400 mb-4">Acesse os relatórios detalhados de lucro e despesas.</p>
                <Button onClick={() => navigate('/payments/cash-flow')} variant="secondary" className="w-full justify-between">
                    Ver Fluxo de Caixa <ArrowRight size={16} />
                </Button>
            </div>

        </div>

      </div>
    </div>
  );
}
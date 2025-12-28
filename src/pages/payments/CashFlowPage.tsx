import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  DollarSign, TrendingUp, TrendingDown, Calendar, 
  Loader2, ArrowUpRight, ArrowDownRight 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid 
} from 'recharts';
import { toast } from 'react-hot-toast';

const StatCard = ({ title, value, type }: { title: string, value: number, type: 'profit' | 'income' | 'expense' }) => {
  const color = type === 'profit' ? 'text-green-600' : type === 'expense' ? 'text-red-600' : 'text-blue-600';
  const bg = type === 'profit' ? 'bg-green-50' : type === 'expense' ? 'bg-red-50' : 'bg-blue-50';
  const Icon = type === 'profit' ? TrendingUp : type === 'expense' ? TrendingDown : DollarSign;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{title}</p>
        <h3 className={`text-2xl font-bold ${color}`}>
          {value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </h3>
      </div>
      <div className={`p-3 rounded-full ${bg}`}>
        <Icon className={color} size={24} />
      </div>
    </div>
  );
};

export function CashFlowPage() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState({ income: 0, expense: 0, profit: 0 });
  const [chartData, setChartData] = useState<any[]>([]);
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  useEffect(() => {
    fetchFinancialData();
  }, [startDate, endDate]);

  async function fetchFinancialData() {
    try {
      setLoading(true);
      
      const { data: incomeData, error: incomeError } = await supabase
        .from('payments')
        .select('amount, paid_at, payment_method')
        .eq('status', 'paid')
        .gte('paid_at', `${startDate}T00:00:00`)
        .lte('paid_at', `${endDate}T23:59:59`)
        .order('paid_at', { ascending: false });

      if (incomeError) throw incomeError;

      const { data: expenseData, error: expenseError } = await supabase
        .from('expenses')
        .select('amount, paid_at, category, description')
        .gte('paid_at', `${startDate}T00:00:00`)
        .lte('paid_at', `${endDate}T23:59:59`)
        .order('paid_at', { ascending: false });

      // Ignora erro se a tabela não existir
      if (expenseError && expenseError.code !== '42P01') {
          console.warn("Erro despesas:", expenseError);
      }

      const incomes = incomeData || [];
      const expenses = expenseData || [];

      const totalIncome = incomes.reduce((acc, cur) => acc + Number(cur.amount), 0);
      const totalExpense = expenses.reduce((acc, cur) => acc + Number(cur.amount), 0);
      
      setStats({
        income: totalIncome,
        expense: totalExpense,
        profit: totalIncome - totalExpense
      });

      setChartData([
        { name: 'Receitas', valor: totalIncome, fill: '#22c55e' },
        { name: 'Despesas', valor: totalExpense, fill: '#ef4444' },
        { name: 'Lucro', valor: totalIncome - totalExpense, fill: '#3b82f6' }
      ]);

      const combined = [
        ...incomes.map(i => ({ ...i, type: 'income', description: `Recebimento (${i.payment_method})` })),
        ...expenses.map(e => ({ ...e, type: 'expense', description: e.description || e.category }))
      ].sort((a, b) => new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime());

      setTransactions(combined);

    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar financeiro.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-pink-600" /></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto pb-20">
      
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Fluxo de Caixa</h1>
          <p className="text-sm text-gray-500">Visão financeira consolidada.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <Calendar size={18} className="text-gray-500 ml-2" />
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent border-none text-sm focus:ring-0 text-gray-700 dark:text-white outline-none" />
            <span className="text-gray-400">-</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent border-none text-sm focus:ring-0 text-gray-700 dark:text-white outline-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Receitas" value={stats.income} type="income" />
        <StatCard title="Despesas" value={stats.expense} type="expense" />
        <StatCard title="Resultado" value={stats.profit} type="profit" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
             <h3 className="font-bold text-gray-800 dark:text-white mb-6">Balanço</h3>
             <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                        <XAxis type="number" tickFormatter={(val) => `R$${val/1000}k`} />
                        <YAxis dataKey="name" type="category" width={80} />
                        <Tooltip cursor={{fill: 'transparent'}} formatter={(value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                        <Bar dataKey="valor" radius={[0, 4, 4, 0]} barSize={40} />
                    </BarChart>
                </ResponsiveContainer>
             </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
             <h3 className="font-bold text-gray-800 dark:text-white mb-4">Extrato Recente</h3>
             <div className="overflow-y-auto max-h-72 space-y-3 pr-2">
                {transactions.length === 0 ? (
                    <p className="text-center text-gray-400 text-sm py-8">Sem movimentações.</p>
                ) : (
                    transactions.map((t, i) => (
                        <div key={i} className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-transparent hover:border-gray-100 transition-all">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${t.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                    {t.type === 'income' ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-800 dark:text-white">{t.description}</p>
                                    <p className="text-xs text-gray-500">{format(new Date(t.paid_at), "dd/MM HH:mm", { locale: ptBR })}</p>
                                </div>
                            </div>
                            <span className={`font-bold text-sm ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                {t.type === 'income' ? '+' : '-'} {Number(t.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                        </div>
                    ))
                )}
             </div>
          </div>
      </div>
    </div>
  );
}
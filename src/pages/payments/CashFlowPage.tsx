import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  DollarSign, TrendingUp, TrendingDown, Calendar, 
  Loader2, ArrowUpRight, ArrowDownRight, Filter, Receipt, Wallet
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell
} from 'recharts';
import { toast } from 'react-hot-toast';

// --- COMPONENTE DE CARTÃO DE MÉTRICAS ---
const StatCard = ({ title, value, type }: { title: string, value: number, type: 'profit' | 'income' | 'expense' }) => {
  const isProfit = type === 'profit';
  const isNegative = isProfit && value < 0;
  
  const color = type === 'expense' || isNegative ? 'text-rose-600' : type === 'profit' ? 'text-emerald-600' : 'text-blue-600';
  const bg = type === 'expense' || isNegative ? 'bg-rose-50 dark:bg-rose-900/10' : type === 'profit' ? 'bg-emerald-50 dark:bg-emerald-900/10' : 'bg-blue-50 dark:bg-blue-900/10';
  const Icon = type === 'profit' ? (isNegative ? TrendingDown : TrendingUp) : type === 'expense' ? TrendingDown : DollarSign;

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between transition-all hover:shadow-xl group">
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{title}</p>
        <h3 className={`text-3xl font-black italic tracking-tighter ${color}`}>
          {value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </h3>
      </div>
      <div className={`p-4 rounded-2xl ${bg} group-hover:scale-110 transition-transform`}>
        <Icon size={28} />
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
      
      // 1. Buscar Receitas (Payments)
      const { data: incomeData, error: incomeError } = await supabase
        .from('payments')
        .select('amount, paid_at, payment_method')
        .eq('status', 'paid')
        .gte('paid_at', `${startDate}T00:00:00`)
        .lte('paid_at', `${endDate}T23:59:59`);

      if (incomeError) throw incomeError;

      // 2. Buscar Despesas (Expenses)
      const { data: expenseData, error: expenseError } = await supabase
        .from('expenses')
        .select('amount, paid_at, category, description')
        .gte('paid_at', `${startDate}T00:00:00`)
        .lte('paid_at', `${endDate}T23:59:59`);

      if (expenseError && expenseError.code !== '42P01') console.warn("Erro despesas:", expenseError);

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
        { name: 'Receitas', valor: totalIncome },
        { name: 'Despesas', valor: totalExpense },
        { name: 'Resultado', valor: totalIncome - totalExpense }
      ]);

      const combined = [
        ...incomes.map(i => ({ ...i, type: 'income', description: `Recebimento (${i.payment_method})` })),
        ...expenses.map(e => ({ ...e, type: 'expense', description: e.description || e.category }))
      ].sort((a, b) => new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime());

      setTransactions(combined);

    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar fluxo de caixa.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 bg-white dark:bg-gray-950">
      <Loader2 className="animate-spin text-pink-600" size={40}/>
      <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em]">Consolidando Caixa...</p>
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto p-6 space-y-8 animate-in fade-in duration-700 pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-6 bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700">
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter italic uppercase flex items-center gap-3">
            <Wallet className="text-pink-600" size={32} /> Fluxo de <span className="text-pink-600">Caixa</span>
          </h1>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">Controle de entradas, saídas e rentabilidade</p>
        </div>
        
        <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900 p-3 rounded-2xl border border-gray-100 dark:border-gray-800">
            <Calendar size={18} className="text-pink-500 ml-2" />
            <div className="flex items-center gap-2">
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent border-0 text-xs font-black uppercase outline-none text-gray-700 dark:text-white focus:ring-0" />
                <span className="text-gray-300">/</span>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent border-0 text-xs font-black uppercase outline-none text-gray-700 dark:text-white focus:ring-0" />
            </div>
        </div>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Entradas" value={stats.income} type="income" />
        <StatCard title="Total Saídas" value={stats.expense} type="expense" />
        <StatCard title="Lucro Operacional" value={stats.profit} type="profit" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          {/* COMPARATIVO VISUAL (3/5) */}
          <div className="lg:col-span-3 bg-white dark:bg-gray-800 p-10 rounded-[3rem] shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-8 opacity-5"><TrendingUp size={120}/></div>
             <h3 className="text-xl font-black text-gray-900 dark:text-white mb-10 italic tracking-tighter uppercase flex items-center gap-3">
                <Filter size={20} className="text-pink-500" /> Balanço do Período
             </h3>
             <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                        <Tooltip 
                            cursor={{fill: 'transparent'}} 
                            contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'}}
                            formatter={(value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} 
                        />
                        <Bar dataKey="valor" radius={[0, 20, 20, 0]} barSize={50}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : index === 1 ? '#f43f5e' : '#10b981'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* EXTRATO (2/5) */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-10 rounded-[3rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden relative">
             <h3 className="text-xl font-black text-gray-900 dark:text-white mb-8 italic tracking-tighter uppercase flex items-center gap-3">
                <Receipt size={20} className="text-pink-500" /> Movimentação Recente
             </h3>
             <div className="overflow-y-auto max-h-[400px] space-y-4 pr-4 custom-scrollbar">
                {transactions.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-200">
                            <DollarSign size={32}/>
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sem movimentações no período</p>
                    </div>
                ) : (
                    transactions.map((t, i) => (
                        <div key={i} className="flex justify-between items-center p-5 rounded-[1.5rem] bg-gray-50/50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 hover:border-pink-200 transition-all group">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-2xl ${t.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                    {t.type === 'income' ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                                </div>
                                <div>
                                    <p className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-tighter italic">{t.description}</p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">
                                        {format(new Date(t.paid_at), "dd 'de' MMMM", { locale: ptBR })}
                                    </p>
                                </div>
                            </div>
                            <span className={`font-black text-lg italic tracking-tighter ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
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
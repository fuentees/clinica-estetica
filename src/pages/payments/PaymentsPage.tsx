import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { 
  TrendingUp, TrendingDown, DollarSign, Calendar, 
  Loader2, Wallet, Plus, Filter, Search, ArrowRight, ArrowLeft,
  AlertCircle, CheckCircle2, PieChart
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { toast } from "react-hot-toast";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  AreaChart, Area 
} from 'recharts';

// --- COMPONENTE DE GRÁFICOS ---
const FinancialCharts = ({ transactions }: { transactions: any[] }) => {
  // 1. Agrupar dados por dia
  const dataMap = transactions.reduce((acc: any, curr) => {
    const date = new Date(curr.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    if (!acc[date]) acc[date] = { name: date, income: 0, expense: 0 };
    
    if (curr.type === 'income' && (curr.status === 'paid' || curr.paid_at)) {
      acc[date].income += Number(curr.amount);
    } else if (curr.type === 'expense' && (curr.status === 'paid' || curr.paid_at)) {
      acc[date].expense += Number(curr.amount);
    }
    return acc;
  }, {});

  const chartData = Object.values(dataMap).reverse(); 

  if (chartData.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* GRÁFICO DE BARRAS */}
      <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Fluxo de Caixa (Diário)</h3>
            <div className="flex gap-2">
                <span className="flex items-center gap-1 text-[10px] text-gray-400 font-medium"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Entradas</span>
                <span className="flex items-center gap-1 text-[10px] text-gray-400 font-medium"><div className="w-2 h-2 rounded-full bg-rose-500"></div> Saídas</span>
            </div>
        </div>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.5} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9CA3AF'}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9CA3AF'}} tickFormatter={(value) => `k${value/1000}`} />
              <RechartsTooltip 
                cursor={{fill: '#F3F4F6', opacity: 0.4}}
                contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold'}}
              />
              <Bar dataKey="income" name="Entradas" fill="#10B981" radius={[4, 4, 0, 0]} barSize={12} />
              <Bar dataKey="expense" name="Saídas" fill="#F43F5E" radius={[4, 4, 0, 0]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* GRÁFICO DE ÁREA */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between">
        <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Tendência de Receita</h3>
            <p className="text-xs text-gray-400">Acumulado do período</p>
        </div>
        
        <div className="h-[180px] w-full mt-4">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                    <defs>
                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis hide />
                    <RechartsTooltip contentStyle={{borderRadius: '12px', border: 'none'}} />
                    <Area type="monotone" dataKey="income" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                </AreaChart>
             </ResponsiveContainer>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-700">
            <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-gray-500 uppercase tracking-wide">Melhor Dia:</span>
                <span className="font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                    {chartData.length > 0 ? Math.max(...chartData.map((d:any) => d.income)).toLocaleString('pt-BR', {style:'currency', currency:'BRL'}) : 'R$ 0'}
                </span>
            </div>
        </div>
      </div>
    </div>
  );
};

// --- CARD DE MÉTRICAS ---
const StatCard = ({ title, value, icon: Icon, colorClass, bgClass }: any) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-5 transition-all hover:shadow-md group">
    <div className={`p-4 rounded-2xl ${bgClass} ${colorClass} group-hover:scale-110 transition-transform duration-300`}>
      <Icon size={28} />
    </div>
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{title}</p>
      <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{value}</h3>
    </div>
  </div>
);

// --- TIPAGEM ---
interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  status: 'paid' | 'pending' | 'canceled';
  created_at: string;
  paid_at?: string | null;
  payment_method: string;
  patient_id?: string;
  professional_id?: string;
  patient_name?: string;      
  professional_name?: string; 
}

// --- PÁGINA PRINCIPAL (RENOMEADA PARA PaymentsPage) ---
export function PaymentsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [metrics, setMetrics] = useState({ income: 0, expense: 0, total: 0, pending: 0 });
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [searchTerm, setSearchTerm] = useState("");
  const ITEMS_PER_PAGE = 8;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchFinancials();
  }, [selectedMonth]); 

  async function fetchFinancials() {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from('profiles').select('clinic_id').eq('id', user.id).single();
      if (!profile?.clinic_id) throw new Error("Clínica não identificada.");

      const [year, month] = selectedMonth.split('-');
      const startDate = `${year}-${month}-01`;
      const endDate = new Date(Number(year), Number(month), 0).toISOString().split('T')[0];

      // Busca Transações (Tabela transactions)
      const { data: transData, error: transError } = await supabase
        .from('transactions') 
        .select('*') 
        .eq('clinic_id', profile.clinic_id)
        .gte('created_at', `${startDate}T00:00:00`)
        .lte('created_at', `${endDate}T23:59:59`)
        .order('created_at', { ascending: false });

      if (transError) throw transError;

      // Busca Nomes (Manual Join)
      const patientIds = [...new Set(transData?.map(t => t.patient_id).filter(Boolean))];
      const professionalIds = [...new Set(transData?.map(t => t.professional_id).filter(Boolean))];

      let patientsMap: Record<string, string> = {};
      let professionalsMap: Record<string, string> = {};

      if (patientIds.length > 0) {
          const { data: pData } = await supabase.from('patients').select('id, name').in('id', patientIds);
          pData?.forEach(p => { patientsMap[p.id] = p.name });
      }
      if (professionalIds.length > 0) {
          const { data: profData } = await supabase.from('profiles').select('id, first_name, last_name').in('id', professionalIds);
          profData?.forEach(p => { professionalsMap[p.id] = `${p.first_name || ''} ${p.last_name || ''}`.trim() });
      }

      const formattedData: Transaction[] = (transData || []).map((t: any) => ({
          ...t,
          amount: Number(t.amount) || 0,
          payment_method: t.payment_method || 'Outros',
          patient_name: patientsMap[t.patient_id],
          professional_name: professionalsMap[t.professional_id]
      }));

      setTransactions(formattedData);
      calculateMetrics(formattedData);

    } catch (error: any) {
      console.error("Erro financeiro:", error);
      toast.error("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }

  const calculateMetrics = (data: Transaction[]) => {
    const inc = data.filter(t => t.type === 'income' && (t.status === 'paid' || t.paid_at)).reduce((acc, curr) => acc + curr.amount, 0);
    const exp = data.filter(t => t.type === 'expense' && (t.status === 'paid' || t.paid_at)).reduce((acc, curr) => acc + curr.amount, 0);
    const pend = data.filter(t => t.status !== 'paid' && !t.paid_at && t.status !== 'canceled').reduce((acc, curr) => acc + curr.amount, 0);
    setMetrics({ income: inc, expense: exp, total: inc - exp, pending: pend });
  };

  const formatMoney = (val: number) => {
      return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // --- FILTROS E PAGINAÇÃO ---
  const filteredList = transactions.filter(t => {
    const matchesType = filterType === 'all' ? true : t.type === filterType;
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
        (t.description?.toLowerCase() || '').includes(searchLower) ||
        (t.patient_name?.toLowerCase() || '').includes(searchLower) ||
        (t.professional_name?.toLowerCase() || '').includes(searchLower);
    
    return matchesType && matchesSearch;
  });

  const totalPages = Math.ceil(filteredList.length / ITEMS_PER_PAGE);
  const paginatedData = filteredList.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
      if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage);
  };

  if (loading) return <div className="h-screen flex items-center justify-center gap-3"><Loader2 className="animate-spin text-emerald-600" size={40}/><span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Carregando Finanças...</span></div>;

  return (
    <div className="p-6 md:p-10 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700 pb-24">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic flex items-center gap-3">
                <Wallet className="text-emerald-500" size={36}/> Gestão Financeira
            </h1>
            <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-2 ml-1">Fluxo de caixa consolidado e métricas</p>
        </div>
        
        <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm h-12">
                <div className="p-2 bg-gray-100 dark:bg-gray-900 rounded-xl text-gray-500"><Calendar size={18} /></div>
                <input 
                    type="month" 
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="bg-transparent border-none focus:ring-0 text-sm font-bold text-gray-700 dark:text-gray-200 outline-none uppercase cursor-pointer"
                />
            </div>

            <Button 
                onClick={() => navigate('/patients')} 
                className="h-12 bg-gray-900 hover:bg-black text-white font-bold uppercase text-[10px] tracking-widest rounded-2xl shadow-xl flex items-center gap-2 px-6 transition-all hover:scale-105"
            >
                <Plus size={16} /> Nova Venda
            </Button>
        </div>
      </div>

      {/* METRICAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 animate-in slide-in-from-bottom-4 duration-500">
          <StatCard title="Receitas (Pagas)" value={formatMoney(metrics.income)} icon={TrendingUp} colorClass="text-emerald-600" bgClass="bg-emerald-50" />
          <StatCard title="Despesas (Pagas)" value={formatMoney(metrics.expense)} icon={TrendingDown} colorClass="text-rose-600" bgClass="bg-rose-50" />
          <StatCard title="Saldo Líquido" value={formatMoney(metrics.total)} icon={DollarSign} colorClass="text-blue-600" bgClass="bg-blue-50" />
          <StatCard title="A Receber / Pagar" value={formatMoney(metrics.pending)} icon={PieChart} colorClass="text-amber-600" bgClass="bg-amber-50" />
      </div>

      {/* GRÁFICOS */}
      <FinancialCharts transactions={transactions} />

      {/* ÁREA DA LISTAGEM */}
      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 duration-700">
          
          {/* BARRA DE FILTROS E PESQUISA */}
          <div className="px-8 py-6 border-b border-gray-50 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-900/30 flex flex-col md:flex-row justify-between items-center gap-6">
             
             {/* BOTÕES DE FILTRO */}
             <div className="flex gap-2 p-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <button onClick={() => setFilterType('all')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterType === 'all' ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}>Todos</button>
                <button onClick={() => setFilterType('income')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterType === 'income' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'text-gray-400 hover:bg-gray-50'}`}>Entradas</button>
                <button onClick={() => setFilterType('expense')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterType === 'expense' ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : 'text-gray-400 hover:bg-gray-50'}`}>Saídas</button>
             </div>

             {/* CAMPO DE PESQUISA */}
             <div className="relative w-full md:w-80 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-emerald-500 transition-colors" size={18} />
                <input 
                    type="text" 
                    placeholder="Buscar transação..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
             </div>
          </div>

          {/* CABEÇALHO DA TABELA */}
          <div className="px-8 py-4 bg-gray-50/50 dark:bg-gray-900/50 grid grid-cols-12 gap-4 border-b border-gray-50 dark:border-gray-700">
              <div className="col-span-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Descrição / Origem</div>
              <div className="col-span-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Data</div>
              <div className="col-span-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Categoria</div>
              <div className="col-span-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</div>
              <div className="col-span-2 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Valor</div>
          </div>

          {/* LISTA DE ITENS */}
          <div className="divide-y divide-gray-50 dark:divide-gray-700 min-h-[400px]">
              {paginatedData.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-300 py-20">
                      <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-full mb-3"><Search size={32}/></div>
                      <p className="font-bold text-xs uppercase tracking-widest">Nenhuma transação encontrada</p>
                  </div>
              ) : (
                  paginatedData.map(item => (
                      <div key={item.id} className="grid grid-cols-12 gap-4 px-8 py-5 items-center hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
                          <div className="col-span-4">
                              <p className="font-bold text-gray-900 dark:text-white truncate">{item.description}</p>
                              <div className="flex flex-col gap-0.5 mt-1">
                                {item.patient_name && <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide flex items-center gap-1"><ArrowRight size={8} className="text-emerald-400"/> {item.patient_name}</span>}
                                {item.professional_name && <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wide flex items-center gap-1"><ArrowRight size={8}/> {item.professional_name}</span>}
                              </div>
                          </div>
                          
                          <div className="col-span-2 flex items-center gap-2 text-xs font-medium text-gray-500">
                              <Calendar size={14} className="text-gray-300"/> 
                              {new Date(item.created_at).toLocaleDateString('pt-BR')}
                          </div>

                          <div className="col-span-2">
                              <span className="text-[10px] font-bold text-gray-500 bg-gray-100 dark:bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-800 uppercase tracking-wide">
                                  {item.category || 'Geral'}
                              </span>
                          </div>

                          <div className="col-span-2">
                              <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-lg border flex w-fit items-center gap-1.5 ${
                                  item.status === 'paid' || item.paid_at ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                  item.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                                  'bg-rose-50 text-rose-600 border-rose-100'
                              }`}>
                                  {item.status === 'paid' || item.paid_at ? <><CheckCircle2 size={12}/> Pago</> : item.status === 'pending' ? <><AlertCircle size={12}/> Pendente</> : 'Cancelado'}
                              </span>
                          </div>

                          <div className="col-span-2 text-right">
                              <span className={`font-black text-lg tracking-tighter ${item.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                  {item.type === 'income' ? '+' : '-'} {formatMoney(item.amount)}
                              </span>
                          </div>
                      </div>
                  ))
              )}
          </div>

          {/* RODAPÉ PAGINAÇÃO */}
          {totalPages > 1 && (
            <div className="px-8 py-4 bg-gray-50/50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Página {currentPage} de {totalPages}
                </span>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="h-9 w-9 p-0 rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-100 border-gray-200"><ArrowLeft size={16}/></Button>
                    <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="h-9 w-9 p-0 rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-100 border-gray-200"><ArrowRight size={16}/></Button>
                </div>
            </div>
          )}
      </div>
    </div>
  );
}
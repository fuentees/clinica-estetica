import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { 
  TrendingUp, TrendingDown, DollarSign, Calendar, 
  Loader2, Wallet, Plus, Search, ArrowRight, ArrowLeft,
  CheckCircle2, PieChart, MinusCircle, ListOrdered, Download,
  ArrowUpRight, ArrowDownRight, Award, Scissors, User
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { toast } from "react-hot-toast";
import { 
  Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart as RePieChart, Pie, Cell, Legend
} from 'recharts';
import { NewTransactionModal } from "../../components/modal/NewTransactionModal";

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

interface RankingItem {
  name: string;
  total: number;
  count?: number;
}

const COLORS = ['#10B981', '#F43F5E', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899'];

export function PaymentsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [prevMonthMetrics, setPrevMonthMetrics] = useState({ income: 0, expense: 0 });
  const [metrics, setMetrics] = useState({ income: 0, expense: 0, total: 0, pending: 0 });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [searchTerm, setSearchTerm] = useState("");
  
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage, filterType, searchTerm, selectedMonth]);

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

      const prevDate = new Date(Number(year), Number(month) - 1, 0);
      const prevMonthStr = prevDate.toISOString().slice(0, 7);
      const [pYear, pMonth] = prevMonthStr.split('-');
      const prevStartDate = `${pYear}-${pMonth}-01`;
      const prevEndDate = new Date(Number(pYear), Number(pMonth), 0).toISOString().split('T')[0];

      const { data: transData } = await supabase
        .from('transactions') 
        .select('*') 
        .eq('clinic_id', profile.clinic_id)
        .gte('created_at', `${startDate}T00:00:00`)
        .lte('created_at', `${endDate}T23:59:59`)
        .order('created_at', { ascending: false });

      const { data: prevTransData } = await supabase
        .from('transactions')
        .select('amount, type, status, paid_at')
        .eq('clinic_id', profile.clinic_id)
        .gte('created_at', `${prevStartDate}T00:00:00`)
        .lte('created_at', `${prevEndDate}T23:59:59`);

      const patientIds = [...new Set((transData || [])?.map(t => t.patient_id).filter(Boolean))];
      const professionalIds = [...new Set((transData || [])?.map(t => t.professional_id).filter(Boolean))];
      
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
          patient_name: patientsMap[t.patient_id],
          professional_name: professionalsMap[t.professional_id]
      }));

      setTransactions(formattedData);
      calculateMetrics(formattedData);
      
      const pInc = (prevTransData || []).filter(t => t.type === 'income' && (t.status === 'paid' || t.paid_at)).reduce((acc, curr) => acc + Number(curr.amount), 0);
      const pExp = (prevTransData || []).filter(t => t.type === 'expense' && (t.status === 'paid' || t.paid_at)).reduce((acc, curr) => acc + Number(curr.amount), 0);
      setPrevMonthMetrics({ income: pInc, expense: pExp });

    } catch (error: any) {
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

  // --- LOGICA DE RANKING COM TIPAGEM CORRETA ---
  const rankingServicesMap = transactions.filter(t => t.type === 'income').reduce((acc: Record<string, RankingItem>, curr) => {
      const name = curr.description.split('-')[0].trim();
      if (!acc[name]) acc[name] = { name, total: 0, count: 0 };
      acc[name].total += curr.amount;
      acc[name].count = (acc[name].count || 0) + 1;
      return acc;
  }, {});
  const topServices = Object.values(rankingServicesMap).sort((a, b) => b.total - a.total).slice(0, 5);

  const rankingProfessionalsMap = transactions.filter(t => t.type === 'income' && t.professional_name).reduce((acc: Record<string, RankingItem>, curr) => {
      const name = curr.professional_name!;
      if (!acc[name]) acc[name] = { name, total: 0 };
      acc[name].total += curr.amount;
      return acc;
  }, {});
  const topProfessionals = Object.values(rankingProfessionalsMap).sort((a, b) => b.total - a.total).slice(0, 5);

  const exportToCSV = () => {
    const headers = ["Data,Descricao,Tipo,Categoria,Valor,Status\n"];
    const rows = transactions.map(t => `${new Date(t.created_at).toLocaleDateString()},${t.description.replace(/,/g, ' ')},${t.type},${t.category},${t.amount},${t.status}`);
    const blob = new Blob([headers + rows.join("\n")], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `financeiro_${selectedMonth}.csv`);
    link.click();
    toast.success("CSV gerado!");
  };

  const categoryData = transactions.filter(t => t.type === 'expense').reduce((acc: {name: string, value: number}[], curr) => {
      const existing = acc.find((item) => item.name === curr.category);
      if (existing) existing.value += curr.amount; else acc.push({ name: curr.category || 'Geral', value: curr.amount });
      return acc;
  }, []);

  const getDiff = (current: number, prev: number) => prev === 0 ? 0 : ((current - prev) / prev) * 100;
  const formatMoney = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const filteredList = transactions.filter(t => {
    const matchesType = filterType === 'all' ? true : t.type === filterType;
    const searchLower = searchTerm.toLowerCase();
    return matchesType && (
      (t.description?.toLowerCase() || '').includes(searchLower) || 
      (t.patient_name?.toLowerCase() || '').includes(searchLower)
    );
  });

  const paginatedData = filteredList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-emerald-600" size={40}/></div>;

  return (
    <div className="p-6 md:p-10 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700 pb-24 font-sans text-gray-900 dark:text-white">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic flex items-center gap-3">
                <Wallet className="text-emerald-500" size={36}/> Financeiro Pro
            </h1>
            <div className="flex items-center gap-4 mt-2">
                <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Painel de Controle Oficial</p>
                <button onClick={exportToCSV} className="flex items-center gap-1.5 text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full hover:bg-blue-100 transition-all uppercase"><Download size={12}/> Exportar</button>
            </div>
        </div>
        
        <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm h-12">
                <div className="p-2 bg-gray-100 dark:bg-gray-900 rounded-xl text-gray-500"><Calendar size={18} /></div>
                <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-transparent border-none focus:ring-0 text-sm font-bold outline-none uppercase" />
            </div>
            <Button onClick={() => setIsModalOpen(true)} variant="outline" className="h-12 border-rose-200 text-rose-600 font-bold uppercase text-[10px] tracking-widest rounded-2xl shadow-sm px-6"><MinusCircle size={16} /> Nova Despesa</Button>
            <Button onClick={() => navigate('/patients')} className="h-12 bg-gray-900 hover:bg-black text-white font-bold uppercase text-[10px] tracking-widest rounded-2xl shadow-xl px-6 transition-all hover:scale-105"><Plus size={16} /> Nova Venda</Button>
        </div>
      </div>

      {/* MÉTRICAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <CardMetric title="Faturamento" value={metrics.income} icon={TrendingUp} color="text-emerald-600" bg="bg-emerald-50" diff={getDiff(metrics.income, prevMonthMetrics.income)} />
          <CardMetric title="Custos/Gastos" value={metrics.expense} icon={TrendingDown} color="text-rose-600" bg="bg-rose-50" diff={getDiff(metrics.expense, prevMonthMetrics.expense)} />
          <CardMetric title="Lucro Líquido" value={metrics.total} icon={DollarSign} color="text-blue-600" bg="bg-blue-50" />
          <CardMetric title="A Receber" value={metrics.pending} icon={PieChart} color="text-amber-600" bg="bg-amber-50" />
      </div>

      {/* RANKINGS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-3 mb-6"><div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600"><Scissors size={20}/></div><h3 className="font-black uppercase italic tracking-tight">Serviços Rentáveis</h3></div>
              <div className="space-y-4">
                  {topServices.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl group hover:bg-emerald-50 transition-colors">
                          <div className="flex items-center gap-4"><span className="text-lg font-black text-gray-300 group-hover:text-emerald-500">#0{idx+1}</span><div><p className="font-bold text-sm">{item.name}</p><p className="text-[10px] text-gray-400 font-bold uppercase">{item.count} sessões</p></div></div>
                          <span className="font-black">{formatMoney(item.total)}</span>
                      </div>
                  ))}
              </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-3 mb-6"><div className="p-3 bg-blue-50 rounded-2xl text-blue-600"><Award size={20}/></div><h3 className="font-black uppercase italic tracking-tight">Top Profissionais</h3></div>
              <div className="space-y-4">
                  {topProfessionals.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl group hover:bg-blue-50 transition-colors">
                          <div className="flex items-center gap-4"><div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-black"><User size={18}/></div><div><p className="font-bold text-sm">{item.name}</p><p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Total gerado</p></div></div>
                          <span className="font-black">{formatMoney(item.total)}</span>
                      </div>
                  ))}
              </div>
          </div>
      </div>

      {/* INSIGHTS E DISTRIBUIÇÃO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between">
              <h3 className="text-sm font-black uppercase italic tracking-tight mb-4 flex items-center gap-2"><CheckCircle2 size={18} className="text-emerald-500"/> Insight da Clínica</h3>
              <p className="text-sm text-gray-500 leading-relaxed font-medium">
                  {topServices.length > 0 ? `O serviço ${topServices[0].name} lidera a receita.` : "Inicie os lançamentos para insights."} 
                  {metrics.total > 0 ? " Caixa saudável para novos investimentos." : " Atenção ao saldo negativo este mês."}
              </p>
              <div className="mt-6 p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Foco do Mês</p><p className="text-xs font-bold text-gray-600 mt-1">Diversifique a receita com {topServices[1]?.name || 'novos serviços'}.</p></div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
             <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 text-center">Distribuição de Despesas</h3>
             <div className="h-[200px] w-full"><ResponsiveContainer width="100%" height="100%"><RePieChart><Pie data={categoryData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">{categoryData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Pie><RechartsTooltip /><Legend iconType="circle" wrapperStyle={{fontSize: '9px', fontWeight: 'black', textTransform: 'uppercase'}} /></RePieChart></ResponsiveContainer></div>
          </div>
          <div className="bg-emerald-600 p-8 rounded-[2.5rem] text-white shadow-xl flex flex-col justify-center relative overflow-hidden group">
                <div className="relative z-10"><p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Faturamento Diário Médio</p><h2 className="text-4xl font-black mt-2 tracking-tighter italic">{formatMoney(metrics.income / 30)}</h2><p className="text-xs mt-4 font-bold opacity-90">Calculado sobre 30 dias.</p></div>
                <TrendingUp size={120} className="absolute -right-10 -bottom-10 opacity-10 rotate-12" />
          </div>
      </div>

      {/* LISTAGEM */}
      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
          <div className="px-8 py-6 border-b border-gray-50 dark:border-gray-700 bg-gray-50/30 flex flex-col lg:flex-row justify-between items-center gap-6">
             <div className="flex gap-2 p-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 shadow-sm">
                {['all', 'income', 'expense'].map((t) => (
                  <button key={t} onClick={() => setFilterType(t as any)} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${filterType === t ? 'bg-gray-900 text-white shadow-md' : 'text-gray-400'}`}>
                    {t === 'all' ? 'Todos' : t === 'income' ? 'Entradas' : 'Saídas'}
                  </button>
                ))}
             </div>

             <div className="flex items-center gap-4 w-full lg:w-auto">
                <div className="flex items-center gap-2 bg-white p-2 px-4 rounded-xl border border-gray-200">
                  <ListOrdered size={14} className="text-gray-400" />
                  <select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))} className="bg-transparent text-sm font-bold outline-none cursor-pointer">
                    {[10, 20, 50].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div className="relative w-full md:w-80 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-emerald-500" size={18} />
                    <input type="text" placeholder="Pesquisar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20" />
                </div>
             </div>
          </div>

          <div className="divide-y divide-gray-50 min-h-[400px]">
              {paginatedData.map(item => (
                  <div key={item.id} className="grid grid-cols-12 gap-4 px-8 py-5 items-center hover:bg-gray-50 transition-colors">
                      <div className="col-span-4">
                          <p className="font-bold truncate">{item.description}</p>
                          <div className="flex flex-col gap-0.5">
                              {item.patient_name && <span className="text-[10px] text-gray-400 font-bold uppercase">Pac: {item.patient_name}</span>}
                              {item.professional_name && <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Prof: {item.professional_name}</span>}
                          </div>
                      </div>
                      <div className="col-span-2 text-xs font-medium text-gray-500">{new Date(item.created_at).toLocaleDateString('pt-BR')}</div>
                      <div className="col-span-2"><span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 uppercase">{item.category}</span></div>
                      <div className="col-span-2">
                          <span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-lg border ${item.status === 'paid' || item.paid_at ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                              {item.status === 'paid' || item.paid_at ? 'Pago' : 'Pendente'}
                          </span>
                      </div>
                      <div className="col-span-2 text-right font-black text-lg tracking-tighter">
                          <span className={item.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}>
                              {item.type === 'income' ? '+' : '-'} {formatMoney(item.amount)}
                          </span>
                      </div>
                  </div>
              ))}
          </div>

          <div className="px-8 py-4 bg-gray-50/50 border-t border-gray-100 flex justify-between items-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Mostrando {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredList.length)} de {filteredList.length} registros
              </span>
              <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="h-9 w-9 p-0 rounded-xl bg-white shadow-sm"><ArrowLeft size={16}/></Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredList.length / itemsPerPage)))} disabled={currentPage === Math.ceil(filteredList.length / itemsPerPage) || filteredList.length === 0} className="h-9 w-9 p-0 rounded-xl bg-white shadow-sm"><ArrowRight size={16}/></Button>
              </div>
          </div>
      </div>

      <NewTransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={() => fetchFinancials()} />
    </div>
  );
}

const CardMetric = ({ title, value, icon: Icon, color, bg, diff }: any) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-5 group transition-all hover:shadow-md">
      <div className={`p-4 rounded-2xl ${bg} ${color} transition-transform group-hover:scale-105`}><Icon size={28} /></div>
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{title}</p>
        <h3 className="text-2xl font-black tracking-tight">{value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3>
        {diff !== undefined && (
            <div className={`flex items-center gap-1 text-[10px] font-black uppercase mt-1 ${diff >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {diff >= 0 ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>}
                {Math.abs(diff).toFixed(1)}% vs mês ant.
            </div>
        )}
      </div>
    </div>
);
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { 
  TrendingUp, DollarSign, Calendar, 
  Loader2, Wallet, Plus, Search, ArrowRight, ArrowLeft,
  CheckCircle2, PieChart, MinusCircle, ListOrdered,
  ArrowUpRight, ArrowDownRight, Award, Scissors, Package, ChevronDown, Heart
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { toast } from "react-hot-toast";
import { 
  Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart as RePieChart, Pie, Cell, Legend
} from 'recharts';
import { NewTransactionModal } from "../../components/modal/NewTransactionModal";

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
  service_id?: string; 
  patient_name?: string;      
  professional_name?: string; 
  service_official_name?: string; 
}

interface RankingItem {
  name: string;
  total: number;
  count?: number;
}

const COLORS = ['#10B981', '#F43F5E', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899'];

export function PaymentsPage() {
  const navigate = useNavigate();
  const rankingRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [prevMonthMetrics, setPrevMonthMetrics] = useState({ income: 0, expense: 0 });
  const [metrics, setMetrics] = useState({ income: 0, expense: 0, total: 0, pending: 0, inventoryCost: 0 });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRankingExpanded, setIsRankingExpanded] = useState(false);
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

      // ✅ BUSCA COM JOIN: Traz o nome do serviço diretamente do catálogo
      const { data: transData } = await supabase.from('transactions')
        .select(`
          *,
          service:services(name),
          patient:patients(name),
          professional:profiles(first_name, last_name)
        `)
        .eq('clinic_id', profile.clinic_id)
        .gte('created_at', `${startDate}T00:00:00`)
        .lte('created_at', `${endDate}T23:59:59`)
        .order('created_at', { ascending: false });

      const formattedData: Transaction[] = (transData || []).map((t: any) => ({
          ...t,
          amount: Number(t.amount) || 0,
          patient_name: t.patient?.name,
          professional_name: t.professional ? `${t.professional.first_name || ''} ${t.professional.last_name || ''}`.trim() : undefined,
          service_official_name: t.service?.name // Nome real do catálogo
      }));

      setTransactions(formattedData);
      calculateMetrics(formattedData);

      // Métricas do mês anterior para o gráfico de diferença
      const prevDate = new Date(Number(year), Number(month) - 1, 0);
      const [pYear, pMonth] = prevDate.toISOString().slice(0, 7).split('-');
      const { data: prevTransData } = await supabase.from('transactions').select('amount, type, status, paid_at').eq('clinic_id', profile.clinic_id).gte('created_at', `${pYear}-${pMonth}-01T00:00:00`).lte('created_at', `${pYear}-${pMonth}-31T23:59:59`);
      const pInc = (prevTransData || []).filter(t => t.type === 'income' && (t.status === 'paid' || t.paid_at)).reduce((acc, curr) => acc + Number(curr.amount), 0);
      setPrevMonthMetrics({ income: pInc, expense: 0 });

    } catch (error: any) {
      toast.error("Erro ao carregar finanças.");
    } finally {
      setLoading(false);
    }
  }

  const calculateMetrics = (data: Transaction[]) => {
    const inc = data.filter(t => t.type === 'income' && (t.status === 'paid' || t.paid_at)).reduce((acc, curr) => acc + curr.amount, 0);
    const exp = data.filter(t => t.type === 'expense' && (t.status === 'paid' || t.paid_at)).reduce((acc, curr) => acc + curr.amount, 0);
    const inv = data.filter(t => t.category === 'Insumos' || t.category === 'Materiais').reduce((acc, curr) => acc + curr.amount, 0);
    const pend = data.filter(t => t.status !== 'paid' && !t.paid_at && t.status !== 'canceled').reduce((acc, curr) => acc + curr.amount, 0);
    setMetrics({ income: inc, expense: exp, total: inc - exp, pending: pend, inventoryCost: inv });
  };

  // ✅ RANKING ATUALIZADO: Prioriza o nome do serviço do catálogo
  const rankingServices = transactions.filter(t => t.type === 'income').reduce((acc: Record<string, RankingItem>, curr) => {
      const name = curr.service_official_name || curr.description || "Outros";
      
      if (!acc[name]) acc[name] = { name, total: 0, count: 0 };
      acc[name].total += curr.amount;
      acc[name].count = (acc[name].count || 0) + 1;
      return acc;
  }, {});
  const allServices = Object.values(rankingServices).sort((a, b) => b.total - a.total);

  const rankingPatients = transactions.filter(t => t.type === 'income' && t.patient_name).reduce((acc: Record<string, RankingItem>, curr) => {
      const name = curr.patient_name!;
      if (!acc[name]) acc[name] = { name, total: 0, count: 0 };
      acc[name].total += curr.amount;
      acc[name].count = (acc[name].count || 0) + 1;
      return acc;
  }, {});
  const allPatients = Object.values(rankingPatients).sort((a, b) => b.total - a.total);

  const rankingProfs = transactions.filter(t => t.type === 'income' && t.professional_name).reduce((acc: Record<string, RankingItem>, curr) => {
      const name = curr.professional_name!;
      if (!acc[name]) acc[name] = { name, total: 0 };
      acc[name].total += curr.amount;
      return acc;
  }, {});
  const allProfessionals = Object.values(rankingProfs).sort((a, b) => b.total - a.total);

  const categoryData = transactions.filter(t => t.type === 'expense').reduce((acc: {name: string, value: number}[], curr) => {
      const existing = acc.find((item) => item.name === curr.category);
      if (existing) existing.value += curr.amount; else acc.push({ name: curr.category || 'Geral', value: curr.amount });
      return acc;
  }, []);

  const formatMoney = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-emerald-600" size={40}/></div>;

  return (
    <div className="p-6 md:p-10 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700 pb-24 font-sans text-gray-900 dark:text-white">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic flex items-center gap-3">
                <Wallet className="text-emerald-500" size={36}/> Financeiro Pro
            </h1>
            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-2">Gestão de Faturamento Vilagi</p>
        </div>
        <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-2xl border border-gray-200 shadow-sm h-12">
                <Calendar size={18} className="ml-2 text-gray-400" />
                <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-transparent border-none focus:ring-0 text-sm font-bold outline-none uppercase" />
            </div>
            <Button onClick={() => setIsModalOpen(true)} variant="outline" className="h-12 border-rose-200 text-rose-600 font-bold uppercase text-[10px] rounded-2xl px-6 hover:bg-rose-50"><MinusCircle size={16} /> Lançar Despesa</Button>
            <Button onClick={() => navigate('/patients')} className="h-12 bg-gray-900 text-white font-bold uppercase text-[10px] rounded-2xl shadow-xl px-6 hover:scale-105 transition-all"><Plus size={16} /> Nova Venda</Button>
        </div>
      </div>

      {/* MÉTRICAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <CardMetric title="Receita Bruta" value={metrics.income} icon={TrendingUp} color="text-emerald-600" bg="bg-emerald-50" diff={((metrics.income - prevMonthMetrics.income) / (prevMonthMetrics.income || 1)) * 100} />
          <CardMetric title="Custo Insumos" value={metrics.inventoryCost} icon={Package} color="text-amber-600" bg="bg-amber-50" />
          <CardMetric title="Saldo Real" value={metrics.total} icon={DollarSign} color="text-blue-600" bg="bg-blue-50" />
          <CardMetric title="Contas a Receber" value={metrics.pending} icon={PieChart} color="text-rose-600" bg="bg-rose-50" />
      </div>

      {/* RANKINGS */}
      <div ref={rankingRef} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <RankingBlock title="Top Procedimentos" icon={Scissors} color="text-emerald-600" bg="bg-emerald-50" items={isRankingExpanded ? allServices : allServices.slice(0, 3)} />
            <RankingBlock title="Top Profissionais" icon={Award} color="text-blue-600" bg="bg-blue-50" items={isRankingExpanded ? allProfessionals : allProfessionals.slice(0, 3)} />
            <RankingBlock title="Clientes VIP" icon={Heart} color="text-rose-600" bg="bg-rose-50" items={isRankingExpanded ? allPatients : allPatients.slice(0, 3)} />
        </div>

        <div className="flex justify-center">
            <button onClick={() => setIsRankingExpanded(!isRankingExpanded)} className="group flex flex-col items-center gap-1 text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-emerald-500 transition-all">
                {isRankingExpanded ? "Recolher Rankings" : "Ver Rankings Completos"}
                <ChevronDown size={28} className={`transition-transform duration-500 ${isRankingExpanded ? 'rotate-180 text-emerald-500' : 'animate-bounce text-gray-300'}`} />
            </button>
        </div>
      </div>

      {/* LISTAGEM DE TRANSAÇÕES */}
      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/30 flex flex-col lg:flex-row justify-between items-center gap-6">
             <div className="flex gap-2 p-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 shadow-sm">
                {['all', 'income', 'expense'].map((t) => (
                  <button key={t} onClick={() => setFilterType(t as any)} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${filterType === t ? 'bg-gray-900 text-white shadow-md' : 'text-gray-400'}`}>
                    {t === 'all' ? 'Todos' : t === 'income' ? 'Entradas' : 'Saídas'}
                  </button>
                ))}
             </div>
             <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-white p-2 px-4 rounded-xl border border-gray-200 shadow-sm">
                  <ListOrdered size={14} className="text-gray-400" />
                  <select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))} className="bg-transparent text-sm font-bold outline-none cursor-pointer">
                    <option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
                  </select>
                </div>
                <div className="relative w-80 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-emerald-500" size={18} />
                    <input type="text" placeholder="Buscar registros..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-sm" />
                </div>
             </div>
          </div>

          <div className="divide-y divide-gray-50 min-h-[400px]">
              {transactions
                .filter(t => (filterType === 'all' || t.type === filterType) && (t.description.toLowerCase().includes(searchTerm.toLowerCase()) || t.patient_name?.toLowerCase().includes(searchTerm.toLowerCase())))
                .slice((currentPage-1)*itemsPerPage, currentPage*itemsPerPage)
                .map(item => (
                  <div key={item.id} className="grid grid-cols-12 gap-4 px-8 py-5 items-center hover:bg-gray-50 transition-colors">
                      <div className="col-span-4">
                        <p className="font-bold truncate text-sm uppercase">
                          {item.service_official_name || item.description}
                        </p>
                        <span className="text-[10px] text-gray-400 font-bold uppercase">Pac: {item.patient_name || 'Avulso'}</span>
                      </div>
                      <div className="col-span-2 text-xs font-medium text-gray-500 italic">{new Date(item.created_at).toLocaleDateString('pt-BR')}</div>
                      <div className="col-span-2"><span className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border bg-gray-100 text-gray-500 uppercase`}>{item.category}</span></div>
                      <div className="col-span-2"><span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-lg border ${item.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>{item.status === 'paid' ? 'Pago' : 'Pendente'}</span></div>
                      <div className="col-span-2 text-right font-black text-lg tracking-tighter"><span className={item.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}>{item.type === 'income' ? '+' : '-'} {formatMoney(item.amount)}</span></div>
                  </div>
              ))}
          </div>

          <div className="px-8 py-4 bg-gray-50/50 border-t border-gray-100 flex justify-between items-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Mostrando {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, transactions.length)} de {transactions.length} registros
              </span>
              <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="h-9 w-9 p-0 rounded-xl bg-white shadow-sm transition-all active:scale-95"><ArrowLeft size={16}/></Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(transactions.length / itemsPerPage)))} disabled={currentPage === Math.ceil(transactions.length / itemsPerPage) || transactions.length === 0} className="h-9 w-9 p-0 rounded-xl bg-white shadow-sm transition-all active:scale-95"><ArrowRight size={16}/></Button>
              </div>
          </div>
      </div>

      <NewTransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={() => fetchFinancials()} />
    </div>
  );
}

const CardMetric = ({ title, value, icon: Icon, color, bg, diff }: any) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-5 transition-all hover:shadow-md group">
      <div className={`p-4 rounded-2xl ${bg} ${color} shadow-sm`}><Icon size={28} /></div>
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{title}</p>
        <h3 className="text-2xl font-black tracking-tight">{value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3>
        {diff !== undefined && !isNaN(diff) && (
          <div className={`flex items-center gap-1 text-[10px] font-black mt-1 ${diff >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {diff >= 0 ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>}{Math.abs(diff).toFixed(1)}% vs mês ant.
          </div>
        )}
      </div>
    </div>
);

const RankingBlock = ({ title, icon: Icon, color, bg, items }: any) => (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col transition-all duration-500">
        <div className="flex items-center gap-3 mb-6"><div className={`p-3 ${bg} rounded-2xl ${color}`}><Icon size={20}/></div><h3 className="font-black uppercase italic tracking-tight text-sm">{title}</h3></div>
        <div className="space-y-3 flex-1">
            {items.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl group hover:bg-emerald-50 transition-all border border-transparent hover:border-emerald-100">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-black text-gray-200">#0{idx+1}</span>
                      <div>
                        <p className="font-bold text-[11px] uppercase text-gray-700 dark:text-gray-100 truncate w-32">{item.name}</p>
                        {item.count !== undefined && <p className="text-[9px] text-gray-400 font-bold uppercase">{item.count} sessões</p>}
                      </div>
                    </div>
                    <span className={`font-black text-sm tracking-tighter ${color}`}>{item.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>
            ))}
            {items.length === 0 && <p className="text-center text-xs text-gray-400 py-4 italic uppercase font-bold">Sem dados no período</p>}
        </div>
    </div>
);
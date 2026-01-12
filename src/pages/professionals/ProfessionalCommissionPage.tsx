import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  Wallet,
  Check,
  Banknote,
  ChevronLeft,
  ChevronRight,
  ListFilter
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from 'react-hot-toast';

type CommissionTransaction = {
  id: string;
  created_at: string;
  description: string;
  amount: number;
  status: string;
  patient_name?: string;
  paid_at?: string; // Data que foi pago
};

export default function ProfessionalCommissionPage() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  // Filtros de Data
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  
  // Estados de Dados
  const [items, setItems] = useState<CommissionTransaction[]>([]);
  const [stats, setStats] = useState({
    totalCommission: 0,
    paidCommission: 0,
    pendingCommission: 0,
    count: 0,
    rate: 0
  });

  // Estados de Visualização (Abas e Paginação)
  const [activeTab, setActiveTab] = useState<'pending' | 'paid'>('pending');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (id) fetchCommissionData(id, selectedMonth);
  }, [id, selectedMonth]);

  // Resetar paginação ao trocar de aba
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, itemsPerPage]);

  async function fetchCommissionData(profId: string, monthIso: string) {
    setLoading(true);
    try {
      const { data: profData } = await supabase.from('profiles').select('commission_rate').eq('id', profId).single();
      const rate = Number(profData?.commission_rate) || 0;

      const [year, month] = monthIso.split('-');
      const startDate = `${year}-${month}-01`;
      const endDate = new Date(Number(year), Number(month), 0).toISOString().split('T')[0];

      const { data: trans, error } = await supabase
        .from('transactions')
        .select(`
          id, created_at, description, amount, status, category, paid_at,
          patient:patients (name) 
        `)
        .eq('professional_id', profId) 
        .gte('created_at', `${startDate}T00:00:00`)
        .lte('created_at', `${endDate}T23:59:59`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const commissionList = (trans || []).filter((t: any) => 
          (t.category && t.category.toLowerCase().includes('comiss')) ||
          (t.description && t.description.toLowerCase().includes('comiss'))
      );

      let total = 0;
      let paid = 0;
      let pending = 0;

      const mappedItems = commissionList.map((t: any) => {
        const val = Number(t.amount) || 0;
        total += val;
        
        if (t.status === 'paid') paid += val;
        else pending += val;

        let pName = 'Venda Avulsa';
        if (t.patient) {
            if (Array.isArray(t.patient)) pName = t.patient[0]?.name || pName;
            else pName = t.patient.name || pName;
        } else if (t.description.includes('-')) {
            pName = t.description.split('-')[1].trim();
        }
        
        return {
          id: t.id,
          created_at: t.created_at,
          description: t.description,
          amount: val,
          status: t.status || 'paid',
          patient_name: pName,
          paid_at: t.paid_at
        };
      });

      setItems(mappedItems);
      setStats({ 
          totalCommission: total, 
          paidCommission: paid,
          pendingCommission: pending,
          count: mappedItems.length, 
          rate 
      });

    } catch (error: any) {
      console.error("ERRO:", error);
      toast.error("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }

  const handleMarkAsPaid = async (transId: string, amount: number) => {
      if(!confirm(`Confirmar pagamento desta comissão? \nValor: ${formatCurrency(amount)}`)) return;
      
      try {
          const { error } = await supabase
            .from('transactions')
            .update({ status: 'paid', paid_at: new Date().toISOString() })
            .eq('id', transId);

          if(error) throw error;
          
          toast.success("Pagamento registrado!");
          fetchCommissionData(id!, selectedMonth);
      } catch (err) {
          toast.error("Erro ao atualizar status.");
      }
  };

  const handlePayAllPending = async () => {
      if(stats.pendingCommission <= 0) return;
      if(!confirm(`Confirmar FECHAMENTO DO MÊS?\n\nIsso marcará todas as comissões pendentes (${formatCurrency(stats.pendingCommission)}) como PAGAS.`)) return;

      setProcessing(true);
      try {
          const pendingIds = items.filter(i => i.status !== 'paid').map(i => i.id);
          if (pendingIds.length === 0) return;

          const { error } = await supabase
            .from('transactions')
            .update({ status: 'paid', paid_at: new Date().toISOString() })
            .in('id', pendingIds);

          if(error) throw error;

          toast.success("Fechamento realizado!");
          fetchCommissionData(id!, selectedMonth);
      } catch (err) {
          toast.error("Erro ao realizar fechamento.");
      } finally {
          setProcessing(false);
      }
  };

  // --- LÓGICA DE PAGINAÇÃO ---
  const getFilteredData = () => {
      if (activeTab === 'pending') {
          return items.filter(i => i.status !== 'paid');
      } else {
          return items.filter(i => i.status === 'paid');
      }
  };

  const currentData = getFilteredData();
  const totalPages = Math.ceil(currentData.length / itemsPerPage);
  const paginatedData = currentData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) return <div className="p-10 flex justify-center h-96 items-center"><Loader2 className="animate-spin text-pink-600" size={40}/></div>;

  return (
    <div className="space-y-8 p-4 sm:p-2 animate-in fade-in duration-500 pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-gray-100 dark:border-gray-800 pb-6">
        <div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white italic tracking-tighter uppercase flex items-center gap-3">
            <Wallet className="text-emerald-500" size={28} /> Gestão de Comissões
            </h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Controle de repasses médicos</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-2 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="p-2 bg-gray-100 dark:bg-gray-900 rounded-xl text-gray-500"><Calendar size={18} /></div>
            <input 
                type="month" 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-sm font-bold text-gray-700 dark:text-gray-200 outline-none uppercase"
            />
        </div>
      </div>

      {/* CARDS DE RESUMO (Sempre visíveis) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Taxa Contratada</p>
            <p className="text-4xl font-black text-gray-900 dark:text-white mt-2 italic tracking-tighter">{stats.rate}%</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><TrendingUp size={64}/></div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Gerado</p>
            <p className="text-3xl font-black text-gray-900 dark:text-white mt-2 tracking-tight">
                {formatCurrency(stats.totalCommission)}
            </p>
            <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-wide">
                <CheckCircle2 size={12} className="text-blue-500"/> {stats.count} vendas
            </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-[2rem] border border-blue-100 dark:border-blue-800 shadow-sm relative overflow-hidden">
            <p className="text-[10px] font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest">Total Já Pago</p>
            <p className="text-3xl font-black text-blue-600 dark:text-blue-400 mt-2 tracking-tighter">
                {formatCurrency(stats.paidCommission)}
            </p>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-[2rem] border border-emerald-100 dark:border-emerald-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div>
                <p className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">Saldo A Pagar</p>
                <p className="text-4xl font-black text-emerald-600 dark:text-emerald-400 mt-2 tracking-tighter">
                    {formatCurrency(stats.pendingCommission)}
                </p>
            </div>
            {stats.pendingCommission > 0 && activeTab === 'pending' && (
                <Button 
                    onClick={handlePayAllPending}
                    disabled={processing}
                    className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] tracking-widest h-10 rounded-xl shadow-lg shadow-emerald-500/20"
                >
                    {processing ? <Loader2 className="animate-spin mr-2"/> : <Banknote size={16} className="mr-2"/>}
                    Realizar Fechamento
                </Button>
            )}
        </div>
      </div>

      {/* ÁREA DE LISTAGEM */}
      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        
        {/* ABAS DE NAVEGAÇÃO */}
        <div className="px-8 pt-6 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
            <div className="flex space-x-1 bg-gray-100 dark:bg-gray-900/50 p-1 rounded-2xl">
                <button 
                    onClick={() => setActiveTab('pending')}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                        activeTab === 'pending' 
                        ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                >
                    A Pagar ({items.filter(i => i.status !== 'paid').length})
                </button>
                <button 
                    onClick={() => setActiveTab('paid')}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                        activeTab === 'paid' 
                        ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                >
                    Histórico / Pagos ({items.filter(i => i.status === 'paid').length})
                </button>
            </div>

            {/* CONTROLE DE PAGINAÇÃO */}
            <div className="flex items-center gap-3 pb-2 md:pb-0">
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 px-3 py-1.5 rounded-xl">
                    <ListFilter size={14} className="text-gray-400"/>
                    <select 
                        value={itemsPerPage} 
                        onChange={(e) => setItemsPerPage(Number(e.target.value))}
                        className="bg-transparent text-xs font-bold text-gray-600 dark:text-gray-300 outline-none"
                    >
                        <option value={10}>10 linhas</option>
                        <option value={20}>20 linhas</option>
                        <option value={50}>50 linhas</option>
                        <option value={100}>100 linhas</option>
                    </select>
                </div>
            </div>
        </div>
        
        {currentData.length === 0 ? (
            <div className="p-16 text-center text-gray-400 flex flex-col items-center gap-4">
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-full"><AlertCircle size={32} className="text-gray-300"/></div>
                <p className="text-xs font-bold uppercase tracking-widest">
                    {activeTab === 'pending' ? 'Tudo pago! Nenhuma pendência.' : 'Nenhum pagamento realizado neste mês.'}
                </p>
            </div>
        ) : (
            <>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 font-bold uppercase text-[10px] tracking-widest">
                            <tr>
                                <th className="px-8 py-4">Data</th>
                                <th className="px-8 py-4">Paciente</th>
                                <th className="px-8 py-4">Descrição</th>
                                <th className="px-8 py-4 text-right">Valor</th>
                                <th className="px-8 py-4 text-center">
                                    {activeTab === 'pending' ? 'Ação' : 'Pago em'}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                            {paginatedData.map((item) => (
                                <tr key={item.id} className={`transition-colors ${activeTab === 'paid' ? 'bg-gray-50/30' : 'hover:bg-gray-50'}`}>
                                    <td className="px-8 py-5 font-medium text-gray-500">{new Date(item.created_at).toLocaleDateString('pt-BR')}</td>
                                    <td className="px-8 py-5 font-bold text-gray-900 dark:text-white">{item.patient_name}</td>
                                    <td className="px-8 py-5 text-xs font-medium text-gray-500 uppercase tracking-wide">{item.description}</td>
                                    <td className="px-8 py-5 text-right font-black text-emerald-600 text-lg">
                                        {formatCurrency(item.amount)}
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        {activeTab === 'paid' ? (
                                            <span className="text-[10px] font-bold text-gray-400">
                                                {item.paid_at ? new Date(item.paid_at).toLocaleDateString('pt-BR') : 'Data n/d'}
                                            </span>
                                        ) : (
                                            <button 
                                                onClick={() => handleMarkAsPaid(item.id, item.amount)}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase border bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 transition-all shadow-sm"
                                            >
                                                <Banknote size={12} /> Pagar
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* RODAPÉ DA PAGINAÇÃO */}
                {totalPages > 1 && (
                    <div className="px-8 py-4 border-t border-gray-50 dark:border-gray-700 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            Página {currentPage} de {totalPages}
                        </span>
                        <div className="flex gap-2">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                                disabled={currentPage === 1}
                                className="h-8 w-8 p-0 rounded-lg"
                            >
                                <ChevronLeft size={14} />
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                                disabled={currentPage === totalPages}
                                className="h-8 w-8 p-0 rounded-lg"
                            >
                                <ChevronRight size={14} />
                            </Button>
                        </div>
                    </div>
                )}
            </>
        )}
      </div>
    </div>
  );
}

function formatCurrency(val: number) {
  return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
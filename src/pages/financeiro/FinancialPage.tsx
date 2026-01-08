import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { 
  TrendingUp, TrendingDown, DollarSign, Calendar, 
  Loader2, Wallet 
} from "lucide-react";
import { toast } from "react-hot-toast";

// --- TIPAGEM ---
interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  status: 'paid' | 'pending' | 'canceled';
  date: string;
  payment_method: string;
  patient?: { name: string };
}

export function FinancialPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ income: 0, expense: 0, total: 0 });
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

  useEffect(() => {
    fetchFinancials();
  }, []);

  async function fetchFinancials() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Pega Clinic ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('clinic_id:clinic_id')
        .eq('id', user.id)
        .single();

      if (!profile?.clinic_id) throw new Error("Clínica não identificada.");

      // 2. Busca Transações
      const { data, error } = await supabase
        .from('transactions') 
        .select(`
          *,
          patient:patients!patient_id ( name )
        `)
        .eq('clinic_id', profile.clinic_id)
        .order('date', { ascending: false });

      if (error) throw error;

      const formattedData: Transaction[] = (data || []).map((t: any) => ({
          ...t,
          amount: Number(t.amount) || 0,
          payment_method: t.payment_method || 'Outros'
      }));

      setTransactions(formattedData);
      calculateSummary(formattedData);

    } catch (error: any) {
      console.error("Erro financeiro:", error);
      toast.error("Erro ao carregar finanças: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  const calculateSummary = (data: Transaction[]) => {
    const inc = data.filter(t => t.type === 'income' && t.status === 'paid').reduce((acc, curr) => acc + curr.amount, 0);
    const exp = data.filter(t => t.type === 'expense' && t.status === 'paid').reduce((acc, curr) => acc + curr.amount, 0);
    setSummary({
        income: inc,
        expense: exp,
        total: inc - exp
    });
  };

  const formatMoney = (val: number) => {
      return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Helper de Data Manual (Sem date-fns para evitar bug de fuso)
  const formatDate = (dateString: string) => {
      if(!dateString) return "--/--";
      try {
          const datePart = dateString.includes('T') ? dateString.split('T')[0] : dateString;
          const [year, month, day] = datePart.split('-');
          return `${day}/${month}/${year}`;
      } catch (e) {
          return dateString;
      }
  };

  const filteredList = transactions.filter(t => filterType === 'all' ? true : t.type === filterType);

  if (loading) {
      return (
        <div className="h-screen flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-pink-600 w-12 h-12" />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Calculando Balanço...</p>
        </div>
      );
  }

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-700">
      
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic flex items-center gap-3">
                <Wallet className="text-emerald-500" size={32}/> Gestão Financeira
            </h1>
            <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">Fluxo de caixa e lançamentos</p>
        </div>
        <div className="flex gap-2">
            <button onClick={() => setFilterType('all')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filterType === 'all' ? 'bg-gray-900 text-white' : 'bg-white text-gray-400'}`}>Todos</button>
            <button onClick={() => setFilterType('income')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filterType === 'income' ? 'bg-emerald-500 text-white' : 'bg-white text-gray-400'}`}>Entradas</button>
            <button onClick={() => setFilterType('expense')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filterType === 'expense' ? 'bg-rose-500 text-white' : 'bg-white text-gray-400'}`}>Saídas</button>
        </div>
      </div>

      {/* CARDS DE RESUMO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl text-emerald-600"><TrendingUp size={24}/></div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Receitas</span>
              </div>
              <h3 className="text-3xl font-black text-gray-900 dark:text-white italic tracking-tighter">{formatMoney(summary.income)}</h3>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-rose-50 dark:bg-rose-900/20 rounded-2xl text-rose-600"><TrendingDown size={24}/></div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Despesas</span>
              </div>
              <h3 className="text-3xl font-black text-gray-900 dark:text-white italic tracking-tighter">{formatMoney(summary.expense)}</h3>
          </div>

          <div className="bg-gray-900 text-white p-6 rounded-[2.5rem] shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500 to-transparent opacity-20 rounded-full blur-2xl -mr-10 -mt-10"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="p-3 bg-white/10 rounded-2xl text-emerald-400"><DollarSign size={24}/></div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Saldo Líquido</span>
              </div>
              <h3 className={`text-4xl font-black italic tracking-tighter relative z-10 ${summary.total >= 0 ? 'text-white' : 'text-rose-400'}`}>
                  {formatMoney(summary.total)}
              </h3>
          </div>
      </div>

      {/* LISTAGEM */}
      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 grid grid-cols-12 gap-4">
              <div className="col-span-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Descrição / Paciente</div>
              <div className="col-span-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Data</div>
              <div className="col-span-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Pagamento</div>
              <div className="col-span-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</div>
              <div className="col-span-2 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Valor</div>
          </div>

          <div className="divide-y divide-gray-50 dark:divide-gray-700">
              {filteredList.length === 0 ? (
                  <div className="py-20 text-center text-gray-400 font-medium italic">Nenhum lançamento encontrado.</div>
              ) : (
                  filteredList.map(item => (
                      <div key={item.id} className="grid grid-cols-12 gap-4 px-8 py-5 items-center hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                          <div className="col-span-4">
                              <p className="font-bold text-gray-900 dark:text-white truncate">{item.description}</p>
                              {item.patient && <p className="text-xs text-gray-400 italic mt-0.5">{item.patient.name}</p>}
                          </div>
                          
                          <div className="col-span-2 flex items-center gap-2 text-sm text-gray-500">
                              <Calendar size={14}/> {formatDate(item.date)}
                          </div>

                          <div className="col-span-2">
                              <span className="text-xs font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-900 px-3 py-1 rounded-lg uppercase tracking-wide">
                                  {item.payment_method}
                              </span>
                          </div>

                          <div className="col-span-2">
                              <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-lg border ${
                                  item.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                  item.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                                  'bg-rose-50 text-rose-600 border-rose-100'
                              }`}>
                                  {item.status === 'paid' ? 'Pago' : item.status === 'pending' ? 'Pendente' : 'Cancelado'}
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
      </div>

    </div>
  );
}
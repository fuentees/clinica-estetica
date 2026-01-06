import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { toast } from "react-hot-toast";
import { 
  DollarSign, 
  Plus, 
  Receipt, 
  CreditCard, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Loader2
} from "lucide-react";
import { Button } from "../../components/ui/button";

// --- COMPONENTES AUXILIARES ---
const StatCard = ({ title, value, sub, type }: any) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm">
    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{title}</p>
    <div className="flex items-baseline gap-2">
      <h3 className="text-2xl font-black text-gray-900 dark:text-white italic tracking-tighter">{value}</h3>
      {type === 'up' && <ArrowUpRight size={16} className="text-emerald-500" />}
      {type === 'down' && <ArrowDownRight size={16} className="text-rose-500" />}
    </div>
    <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase">{sub}</p>
  </div>
);

export function PatientFinancialPage() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<'transacoes' | 'pacotes'>('transacoes');
  
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({ total: 0, pending: 0, openSessions: 0 });

  useEffect(() => {
    if (id) fetchFinancialData();
  }, [id]);

  async function fetchFinancialData() {
    try {
      setLoading(true);
      
      // 1. Buscar Transações Reais
      // Ajuste: patientId (camelCase)
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('patientId', id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const items = data || [];
      setTransactions(items);

      // 2. Calcular Métricas
      const totalPaid = items
        .filter(t => t.paid_at) // Se tem data de pagamento, está pago
        .reduce((acc, curr) => acc + Number(curr.amount), 0);

      const totalPending = items
        .filter(t => !t.paid_at) // Se não tem, está pendente
        .reduce((acc, curr) => acc + Number(curr.amount), 0);

      setMetrics({
          total: totalPaid,
          pending: totalPending,
          openSessions: 0 // Placeholder para lógica futura de pacotes
      });

    } catch (error) {
      console.error("Erro financeiro:", error);
      toast.error("Erro ao carregar dados financeiros.");
    } finally {
      setLoading(false);
    }
  }

  // Função helper para formatar moeda
  const formatCurrency = (val: number) => {
      return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 bg-white dark:bg-gray-950">
      <Loader2 className="animate-spin text-emerald-600" size={40}/>
      <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em]">Calculando Faturamento...</p>
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto p-6 space-y-8 animate-in fade-in duration-700">
      
      {/* HEADER FINANCEIRO */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="flex items-center gap-6">
          <div className="p-5 bg-emerald-50 dark:bg-emerald-900/20 rounded-[2rem] text-emerald-600">
            <DollarSign size={40} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter italic uppercase">Financeiro</h1>
            <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">Gestão de faturamento e créditos do paciente</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="h-12 rounded-xl border-gray-200 font-bold uppercase text-[10px] tracking-widest">
            <Receipt size={16} className="mr-2" /> Gerar Recibo
          </Button>
          <Button className="h-12 px-8 bg-gray-900 hover:bg-black text-white rounded-xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl">
            <Plus size={18} className="mr-2 text-emerald-400" /> Nova Venda
          </Button>
        </div>
      </div>

      {/* MÉTRICAS (KPIs REAIS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Investido" value={formatCurrency(metrics.total)} sub="LTV (Lifetime Value)" type="up" />
        <StatCard title="Saldo Devedor" value={formatCurrency(metrics.pending)} sub="Pagamentos Pendentes" type="down" />
        <StatCard title="Sessões em Aberto" value={String(metrics.openSessions).padStart(2, '0')} sub="Pacotes Ativos" />
        <StatCard title="Crédito em Conta" value="R$ 0,00" sub="Adiantamentos" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* COLUNA ESQUERDA: LISTAGENS (2/3) */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="flex border-b border-gray-100 dark:border-gray-700">
              <button 
                onClick={() => setActiveTab('transacoes')}
                className={`px-8 py-5 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'transacoes' ? 'text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/30' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Últimas Transações
              </button>
              <button 
                onClick={() => setActiveTab('pacotes')}
                className={`px-8 py-5 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'pacotes' ? 'text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/30' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Pacotes & Sessões
              </button>
            </div>

            <div className="p-4">
              {activeTab === 'transacoes' ? (
                <>
                    {transactions.length === 0 ? (
                        <div className="p-12 text-center text-gray-400">
                            <p className="font-bold text-xs uppercase tracking-widest">Nenhuma transação registrada.</p>
                        </div>
                    ) : (
                        <table className="w-full">
                        <thead>
                            <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 dark:border-gray-700">
                            <th className="text-left p-4">Data</th>
                            <th className="text-left p-4">Descrição</th>
                            <th className="text-left p-4">Valor</th>
                            <th className="text-left p-4">Status</th>
                            <th className="text-right p-4">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                            {transactions.map(t => (
                            <tr key={t.id} className="group hover:bg-gray-50/50 dark:hover:bg-gray-900/50 transition-colors">
                                <td className="p-4 text-xs font-bold text-gray-500">
                                    {new Date(t.due_date || t.created_at).toLocaleDateString()}
                                </td>
                                <td className="p-4">
                                <p className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-tighter italic">{t.description}</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t.payment_method || '---'}</p>
                                </td>
                                <td className="p-4 text-sm font-black text-gray-900 dark:text-white">
                                    {Number(t.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </td>
                                <td className="p-4">
                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border ${t.paid_at ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                    {t.paid_at ? 'Pago' : 'Pendente'}
                                </span>
                                </td>
                                <td className="p-4 text-right">
                                <button className="p-2 text-gray-300 hover:text-emerald-500 transition-colors">
                                    <Receipt size={18} />
                                </button>
                                </td>
                            </tr>
                            ))}
                        </tbody>
                        </table>
                    )}
                </>
              ) : (
                <div className="p-12 text-center flex flex-col items-center">
                  <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mb-4">
                    <Package size={24} className="text-gray-300" />
                  </div>
                  <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter">Módulo de Pacotes</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Controle o consumo de sessões contratadas.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA: CARTÕES E PAGAMENTOS (1/3) */}
        <div className="space-y-6">
          <div className="bg-gray-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
              <CreditCard size={100} />
            </div>
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-emerald-400 mb-8 flex items-center gap-2">
              <TrendingUp size={16}/> Inteligência de Vendas
            </h3>
            <div className="space-y-6">
               <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Ticket Médio</p>
                  <p className="text-2xl font-black italic tracking-tighter">
                      {/* Cálculo Simples do Ticket Médio */}
                      {transactions.length > 0 
                        ? formatCurrency(metrics.total / transactions.length)
                        : 'R$ 0,00'
                      }
                  </p>
               </div>
               <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Total de Transações</p>
                  <p className="text-2xl font-black italic tracking-tighter">{transactions.length}</p>
               </div>
               <div className="pt-4 border-t border-white/10">
                  <p className="text-[10px] font-bold text-gray-400 leading-relaxed uppercase">
                    Análise baseada no histórico de compras registrado.
                  </p>
               </div>
            </div>
          </div>

          {metrics.pending > 0 && (
              <div className="bg-amber-50 dark:bg-amber-950/20 p-6 rounded-[2rem] border border-amber-100 dark:border-amber-900/30 animate-in slide-in-from-bottom-4">
                <div className="flex items-center gap-3 text-amber-800 dark:text-amber-200">
                   <AlertCircle size={20}/>
                   <p className="text-[10px] font-black uppercase tracking-widest">Aviso de Pendência</p>
                </div>
                <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mt-3 leading-relaxed">
                  Existe um saldo devedor total de <span className="font-black">{formatCurrency(metrics.pending)}</span>.
                </p>
                <Button className="w-full mt-4 bg-amber-600 hover:bg-amber-700 text-white h-10 rounded-xl font-bold uppercase text-[9px] tracking-widest">
                  Enviar Cobrança
                </Button>
              </div>
          )}
        </div>
      </div>
    </div>
  );
}
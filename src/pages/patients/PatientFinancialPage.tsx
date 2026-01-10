import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { toast } from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext"; 
import { 
  DollarSign, 
  Plus, 
  Receipt, 
  CreditCard, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle,
  Package,
  Loader2,
  FileText, 
  Printer,
  Trash2,
  Edit,
  MinusCircle
} from "lucide-react";
import { Button } from "../../components/ui/button";

// Verifique se o caminho do import está correto no seu projeto
import ModalAprovarOrcamento, { PaymentData } from "../../components/modal/ModalAprovacaoOrcamento";

// --- COMPONENTES VISUAIS ---
const ArrowUpRight = ({ size, className }: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M7 7h10v10"/><path d="M7 17 17 7"/></svg>
);
const ArrowDownRight = ({ size, className }: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m7 7 10 10"/><path d="M17 7v10H7"/></svg>
);

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

interface Budget {
  id: string;
  created_at: string;
  total: number;
  status: string;
  items: any;
  clinic_id: string;
}

export function PatientFinancialPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAdmin } = useAuth();
  
  const activeTab = searchParams.get('tab') || 'transacoes';

  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]); 
  const [activePackages, setActivePackages] = useState<any[]>([]); 
  const [metrics, setMetrics] = useState({ total: 0, pending: 0, openBudgets: 0 });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [consumingId, setConsumingId] = useState<string | null>(null);

  const [modalAprovacaoOpen, setModalAprovacaoOpen] = useState(false);
  const [budgetToApprove, setBudgetToApprove] = useState<Budget | null>(null);
  const [approving, setApproving] = useState(false);

  const changeTab = (tab: string) => {
    setSearchParams({ tab });
  };

  useEffect(() => {
    if (id) fetchFinancialData();
  }, [id]);

  async function fetchFinancialData() {
    try {
      setLoading(true);
      
      const { data: transData } = await supabase
        .from('transactions')
        .select('*')
        .eq('patient_id', id)
        .order('created_at', { ascending: false });

      const { data: budgetData } = await supabase
        .from('budgets')
        .select('*')
        .eq('patient_id', id)
        .order('created_at', { ascending: false });

      const { data: packagesData } = await supabase
        .from('planos_clientes')
        .select('*')
        .eq('cliente_id', id)
        .order('created_at', { ascending: false });

      setTransactions(transData || []);
      setBudgets(budgetData || []);
      setActivePackages(packagesData || []);

      calculateMetrics(transData || [], budgetData || []);

    } catch (error) {
      console.error("Erro financeiro:", error);
      toast.error("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }

  const calculateMetrics = (currentTransactions: any[], currentBudgets: any[]) => {
      const totalPaid = currentTransactions
        .filter(t => t.paid_at)
        .reduce((acc, curr) => acc + Number(curr.amount), 0);

      const totalPending = currentTransactions
        .filter(t => !t.paid_at)
        .reduce((acc, curr) => acc + Number(curr.amount), 0);

      const totalOpenBudgets = currentBudgets
        .filter((b: Budget) => b.status === 'pending')
        .reduce((acc, curr) => acc + Number(curr.total), 0);

      setMetrics({
          total: totalPaid,
          pending: totalPending,
          openBudgets: totalOpenBudgets
      });
  };

  const handleOpenApproveModal = (budget: Budget) => {
    setBudgetToApprove(budget);
    setModalAprovacaoOpen(true);
  };

  // --- LÓGICA DE CONSUMIR SESSÃO ---
  const handleConsumeSession = async (pkg: any) => {
    if (pkg.sessoes_restantes <= 0) return toast.error("Todas as sessões já foram utilizadas.");
    if (!confirm(`Confirmar realização de 1 sessão de ${pkg.nome_plano}?`)) return;

    setConsumingId(pkg.id);
    try {
        const newRemaining = pkg.sessoes_restantes - 1;
        const newStatus = newRemaining === 0 ? 'finalizado' : 'ativo';

        const { error } = await supabase
            .from('planos_clientes')
            .update({ 
                sessoes_restantes: newRemaining,
                status: newStatus
            })
            .eq('id', pkg.id);

        if (error) throw error;

        toast.success("Sessão debitada com sucesso!");
        
        setActivePackages(prev => prev.map(p => 
            p.id === pkg.id 
                ? { ...p, sessoes_restantes: newRemaining, status: newStatus } 
                : p
        ));

    } catch (err) {
        console.error(err);
        toast.error("Erro ao debitar sessão.");
    } finally {
        setConsumingId(null);
    }
  };

  // --- CONFIRMAR APROVAÇÃO ---
  const handleConfirmApproval = async (paymentData: PaymentData) => {
    if (!budgetToApprove) return;
    setApproving(true);

    try {
      // 1. Atualizar Orçamento para 'approved'
      const { error: updateError } = await supabase
        .from('budgets')
        .update({ status: 'approved' })
        .eq('id', budgetToApprove.id);

      if (updateError) throw updateError;

      // 2. Criar Transação Financeira
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          clinic_id: budgetToApprove.clinic_id, 
          patient_id: id,
          amount: budgetToApprove.total,
          type: 'income',
          category: 'Venda de Serviço',
          description: `Aprovação de Orçamento`,
          payment_method: paymentData.method,
          due_date: new Date().toISOString(),
          paid_at: paymentData.paidNow ? new Date().toISOString() : null,
        });

      if (transactionError) throw transactionError;

      // 3. GERAR PACOTES
      if (budgetToApprove.items && Array.isArray(budgetToApprove.items) && budgetToApprove.items.length > 0) {
          const packagesToCreate = budgetToApprove.items.map((item: any) => ({
              clinic_id: budgetToApprove.clinic_id,
              cliente_id: id,
              nome_plano: item.name,
              sessoes_totais: Number(item.qty) || 1,     
              sessoes_restantes: Number(item.qty) || 1,
              valor_pago: (Number(item.price) || 0) * (Number(item.qty) || 1),
              status: 'ativo'
          }));

          // --- DEBUG: Verifique isso no Console do Chrome (F12) ---
          console.log("🚨 DADOS SENDO ENVIADOS PARA PLANOS_CLIENTES:", packagesToCreate);

          const { error: packagesError } = await supabase
              .from('planos_clientes')
              .insert(packagesToCreate);

          if (packagesError) throw packagesError;
      }

      toast.success("Venda confirmada e pacotes gerados!");
      setModalAprovacaoOpen(false);
      setBudgetToApprove(null);
      
      await fetchFinancialData();
      setSearchParams({ tab: 'pacotes' });

    } catch (err: any) {
      console.error("Erro na aprovação:", err);
      toast.error("Erro ao aprovar: " + err.message);
    } finally {
      setApproving(false);
    }
  };

  const handleDeleteTransaction = async (transId: string) => {
    if(!isAdmin) return toast.error("Apenas administradores podem excluir transações.");
    if(!confirm("Deseja realmente excluir este registro financeiro?")) return;

    setDeletingId(transId);
    try {
        const { error } = await supabase.from('transactions').delete().eq('id', transId);
        if(error) throw error;
        toast.success("Registro removido.");
        const newTransactions = transactions.filter(t => t.id !== transId);
        setTransactions(newTransactions);
        calculateMetrics(newTransactions, budgets);
    } catch(err) {
        toast.error("Erro ao excluir transação.");
    } finally {
        setDeletingId(null);
    }
  };

  const handleDeleteBudget = async (budgetId: string) => {
    if(!confirm("Tem certeza que deseja excluir esta proposta?")) return;
    setDeletingId(budgetId);
    try {
        const { error } = await supabase.from('budgets').delete().eq('id', budgetId);
        if (error) throw error;
        toast.success("Proposta excluída.");
        const newBudgets = budgets.filter(b => b.id !== budgetId);
        setBudgets(newBudgets);
        calculateMetrics(transactions, newBudgets);
    } catch (err) {
        toast.error("Erro ao excluir proposta.");
    } finally {
        setDeletingId(null);
    }
  };

  const handleEditBudget = (budgetId: string) => {
    navigate(`../treatment-plans?edit=${budgetId}`);
  };

  const formatCurrency = (val: number) => {
      return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const getStatusBadge = (status: string) => {
      switch(status) {
          case 'approved': return <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase bg-emerald-50 text-emerald-600 border border-emerald-100">Aprovado</span>;
          case 'pending': return <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase bg-amber-50 text-amber-600 border border-amber-100">Pendente</span>;
          case 'rejected': return <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase bg-rose-50 text-rose-600 border border-rose-100">Recusado</span>;
          default: return <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase bg-gray-50 text-gray-500 border border-gray-200">{status}</span>;
      }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 bg-white dark:bg-gray-950">
      <Loader2 className="animate-spin text-emerald-600" size={40}/>
      <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em]">Carregando Financeiro...</p>
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto p-6 space-y-8 animate-in fade-in duration-700">
      
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="flex items-center gap-6">
          <div className="p-5 bg-emerald-50 dark:bg-emerald-900/20 rounded-[2rem] text-emerald-600">
            <DollarSign size={40} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter italic uppercase">Financeiro</h1>
            <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">Gestão de faturamento e orçamentos</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="h-12 rounded-xl border-gray-200 font-bold uppercase text-[10px] tracking-widest">
            <Receipt size={16} className="mr-2" /> Gerar Recibo
          </Button>
          <Button 
            onClick={() => navigate('../treatment-plans')}
            className="h-12 px-8 bg-gray-900 hover:bg-black text-white rounded-xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl"
          >
            <Plus size={18} className="mr-2 text-emerald-400" /> Nova Venda
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Pago (LTV)" value={formatCurrency(metrics.total)} sub="Recebido Histórico" type="up" />
        <StatCard title="A Receber" value={formatCurrency(metrics.pending)} sub="Transações Pendentes" type="down" />
        <StatCard title="Orçamentos Abertos" value={formatCurrency(metrics.openBudgets)} sub="Propostas Pendentes" />
        <StatCard title="Total de Vendas" value={transactions.length.toString()} sub="Transações" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
            
            <div className="flex border-b border-gray-100 dark:border-gray-700 overflow-x-auto">
              <button onClick={() => changeTab('transacoes')} className={`px-8 py-5 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'transacoes' ? 'text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/30' : 'text-gray-400 hover:text-gray-600'}`}>Transações</button>
              <button onClick={() => changeTab('orcamentos')} className={`px-8 py-5 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'orcamentos' ? 'text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/30' : 'text-gray-400 hover:text-gray-600'}`}>Orçamentos</button>
              <button onClick={() => changeTab('pacotes')} className={`px-8 py-5 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'pacotes' ? 'text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/30' : 'text-gray-400 hover:text-gray-600'}`}>Pacotes</button>
            </div>

            <div className="p-4">
              
              {/* TAB TRANSAÇÕES */}
              {activeTab === 'transacoes' && (
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
                                <td className="p-4 text-xs font-bold text-gray-500">{new Date(t.due_date || t.created_at).toLocaleDateString()}</td>
                                <td className="p-4">
                                <p className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-tighter italic">{t.description}</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t.payment_method || '---'}</p>
                                </td>
                                <td className="p-4 text-sm font-black text-gray-900 dark:text-white">{formatCurrency(Number(t.amount))}</td>
                                <td className="p-4">
                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border ${t.paid_at ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>{t.paid_at ? 'Pago' : 'Pendente'}</span>
                                </td>
                                <td className="p-4 text-right flex justify-end gap-1">
                                    <button className="p-2 text-gray-300 hover:text-emerald-500 transition-colors"><Receipt size={18} /></button>
                                    {isAdmin && (
                                      <button onClick={() => handleDeleteTransaction(t.id)} disabled={deletingId === t.id} className="p-2 text-gray-300 hover:text-red-500 transition-colors disabled:opacity-50">
                                          {deletingId === t.id ? <Loader2 className="animate-spin" size={18}/> : <Trash2 size={18}/>}
                                      </button>
                                    )}
                                </td>
                            </tr>
                            ))}
                        </tbody>
                        </table>
                    )}
                </>
              )}

              {/* TAB ORÇAMENTOS (Com Filtro!) */}
              {activeTab === 'orcamentos' && (
                <>
                    {budgets.filter(b => b.status === 'pending').length === 0 ? (
                        <div className="p-12 text-center text-gray-400 flex flex-col items-center gap-3">
                            <FileText size={40} className="opacity-20"/>
                            <p className="font-bold text-xs uppercase tracking-widest">Nenhum orçamento pendente.</p>
                        </div>
                    ) : (
                        <table className="w-full">
                        <thead>
                            <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 dark:border-gray-700">
                            <th className="text-left p-4">Criado em</th>
                            <th className="text-left p-4">Itens</th>
                            <th className="text-left p-4">Total</th>
                            <th className="text-left p-4">Status</th>
                            <th className="text-right p-4">Opções</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                            {budgets.filter(b => b.status === 'pending').map(b => (
                            <tr key={b.id} className="group hover:bg-gray-50/50 dark:hover:bg-gray-900/50 transition-colors">
                                <td className="p-4 text-xs font-bold text-gray-500">{new Date(b.created_at).toLocaleDateString()}</td>
                                <td className="p-4"><p className="text-xs font-bold text-gray-700 dark:text-gray-300">{Array.isArray(b.items) ? `${b.items.length} item(s)` : '---'}</p></td>
                                <td className="p-4 text-sm font-black text-gray-900 dark:text-white">{formatCurrency(Number(b.total))}</td>
                                <td className="p-4">{getStatusBadge(b.status)}</td>
                                <td className="p-4 flex justify-end gap-1">
                                    <button onClick={() => handleOpenApproveModal(b)} className="p-2 text-emerald-400 hover:text-emerald-600 transition-colors bg-emerald-50 rounded-lg mr-2" title="Aprovar e Vender"><CheckCircle2 size={16} /></button>
                                    <button onClick={() => handleEditBudget(b.id)} className="p-2 text-gray-400 hover:text-blue-500 transition-colors"><Edit size={16} /></button>
                                    <button className="p-2 text-gray-400 hover:text-emerald-500 transition-colors"><Printer size={16} /></button>
                                    <button onClick={() => handleDeleteBudget(b.id)} disabled={deletingId === b.id} className="p-2 text-gray-400 hover:text-rose-500 transition-colors disabled:opacity-50">
                                        {deletingId === b.id ? <Loader2 className="animate-spin" size={16}/> : <Trash2 size={16} />}
                                    </button>
                                </td>
                            </tr>
                            ))}
                        </tbody>
                        </table>
                    )}
                </>
              )}

              {/* TAB PACOTES (Com Botão Utilizar!) */}
              {activeTab === 'pacotes' && (
                <>
                  {activePackages.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center">
                      <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mb-4">
                        <Package size={24} className="text-gray-300" />
                      </div>
                      <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter">Nenhum pacote ativo</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Realize uma venda para gerar pacotes.</p>
                    </div>
                  ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 dark:border-gray-700">
                            <th className="text-left p-4">Procedimento</th>
                            <th className="text-left p-4">Sessões Totais</th>
                            <th className="text-left p-4">Restantes</th>
                            <th className="text-left p-4">Status</th>
                            <th className="text-right p-4">Utilizar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                            {activePackages.map(pkg => (
                            <tr key={pkg.id} className="group hover:bg-gray-50/50 dark:hover:bg-gray-900/50 transition-colors">
                                <td className="p-4">
                                    <p className="text-sm font-black text-gray-900 dark:text-white">{pkg.nome_plano}</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">{new Date(pkg.created_at).toLocaleDateString()}</p>
                                </td>
                                <td className="p-4 text-sm font-bold text-gray-600">{pkg.sessoes_totais}</td>
                                <td className="p-4">
                                    <span className="text-lg font-black text-emerald-600">{pkg.sessoes_restantes}</span>
                                </td>
                                <td className="p-4">
                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${pkg.status === 'ativo' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                                        {pkg.status}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    {pkg.sessoes_restantes > 0 && pkg.status === 'ativo' && (
                                        <button 
                                            onClick={() => handleConsumeSession(pkg)}
                                            disabled={consumingId === pkg.id}
                                            className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors flex items-center gap-2 ml-auto"
                                            title="Realizar Sessão"
                                        >
                                            {consumingId === pkg.id ? <Loader2 className="animate-spin" size={16}/> : <MinusCircle size={16} />}
                                            <span className="text-[10px] font-bold uppercase">Utilizar</span>
                                        </button>
                                    )}
                                </td>
                            </tr>
                            ))}
                        </tbody>
                    </table>
                  )}
                </>
              )}

            </div>
          </div>
        </div>

        {/* COLUNA DIREITA */}
        <div className="space-y-6">
          <div className="bg-gray-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
              <CreditCard size={100} />
            </div>
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-emerald-400 mb-8 flex items-center gap-2">
              <TrendingUp size={16}/> Resumo
            </h3>
            <div className="space-y-6">
               <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Ticket Médio</p>
                  <p className="text-2xl font-black italic tracking-tighter">
                      {transactions.length > 0 
                        ? formatCurrency(metrics.total / transactions.length)
                        : 'R$ 0,00'
                      }
                  </p>
               </div>
               <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Total de Orçamentos</p>
                  <p className="text-2xl font-black italic tracking-tighter">{budgets.filter(b => b.status === 'pending').length}</p>
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

      {modalAprovacaoOpen && budgetToApprove && (
        <ModalAprovarOrcamento 
          budget={budgetToApprove}
          isLoading={approving}
          onClose={() => setModalAprovacaoOpen(false)}
          onConfirm={handleConfirmApproval}
        />
      )}

    </div>
  );
}
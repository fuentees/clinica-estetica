import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { toast } from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext"; 
import { 
  DollarSign, 
  Plus, 
  Receipt, 
  ArrowLeft,
  ArrowRight,
  CheckCircle2, 
  Loader2,
  FileText, 
  Printer,
  Trash2,
  Play,
  Wallet,
  AlertCircle,
  Pencil // ✅ Importado para o botão editar
} from "lucide-react";
import { Button } from "../../components/ui/button";

// Modais e Componentes
import ModalAprovarOrcamento, { PaymentData } from "../../components/modal/ModalAprovacaoOrcamento";
import ProcedureExecution from '../../components/patients/ProcedureExecution';

const StatCard = ({ title, value, icon: Icon, colorClass }: any) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
    <div className={`p-3 rounded-xl ${colorClass}`}>
      <Icon size={24} />
    </div>
    <div>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{value}</h3>
    </div>
  </div>
);

interface Budget {
  id: string;
  created_at: string;
  total: number;
  status: string;
  items: any;
  clinic_id: string;
  professional_id?: string;
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

  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const [modalAprovacaoOpen, setModalAprovacaoOpen] = useState(false);
  const [budgetToApprove, setBudgetToApprove] = useState<Budget | null>(null);
  const [approving, setApproving] = useState(false);

  const [executionModalOpen, setExecutionModalOpen] = useState(false);
  const [selectedPlanForExecution, setSelectedPlanForExecution] = useState<any>(null);

  const changeTab = (tab: string) => {
    setSearchParams({ tab });
    setCurrentPage(1);
  };

  useEffect(() => {
    if (id) fetchFinancialData();
  }, [id, activeTab]);

  async function fetchFinancialData() {
    try {
      setLoading(true);
      
      const { data: transData } = await supabase
        .from('transactions')
        .select(`*, service:services(name)`)
        .eq('patient_id', id)
        .neq('category', 'Comissões')
        .order('created_at', { ascending: false });

      const { data: budgetData } = await supabase
        .from('budgets')
        .select('*')
        .eq('patient_id', id)
        .order('created_at', { ascending: false });

      const { data: packagesData } = await supabase
        .from('planos_clientes')
        .select(`*, service:services (id, name)`)
        .eq('cliente_id', id)
        .order('created_at', { ascending: false });

      setTransactions(transData || []);
      
      const formattedBudgets = (budgetData || []).map((b: any) => ({
          ...b,
          items: typeof b.items === 'string' ? JSON.parse(b.items) : b.items
      }));
      setBudgets(formattedBudgets);
      
      const normalizedPackages = (packagesData || []).map((pkg: any) => ({
         ...pkg,
         service_id: pkg.service_id || pkg.service?.id || pkg.procedure_id
      }));
      setActivePackages(normalizedPackages);

      calculateMetrics(transData || [], budgetData || []);

    } catch (error) {
      console.error("Erro financeiro:", error);
    } finally {
      setLoading(false);
    }
  }

  const calculateMetrics = (currentTransactions: any[], currentBudgets: any[]) => {
      const incomeTrans = currentTransactions.filter(t => t.type === 'income');
      const totalPaid = incomeTrans.filter(t => t.paid_at || t.status === 'paid').reduce((acc, curr) => acc + Number(curr.amount), 0);
      const totalPending = incomeTrans.filter(t => !t.paid_at && t.status !== 'paid').reduce((acc, curr) => acc + Number(curr.amount), 0);
      const totalOpenBudgets = currentBudgets.filter((b: Budget) => b.status === 'pending').reduce((acc, curr) => acc + Number(curr.total), 0);
      setMetrics({ total: totalPaid, pending: totalPending, openBudgets: totalOpenBudgets });
  };

  const getPaginatedData = (data: any[]) => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return data.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  };

  const renderPaginationControls = (totalItems: number) => {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    if (totalPages <= 1) return null;
    return (
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700 print:hidden">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Página {currentPage} de {totalPages}</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="h-8 rounded-lg"><ArrowLeft size={14} className="mr-1" /> Anterior</Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="h-8 rounded-lg">Próximo <ArrowRight size={14} className="ml-1" /></Button>
        </div>
      </div>
    );
  };

  const handleExecutionSuccess = () => {
      setExecutionModalOpen(false);
      setSelectedPlanForExecution(null);
      fetchFinancialData();
      toast.success("Procedimento realizado!");
  };

  const handleDeleteBudget = async (budgetId: string) => {
    if (!confirm("Deseja realmente excluir este orçamento pendente?")) return;
    try {
      const { error } = await supabase.from('budgets').delete().eq('id', budgetId);
      if (error) throw error;
      toast.success("Orçamento excluído!");
      fetchFinancialData();
    } catch (error) {
      toast.error("Erro ao excluir orçamento.");
    }
  };

  const handleConfirmApproval = async (paymentData: PaymentData) => {
    if (!budgetToApprove) return;
    setApproving(true);
    
    try {
      const firstItem = budgetToApprove.items?.[0];
      const serviceName = firstItem?.name || "Procedimento Estético";
      const serviceId = firstItem?.id || firstItem?.service_id || null;

      await supabase.from('budgets').update({ status: 'approved' }).eq('id', budgetToApprove.id);
      const now = new Date().toISOString();

      await supabase.from('transactions').insert({
          clinic_id: budgetToApprove.clinic_id, 
          patient_id: id, 
          service_id: serviceId,
          budget_id: budgetToApprove.id,
          amount: budgetToApprove.total,
          type: 'income', 
          category: 'Venda', 
          description: serviceName, 
          payment_method: paymentData.method, 
          due_date: now,
          paid_at: paymentData.paidNow ? now : null,
          status: paymentData.paidNow ? 'paid' : 'pending',
          professional_id: budgetToApprove.professional_id 
      });

      if (budgetToApprove.professional_id) {
          const { data: profData } = await supabase.from('profiles').select('commission_rate').eq('id', budgetToApprove.professional_id).single();
          const rate = Number(profData?.commission_rate) || 0;
          if (rate > 0) {
              const commissionValue = (budgetToApprove.total * rate) / 100;
              await supabase.from('transactions').insert({
                  clinic_id: budgetToApprove.clinic_id,
                  professional_id: budgetToApprove.professional_id, 
                  amount: commissionValue,
                  type: 'expense', 
                  category: 'Comissões', 
                  description: `Comissão - ${serviceName}`,
                  status: 'pending', 
                  created_at: now,
                  due_date: now
              });
          }
      }

      if (budgetToApprove.items && Array.isArray(budgetToApprove.items)) {
          const packagesToCreate = budgetToApprove.items.map((item: any) => ({
              clinic_id: budgetToApprove.clinic_id, cliente_id: id, service_id: item.id || item.service_id,
              nome_plano: item.name, sessoes_totais: Number(item.qty) || 1, sessoes_restantes: Number(item.qty) || 1, status: 'active'
          }));
          await supabase.from('planos_clientes').insert(packagesToCreate);
      }

      toast.success("Venda aprovada!");
      setModalAprovacaoOpen(false);
      fetchFinancialData();
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    } finally {
      setApproving(false);
    }
  };

  const handleDeleteTransaction = async (transId: string) => {
    if(!isAdmin) return toast.error("Acesso negado.");
    if(!confirm("Excluir registro financeiro?")) return;
    setDeletingId(transId);
    try {
        await supabase.from('transactions').delete().eq('id', transId);
        toast.success("Removido.");
        fetchFinancialData();
    } catch { toast.error("Erro."); } finally { setDeletingId(null); }
  };

  const handleDeletePackage = async (packageId: string) => {
    if (!confirm("Excluir pacote permanentemente?")) return;
    await supabase.from('planos_clientes').delete().eq('id', packageId);
    fetchFinancialData();
  };

  const handleOpenApproveModal = (budget: Budget) => {
    setBudgetToApprove(budget);
    setModalAprovacaoOpen(true);
  };

  const handleOpenExecutionModal = (pkg: any) => {
      const validId = pkg.service_id || pkg.service?.id;
      if (!validId) return toast.error("Erro de vínculo do serviço.");
      setSelectedPlanForExecution({ ...pkg, service_id: validId });
      setExecutionModalOpen(true);
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-emerald-600" size={40}/></div>;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 animate-in fade-in pb-20 print:p-0">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 print:hidden">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-100/50 rounded-xl text-emerald-600"><DollarSign size={32} /></div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Financeiro do Paciente</h1>
            <p className="text-gray-500 text-sm font-medium">Controle total de transações e procedimentos.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => window.print()} className="font-bold uppercase text-[10px] tracking-widest"><Printer size={16} className="mr-2" /> Imprimir</Button>
          <Button onClick={() => navigate(`/patients/${id}/treatment-plans`)} className="bg-gray-900 text-white font-bold uppercase text-[10px] tracking-widest"><Plus size={16} className="mr-2" /> Nova Venda</Button>
        </div>
      </div>

      {/* MÉTRICAS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:grid-cols-4">
        <StatCard title="Total Pago" value={formatCurrency(metrics.total)} icon={Wallet} colorClass="bg-blue-50 text-blue-600" />
        <StatCard title="Pendente" value={formatCurrency(metrics.pending)} icon={AlertCircle} colorClass="bg-rose-50 text-rose-600" />
        <StatCard title="Em Aberto" value={formatCurrency(metrics.openBudgets)} icon={FileText} colorClass="bg-purple-50 text-purple-600" />
        <StatCard title="Sessões Ativas" value={activePackages.reduce((acc, p) => acc + (p.sessoes_restantes || 0), 0).toString()} icon={CheckCircle2} colorClass="bg-emerald-50 text-emerald-600" />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[500px]">
        <div className="flex border-b overflow-x-auto print:hidden bg-gray-50/50">
          {['transacoes', 'orcamentos', 'pacotes'].map((tab) => (
            <button key={tab} onClick={() => changeTab(tab)} className={`px-8 py-4 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === tab ? 'text-emerald-600 border-emerald-500 bg-white' : 'text-gray-400 border-transparent hover:text-gray-600'}`}>
              {tab}
            </button>
          ))}
        </div>

        <div className="p-0">
          {/* TABELA TRANSAÇÕES */}
          {activeTab === 'transacoes' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50 text-gray-400 font-black uppercase text-[10px] tracking-widest border-b">
                  <tr>
                    <th className="p-4">Data</th>
                    <th className="p-4">Procedimento / Detalhe</th>
                    <th className="p-4">Valor</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right print:hidden">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm">
                  {getPaginatedData(transactions).map(t => (
                    <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 text-gray-500">{new Date(t.created_at).toLocaleDateString()}</td>
                      <td className="p-4 font-bold text-gray-800 uppercase text-[11px]">
                        {t.service?.name || t.description}
                      </td>
                      <td className={`p-4 font-black text-emerald-600`}>{formatCurrency(t.amount)}</td>
                      <td className="p-4">{t.paid_at || t.status === 'paid' ? <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md text-[9px] font-black uppercase">Pago</span> : <span className="text-rose-600 bg-rose-50 px-2 py-1 rounded-md text-[9px] font-black uppercase">Pendente</span>}</td>
                      <td className="p-4 text-right print:hidden flex justify-end gap-1">
                          <button className="p-2 text-gray-300 hover:text-emerald-600"><Receipt size={18}/></button>
                          {isAdmin && (
                            <button onClick={() => handleDeleteTransaction(t.id)} className="p-2 text-gray-300 hover:text-rose-600" disabled={deletingId === t.id}>
                                {deletingId === t.id ? <Loader2 className="animate-spin" size={18}/> : <Trash2 size={18}/>}
                            </button>
                          )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {renderPaginationControls(transactions.length)}
            </div>
          )}

          {/* TABELA ORÇAMENTOS - ✅ ATUALIZADA COM EDITAR E EXCLUIR */}
          {activeTab === 'orcamentos' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50 text-gray-400 font-black uppercase text-[10px] tracking-widest border-b">
                  <tr>
                    <th className="p-4">Criado em</th>
                    <th className="p-4 w-1/3">Itens do Plano</th>
                    <th className="p-4">Total</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right print:hidden">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm">
                  {getPaginatedData(budgets.filter(b => b.status === 'pending')).map(b => (
                    <tr key={b.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="p-4 text-gray-500">{new Date(b.created_at).toLocaleDateString()}</td>
                      <td className="p-4">
                        {Array.isArray(b.items) && (
                            <div className="flex flex-col gap-1">
                                {b.items.map((item: any, idx: number) => (
                                    <span key={idx} className="text-[11px] font-bold text-gray-700 flex items-center gap-2 uppercase">
                                        <span className="bg-gray-100 px-1.5 rounded text-[10px]">{item.qty}x</span> {item.name}
                                    </span>
                                ))}
                            </div>
                        )}
                      </td>
                      <td className="p-4 font-black">{formatCurrency(b.total)}</td>
                      <td className="p-4"><span className="px-2 py-1 rounded-md text-[9px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-200">Pendente</span></td>
                      <td className="p-4 text-right print:hidden">
                        <div className="flex justify-end gap-2 items-center">
                          {/* Botão Editar: Leva de volta para a montagem do plano */}
                          <button 
                            onClick={() => navigate(`/patients/${id}/treatment-plans`)} 
                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Editar Orçamento"
                          >
                            <Pencil size={18} />
                          </button>
                          
                          {/* Botão Excluir */}
                          <button 
                            onClick={() => handleDeleteBudget(b.id)} 
                            className="p-2 text-gray-400 hover:text-rose-600 transition-colors"
                            title="Excluir Orçamento"
                          >
                            <Trash2 size={18} />
                          </button>

                          <button 
                            onClick={() => handleOpenApproveModal(b)} 
                            className="ml-2 px-3 py-1.5 text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors border border-emerald-100"
                          >
                            Aprovar Venda
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {budgets.filter(b => b.status === 'pending').length === 0 && (
                    <tr><td colSpan={5} className="p-8 text-center text-gray-400 italic">Nenhum orçamento pendente.</td></tr>
                  )}
                </tbody>
              </table>
              {renderPaginationControls(budgets.filter(b => b.status === 'pending').length)}
            </div>
          )}

          {/* TABELA PACOTES */}
          {activeTab === 'pacotes' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50 text-gray-400 font-black uppercase text-[10px] tracking-widest border-b">
                  <tr>
                    <th className="p-4">Procedimento</th>
                    <th className="p-4">Saldo</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right print:hidden">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm">
                  {getPaginatedData(activePackages).map(pkg => (
                    <tr key={pkg.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4">
                        <p className="font-bold text-gray-800 uppercase text-[11px]">{pkg.nome_plano || pkg.service?.name}</p>
                      </td>
                      <td className="p-4"><span className={`font-black text-lg ${pkg.sessoes_restantes === 0 ? 'text-gray-300' : 'text-emerald-600'}`}>{pkg.sessoes_restantes}</span><span className="text-gray-400 font-bold"> / {pkg.sessoes_totais}</span></td>
                      <td className="p-4">{pkg.sessoes_restantes > 0 ? <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-[9px] font-black uppercase">Ativo</span> : <span className="px-2 py-1 bg-gray-50 text-gray-400 rounded-md text-[9px] font-black uppercase">Concluído</span>}</td>
                      <td className="p-4 text-right print:hidden flex justify-end gap-2">
                          <button onClick={() => handleDeletePackage(pkg.id)} className="p-2 text-gray-300 hover:text-rose-600 transition-colors"><Trash2 size={18} /></button>
                          {pkg.sessoes_restantes > 0 && <button onClick={() => handleOpenExecutionModal(pkg)} className="px-4 py-2 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all shadow-sm"><Play size={12} fill="currentColor"/> Realizar</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {renderPaginationControls(activePackages.length)}
            </div>
          )}
        </div>
      </div>

      {/* MODAIS */}
      {executionModalOpen && selectedPlanForExecution && (
        <ProcedureExecution isOpen={executionModalOpen} onClose={() => setExecutionModalOpen(false)} onSuccess={handleExecutionSuccess} plan={selectedPlanForExecution} />
      )}
      
      {modalAprovacaoOpen && budgetToApprove && (
        <ModalAprovarOrcamento budget={budgetToApprove} isLoading={approving} onClose={() => setModalAprovacaoOpen(false)} onConfirm={handleConfirmApproval} />
      )}
    </div>
  );
}

function formatCurrency(val: number) {
  return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
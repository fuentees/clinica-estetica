import { useState, useEffect } from "react";
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  FileText, 
  Sparkles, 
  Syringe, 
  Zap, 
  ShoppingBag, 
  Loader2,
  Tag,
  Calendar,
  CheckCircle2
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom"; 
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/ui/button";
import { toast } from "react-hot-toast";

// IMPORT DO SEU MODAL
import ModalAgendarSessao from "../../components/modal/ModalAgendarSessao";

// Interfaces
interface Procedure {
  id: string;
  name: string;
  category: string;
  price: number;
  description?: string;
}

interface BudgetItem extends Procedure {
  qty: number;
  internalId: string;
}

interface ClientPlan {
  id: string;
  nome_plano: string;
  sessoes_totais: number;
  sessoes_restantes: number;
}

export function PatientPlanningPage() {
  const { id: patientId } = useParams();
  const navigate = useNavigate(); 
  
  const [loading, setLoading] = useState(true);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [activePlans, setActivePlans] = useState<ClientPlan[]>([]);
  
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("todos");
  const [clinicId, setClinicId] = useState<string | null>(null);
  
  const [selectedItems, setSelectedItems] = useState<BudgetItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  const [modalAberto, setModalAberto] = useState(false);
  const [planoParaAgendar, setPlanoParaAgendar] = useState<ClientPlan | null>(null);

  useEffect(() => {
    async function initPage() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
            .from('profiles')
            .select('clinic_id') 
            .eq('id', user.id)
            .single();

        const currentClinicId = profile?.clinic_id || user.id;
        setClinicId(currentClinicId);

        const { data: servicesData } = await supabase
          .from('services')
          .select('*')
          .eq('clinic_id', currentClinicId)
          .eq('is_active', true)
          .order('name');

        if (servicesData) setProcedures(servicesData);

        if (patientId) {
            const { data: plansData, error: plansError } = await supabase
                .from('planos_clientes')
                .select('*')
                .eq('cliente_id', patientId)
                .gt('sessoes_restantes', 0);

            if (!plansError && plansData) {
                setActivePlans(plansData);
            }
        }

      } catch (err) {
        console.error("Erro ao carregar:", err);
        toast.error("Erro ao carregar dados.");
      } finally {
        setLoading(false);
      }
    }
    initPage();
  }, [patientId]);

  const handleAgendarClick = (plano: ClientPlan) => {
    setPlanoParaAgendar(plano);
    setModalAberto(true);
  };

  const handleModalClose = () => {
    setModalAberto(false);
    setPlanoParaAgendar(null);
    window.location.reload(); 
  };

  const addItem = (proc: Procedure) => {
    const existing = selectedItems.find(i => i.id === proc.id);
    if (existing) {
      setSelectedItems(selectedItems.map(i => 
        i.id === proc.id ? { ...i, qty: i.qty + 1 } : i
      ));
    } else {
      setSelectedItems([...selectedItems, { ...proc, qty: 1, internalId: crypto.randomUUID() }]);
    }
  };

  const updateQty = (internalId: string, delta: number) => {
    setSelectedItems(prev => prev.map(item => {
      if (item.internalId === internalId) {
        const newQty = Math.max(1, item.qty + delta);
        return { ...item, qty: newQty };
      }
      return item;
    }));
  };

  const removeItem = (internalId: string) => {
    setSelectedItems(selectedItems.filter(i => i.internalId !== internalId));
  };

  const subtotal = selectedItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const total = Math.max(0, subtotal - discount);

  const filteredProcedures = procedures.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const pCat = p.category?.toLowerCase() || '';
    const matchesCategory = activeCategory === "todos" || pCat.includes(activeCategory);
    return matchesSearch && matchesCategory;
  });

  const handleSaveBudget = async () => {
     if(selectedItems.length === 0) return toast.error("O orçamento está vazio.");
     if(!clinicId) return toast.error("Erro: Clínica não identificada.");
     
     setSaving(true);
     try {
        const { data: { user } } = await supabase.auth.getUser();
        if(!user) throw new Error("Usuário não logado");

        const { error } = await supabase.from('budgets').insert({
            clinic_id: clinicId,
            patient_id: patientId,
            professional_id: user.id,
            items: selectedItems,
            subtotal,
            discount,
            total,
            status: 'pending'
        });
        
        if (error) throw error;
        
        toast.success("Proposta gerada com sucesso!");
        setSelectedItems([]);
        setDiscount(0);
        
        // Redireciona para o financeiro
        navigate(`../financial`); 
        
     } catch (e: any) {
        console.error("Erro ao salvar:", e);
        toast.error(`Erro: ${e.message || "Falha ao salvar"}`);
     } finally {
        setSaving(false);
     }
  };

  const getIcon = (cat: string) => {
     const c = cat?.toLowerCase() || '';
     if (c.includes('toxina') || c.includes('preenchedor')) return <Syringe size={18}/>;
     if (c.includes('tecnologia') || c.includes('laser')) return <Zap size={18}/>;
     return <Sparkles size={18}/>;
  };

  if (loading) return (
    <div className="p-10 h-96 flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-pink-500 w-10 h-10"/>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sincronizando...</p>
    </div>
  );

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col xl:flex-row gap-6 animate-in fade-in duration-500">
      <div className="flex-1 flex flex-col gap-6 h-full overflow-hidden">
         {activePlans.length > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800 p-6 rounded-3xl border border-blue-100 dark:border-gray-700 shrink-0">
                <div className="flex items-center gap-2 mb-4">
                    <CheckCircle2 className="text-blue-600" size={20} />
                    <h3 className="font-bold text-blue-900 dark:text-blue-100">Planos Ativos</h3>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-2">
                    {activePlans.map(plano => (
                        <div key={plano.id} className="min-w-[220px] bg-white dark:bg-gray-900 p-4 rounded-2xl border border-blue-100 shadow-sm flex flex-col justify-between">
                            <div>
                                <h4 className="font-bold text-gray-900 dark:text-white text-sm">{plano.nome_plano}</h4>
                                <div className="mt-2">
                                    <span className="text-2xl font-black text-blue-600">{plano.sessoes_restantes}</span>
                                    <span className="text-xs text-gray-500 font-medium"> / {plano.sessoes_totais}</span>
                                </div>
                            </div>
                            <Button onClick={() => handleAgendarClick(plano)} className="mt-3 w-full bg-blue-600 text-white h-8 text-xs font-bold">
                                <Calendar size={14} className="mr-2" /> Agendar
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
         )}

         <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 shadow-sm shrink-0">
             <div className="relative mb-6">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                 <input 
                   type="text" 
                   placeholder="Buscar procedimento..." 
                   value={search}
                   onChange={(e) => setSearch(e.target.value)}
                   className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-pink-500/20"
                 />
             </div>
             <div className="flex gap-2 overflow-x-auto pb-1">
                {['todos', 'toxina', 'preenchedor', 'tecnologia', 'facial', 'corporal'].map(cat => (
                   <button 
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                         activeCategory === cat ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-500'
                      }`}
                   >
                      {cat}
                   </button>
                ))}
             </div>
         </div>

         <div className="flex-1 overflow-y-auto pr-2">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-20">
                {filteredProcedures.map((proc) => (
                   <button key={proc.id} onClick={() => addItem(proc)} className="flex flex-col text-left bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 hover:border-pink-300 transition-all">
                      <div className="flex justify-between items-start w-full mb-3">
                         <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-pink-50 text-pink-500">
                            {getIcon(proc.category)}
                         </div>
                         <span className="bg-gray-50 dark:bg-gray-900 px-3 py-1 rounded-lg text-xs font-bold">
                            R$ {Number(proc.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                         </span>
                      </div>
                      <h4 className="font-bold text-gray-900 dark:text-white text-sm">{proc.name}</h4>
                      <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">{proc.category}</p>
                   </button>
                ))}
             </div>
         </div>
      </div>

      <div className="xl:w-[450px] shrink-0 flex flex-col h-full bg-white dark:bg-gray-800 border border-gray-100 rounded-[2.5rem] shadow-xl overflow-hidden">
          <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-b">
             <div className="flex items-center gap-3">
                <FileText className="text-pink-500" size={20}/>
                <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase">Novo Orçamento</h2>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
             {selectedItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-300 opacity-40">
                   <ShoppingBag size={24} className="mb-2"/>
                   <p className="text-[10px] font-black uppercase">Carrinho Vazio</p>
                </div>
             ) : (
                selectedItems.map((item) => (
                   <div key={item.internalId} className="flex items-center justify-between">
                      <div className="flex-1">
                          <p className="text-xs font-bold">{item.name}</p>
                          <p className="text-[10px] text-gray-400">R$ {Number(item.price).toLocaleString('pt-BR')}</p>
                      </div>
                      <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900 rounded-lg p-1">
                          <button onClick={() => updateQty(item.internalId, -1)} className="w-6 h-6 flex items-center justify-center text-gray-400"><Minus size={12}/></button>
                          <span className="text-xs font-bold">{item.qty}</span>
                          <button onClick={() => updateQty(item.internalId, 1)} className="w-6 h-6 flex items-center justify-center text-gray-400"><Plus size={12}/></button>
                      </div>
                      <button onClick={() => removeItem(item.internalId)} className="ml-3 text-gray-300 hover:text-red-500"><Trash2 size={16}/></button>
                   </div>
                ))
             )}
          </div>

          <div className="p-6 bg-gray-50 dark:bg-gray-900 border-t space-y-4">
             <div className="space-y-2">
                <div className="flex justify-between text-[10px] text-gray-400 font-black uppercase">
                   <span>Subtotal</span>
                   <span>R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-emerald-600 font-black uppercase">
                   <span className="flex items-center gap-1"><Tag size={12}/> Desconto</span>
                   <input 
                      type="number" 
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                      className="w-20 text-right bg-white border rounded-lg px-2 py-1 font-bold"
                   />
                </div>
                <div className="pt-3 border-t flex justify-between items-end">
                   <span className="text-sm font-black uppercase italic">Total</span>
                   <span className="text-2xl font-black italic">R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
             </div>
             <Button onClick={handleSaveBudget} disabled={saving || selectedItems.length === 0} className="w-full h-14 bg-gray-900 text-white rounded-2xl font-black uppercase shadow-xl flex items-center justify-center gap-2">
                {saving ? <Loader2 className="animate-spin"/> : <Sparkles size={18} className="text-pink-500"/>}
                Gerar Proposta
             </Button>
          </div>
      </div>

      {modalAberto && planoParaAgendar && patientId && (
        <ModalAgendarSessao 
            clienteSelecionado={{ id: patientId, nome: 'Paciente Atual' }} 
            planoSelecionado={planoParaAgendar}
            onClose={handleModalClose}
        />
      )}
    </div>
  );
}

export default PatientPlanningPage; // CORRIGIDO: Sem o "a" no final!
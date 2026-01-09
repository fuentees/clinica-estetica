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
  Calendar, // <--- Novo ícone
  CheckCircle2 // <--- Novo ícone
} from "lucide-react";
import { useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/ui/button";
import { toast } from "react-hot-toast";

// IMPORT DO SEU MODAL (Verifique se a pasta é 'modal' ou 'modals')
import ModalAgendarSessao from "../../components/modal/ModalAgendarSessao";

// Interface alinhada com a tabela 'services'
interface Procedure {
  id: string;
  name: string;
  category: string;
  price: number;
  description?: string;
}

// Interface do Item no Orçamento
interface BudgetItem extends Procedure {
  qty: number;
  internalId: string;
}

// Interface para os Planos que o cliente JÁ TEM (Vindo do SQL que criamos)
interface ClientPlan {
  id: string;
  nome_plano: string;
  sessoes_totais: number;
  sessoes_restantes: number;
}

export function PatientPlanningPage() {
  const { id: patientId } = useParams();
  const [loading, setLoading] = useState(true);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  
  // Estado dos Planos Ativos (Pacotes comprados)
  const [activePlans, setActivePlans] = useState<ClientPlan[]>([]);
  
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("todos");
  const [clinicId, setClinicId] = useState<string | null>(null);
  
  // Estado do Orçamento (Carrinho)
  const [selectedItems, setSelectedItems] = useState<BudgetItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  // ESTADOS DO MODAL DE AGENDAMENTO
  const [modalAberto, setModalAberto] = useState(false);
  const [planoParaAgendar, setPlanoParaAgendar] = useState<ClientPlan | null>(null);

  // 1. CARREGAR DADOS (Serviços + Planos do Cliente)
  useEffect(() => {
    async function initPage() {
      try {
        setLoading(true);
        
        // Identificar Usuário e Clínica
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
            .from('profiles')
            .select('clinic_id:clinic_id')
            .eq('id', user.id)
            .single();

        if (profile?.clinic_id) {
            setClinicId(profile.clinic_id);

            // A. BUSCA OS SERVIÇOS (CATÁLOGO)
            const { data: servicesData } = await supabase
              .from('services')
              .select('*')
              .eq('clinic_id', profile.clinic_id)
              .eq('is_active', true)
              .order('name');

            if (servicesData) setProcedures(servicesData);

            // B. BUSCA OS PLANOS ATIVOS DO CLIENTE (Novo!)
            // Só busca se tiver patientId
            if (patientId) {
                const { data: plansData, error: plansError } = await supabase
                    .from('planos_clientes') // A tabela que criamos no SQL
                    .select('*')
                    .eq('cliente_id', patientId)
                    .gt('sessoes_restantes', 0); // Só traz o que tem saldo

                if (!plansError && plansData) {
                    setActivePlans(plansData);
                }
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

  // Função para abrir o modal
  const handleAgendarClick = (plano: ClientPlan) => {
    setPlanoParaAgendar(plano);
    setModalAberto(true);
  };

  // Função chamada quando o modal fecha (para atualizar o saldo na tela)
  const handleModalClose = () => {
    setModalAberto(false);
    setPlanoParaAgendar(null);
    // Opcional: Recarregar a página ou fazer um fetch novo para atualizar o saldo visualmente
    window.location.reload(); 
  };

  // 2. LÓGICA DO CARRINHO
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

  // Cálculos
  const subtotal = selectedItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const total = Math.max(0, subtotal - discount);

  // Filtros
  const filteredProcedures = procedures.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const pCat = p.category?.toLowerCase() || '';
    const matchesCategory = activeCategory === "todos" || pCat.includes(activeCategory);
    return matchesSearch && matchesCategory;
  });

  // 3. SALVAR ORÇAMENTO
  const handleSaveBudget = async () => {
     if(selectedItems.length === 0) return toast.error("O orçamento está vazio.");
     if(!clinicId) return toast.error("Clínica não identificada.");
     
     setSaving(true);
     try {
        const { error } = await supabase.from('treatment_plans').insert({
            clinic_id: clinicId,
            patient_id: patientId, 
            notes: `Orçamento gerado via painel de planejamento`,
            items: selectedItems,
            subtotal,
            discount,
            total,
            status: 'pending',
            date: new Date().toISOString()
        });
        
        if (error) throw error;
        toast.success("Proposta gerada com sucesso!");
        setSelectedItems([]);
        setDiscount(0);
     } catch (e: any) {
        console.error(e);
        toast.error("Erro ao salvar orçamento.");
     } finally {
        setSaving(false);
     }
  };

  // Helper de Ícones
  const getIcon = (cat: string) => {
     const c = cat?.toLowerCase() || '';
     if (c.includes('toxina') || c.includes('preenchedor') || c.includes('bioestimulador') || c.includes('injet')) return <Syringe size={18}/>;
     if (c.includes('tecnologia') || c.includes('laser')) return <Zap size={18}/>;
     if (c.includes('facial') || c.includes('corporal')) return <Sparkles size={18}/>;
     return <ShoppingBag size={18}/>;
  };

  const categories = [
    { id: 'todos', label: 'Tudo' },
    { id: 'toxina', label: 'Toxina' },
    { id: 'preenchedor', label: 'Preenchedores' },
    { id: 'bioestimulador', label: 'Bioestimuladores' },
    { id: 'tecnologia', label: 'Tecnologias' },
    { id: 'facial', label: 'Faciais' },
    { id: 'corporal', label: 'Corporais' },
  ];

  if (loading) return (
    <div className="p-10 h-96 flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-pink-500 w-10 h-10"/>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sincronizando Catálogo...</p>
    </div>
  );

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col xl:flex-row gap-6 animate-in fade-in duration-500">
      
      {/* --- COLUNA ESQUERDA: CATÁLOGO + PLANOS ATIVOS --- */}
      <div className="flex-1 flex flex-col gap-6 h-full overflow-hidden">
         
         {/* --- SEÇÃO NOVA: PLANOS ATIVOS DO CLIENTE --- */}
         {activePlans.length > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800 p-6 rounded-3xl border border-blue-100 dark:border-gray-700 shrink-0">
                <div className="flex items-center gap-2 mb-4">
                    <CheckCircle2 className="text-blue-600" size={20} />
                    <h3 className="font-bold text-blue-900 dark:text-blue-100">Planos Contratados (Disponíveis)</h3>
                </div>
                
                <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                    {activePlans.map(plano => (
                        <div key={plano.id} className="min-w-[220px] bg-white dark:bg-gray-900 p-4 rounded-2xl border border-blue-100 dark:border-gray-700 shadow-sm flex flex-col justify-between">
                            <div>
                                <h4 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-1">{plano.nome_plano}</h4>
                                <div className="mt-2 flex items-baseline gap-1">
                                    <span className="text-2xl font-black text-blue-600">{plano.sessoes_restantes}</span>
                                    <span className="text-xs text-gray-500 font-medium">/ {plano.sessoes_totais} sessões</span>
                                </div>
                            </div>
                            <Button 
                                onClick={() => handleAgendarClick(plano)}
                                className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2"
                            >
                                <Calendar size={14} /> Agendar
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
         )}
         {/* ----------------------------------------------- */}

         <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm shrink-0">
             <div className="relative mb-6">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                 <input 
                    type="text" 
                    placeholder="Buscar novo procedimento para venda..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-pink-500/20 transition-all font-medium text-gray-900 dark:text-white"
                 />
             </div>
             
             <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {categories.map(cat => (
                   <button 
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                         activeCategory === cat.id 
                         ? 'bg-gray-900 text-white shadow-md' 
                         : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300'
                      }`}
                   >
                      {cat.label}
                   </button>
                ))}
             </div>
         </div>

         <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
             {filteredProcedures.length === 0 ? (
                 <div className="h-64 flex flex-col items-center justify-center text-center opacity-50">
                    <ShoppingBag size={48} className="text-gray-300 mb-4"/>
                    <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">Nenhum serviço encontrado.</p>
                 </div>
             ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-20">
                    {filteredProcedures.map((proc) => (
                       <button 
                          key={proc.id} 
                          onClick={() => addItem(proc)}
                          className="flex flex-col text-left bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-gray-700 hover:border-pink-300 dark:hover:border-pink-700 hover:shadow-md transition-all group"
                       >
                          <div className="flex justify-between items-start w-full mb-3">
                             <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors bg-pink-50 text-pink-500`}>
                                {getIcon(proc.category)}
                             </div>
                             <span className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-1 rounded-lg text-xs font-bold border border-gray-200 dark:border-gray-700">
                                R$ {Number(proc.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                             </span>
                          </div>
                          <h4 className="font-bold text-gray-900 dark:text-white text-sm group-hover:text-pink-600 transition-colors line-clamp-2">
                             {proc.name}
                          </h4>
                          <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-wider">{proc.category}</p>
                       </button>
                    ))}
                 </div>
             )}
         </div>
      </div>

      {/* --- COLUNA DIREITA: O ORÇAMENTO --- */}
      <div className="xl:w-[450px] shrink-0 flex flex-col h-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-[2.5rem] shadow-xl overflow-hidden relative">
          
          <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
             <div className="flex items-center gap-3 mb-1">
                <FileText className="text-pink-500" size={20}/>
                <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Novo Orçamento</h2>
             </div>
             <p className="text-xs text-gray-500 pl-8">Adicione itens para compor a proposta</p>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
             {selectedItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-300 space-y-4 opacity-40">
                   <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                      <ShoppingBag size={24}/>
                   </div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-center">Selecione procedimentos</p>
                </div>
             ) : (
                selectedItems.map((item) => (
                   <div key={item.internalId} className="group flex items-center justify-between animate-in slide-in-from-right-4">
                      <div className="flex-1">
                          <p className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1">{item.name}</p>
                          <p className="text-[10px] text-gray-400 font-bold">R$ {Number(item.price).toLocaleString('pt-BR')} un.</p>
                      </div>
                      
                      <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900 rounded-lg p-1 border border-gray-100 dark:border-gray-700">
                          <button onClick={() => updateQty(item.internalId, -1)} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-white rounded-md transition-all">
                             <Minus size={12}/>
                          </button>
                          <span className="text-xs font-bold w-4 text-center">{item.qty}</span>
                          <button onClick={() => updateQty(item.internalId, 1)} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-green-500 hover:bg-white rounded-md transition-all">
                             <Plus size={12}/>
                          </button>
                      </div>

                      <button onClick={() => removeItem(item.internalId)} className="ml-3 text-gray-300 hover:text-red-500 transition-colors">
                          <Trash2 size={16}/>
                      </button>
                   </div>
                ))
             )}
          </div>

          <div className="p-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700 space-y-4">
             <div className="space-y-2">
                <div className="flex justify-between text-[10px] text-gray-400 font-black uppercase tracking-widest">
                   <span>Subtotal</span>
                   <span>R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                
                <div className="flex justify-between items-center text-[10px] text-emerald-600 font-black uppercase tracking-widest">
                   <span className="flex items-center gap-1"><Tag size={12}/> Desconto (R$)</span>
                   <input 
                      type="number" 
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                      className="w-20 text-right bg-white border border-emerald-100 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-emerald-500 font-bold"
                   />
                </div>

                <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-end">
                   <span className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">Total Final</span>
                   <span className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter italic">
                      R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                   </span>
                </div>
             </div>

             <Button 
                onClick={handleSaveBudget}
                disabled={saving || selectedItems.length === 0}
                className="w-full h-14 bg-gray-900 hover:bg-black text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
             >
                {saving ? <Loader2 className="animate-spin"/> : <Sparkles size={18} className="text-pink-500"/>}
                Gerar Proposta
             </Button>
          </div>
      </div>

      {/* --- RENDERIZA O MODAL FLUTUANTE AQUI --- */}
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
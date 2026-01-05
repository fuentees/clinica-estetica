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
  ChevronRight,
  Loader2,
  Calculator,
  Tag
} from "lucide-react";
import { useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/ui/button";
import { toast } from "react-hot-toast";

// Interface do Procedimento (Vindo do Banco)
interface Procedure {
  id: string;
  name: string;
  category: 'toxina' | 'preenchedor' | 'bioestimulador' | 'tecnologia' | 'facial' | 'corporal' | 'outros';
  price: number;
  description?: string;
}

// Interface do Item no Orçamento
interface BudgetItem extends Procedure {
  qty: number;
  internalId: string;
}

export function PatientPlanningPage() {
  const { id: patientId } = useParams();
  const [loading, setLoading] = useState(true);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("todos");
  
  // Estado do Orçamento
  const [selectedItems, setSelectedItems] = useState<BudgetItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  // 1. CARREGAR PROCEDIMENTOS DO BANCO
  useEffect(() => {
    async function fetchProcedures() {
      try {
        const { data, error } = await supabase
          .from('procedures')
          .select('*')
          .eq('active', true) // Apenas procedimentos ativos
          .order('name');

        if (error) throw error;

        if (data && data.length > 0) {
          setProcedures(data);
        } else {
          // DADOS DE FALLBACK (CASO A TABELA ESTEJA VAZIA PARA TESTE)
          setProcedures([
             { id: '1', name: 'Toxina Botulínica (3 Regiões)', category: 'toxina', price: 1200 },
             { id: '2', name: 'Preenchimento Labial (1ml)', category: 'preenchedor', price: 1500 },
             { id: '3', name: 'Bioestimulador Sculptra', category: 'bioestimulador', price: 2800 },
             { id: '4', name: 'Laser Lavieen (Face)', category: 'tecnologia', price: 800 },
             { id: '5', name: 'Ultraformer (Full Face)', category: 'tecnologia', price: 2500 },
             { id: '6', name: 'Limpeza de Pele Profunda', category: 'facial', price: 250 },
             { id: '7', name: 'Enzimas Corporais', category: 'corporal', price: 350 },
          ]);
        }
      } catch (err) {
        console.error("Erro ao buscar procedimentos:", err);
        toast.error("Erro ao carregar catálogo.");
      } finally {
        setLoading(false);
      }
    }
    fetchProcedures();
  }, []);

  // 2. LÓGICA DO CARRINHO
  const addItem = (proc: Procedure) => {
    const existing = selectedItems.find(i => i.id === proc.id);
    if (existing) {
      // Se já existe, aumenta a quantidade
      setSelectedItems(selectedItems.map(i => 
        i.id === proc.id ? { ...i, qty: i.qty + 1 } : i
      ));
    } else {
      // Se não, adiciona novo
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
  const total = subtotal - discount;

  // Filtros
  const filteredProcedures = procedures.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === "todos" || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // Salvar Orçamento
  const handleSaveBudget = async () => {
     if(selectedItems.length === 0) return toast.error("O orçamento está vazio.");
     
     setSaving(true);
     try {
        // Exemplo de salvamento (crie a tabela 'budgets' depois se precisar)
        const { error } = await supabase.from('treatment_budgets').insert({
            patient_id: patientId,
            items: selectedItems,
            subtotal,
            discount,
            total,
            status: 'pending',
            created_at: new Date().toISOString()
        });
        
        if (error) throw error;
        toast.success("Orçamento salvo com sucesso!");
        // Opcional: Gerar PDF aqui
     } catch (e) {
        console.error(e);
        toast.error("Erro ao salvar orçamento.");
     } finally {
        setSaving(false);
     }
  };

  // Helper de Ícones
  const getIcon = (cat: string) => {
     switch(cat) {
        case 'toxina': case 'preenchedor': case 'bioestimulador': return <Syringe size={18}/>;
        case 'tecnologia': return <Zap size={18}/>;
        case 'facial': case 'corporal': return <Sparkles size={18}/>;
        default: return <ShoppingBag size={18}/>;
     }
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

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-pink-500"/></div>;

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col xl:flex-row gap-6 animate-in fade-in duration-500">
      
      {/* --- COLUNA ESQUERDA: CATÁLOGO (Scrollável) --- */}
      <div className="flex-1 flex flex-col gap-6 h-full overflow-hidden">
         
         {/* Barra de Busca e Filtros */}
         <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm shrink-0">
             <div className="relative mb-6">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                 <input 
                    type="text" 
                    placeholder="Buscar procedimento (ex: Botox, Lavieen)..." 
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

         {/* Grid de Procedimentos */}
         <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-20">
                {filteredProcedures.map((proc) => (
                   <button 
                      key={proc.id} 
                      onClick={() => addItem(proc)}
                      className="flex flex-col text-left bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-gray-700 hover:border-pink-300 dark:hover:border-pink-700 hover:shadow-md transition-all group"
                   >
                      <div className="flex justify-between items-start w-full mb-3">
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                            proc.category === 'tecnologia' ? 'bg-blue-50 text-blue-500' :
                            proc.category === 'toxina' ? 'bg-purple-50 text-purple-500' :
                            'bg-pink-50 text-pink-500'
                         }`}>
                            {getIcon(proc.category)}
                         </div>
                         <span className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-1 rounded-lg text-xs font-bold border border-gray-200 dark:border-gray-700">
                            R$ {proc.price.toLocaleString('pt-BR')}
                         </span>
                      </div>
                      <h4 className="font-bold text-gray-900 dark:text-white text-sm group-hover:text-pink-600 transition-colors line-clamp-2">
                         {proc.name}
                      </h4>
                      <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-wider">{proc.category}</p>
                   </button>
                ))}
                
                {filteredProcedures.length === 0 && (
                   <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400 opacity-50">
                      <Search size={48} className="mb-4"/>
                      <p className="font-bold">Nenhum procedimento encontrado.</p>
                   </div>
                )}
             </div>
         </div>
      </div>

      {/* --- COLUNA DIREITA: O CONTRATO (Sticky/Fixo) --- */}
      <div className="xl:w-[450px] shrink-0 flex flex-col h-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-[2.5rem] shadow-xl overflow-hidden relative">
          
          {/* Header do Orçamento */}
          <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
             <div className="flex items-center gap-3 mb-1">
                <FileText className="text-pink-500" size={20}/>
                <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Novo Orçamento</h2>
             </div>
             <p className="text-xs text-gray-500 pl-8">Adicione itens para compor a proposta</p>
          </div>

          {/* Lista de Itens Selecionados */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
             {selectedItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-300 space-y-4">
                   <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                      <ShoppingBag size={24}/>
                   </div>
                   <p className="text-xs font-bold uppercase tracking-widest text-center">O orçamento está vazio</p>
                </div>
             ) : (
                selectedItems.map((item) => (
                   <div key={item.internalId} className="group flex items-center justify-between animate-in slide-in-from-right-4">
                      <div className="flex-1">
                         <p className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1">{item.name}</p>
                         <p className="text-[10px] text-gray-400">R$ {item.price.toLocaleString('pt-BR')} un.</p>
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

          {/* Rodapé de Totais */}
          <div className="p-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700 space-y-4">
             <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-500 font-medium">
                   <span>Subtotal</span>
                   <span>R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                
                <div className="flex justify-between items-center text-xs text-emerald-600 font-bold">
                   <span className="flex items-center gap-1"><Tag size={12}/> Desconto (R$)</span>
                   <input 
                      type="number" 
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                      className="w-20 text-right bg-white border border-emerald-100 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-emerald-500"
                   />
                </div>

                <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-end">
                   <span className="text-sm font-black text-gray-900 dark:text-white uppercase">Total Final</span>
                   <span className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">
                      R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                   </span>
                </div>
             </div>

             <Button 
                onClick={handleSaveBudget}
                disabled={saving || selectedItems.length === 0}
                className="w-full h-14 bg-gray-900 hover:bg-black text-white rounded-2xl font-black uppercase tracking-widest shadow-xl transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
             >
                {saving ? <Loader2 className="animate-spin"/> : <FileText size={18} className="text-pink-500"/>}
                Gerar Proposta
             </Button>
          </div>

      </div>
    </div>
  );
}
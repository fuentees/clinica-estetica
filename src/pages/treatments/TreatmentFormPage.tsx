import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom'; 
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/button';
import { toast } from 'react-hot-toast';
import { 
  Loader2, ArrowLeft, Sparkles, Clock, DollarSign, FileText, 
  Package, Plus, Trash2, Search, Syringe 
} from 'lucide-react';

const treatmentSchema = z.object({
  name: z.string().min(3, "Nome muito curto"),
  category: z.string().min(1, "Categoria obrigatória"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Preço inválido"),
  duration_minutes: z.coerce.number().min(5, "Mínimo 5 min"),
});

type TreatmentFormData = z.infer<typeof treatmentSchema>;

// Interface interna para o Kit
interface KitItem {
    inventory_id: string; // ID do item no estoque (tabela inventory)
    name: string;
    qty: number;
}

export function TreatmentFormPage() {
  const navigate = useNavigate();
  const { id } = useParams(); 
  const isEditing = !!id; 

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  
  const [inventoryList, setInventoryList] = useState<any[]>([]);
  const [kitItems, setKitItems] = useState<KitItem[]>([]); 
  const [searchTerm, setSearchTerm] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<TreatmentFormData>({
    resolver: zodResolver(treatmentSchema),
    defaultValues: { price: 0, duration_minutes: 30, category: "Facial" }
  });

  // 1. Carregar Estoque
  useEffect(() => {
    async function fetchInventory() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from('profiles').select('clinic_id').eq('id', user.id).single();
      if (!profile?.clinic_id) return;

      // Mantendo 'inventory' ou 'inventory_items' conforme seu banco
      const { data } = await supabase
        .from('inventory') 
        .select('id, name')
        .eq('clinic_id', profile.clinic_id)
        .order('name');
        
      if (data) setInventoryList(data);
    }
    fetchInventory();
  }, []);

  // 2. Carregar Dados na Edição
  useEffect(() => {
    if (!isEditing) return;

    async function loadServiceData() {
        try {
            setLoadingData(true);
            
            const { data: service, error } = await supabase
                .from('services')
                .select('*')
                .eq('id', id)
                .single();

            if (error || !service) throw new Error("Serviço não encontrado");

            reset({
                name: service.name,
                category: service.category,
                description: service.description || '',
                price: Number(service.price),
                duration_minutes: service.duration
            });

            // ✅ AQUI VOLTAMOS PARA PROCEDURE_ITEMS
            const { data: items } = await supabase
                .from('procedure_items') 
                .select(`
                    quantity_needed, 
                    inventory:inventory_id (id, name)
                `)
                .eq('procedure_id', id);

            if (items) {
                const formattedKit: KitItem[] = items.map((item: any) => ({
                    inventory_id: item.inventory.id,
                    name: item.inventory.name,
                    qty: item.quantity_needed // Nome correto da coluna antiga
                }));
                setKitItems(formattedKit);
            }

        } catch (error) {
            console.error(error);
            toast.error("Erro ao carregar dados.");
            navigate('/services');
        } finally {
            setLoadingData(false);
        }
    }
    loadServiceData();
  }, [id, isEditing, reset, navigate]);

  // --- Lógica do Kit ---
  const addToKit = (item: any) => {
    const exists = kitItems.find(k => k.inventory_id === item.id);
    if (exists) {
      setKitItems(kitItems.map(k => k.inventory_id === item.id ? { ...k, qty: k.qty + 1 } : k));
    } else {
      setKitItems([...kitItems, { inventory_id: item.id, name: item.name, qty: 1 }]);
    }
  };

  const removeFromKit = (invId: string) => {
    setKitItems(kitItems.filter(k => k.inventory_id !== invId));
  };

  const updateKitQty = (invId: string, delta: number) => {
    setKitItems(prev => prev.map(k => {
      if (k.inventory_id === invId) return { ...k, qty: Math.max(0.1, k.qty + delta) }; 
      return k;
    }));
  };

  // --- Salvar ---
  const onSubmit = async (data: TreatmentFormData) => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário offline");

      const { data: profile } = await supabase.from('profiles').select('clinic_id').eq('id', user.id).single();
      if (!profile?.clinic_id) throw new Error("Clínica não encontrada");

      let serviceId = id;

      if (isEditing) {
          const { error } = await supabase
            .from('services')
            .update({
                name: data.name,
                category: data.category,
                description: data.description,
                price: data.price,
                duration: data.duration_minutes
            })
            .eq('id', id);
          if (error) throw error;
      } else {
          const { data: newService, error } = await supabase
            .from('services') 
            .insert({
              clinic_id: profile.clinic_id,
              name: data.name,
              category: data.category,
              description: data.description,
              price: data.price,
              duration: data.duration_minutes,
              is_active: true
            })
            .select()
            .single();

          if (error) throw error;
          serviceId = newService.id;
      }

      // ✅ SALVANDO NO PROCEDURE_ITEMS (ESTRUTURA ANTIGA)
      if (serviceId) {
          await supabase.from('procedure_items').delete().eq('procedure_id', serviceId);
          
          if (kitItems.length > 0) {
            const itemsToInsert = kitItems.map(item => ({
              procedure_id: serviceId, 
              inventory_id: item.inventory_id,
              quantity_needed: item.qty
            }));
            
            const { error: kitError } = await supabase.from('procedure_items').insert(itemsToInsert);
            if (kitError) throw kitError;
          }
      }

      toast.success(isEditing ? 'Serviço atualizado!' : 'Serviço criado com sucesso!');
      navigate('/services');

    } catch (error: any) {
      console.error(error);
      toast.error('Erro ao salvar: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredInventory = inventoryList.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loadingData) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-pink-600"/></div>;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto animate-in fade-in duration-700">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" onClick={() => navigate('/services')} className="bg-white dark:bg-gray-800 border dark:border-gray-700">
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase italic flex items-center gap-2">
            {isEditing ? 'Editar' : 'Novo'} <span className="text-pink-600">Serviço</span> <Sparkles size={20} className="text-pink-400" />
          </h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Cadastro de tratamento e consumo</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* COLUNA 1: DADOS */}
        <div className="lg:col-span-2 space-y-8 bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden h-full">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-600 to-purple-600"></div>
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><FileText size={18} className="text-pink-500"/> Dados do Procedimento</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome</label>
                    <input {...register('name')} className="w-full h-12 px-4 rounded-xl bg-gray-50 dark:bg-gray-900 border-0 outline-none focus:ring-2 focus:ring-pink-500 font-bold dark:text-white" />
                    {errors.name && <span className="text-red-500 text-xs">{errors.name.message}</span>}
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Categoria</label>
                    <select {...register('category')} className="w-full h-12 px-4 rounded-xl bg-gray-50 dark:bg-gray-900 border-0 outline-none focus:ring-2 focus:ring-pink-500 font-bold dark:text-white cursor-pointer">
                        {['Facial', 'Corporal', 'Toxina', 'Preenchedor', 'Bioestimulador', 'Capilar', 'Tecnologia'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Descrição</label>
                <textarea {...register('description')} className="w-full rounded-2xl bg-gray-50 dark:bg-gray-900 p-4 font-medium outline-none focus:ring-2 focus:ring-pink-500 min-h-[150px] resize-none dark:text-white" />
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1"><DollarSign size={12}/> Preço Venda</label>
                    <input type="number" step="0.01" {...register('price')} className="w-full h-12 px-4 rounded-xl bg-gray-50 dark:bg-gray-900 border-0 outline-none focus:ring-2 focus:ring-pink-500 font-black text-emerald-600" />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1"><Clock size={12}/> Minutos</label>
                    <input type="number" {...register('duration_minutes')} className="w-full h-12 px-4 rounded-xl bg-gray-50 dark:bg-gray-900 border-0 outline-none focus:ring-2 focus:ring-pink-500 font-black text-blue-600" />
                </div>
            </div>
        </div>

        {/* COLUNA 2: MONTAGEM DO KIT */}
        <div className="lg:col-span-1 flex flex-col gap-6 h-full">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 flex-1 flex flex-col min-h-[600px]">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4"><Package size={18} className="text-purple-500"/> Montar Kit (Receita)</h3>
                
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                    <input className="w-full pl-9 h-12 bg-gray-50 dark:bg-gray-900 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500 dark:text-white" placeholder="Buscar insumo..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>

                <div className="h-80 overflow-y-auto mb-6 border border-gray-100 dark:border-gray-700 rounded-xl p-2 custom-scrollbar bg-gray-50/30">
                    {filteredInventory.map(item => (
                        <button key={item.id} type="button" onClick={() => addToKit(item)} className="w-full text-left p-3 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg text-sm flex justify-between items-center group transition-colors border-b border-gray-50 dark:border-gray-800 last:border-0">
                            <span className="truncate max-w-[200px] text-gray-700 dark:text-gray-300 font-medium">{item.name}</span>
                            <Plus size={16} className="text-purple-400 opacity-0 group-hover:opacity-100"/>
                        </button>
                    ))}
                </div>

                <div className="mb-2"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Itens no Kit ({kitItems.length})</p></div>

                <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar min-h-[150px]">
                    {kitItems.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-xl p-4">
                            <Syringe className="text-gray-300 mb-2" size={24}/>
                            <p className="text-xs text-gray-400 font-bold uppercase text-center">Nenhum insumo selecionado</p>
                        </div>
                    ) : (
                        kitItems.map(item => (
                            <div key={item.inventory_id} className="bg-purple-50 dark:bg-purple-900/10 p-3 rounded-xl flex items-center justify-between border border-purple-100 dark:border-purple-900/30">
                                <div className="flex-1 overflow-hidden mr-2"><p className="text-xs font-bold text-gray-800 dark:text-white truncate">{item.name}</p></div>
                                <div className="flex items-center gap-2">
                                    <button type="button" onClick={() => updateKitQty(item.inventory_id, -1)} className="text-gray-400 hover:text-purple-600 font-mono p-1">-</button>
                                    <span className="text-xs font-bold w-6 text-center">{item.qty}</span>
                                    <button type="button" onClick={() => updateKitQty(item.inventory_id, 1)} className="text-gray-400 hover:text-purple-600 font-mono p-1">+</button>
                                    <button type="button" onClick={() => removeFromKit(item.inventory_id)} className="ml-1 text-rose-400 hover:text-rose-600 p-1"><Trash2 size={14}/></button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <Button type="submit" disabled={isSubmitting} className="w-full h-14 bg-gray-900 hover:bg-black text-white rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg flex items-center justify-center gap-2">
                        {isSubmitting ? <Loader2 className="animate-spin"/> : <Sparkles size={16} className="text-pink-500"/>}
                        {isSubmitting ? 'Salvando...' : (isEditing ? 'Atualizar Serviço' : 'Salvar Serviço & Kit')}
                    </Button>
                </div>
            </div>
        </div>
      </form>
    </div>
  );
}
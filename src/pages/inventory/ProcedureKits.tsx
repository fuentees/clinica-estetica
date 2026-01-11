import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Plus, Trash2, Microscope, ArrowRight, Package, Loader2 
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { toast } from 'react-hot-toast';

export function ProcedureKits() {
  const [procedures, setProcedures] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [selectedProcedure, setSelectedProcedure] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  
  // Controle de formulário para adicionar item
  const [selectedInventoryId, setSelectedInventoryId] = useState('');
  const [quantityNeeded, setQuantityNeeded] = useState('');

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedProcedure) fetchKitItems(selectedProcedure);
  }, [selectedProcedure]);

  async function loadInitialData() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('clinic_id')
        .eq('id', user.id)
        .single();

      if (!profile?.clinic_id) return;

      // Buscar procedimentos da clínica
      const { data: procData } = await supabase
        .from('procedures')
        .select('*')
        .eq('clinic_id', profile.clinic_id)
        .order('name');
        
      // Buscar estoque da clínica
      const { data: invData } = await supabase
        .from('inventory')
        .select('id, name, unit_price')
        .eq('clinic_id', profile.clinic_id)
        .order('name');

      if (procData) setProcedures(procData);
      if (invData) setInventory(invData);

    } catch (error) {
      toast.error('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  }

  async function fetchKitItems(procId: string) {
    const { data } = await supabase
      .from('procedure_items')
      .select(`
        id, quantity_needed,
        inventory:inventory_id (id, name, unit_price)
      `)
      .eq('procedure_id', procId);
      
    if (data) setItems(data);
  }

  async function handleAddItem() {
    if (!selectedProcedure || !selectedInventoryId || !quantityNeeded) {
        toast.error("Preencha todos os campos");
        return;
    }

    try {
      const { error } = await supabase
        .from('procedure_items')
        .insert({
          procedure_id: selectedProcedure,
          inventory_id: selectedInventoryId,
          quantity_needed: Number(quantityNeeded)
        });

      if (error) throw error;
      
      toast.success('Item adicionado ao kit!');
      fetchKitItems(selectedProcedure);
      setQuantityNeeded('');
      setSelectedInventoryId('');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao adicionar item.');
    }
  }

  async function handleRemoveItem(id: string) {
    try {
      await supabase.from('procedure_items').delete().eq('id', id);
      setItems(prev => prev.filter(i => i.id !== id));
      toast.success('Item removido.');
    } catch (e) {
      toast.error('Erro ao remover.');
    }
  }

  // Cálculo do custo total do kit
  const totalCost = items.reduce((acc, item) => {
    return acc + (item.quantity_needed * (item.inventory?.unit_price || 0));
  }, 0);

  if (loading) {
    return (
        <div className="flex justify-center items-center h-[500px]">
            <Loader2 className="animate-spin text-pink-600" size={32} />
        </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in">
      
      {/* Coluna 1: Lista de Procedimentos */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 h-fit">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
          <Microscope className="text-pink-600" /> Procedimentos
        </h2>
        <p className="text-xs text-gray-500 mb-4">Selecione para configurar o kit</p>
        
        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          {procedures.map(proc => (
            <button
              key={proc.id}
              onClick={() => setSelectedProcedure(proc.id)}
              className={`w-full text-left p-3 rounded-xl text-sm font-medium transition-all flex justify-between items-center group
                ${selectedProcedure === proc.id 
                  ? 'bg-pink-50 text-pink-700 border border-pink-200' 
                  : 'hover:bg-gray-50 text-gray-600 border border-transparent'}`}
            >
              <span className="truncate">{proc.name}</span>
              {selectedProcedure === proc.id && <ArrowRight size={16} />}
            </button>
          ))}
          
          {procedures.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-lg">
                Nenhum procedimento cadastrado em "Serviços".
            </div>
          )}
        </div>
      </div>

      {/* Coluna 2 e 3: Editor do Kit */}
      {selectedProcedure ? (
        <div className="md:col-span-2 space-y-6">
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <span>Configurar Kit</span>
                <span className="text-sm bg-green-50 text-green-700 px-3 py-1 rounded-full border border-green-100 font-medium">
                    Custo de Insumos: {totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
            </h2>

            {/* Formulário de Adição */}
            <div className="flex flex-col md:flex-row gap-4 items-end bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl mb-6 border border-gray-100">
                <div className="flex-1 w-full">
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Insumo</label>
                    <select 
                        className="w-full h-10 rounded-lg border-gray-200 bg-white text-sm focus:ring-pink-500 focus:border-pink-500"
                        value={selectedInventoryId}
                        onChange={e => setSelectedInventoryId(e.target.value)}
                    >
                        <option value="">Selecione um item...</option>
                        {inventory.map(i => (
                            <option key={i.id} value={i.id}>{i.name}</option>
                        ))}
                    </select>
                </div>
                <div className="w-full md:w-32">
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Qtd Necessária</label>
                    <Input 
                        type="number" 
                        value={quantityNeeded}
                        onChange={e => setQuantityNeeded(e.target.value)}
                        placeholder="Ex: 2"
                        className="bg-white"
                    />
                </div>
                <Button onClick={handleAddItem} className="bg-gray-900 text-white hover:bg-black w-full md:w-auto">
                    <Plus size={18} /> <span className="md:hidden ml-2">Adicionar</span>
                </Button>
            </div>

            {/* Lista de Itens do Kit */}
            <div className="space-y-3">
                {items.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm hover:border-pink-100 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-pink-50 dark:bg-pink-900/20 text-pink-600 rounded-lg">
                                <Package size={20} />
                            </div>
                            <div>
                                <p className="font-bold text-gray-800 dark:text-gray-200">{item.inventory?.name}</p>
                                <p className="text-xs text-gray-500">
                                    Custo Unit: {Number(item.inventory?.unit_price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <span className="block text-xl font-bold text-gray-900 dark:text-white">{item.quantity_needed}</span>
                                <span className="text-[10px] text-gray-400 uppercase font-bold">Qtd</span>
                            </div>
                            <button 
                                onClick={() => handleRemoveItem(item.id)}
                                className="text-gray-300 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}

                {items.length === 0 && (
                    <div className="text-center py-12 bg-gray-50/50 rounded-xl border-dashed border-2 border-gray-200">
                        <p className="text-gray-400 font-medium">Nenhum item vinculado.</p>
                        <p className="text-xs text-gray-400 mt-1">Este procedimento não consome insumos automaticamente ainda.</p>
                    </div>
                )}
            </div>
          </div>
        </div>
      ) : (
        <div className="md:col-span-2 flex items-center justify-center h-full min-h-[400px] bg-gray-50 dark:bg-gray-800/50 rounded-2xl border-dashed border-2 border-gray-200 dark:border-gray-700 text-gray-400">
            <div className="text-center p-6">
                <Microscope size={48} className="mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">Selecione um procedimento</p>
                <p className="text-sm opacity-60">Escolha um item na lista à esquerda para configurar os insumos gastos.</p>
            </div>
        </div>
      )}
    </div>
  );
}
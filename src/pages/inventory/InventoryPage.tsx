import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  Plus, Search, Package, AlertTriangle, CheckCircle, Trash2, Edit, Loader2, ShoppingCart
} from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { toast } from 'react-hot-toast';

export function InventoryPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [clinicId, setClinicId] = useState<string | null>(null);

  useEffect(() => {
    fetchInventory();
  }, []);

  async function fetchInventory() {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('clinicId')
        .eq('id', user.id)
        .single();

      if (!profile?.clinicId) {
        toast.error("Clínica não identificada.");
        return;
      }
      
      setClinicId(profile.clinicId);

      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('clinicId', profile.clinicId) 
        .order('name', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar estoque.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza? Esta ação removerá o item permanentemente do estoque.')) return;
    try {
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id)
        .eq('clinicId', clinicId); 

      if (error) throw error;
      
      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success('Produto removido.');
    } catch (error) {
      toast.error('Erro ao remover o item.');
    }
  }

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockCount = products.filter(p => p.quantity <= p.minimum_quantity && p.quantity > 0).length;
  const outOfStockCount = products.filter(p => p.quantity === 0).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="animate-spin text-pink-600 w-12 h-12" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Sincronizando estoque...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3 uppercase italic tracking-tighter">
            <Package className="text-pink-600" size={32} /> Controle de Insumos
          </h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Gestão de materiais e produtos da clínica</p>
        </div>
        <Link to="/inventory/new">
          <Button className="bg-gray-900 hover:bg-black text-white flex items-center gap-2 shadow-xl h-12 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all hover:scale-105 active:scale-95">
            <Plus size={18} className="text-pink-500" /> Novo Produto
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard icon={<CheckCircle size={24}/>} count={products.length} label="Itens em Catálogo" color="blue" />
          <StatCard icon={<AlertTriangle size={24}/>} count={lowStockCount} label="Estoque Crítico" color="orange" />
          <StatCard icon={<ShoppingCart size={24}/>} count={outOfStockCount} label="Esgotados" color="red" />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20">
            <div className="relative max-w-md group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-300 group-focus-within:text-pink-500 transition-colors" size={20} />
                <Input 
                    placeholder="Filtrar por nome ou marca..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-12 bg-white dark:bg-gray-900 rounded-xl border-gray-200 focus:ring-2 focus:ring-pink-500 font-bold"
                />
            </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-50/80 dark:bg-gray-700/50 text-gray-400 font-black uppercase text-[10px] tracking-widest">
                <th className="px-8 py-6">Identificação do Produto</th>
                <th className="px-6 py-6 text-center">Qtd Atual</th>
                <th className="px-6 py-6 text-center">Nível de Alerta</th>
                <th className="px-6 py-6 text-right pr-20">Preço de Custo</th>
                <th className="px-8 py-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {filtered.map((item) => {
                  const isCritical = item.quantity === 0;
                  const isLow = item.quantity <= item.minimum_quantity && item.quantity > 0;

                  return (
                    <tr key={item.id} className={`group hover:bg-gray-50/80 dark:hover:bg-gray-900/40 transition-colors ${isCritical ? 'bg-red-50/20' : ''}`}>
                        <td className="px-8 py-6">
                            <div className="flex flex-col">
                                <span className="font-black text-gray-900 dark:text-white text-base uppercase italic tracking-tighter group-hover:text-pink-600 transition-colors">{item.name}</span>
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{item.description || 'Sem detalhes técnicos'}</span>
                            </div>
                        </td>
                        <td className="px-6 py-6 text-center">
                            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl font-black text-lg shadow-inner border-2
                                ${isCritical ? 'bg-red-600 text-white border-red-700 shadow-red-900/20' : 
                                  isLow ? 'bg-amber-400 text-amber-900 border-amber-500 shadow-amber-900/20' : 
                                  'bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-gray-100 shadow-gray-200'}`}>
                                {item.quantity}
                            </div>
                        </td>
                        <td className="px-6 py-6 text-center">
                            <span className="text-[10px] font-black uppercase bg-gray-100 dark:bg-gray-900 px-3 py-1.5 rounded-lg text-gray-500 tracking-widest border border-gray-200">
                                Min: {item.minimum_quantity}
                            </span>
                        </td>
                        <td className="px-6 py-6 text-right pr-20 font-black text-gray-600 dark:text-gray-300 italic tracking-tighter">
                            {Number(item.unit_price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                        <td className="px-8 py-6 text-right">
                            <div className="flex justify-end gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => navigate(`/inventory/${item.id}/edit`)} 
                                  className="h-10 w-10 p-0 text-blue-500 hover:bg-blue-50 rounded-xl"
                                >
                                    <Edit size={18} />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleDelete(item.id)} 
                                  className="h-10 w-10 p-0 text-red-500 hover:bg-red-50 rounded-xl"
                                >
                                    <Trash2 size={18} />
                                </Button>
                            </div>
                        </td>
                    </tr>
                  );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, count, label, color }: any) {
    const colors: any = {
        blue: "text-blue-600 bg-blue-50 dark:bg-blue-900/20 hover:border-blue-200",
        orange: "text-orange-600 bg-orange-50 dark:bg-orange-900/20 hover:border-orange-200",
        red: "text-red-600 bg-red-50 dark:bg-red-900/20 hover:border-red-200"
    }
    return (
        <div className={`bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-6 group transition-all ${colors[color]}`}>
            <div className={`p-4 rounded-2xl transition-transform group-hover:scale-110 shadow-sm ${colors[color].split(' ')[1]}`}>
                {icon}
            </div>
            <div>
                <p className="text-4xl font-black text-gray-900 dark:text-white italic tracking-tighter">{count}</p>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{label}</p>
            </div>
        </div>
    );
}
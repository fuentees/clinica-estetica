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
      
      // 1. Identificar a clínica do usuário logado
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

      // 2. Buscar apenas os produtos DESTA clínica
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('clinicId', profile.clinicId) // FILTRO DE SEGURANÇA SaaS
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
      // Garantimos que o delete só ocorra se o item pertencer à clínica logada
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

  // Filtros de busca local
  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Lógica de Contadores
  const lowStockCount = products.filter(p => p.quantity <= p.minimum_quantity && p.quantity > 0).length;
  const outOfStockCount = products.filter(p => p.quantity === 0).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="animate-spin text-pink-600 w-12 h-12" />
        <p className="text-gray-500 animate-pulse">Sincronizando estoque...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Package className="text-pink-600" size={32} /> Controle de Insumos
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Monitore frascos, agulhas e produtos da sua clínica.</p>
        </div>
        <Link to="/inventory/new">
          <Button className="bg-pink-600 hover:bg-pink-700 text-white flex items-center gap-2 shadow-lg shadow-pink-200 dark:shadow-none h-11 px-6 rounded-xl transition-all hover:scale-105">
            <Plus size={20} /> Novo Produto
          </Button>
        </Link>
      </div>

      {/* Quick Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-5 group hover:border-blue-200 transition-colors">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl transition-transform group-hover:scale-110"><CheckCircle size={28} /></div>
              <div>
                  <p className="text-3xl font-black text-gray-900 dark:text-white">{products.length}</p>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Itens em Catálogo</p>
              </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-orange-100 dark:border-gray-700 shadow-sm flex items-center gap-5 group hover:border-orange-200 transition-colors">
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 text-orange-600 rounded-2xl transition-transform group-hover:scale-110"><AlertTriangle size={28} /></div>
              <div>
                  <p className="text-3xl font-black text-gray-900 dark:text-white">{lowStockCount}</p>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Estoque Crítico</p>
              </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-red-100 dark:border-gray-700 shadow-sm flex items-center gap-5 group hover:border-red-200 transition-colors">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-2xl transition-transform group-hover:scale-110"><ShoppingCart size={28} /></div>
              <div>
                  <p className="text-3xl font-black text-gray-900 dark:text-white">{outOfStockCount}</p>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Esgotados</p>
              </div>
          </div>
      </div>

      {/* Tabela Principal */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {/* Barra de Filtro */}
        <div className="p-6 border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20">
            <div className="relative max-w-md group">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-pink-500 transition-colors" size={20} />
                <Input 
                    placeholder="Filtrar por nome ou marca..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-11 h-11 bg-white dark:bg-gray-900 rounded-xl border-gray-200 focus:ring-2 focus:ring-pink-500"
                />
            </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-50/80 dark:bg-gray-700/50 text-gray-500 font-bold uppercase text-[10px] tracking-widest">
                <th className="px-8 py-5">Identificação do Produto</th>
                <th className="px-6 py-5 text-center">Quantidade</th>
                <th className="px-6 py-5 text-center">Nível de Alerta</th>
                <th className="px-6 py-5">Preço Médio</th>
                <th className="px-8 py-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map((item) => {
                  const isCritical = item.quantity === 0;
                  const isLow = item.quantity <= item.minimum_quantity && item.quantity > 0;

                  return (
                    <tr key={item.id} className={`hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-colors ${isCritical ? 'bg-red-50/30' : ''}`}>
                        <td className="px-8 py-5">
                            <div className="flex flex-col">
                                <span className="font-bold text-gray-800 dark:text-white text-base">{item.name}</span>
                                <span className="text-xs text-gray-500 italic">{item.description || 'Sem descrição'}</span>
                            </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl font-black text-lg shadow-sm border
                                ${isCritical ? 'bg-red-600 text-white border-red-700' : 
                                  isLow ? 'bg-yellow-400 text-yellow-900 border-yellow-500' : 
                                  'bg-white dark:bg-gray-900 text-gray-800 dark:text-white border-gray-200'}`}>
                                {item.quantity}
                            </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 font-medium">
                                {item.minimum_quantity} unidades
                            </span>
                        </td>
                        <td className="px-6 py-5 font-semibold text-gray-700 dark:text-gray-300">
                            {Number(item.unit_price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                        <td className="px-8 py-5 text-right">
                            <div className="flex justify-end gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => navigate(`/inventory/${item.id}/edit`)} 
                                  className="h-9 w-9 p-0 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"
                                >
                                    <Edit size={18} />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleDelete(item.id)} 
                                  className="h-9 w-9 p-0 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
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
        
        {filtered.length === 0 && !loading && (
            <div className="p-20 text-center flex flex-col items-center gap-4">
                <Package size={48} className="text-gray-200" />
                <p className="text-gray-500 font-medium text-lg">Nenhum insumo encontrado nesta categoria.</p>
                <Button variant="outline" onClick={() => setSearchTerm('')} className="rounded-xl">Limpar filtros</Button>
            </div>
        )}
      </div>
    </div>
  );
}
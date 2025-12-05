import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  Plus, Search, Package, AlertTriangle, CheckCircle, Trash2, Edit, Loader2 
} from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { toast } from 'react-hot-toast';

export function InventoryPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchInventory();
  }, []);

  async function fetchInventory() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
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
    if (!confirm('Tem certeza? Isso não afetará históricos passados.')) return;
    try {
      await supabase.from('inventory').delete().eq('id', id);
      fetchInventory();
      toast.success('Produto removido.');
    } catch (error) {
      toast.error('Erro ao remover.');
    }
  }

  // Filtros
  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Contadores para o Dashboard Rápido
  const lowStockCount = products.filter(p => p.quantity <= p.minimum_quantity && p.quantity > 0).length;
  const outOfStockCount = products.filter(p => p.quantity === 0).length;

  // CORREÇÃO 1: Usando a variável 'loading'
  if (loading) {
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="animate-spin text-pink-600 w-10 h-10" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Package className="text-blue-600" /> Controle de Estoque
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Gerencie insumos e produtos de venda.</p>
        </div>
        <Link to="/inventory/new">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 shadow-sm">
            <Plus size={18} /> Novo Produto
          </Button>
        </Link>
      </div>

      {/* Cards de Alerta */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-green-100 text-green-600 rounded-full"><CheckCircle size={24} /></div>
              <div>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">{products.length}</p>
                  <p className="text-xs text-gray-500">Total de Itens</p>
              </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-yellow-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-yellow-100 text-yellow-600 rounded-full"><AlertTriangle size={24} /></div>
              <div>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">{lowStockCount}</p>
                  <p className="text-xs text-gray-500">Estoque Baixo</p>
              </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-red-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-red-100 text-red-600 rounded-full"><Package size={24} /></div>
              <div>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">{outOfStockCount}</p>
                  <p className="text-xs text-gray-500">Esgotados</p>
              </div>
          </div>
      </div>

      {/* Tabela */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {/* Barra de Busca */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input 
                    placeholder="Buscar produto..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-50 dark:bg-gray-900"
                />
            </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 font-medium">
              <tr>
                <th className="px-6 py-4">Produto</th>
                <th className="px-6 py-4">Qtd. Atual</th>
                <th className="px-6 py-4">Mínimo</th>
                <th className="px-6 py-4">Valor Unit.</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map((item) => {
                  // Lógica de Status
                  let statusColor = "text-gray-700";
                  let bgClass = "";
                  if (item.quantity === 0) {
                      statusColor = "text-red-600 font-bold";
                      bgClass = "bg-red-50 dark:bg-red-900/20";
                  } else if (item.quantity <= item.minimum_quantity) {
                      statusColor = "text-yellow-600 font-bold";
                      bgClass = "bg-yellow-50 dark:bg-yellow-900/20";
                  }

                  return (
                    <tr key={item.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors ${bgClass}`}>
                        <td className="px-6 py-4">
                            <p className="font-semibold text-gray-800 dark:text-white">{item.name}</p>
                            <p className="text-xs text-gray-500">{item.description || '-'}</p>
                        </td>
                        <td className={`px-6 py-4 ${statusColor} text-lg`}>
                            {item.quantity}
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                            {item.minimum_quantity}
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                            {Number(item.unit_price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                        <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                                {/* CORREÇÃO 2: size="sm" em vez de "icon" e classes para ajuste */}
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => navigate(`/inventory/${item.id}/edit`)} 
                                  className="h-8 w-8 p-0 text-blue-500 hover:bg-blue-50"
                                >
                                    <Edit size={16} />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleDelete(item.id)} 
                                  className="h-8 w-8 p-0 text-red-500 hover:bg-red-50"
                                >
                                    <Trash2 size={16} />
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
            <div className="p-12 text-center text-gray-400">Nenhum produto encontrado.</div>
        )}
      </div>
    </div>
  );
}
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  Plus, Search, Package, AlertTriangle, CheckCircle, Trash2, Edit, Loader2, ShoppingCart,
  ChevronLeft, ChevronRight, MinusCircle, PlusCircle
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

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // Mostra 8 itens por vez para caber na tela sem scroll infinito

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
        .select('clinic_id:clinic_id')
        .eq('id', user.id)
        .single();

      if (!profile?.clinic_id) {
        toast.error("Clínica não identificada.");
        return;
      }
      
      setClinicId(profile.clinic_id);

      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('clinic_id', profile.clinic_id) 
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

  // Função para dar baixa ou entrada rápida
  async function handleQuickUpdate(item: any, amount: number) {
    const newQuantity = item.quantity + amount;
    if (newQuantity < 0) return;

    try {
        // Atualização otimista (atualiza a tela antes do banco para parecer instantâneo)
        setProducts(prev => prev.map(p => 
            p.id === item.id ? { ...p, quantity: newQuantity } : p
        ));

        const { error } = await supabase
            .from('inventory')
            .update({ quantity: newQuantity })
            .eq('id', item.id)
            .eq('clinic_id', clinicId);

        if (error) throw error;
        
        if (amount < 0) toast.success(`Baixa realizada: -1 em ${item.name}`);
        else toast.success(`Entrada realizada: +1 em ${item.name}`);

    } catch (error) {
        toast.error('Erro ao atualizar quantidade.');
        // Reverte em caso de erro
        fetchInventory();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza? Esta ação removerá o item permanentemente do estoque.')) return;
    try {
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id)
        .eq('clinic_id', clinicId); 

      if (error) throw error;
      
      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success('Produto removido.');
    } catch (error) {
      toast.error('Erro ao remover o item.');
    }
  }

  // Lógica de Filtro e Paginação
  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filtered.slice(startIndex, startIndex + itemsPerPage);

  const lowStockCount = products.filter(p => p.quantity <= p.minimum_quantity && p.quantity > 0).length;
  const outOfStockCount = products.filter(p => p.quantity === 0).length;

  // Resetar para página 1 se mudar a busca
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="animate-spin text-pink-600 w-12 h-12" />
        <p className="text-sm font-medium text-gray-500">Sincronizando estoque...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Package className="text-pink-600" size={28} /> Controle de Insumos
          </h1>
          <p className="text-sm text-gray-500 mt-1">Gestão de materiais e produtos da clínica</p>
        </div>
        <Link to="/inventory/new">
          <Button className="bg-pink-600 hover:bg-pink-700 text-white shadow-lg shadow-pink-200">
            <Plus size={18} className="mr-2" /> Novo Produto
          </Button>
        </Link>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard icon={<CheckCircle size={24}/>} count={products.length} label="Itens em Catálogo" color="blue" />
          <StatCard icon={<AlertTriangle size={24}/>} count={lowStockCount} label="Estoque Baixo" color="orange" />
          <StatCard icon={<ShoppingCart size={24}/>} count={outOfStockCount} label="Esgotados" color="red" />
      </div>

      {/* Tabela */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        
        {/* Barra de Busca */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex gap-4">
            <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input 
                    placeholder="Buscar insumo..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-50 dark:bg-gray-900 border-gray-200 focus:ring-pink-500"
                />
            </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-600 font-medium">
              <tr>
                <th className="px-6 py-4">Produto</th>
                <th className="px-6 py-4 text-center">Quantidade</th>
                <th className="px-6 py-4 text-center">Mínimo</th>
                <th className="px-6 py-4 text-right">Custo Unit.</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {currentItems.map((item) => {
                  const isCritical = item.quantity === 0;
                  const isLow = item.quantity <= item.minimum_quantity && item.quantity > 0;

                  return (
                    <tr key={item.id} className="group hover:bg-gray-50/50 dark:hover:bg-gray-900/40 transition-colors">
                        <td className="px-6 py-4">
                            <div className="flex flex-col">
                                <span className={`font-semibold text-base ${isCritical ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                                    {item.name}
                                </span>
                                {item.description && (
                                    <span className="text-xs text-gray-500 mt-0.5 truncate max-w-[200px]">
                                        {item.description}
                                    </span>
                                )}
                            </div>
                        </td>
                        
                        {/* Coluna de Quantidade com Botões Rápidos */}
                        <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-3">
                                <button 
                                    onClick={() => handleQuickUpdate(item, -1)}
                                    className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-30"
                                    disabled={item.quantity <= 0}
                                    title="Dar baixa (-1)"
                                >
                                    <MinusCircle size={20} />
                                </button>
                                
                                <span className={`font-bold text-lg w-8 text-center
                                    ${isCritical ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-gray-700 dark:text-gray-300'}`}>
                                    {item.quantity}
                                </span>

                                <button 
                                    onClick={() => handleQuickUpdate(item, 1)}
                                    className="text-gray-400 hover:text-green-500 transition-colors"
                                    title="Adicionar (+1)"
                                >
                                    <PlusCircle size={20} />
                                </button>
                            </div>
                        </td>

                        <td className="px-6 py-4 text-center">
                            <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2.5 py-1 rounded-full font-medium">
                                {item.minimum_quantity} un
                            </span>
                        </td>
                        <td className="px-6 py-4 text-right text-gray-600 dark:text-gray-400 font-medium">
                            {Number(item.unit_price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                        <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => navigate(`/inventory/${item.id}/edit`)} 
                                  className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
                                >
                                    <Edit size={16} />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleDelete(item.id)} 
                                  className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                                >
                                    <Trash2 size={16} />
                                </Button>
                            </div>
                        </td>
                    </tr>
                  );
              })}
              
              {currentItems.length === 0 && (
                  <tr>
                      <td colSpan={5} className="py-12 text-center text-gray-400">
                          Nenhum produto encontrado.
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Rodapé com Paginação */}
        {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50">
                <span className="text-xs text-gray-500">
                    Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filtered.length)} de {filtered.length} itens
                </span>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="h-8 px-2"
                    >
                        <ChevronLeft size={16} />
                    </Button>
                    <span className="text-sm font-medium text-gray-600">
                        Página {currentPage} de {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="h-8 px-2"
                    >
                        <ChevronRight size={16} />
                    </Button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}

// Componente simples de Card de Estatística
function StatCard({ icon, count, label, color }: any) {
    const colors: any = {
        blue: "text-blue-600 bg-blue-50 border-blue-100",
        orange: "text-orange-600 bg-orange-50 border-orange-100",
        red: "text-red-600 bg-red-50 border-red-100"
    }
    
    return (
        <div className={`p-6 rounded-xl border flex items-center gap-4 ${colors[color]}`}>
            <div className={`p-3 bg-white rounded-full shadow-sm`}>
                {icon}
            </div>
            <div>
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-xs font-medium uppercase tracking-wide opacity-80">{label}</p>
            </div>
        </div>
    );
}
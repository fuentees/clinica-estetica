import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  Plus, Search, Edit, Trash2, Tag, Loader2, Sparkles, Database,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from 'react-hot-toast';

// Lista padrão (mantida)
const DEFAULT_SERVICES = [
  { name: 'Toxina Botulínica (Terço Superior)', category: 'Toxina', price: 1200, duration: 30, description: 'Testa, Glabela e Pés de Galinha' },
  { name: 'Toxina Botulínica (Full Face)', category: 'Toxina', price: 1800, duration: 45, description: 'Face completa e pescoço (Nefertiti)' },
  { name: 'Preenchimento Labial (1ml)', category: 'Preenchedor', price: 1500, duration: 45, description: 'Volumização e contorno labial' },
  { name: 'Preenchimento de Olheiras', category: 'Preenchedor', price: 1500, duration: 45, description: 'Tratamento de profundidade infraorbital' },
  { name: 'Sculptra (1 Frasco)', category: 'Bioestimulador', price: 2800, duration: 45, description: 'Ácido Poli-L-Lático para flacidez' },
  { name: 'Limpeza de Pele Profunda', category: 'Facial', price: 250, duration: 60, description: 'Extração de comedões e hidratação' },
  { name: 'Enzimas (Gordura Localizada)', category: 'Corporal', price: 350, duration: 30, description: 'Aplicação de lipolíticos' },
];

const CATEGORIES = [
    { id: 'todos', label: 'Todos' },
    { id: 'Facial', label: 'Facial' },
    { id: 'Corporal', label: 'Corporal' },
    { id: 'Toxina', label: 'Toxina' },
    { id: 'Preenchedor', label: 'Preenchedores' },
    { id: 'Bioestimulador', label: 'Bioestimuladores' },
    { id: 'Tecnologia', label: 'Tecnologias' },
    { id: 'Capilar', label: 'Capilar' },
];

export function TreatmentsPage() {
  const navigate = useNavigate();
  const [treatments, setTreatments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeCategory, itemsPerPage]);

  async function fetchServices() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from('profiles').select('clinic_id').eq('id', user.id).single();
      if (!profile?.clinic_id) return toast.error("Erro: Clínica não identificada.");

      const { data, error } = await supabase
        .from('services') 
        .select('*')
        .eq('clinic_id', profile.clinic_id)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setTreatments(data || []);

    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar serviços.');
    } finally {
      setLoading(false);
    }
  }

  const handleImportDefaults = async () => {
      if(!confirm("Deseja importar o catálogo padrão?")) return;
      try {
          setImporting(true);
          const { data: { user } } = await supabase.auth.getUser();
          const { data: profile } = await supabase.from('profiles').select('clinic_id').eq('id', user?.id).single();
          if (!profile?.clinic_id) throw new Error("Clínica não encontrada");

          const servicesToInsert = DEFAULT_SERVICES.map(service => ({ ...service, clinic_id: profile.clinic_id, is_active: true }));
          const { error } = await supabase.from('services').insert(servicesToInsert);
          if (error) throw error;

          toast.success("Catálogo importado!");
          fetchServices();
      } catch (error: any) {
          toast.error("Erro: " + error.message);
      } finally {
          setImporting(false);
      }
  };

  async function handleDelete(id: string) {
    if (!confirm('Remover este serviço?')) return;
    try {
      await supabase.from('services').delete().eq('id', id);
      toast.success('Serviço removido.');
      setTreatments(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      toast.error('Erro ao remover.');
    }
  }

  const filtered = treatments.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || (t.category && t.category.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = activeCategory === 'todos' || t.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // --- PAGINAÇÃO ---
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage; 
  const currentItems = filtered.slice(startIndex, endIndex);

  const formatDuration = (duration: any) => duration ? `${duration} min` : '--';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* CABEÇALHO CLEAN */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Tag className="text-pink-600" size={28} /> Catálogo de Serviços
          </h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie protocolos, preços e kits de consumo</p>
        </div>
        
        <div className="flex gap-3">
            {treatments.length === 0 && (
                <Button onClick={handleImportDefaults} disabled={importing} variant="outline" className="text-pink-600 border-pink-200 hover:bg-pink-50">
                    {importing ? <Loader2 className="animate-spin mr-2" size={16}/> : <Database className="mr-2" size={16} />} Importar Padrões
                </Button>
            )}
            <Link to="/services/new">
                <Button className="bg-pink-600 hover:bg-pink-700 text-white shadow-lg shadow-pink-200">
                    <Plus size={18} className="mr-2" /> Novo Serviço
                </Button>
            </Link>
        </div>
      </div>

      {/* FILTROS E PAGINAÇÃO */}
      <div className="space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
              {CATEGORIES.map(cat => (
                  <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`px-4 py-2 rounded-full text-xs font-medium transition-all border
                          ${activeCategory === cat.id 
                              ? 'bg-gray-900 text-white border-gray-900' 
                              : 'bg-white dark:bg-gray-800 text-gray-600 border-gray-200 hover:border-pink-300'
                          }`}
                  >
                      {cat.label}
                  </button>
              ))}
          </div>

          <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input 
                    type="text"
                    placeholder="Buscar procedimento..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all"
                />
              </div>

              <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-medium">Exibir:</span>
                  <select 
                      value={itemsPerPage}
                      onChange={(e) => setItemsPerPage(Number(e.target.value))}
                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm rounded-lg px-2 py-2 outline-none focus:border-pink-500"
                  >
                      <option value={10}>10 linhas</option>
                      <option value={20}>20 linhas</option>
                      <option value={50}>50 linhas</option>
                  </select>
              </div>
          </div>
      </div>

      {/* TABELA CLEAN */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 font-medium border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4">Procedimento</th>
                  <th className="px-6 py-4 text-center">Categoria</th>
                  <th className="px-6 py-4 text-center">Tempo</th>
                  <th className="px-6 py-4 text-right">Valor</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center">
                        <Loader2 className="animate-spin text-pink-600 mx-auto mb-2" size={24} />
                        <p className="text-gray-400 text-xs">Carregando...</p>
                    </td>
                  </tr>
                ) : currentItems.length === 0 ? (
                   <tr>
                      <td colSpan={5} className="py-12 text-center">
                         <div className="flex flex-col items-center gap-3">
                            <Sparkles className="text-gray-300" size={32} />
                            <span className="text-gray-400 text-sm">Nenhum serviço encontrado.</span>
                         </div>
                      </td>
                   </tr>
                ) : (
                  currentItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/40 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/20">
                            <Tag size={18} />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{item.name}</p>
                            {item.description && (
                                <p className="text-xs text-gray-500 truncate max-w-[250px]">{item.description}</p>
                            )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                            {item.category}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">
                      {formatDuration(item.duration)}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-white">
                      {Number(item.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
                          // ✅ ROTA CORRIGIDA PARA serviços/edit/:id
                          onClick={() => navigate(`/services/edit/${item.id}`)}
                        >
                            <Edit size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:bg-red-50"
                          onClick={() => handleDelete(item.id)}
                        >
                            <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
        </div>

        {/* PAGINAÇÃO */}
        {filtered.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50">
                <span className="text-xs text-gray-500">
                    Mostrando {startIndex + 1} a {Math.min(endIndex, filtered.length)} de {filtered.length} serviços
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
                        {currentPage} de {totalPages}
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
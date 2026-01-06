import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  Plus, Search, Edit, Trash2, Tag, Clock, DollarSign, Stethoscope, Loader2 
} from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { toast } from 'react-hot-toast';

export function TreatmentsPage() {
  const navigate = useNavigate();
  const [treatments, setTreatments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchServices();
  }, []);

  async function fetchServices() {
    try {
      setLoading(true);
      // ✅ CORREÇÃO 1: Nome da tabela no banco é 'services' (conforme Prisma)
      const { data, error } = await supabase
        .from('services') 
        .select('*')
        .eq('isActive', true) // Opcional: trazer apenas ativos
        .order('name');

      if (error) throw error;
      setTreatments(data || []);
    } catch (error) {
      console.error('Erro ao carregar catálogo:', error);
      toast.error('Erro ao carregar serviços.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja remover este serviço?')) return;
    try {
      // ✅ CORREÇÃO 2: Deletar da tabela 'services'
      const { error } = await supabase.from('services').delete().eq('id', id);
      
      if (error) throw error;
      toast.success('Serviço removido do catálogo.');
      fetchServices();
    } catch (error) {
      toast.error('Erro ao remover o serviço.');
    }
  }

  const filtered = treatments.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper para formatar a duração
  const formatDuration = (duration: any) => {
    if (!duration) return '--';
    return String(duration) + ' min';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Tag className="text-pink-600" /> Catálogo de Serviços
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Gerencie os protocolos, preços e tempos médios de cada procedimento.
          </p>
        </div>
        
        {/* ✅ CORREÇÃO 3: Link agora aponta para /services/new */}
        <Link to="/services/new">
          <Button className="bg-pink-600 hover:bg-pink-700 text-white flex items-center gap-2 shadow-lg shadow-pink-200 dark:shadow-none transition-all hover:scale-105 active:scale-95">
            <Plus size={18} /> Criar Novo Serviço
          </Button>
        </Link>
      </div>

      {/* FERRAMENTA DE BUSCA */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input 
            placeholder="Buscar procedimento pelo nome (ex: Botox, Preenchimento)..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-pink-500/20"
          />
        </div>
      </div>

      {/* TABELA DE SERVIÇOS */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 uppercase text-[10px] font-black tracking-widest border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4">Procedimento & Descrição</th>
                  <th className="px-6 py-4">Duração Média</th>
                  <th className="px-6 py-4">Valor Base</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-20 text-center">
                       <Loader2 className="animate-spin text-pink-600 mx-auto" size={32} />
                       <p className="text-gray-400 text-xs mt-2 font-bold uppercase tracking-widest">Sincronizando Catálogo...</p>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                   <tr>
                     <td colSpan={4} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-4">
                            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-full text-gray-200">
                                <Search size={32} />
                            </div>
                            <p className="text-gray-400 font-bold uppercase text-xs tracking-widest italic">
                                Nenhum serviço encontrado.
                            </p>
                        </div>
                     </td>
                   </tr>
                ) : (
                  filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300 shadow-inner">
                            <Stethoscope size={20} />
                        </div>
                        <div>
                            <p className="font-bold text-gray-800 dark:text-white group-hover:text-pink-600 transition-colors">{item.name}</p>
                            <p className="text-xs text-gray-400 line-clamp-1">{item.description || 'S/ Descrição'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 font-medium italic">
                        <Clock size={16} className="text-orange-500" />
                        {formatDuration(item.duration)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 font-black text-emerald-600 dark:text-emerald-400">
                        <DollarSign size={16} />
                        {Number(item.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                          // ✅ CORREÇÃO 4: Link de edição corrigido para /services/...
                          onClick={() => navigate(`/services/${item.id}/edit`)}
                        >
                            <Edit size={18} />
                        </Button>
                        <Button 
                          onClick={() => handleDelete(item.id)} 
                          variant="ghost" 
                          size="sm" 
                          className="hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                        >
                            <Trash2 size={18} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}
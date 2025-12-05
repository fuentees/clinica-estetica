import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  Plus, Search, Edit, Trash2, Tag, Clock, DollarSign, Stethoscope 
} from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { toast } from 'react-hot-toast';

export function TreatmentsPage() {
  const [treatments, setTreatments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTreatments();
  }, []);

  async function fetchTreatments() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('treatments')
        .select('*')
        .order('name');

      if (error) throw error;
      setTreatments(data || []);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar serviços.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza? Isso pode afetar históricos passados.')) return;
    try {
      const { error } = await supabase.from('treatments').delete().eq('id', id);
      if (error) throw error;
      toast.success('Serviço removido.');
      fetchTreatments();
    } catch (error) {
      toast.error('Erro ao remover.');
    }
  }

  const filtered = treatments.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Tag className="text-pink-600" /> Catálogo de Serviços
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Gerencie os preços e tempos dos seus procedimentos.
          </p>
        </div>
        <Link to="/treatments/new">
          <Button className="bg-pink-600 hover:bg-pink-700 text-white flex items-center gap-2 shadow-sm">
            <Plus size={18} /> Criar Personalizado
          </Button>
        </Link>
      </div>

      {/* Busca */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input 
            placeholder="Buscar procedimento (ex: Botox, Bioimpedância)..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600"
          />
        </div>
      </div>

      {/* Tabela de Serviços */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 font-medium border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4">Procedimento</th>
                  <th className="px-6 py-4">Duração</th>
                  <th className="px-6 py-4">Valor Base</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300">
                            <Stethoscope size={18} />
                        </div>
                        <div>
                            <p className="font-bold text-gray-800 dark:text-white">{item.name}</p>
                            <p className="text-xs text-gray-500">{item.description || 'Sem descrição'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <Clock size={16} className="text-orange-500" />
                        {/* Tratamento visual para o intervalo do Postgres */}
                        {String(item.duration).replace(/:00$/, '').replace('00:', '')} 
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 font-bold text-green-600 dark:text-green-400">
                        <DollarSign size={16} />
                        {Number(item.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link to={`/treatments/${item.id}/edit`}> {/* Rota para editar preço (reutiliza o form) */}
                            <Button variant="ghost" size="sm" className="hover:text-blue-600 hover:bg-blue-50">
                                <Edit size={16} />
                            </Button>
                        </Link>
                        <Button onClick={() => handleDelete(item.id)} variant="ghost" size="sm" className="hover:text-red-600 hover:bg-red-50">
                            <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
        
        {filtered.length === 0 && !loading && (
            <div className="p-12 text-center text-gray-500">
                Nenhum serviço encontrado.
            </div>
        )}
      </div>
    </div>
  );
}
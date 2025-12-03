import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Plus, Search, User, Stethoscope, Briefcase, Edit } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { toast } from 'react-hot-toast';

export function ProfessionalsPage() {
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProfessionals();
  }, []);

  async function fetchProfessionals() {
    try {
      setLoading(true);
      // Busca todos os perfis que não são 'patient' (ou seja: Admin, Médico, Recepcionista)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('role', 'patient') 
        .order('last_name', { ascending: true });

      if (error) throw error;
      setProfessionals(data || []);
    } catch (error) {
      console.error('Erro ao buscar profissionais:', error);
      toast.error('Erro ao carregar lista de profissionais.');
    } finally {
      setLoading(false);
    }
  }

  // Filtragem local
  const filteredProfessionals = professionals.filter(p => {
    const fullName = `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase();
    const email = p.email || '';
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) || email.includes(search);
  });

  // Função auxiliar para mostrar o ícone correto
  const RoleIcon = ({ role }: { role: string }) => {
    switch (role) {
      case 'medico':
      case 'professional':
      case 'doutor':
        return <Stethoscope size={18} className="text-blue-500" />;
      case 'admin':
        return <Briefcase size={18} className="text-purple-500" />;
      case 'recepcionista':
        return <User size={18} className="text-pink-500" />;
      default:
        return <User size={18} className="text-gray-500" />;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Profissionais</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Gerencie o staff e permissões.</p>
        </div>
        
        {/* BOTÃO NOVO PROFISSIONAL */}
        <Link to="/professionals/new">
          <Button className="bg-pink-600 hover:bg-pink-700 text-white flex items-center gap-2">
            <Plus size={18} /> Novo Profissional
          </Button>
        </Link>
      </div>

      {/* Barra de Busca */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input 
            placeholder="Buscar por nome ou email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600"
          />
        </div>
      </div>

      {/* Lista / Tabela */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Carregando profissionais...</div>
        ) : filteredProfessionals.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center gap-3">
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-full">
              <Search size={32} className="text-gray-400" />
            </div>
            <p className="text-gray-500">Nenhum profissional encontrado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 font-medium border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4">Nome</th>
                  <th className="px-6 py-4">Função</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredProfessionals.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center font-bold uppercase text-sm">
                          {p.first_name?.charAt(0) || '?'}
                        </div>
                        <p className="font-semibold text-gray-800 dark:text-white">
                          {p.first_name} {p.last_name}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 capitalize">
                      <div className="flex items-center gap-2">
                          <RoleIcon role={p.role} />
                          {p.role}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {p.email}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/professionals/${p.id}/edit`}>
                        <Button variant="ghost" size="sm" className="hover:text-pink-600 hover:bg-pink-50">
                          <Edit size={16} className="mr-2" /> Editar
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Plus, Search, User, Stethoscope, Briefcase, Edit, Loader2 } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { toast } from 'react-hot-toast';

export function ProfessionalsPage() {
  const navigate = useNavigate();
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProfessionals();
  }, []);

  async function fetchProfessionals() {
    try {
      setLoading(true);
      // Busca perfis administrativos/técnicos (exclui o role 'patient' ou 'paciente')
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .not('role', 'eq', 'patient') 
        .not('role', 'eq', 'paciente')
        .order('first_name', { ascending: true });

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
    const email = (p.email || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) || email.includes(search);
  });

  // Função auxiliar para ícone correto
  const RoleIcon = ({ role }: { role: string }) => {
    const r = role?.toLowerCase();
    switch (r) {
      case 'medico':
      case 'professional':
      case 'profissional':
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
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Equipe e Colaboradores</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Gerencie o staff, especialidades e permissões de acesso.</p>
        </div>
        
        <Button 
          onClick={() => navigate("/professionals/new")}
          className="bg-pink-600 hover:bg-pink-700 text-white flex items-center gap-2 shadow-lg shadow-pink-200 dark:shadow-none"
        >
          <Plus size={18} /> Novo Colaborador
        </Button>
      </div>

      {/* Barra de Busca */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input 
            placeholder="Buscar por nome, cargo ou e-mail..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600"
          />
        </div>
      </div>

      {/* Lista / Tabela */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-20 text-center flex flex-col items-center gap-3">
             <Loader2 className="animate-spin text-pink-600" size={32} />
             <p className="text-gray-500 text-sm">Sincronizando staff...</p>
          </div>
        ) : filteredProfessionals.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center gap-3">
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-full">
              <Search size={32} className="text-gray-400" />
            </div>
            <p className="text-gray-500">Nenhum colaborador localizado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 font-medium border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4">Nome Profissional</th>
                  <th className="px-6 py-4">Função / Especialidade</th>
                  <th className="px-6 py-4">Email de Acesso</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredProfessionals.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-600 flex items-center justify-center font-bold uppercase text-sm border border-pink-200 dark:border-pink-800">
                          {p.avatar_url ? (
                            <img src={p.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            p.first_name?.charAt(0) || '?'
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 dark:text-white group-hover:text-pink-600 transition-colors">
                            {p.first_name} {p.last_name}
                          </p>
                          <p className="text-[10px] text-gray-400 uppercase tracking-widest">{p.formacao || 'Staff'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                          <RoleIcon role={p.role} />
                          <span className="capitalize text-gray-700 dark:text-gray-300 font-medium">{p.role}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {p.email}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/professionals/${p.id}`}>
                        <Button variant="ghost" size="sm" className="hover:text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-900/20">
                          <Edit size={16} className="mr-2" /> Gerenciar
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
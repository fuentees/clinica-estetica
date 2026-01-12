import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Plus, Search, User, Stethoscope, Briefcase, Edit, Loader2, Lock, KeyRound, Percent } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { toast } from 'react-hot-toast';

interface Professional {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  cpf: string;
  role: string;
  formacao: string;
  avatar_url?: string;
  commission_rate?: number; // <--- Adicionado
}

export function ProfessionalsPage() {
  const navigate = useNavigate();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProfessionals();
  }, []);

  async function fetchProfessionals() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*') // Vai trazer commission_rate automaticamente
        .not('role', 'in', '("patient","paciente")')
        .order('first_name', { ascending: true });

      if (error) throw error;
      setProfessionals(data || []);
    } catch (error) {
      console.error('Erro ao buscar profissionais:', error);
      toast.error('Erro ao carregar lista.');
    } finally {
      setLoading(false);
    }
  }

  // --- HELPER: LIMPA CPF PARA SENHA ---
  const getCleanPassword = (cpf: string) => {
      return cpf.replace(/\D/g, '');
  };

  // --- FUNÇÃO 1: CRIAR USUÁRIO ---
  const handleCreateUser = async (prof: Professional) => {
    if (!prof.email || !prof.cpf) return toast.error("Email e CPF obrigatórios.");
    
    const password = getCleanPassword(prof.cpf);
    
    if (password.length < 6) return toast.error("CPF inválido para senha (mínimo 6 dígitos).");

    try {
      setActionLoading(prof.id);
      const { error } = await supabase.rpc('create_professional_user', {
        email_input: prof.email,
        password_input: password, 
        profile_id_input: prof.id,
        role_input: prof.role || 'professional'
      });

      if (error) {
          if (error.message.includes("já está cadastrado")) {
              toast.error("Usuário já existe! Use o botão 'Resetar' ao lado.", { duration: 5000 });
          } else {
              throw error;
          }
      } else {
          toast.success(`Acesso liberado! Senha inicial: ${password}`);
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao liberar acesso.");
    } finally {
      setActionLoading(null);
    }
  };

  // --- FUNÇÃO 2: RESETAR SENHA ---
  const handleResetPassword = async (prof: Professional) => {
    const password = getCleanPassword(prof.cpf);

    if (!confirm(`Confirmar reset de senha para: ${password} ?`)) return;
    
    if (!prof.email || password.length < 6) return toast.error("Dados inválidos.");

    try {
        setActionLoading(prof.id);
        const { data, error } = await supabase.rpc('reset_professional_password', {
            target_email: prof.email,
            new_password: password 
        });

        if (error) throw error;

        if (data === true) {
            toast.success(`Senha resetada! Nova senha: ${password}`);
        } else {
            toast.error("Usuário não encontrado no sistema de autenticação (Tente 'Liberar' primeiro).");
        }

    } catch (err: any) {
        console.error(err);
        toast.error("Erro ao resetar senha.");
    } finally {
        setActionLoading(null);
    }
  };

  const filteredProfessionals = professionals.filter(p => {
    const fullName = `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase();
    const email = (p.email || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) || email.includes(search);
  });

  const RoleIcon = ({ role }: { role: string }) => {
    const r = role?.toLowerCase();
    if (r?.includes('medic') || r?.includes('doutor')) return <Stethoscope size={18} className="text-blue-500" />;
    if (r === 'admin') return <Briefcase size={18} className="text-purple-500" />;
    return <User size={18} className="text-gray-500" />;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Equipe e Colaboradores</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Gerencie o staff e permissões de acesso.</p>
        </div>
        <Button onClick={() => navigate("/professionals/new")} className="bg-pink-600 hover:bg-pink-700 text-white flex gap-2 shadow-lg">
          <Plus size={18} /> Novo Colaborador
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input 
            placeholder="Buscar por nome, cargo ou e-mail..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-50 dark:bg-gray-900 border-gray-200"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-20 text-center flex flex-col items-center gap-3">
              <Loader2 className="animate-spin text-pink-600" size={32} />
              <p className="text-gray-500 text-sm">Sincronizando staff...</p>
          </div>
        ) : filteredProfessionals.length === 0 ? (
          <div className="p-12 text-center text-gray-500">Nenhum colaborador localizado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 font-medium">
                <tr>
                  <th className="px-6 py-4">Profissional</th>
                  <th className="px-6 py-4">Função</th>
                  <th className="px-6 py-4">Comissão</th> {/* NOVA COLUNA */}
                  <th className="px-6 py-4">Acesso ao Sistema</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredProfessionals.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center font-bold text-sm border border-pink-200">
                          {p.first_name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 dark:text-white">{p.first_name} {p.last_name}</p>
                          <p className="text-[10px] text-gray-400 uppercase tracking-widest">{p.formacao || 'Staff'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                          <RoleIcon role={p.role} />
                          <span className="capitalize">{p.role}</span>
                      </div>
                    </td>
                    
                    {/* COLUNA DE COMISSÃO */}
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-1 font-bold text-gray-700 dark:text-gray-300">
                            <Percent size={14} className="text-emerald-500"/>
                            {p.commission_rate || 0}%
                        </div>
                    </td>

                    <td className="px-6 py-4">
                        <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              disabled={actionLoading === p.id}
                              onClick={() => handleCreateUser(p)}
                              className="h-8 text-[10px] font-bold uppercase tracking-widest border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                            >
                              {actionLoading === p.id ? <Loader2 className="animate-spin w-3 h-3"/> : <Lock size={12} className="mr-1"/>}
                              Liberar
                            </Button>

                            <Button 
                              size="sm" 
                              variant="outline"
                              disabled={actionLoading === p.id}
                              onClick={() => handleResetPassword(p)}
                              className="h-8 text-[10px] font-bold uppercase tracking-widest border-amber-200 text-amber-700 hover:bg-amber-50"
                              title="Resetar senha para CPF"
                            >
                              <KeyRound size={12} className="mr-1"/>
                              Resetar
                            </Button>
                        </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/professionals/${p.id}`}>
                        <Button variant="ghost" size="sm">
                          <Edit size={16} />
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
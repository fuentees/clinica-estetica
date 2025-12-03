import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Plus, Search, Edit, Phone, Calendar, FileText } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

export function PatientsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPatients();
  }, []);

  async function fetchPatients() {
    try {
      setLoading(true);
      // Busca pacientes e os dados pessoais da tabela profiles
      const { data, error } = await supabase
        .from('patients')
        .select(`
          id,
          cpf,
          date_of_birth,
          profiles:profile_id (
            first_name,
            last_name,
            email,
            phone
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Erro ao buscar pacientes:', error);
      toast.error('Erro ao carregar lista.');
    } finally {
      setLoading(false);
    }
  }

  // Filtragem local
  const filteredPatients = patients.filter(p => {
    const fullName = `${p.profiles?.first_name || ''} ${p.profiles?.last_name || ''}`.toLowerCase();
    const cpf = p.cpf || '';
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) || cpf.includes(search);
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Pacientes</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Gerencie seus clientes e prontuários.</p>
        </div>
        <Link to="/patients/new">
          <Button className="bg-pink-600 hover:bg-pink-700 text-white flex items-center gap-2">
            <Plus size={18} /> Novo Paciente
          </Button>
        </Link>
      </div>

      {/* Barra de Busca */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input 
            placeholder="Buscar por nome ou CPF..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600"
          />
        </div>
      </div>

      {/* Lista / Tabela */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Carregando pacientes...</div>
        ) : filteredPatients.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center gap-3">
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-full">
              <Search size={32} className="text-gray-400" />
            </div>
            <p className="text-gray-500">Nenhum paciente encontrado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 font-medium border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4">Nome</th>
                  <th className="px-6 py-4">Contato</th>
                  <th className="px-6 py-4">CPF</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredPatients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center font-bold uppercase text-sm">
                          {patient.profiles?.first_name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 dark:text-white">
                            {patient.profiles?.first_name} {patient.profiles?.last_name}
                          </p>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar size={12} /> 
                            {patient.date_of_birth ? format(new Date(patient.date_of_birth), 'dd/MM/yyyy') : '-'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="text-gray-600 dark:text-gray-300 flex items-center gap-2">
                          <Phone size={14} className="text-green-500" />
                          {patient.profiles?.phone || '-'}
                        </p>
                        <p className="text-xs text-gray-400">{patient.profiles?.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {patient.cpf}
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      
                      {/* BOTÃO PRONTUÁRIO / HISTÓRICO (Novo) */}
                      <Link to={`/patients/${patient.id}/history`}>
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-50">
                          <FileText size={16} className="mr-2" /> Histórico
                        </Button>
                      </Link>

                      {/* BOTÃO EDITAR DADOS */}
                      <Link to={`/patients/${patient.id}/edit`}>
                        <Button variant="ghost" size="sm" className="hover:text-pink-600 hover:bg-pink-50">
                          <Edit size={16} className="mr-2" /> Dados
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
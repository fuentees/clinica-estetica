import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  Search, 
  Calendar, 
  ClipboardList, 
  Activity, 
  UserCog, 
  MessageCircle, 
  DollarSign, 
  CalendarPlus,
  Loader2, 
  UserPlus, 
  Filter,
  Users // Adicionado para corrigir erro 2304
} from 'lucide-react'; // Plus removido para corrigir erro 6133
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

export function PatientsPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (profile?.clinicId) {
      fetchPatients();
    }
  }, [profile?.clinicId]);

  async function fetchPatients() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('patients')
        .select(`
          id,
          cpf,
          date_of_birth,
          name,
          phone,
          email
        `)
        .eq('clinicId', profile?.clinicId)
        .order('name', { ascending: true });

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Erro ao buscar pacientes:', error);
      toast.error('Erro ao carregar lista de pacientes.');
    } finally {
      setLoading(false);
    }
  }

  const filteredPatients = patients.filter(p => {
    const fullName = (p.name || '').toLowerCase();
    const cpf = (p.cpf || '').replace(/\D/g, '');
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) || cpf.includes(search);
  });

  const handleWhatsApp = (phone: string) => {
      if (!phone) return toast.error("Telefone não cadastrado.");
      const cleanPhone = phone.replace(/\D/g, '');
      const finalPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
      window.open(`https://wa.me/${finalPhone}`, '_blank');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      
      {/* HEADER PREMIUM */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter italic uppercase flex items-center gap-3">
            <Users className="text-pink-600" size={32} /> Central de <span className="text-pink-600">Pacientes</span>
          </h1>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">Gestão de prontuários e histórico clínico</p>
        </div>
        <Link to="/patients/new">
          <Button className="h-14 px-8 bg-gray-900 hover:bg-black text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl transition-all hover:scale-105 active:scale-95">
            <UserPlus size={18} className="mr-2 text-pink-500" /> Novo Cadastro
          </Button>
        </Link>
      </div>

      {/* BARRA DE BUSCA E FILTROS */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-xl group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-pink-500 transition-colors" size={20} />
          <Input 
            placeholder="Pesquisar por nome ou CPF..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-12 pl-12 pr-6 rounded-xl bg-gray-50 dark:bg-gray-900 border-0 text-sm font-bold outline-none focus:ring-2 focus:ring-pink-500/20 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 bg-gray-50 dark:bg-gray-900 px-4 py-2 rounded-full border border-gray-100 dark:border-gray-700">
           <Filter size={14} className="text-pink-500" />
           <span>{filteredPatients.length}</span> Registros Encontrados
        </div>
      </div>

      {/* TABELA DE PACIENTES */}
      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="py-40 flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-pink-600" size={48} />
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em]">Sincronizando Base de Dados...</p>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="py-40 text-center flex flex-col items-center gap-4">
            <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-full text-gray-200">
              <Search size={64} />
            </div>
            <p className="text-gray-500 font-black uppercase text-xs tracking-widest">Nenhum paciente localizado</p>
          </div>
        ) : (
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50/50 dark:bg-gray-900/50 text-gray-400 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Paciente & Identificação</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-center">Contatos</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-right">Ações Técnicas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {filteredPatients.map((patient) => {
                  const initials = (patient.name || '?').substring(0, 2).toUpperCase();
                  
                  return (
                    <tr key={patient.id} className="group hover:bg-pink-50/30 dark:hover:bg-gray-900/40 transition-all cursor-pointer" onClick={() => navigate(`/patients/${patient.id}`)}>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-5">
                          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-pink-100 to-purple-100 dark:from-pink-900/20 dark:to-purple-900/20 text-pink-600 font-black text-sm flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform italic border border-white dark:border-gray-700">
                            {initials}
                          </div>
                          <div>
                            <p className="font-black text-gray-900 dark:text-white text-base tracking-tighter italic uppercase group-hover:text-pink-600 transition-colors">
                              {patient.name}
                            </p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 flex items-center gap-1.5">
                              <Calendar size={12} className="text-pink-300"/> 
                              {patient.date_of_birth ? format(new Date(patient.date_of_birth), 'dd/MM/yyyy') : 'Nascimento não informado'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-2 items-center">
                            <span className="text-gray-600 dark:text-gray-300 text-xs font-black tracking-widest font-mono">{patient.phone || '--'}</span>
                            {patient.phone && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleWhatsApp(patient.phone); }}
                                    className="flex items-center gap-2 text-[9px] font-black uppercase tracking-tighter text-green-600 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-all shadow-sm"
                                >
                                    <MessageCircle size={12} /> WhatsApp
                                </button>
                            )}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2 items-center" onClick={(e) => e.stopPropagation()}>
                          
                          {/* Atalhos Rápidos */}
                          <Link to={`/appointments/new?patientId=${patient.id}`}> 
                            <Button variant="ghost" size="sm" className="text-gray-300 hover:text-blue-500 h-10 w-10 p-0 rounded-xl hover:bg-blue-50" title="Agendar Consulta">
                              <CalendarPlus size={20} />
                            </Button>
                          </Link>
                          
                          <Link to={`/financial/${patient.id}`}> 
                            <Button variant="ghost" size="sm" className="text-gray-300 hover:text-emerald-500 h-10 w-10 p-0 rounded-xl hover:bg-emerald-50" title="Financeiro">
                              <DollarSign size={20} />
                            </Button>
                          </Link>

                          <div className="w-px h-6 bg-gray-100 dark:bg-gray-700 mx-2"></div>

                          {/* Ações Técnicas com Labels */}
                          <Link to={`/patients/${patient.id}/anamnesis`}>
                            <Button variant="outline" className="h-10 px-4 rounded-xl text-blue-600 border-blue-100 hover:bg-blue-50 font-black uppercase text-[9px] tracking-widest">
                              <ClipboardList size={14} className="mr-2" /> Anamnese
                            </Button>
                          </Link>

                          <Link to={`/patients/${patient.id}/history`}>
                            <Button variant="outline" className="h-10 px-4 rounded-xl text-purple-600 border-purple-100 hover:bg-purple-50 font-black uppercase text-[9px] tracking-widest">
                              <Activity size={14} className="mr-2" /> Prontuário
                            </Button>
                          </Link>

                          <Link to={`/patients/${patient.id}/edit`}>
                            <Button variant="ghost" className="h-10 w-10 p-0 rounded-xl text-gray-300 hover:text-gray-900" title="Editar Cadastro">
                              <UserCog size={20} />
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
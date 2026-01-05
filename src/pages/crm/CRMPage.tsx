import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import {
  Users, Plus, Search, Phone, Mail,
  MessageSquare, TrendingUp, CheckCircle2, XCircle, Loader2
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
// Importação do Modal que acabamos de criar
import { NewLeadModal } from '../../components/crm/NewLeadModal';

interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  source: string | null;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  score: number;
  created_at: string;
}

// Configuração visual dos status (Mapeamento)
const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  new: { label: 'Novo', color: 'bg-blue-500', icon: Users },
  contacted: { label: 'Contatado', color: 'bg-yellow-500', icon: Phone },
  qualified: { label: 'Qualificado', color: 'bg-purple-500', icon: TrendingUp },
  converted: { label: 'Convertido', color: 'bg-green-500', icon: CheckCircle2 },
  lost: { label: 'Perdido', color: 'bg-red-500', icon: XCircle },
};

export function CRMPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewLead, setShowNewLead] = useState(false);
  const [clinicId, setClinicId] = useState<string | null>(null);
  
  const queryClient = useQueryClient();

  // 1. Busca ClinicId ao carregar
  useEffect(() => {
    async function getClinic() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('clinicId').eq('id', user.id).single();
        if (data?.clinicId) setClinicId(data.clinicId);
      }
    }
    getClinic();
  }, []);

  // 2. Query de Leads (Filtrada por Clínica)
  const { data: leads, isLoading } = useQuery({
    queryKey: ['leads', statusFilter, clinicId],
    queryFn: async () => {
      if (!clinicId) return [];

      let query = supabase
        .from('leads')
        .select('*')
        .eq('clinicId', clinicId) // SEGURANÇA: Apenas desta clínica
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Lead[];
    },
    enabled: !!clinicId, // Só busca se tiver o ID da clínica
  });

  const updateLeadStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('leads')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Status atualizado!');
    },
  });

  // Filtro Local (Busca por texto)
  const filteredLeads = leads?.filter((lead) =>
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.phone.includes(searchTerm) ||
    lead.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Estatísticas Rápidas
  const stats = {
    total: leads?.length || 0,
    new: leads?.filter((l) => l.status === 'new').length || 0,
    contacted: leads?.filter((l) => l.status === 'contacted').length || 0,
    converted: leads?.filter((l) => l.status === 'converted').length || 0,
  };

  if (isLoading && !leads) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-white">CRM - Gestão de Leads</h1>
          <p className="text-gray-600 dark:text-gray-400">Gerencie seus potenciais clientes</p>
        </div>
        <Button 
          onClick={() => setShowNewLead(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
        >
          <Plus size={20} className="mr-2" />
          Novo Lead
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total de Leads" value={stats.total} icon={Users} color="blue" />
        <StatCard title="Novos" value={stats.new} icon={TrendingUp} color="yellow" />
        <StatCard title="Contatados" value={stats.contacted} icon={Phone} color="purple" />
        <StatCard title="Convertidos" value={stats.converted} icon={CheckCircle2} color="green" />
      </div>

      {/* Tabela e Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
        
        {/* Barra de Ferramentas */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Campo de Busca */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Buscar por nome, email ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>

            {/* Filtros de Status */}
            <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
              {['all', 'new', 'contacted', 'qualified', 'converted', 'lost'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    statusFilter === status
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {status === 'all' ? 'Todos' : statusConfig[status]?.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tabela */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Lead</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Contato</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Origem</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Score</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredLeads && filteredLeads.length > 0 ? (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900 dark:text-white">{lead.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {format(new Date(lead.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-300">{lead.phone}</div>
                      {lead.email && <div className="text-xs text-gray-500">{lead.email}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                        {lead.source || 'Desconhecido'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={lead.status}
                        onChange={(e) =>
                          updateLeadStatus.mutate({ id: lead.id, status: e.target.value })
                        }
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold text-white border-none outline-none cursor-pointer hover:opacity-90 transition-opacity ${
                          statusConfig[lead.status]?.color || 'bg-gray-500'
                        }`}
                      >
                        {Object.entries(statusConfig).map(([value, config]) => (
                          <option key={value} value={value} className="text-black bg-white">
                            {config.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-bold text-gray-700 dark:text-gray-300 w-6">{lead.score}</div>
                        <div className="ml-2 w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(lead.score, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <ActionButton icon={Phone} color="text-blue-600" bg="hover:bg-blue-50" onClick={() => window.open(`tel:${lead.phone}`)} />
                        <ActionButton icon={MessageSquare} color="text-green-600" bg="hover:bg-green-50" onClick={() => window.open(`https://wa.me/55${lead.phone.replace(/\D/g, '')}`, '_blank')} />
                        <ActionButton icon={Mail} color="text-purple-600" bg="hover:bg-purple-50" onClick={() => window.open(`mailto:${lead.email}`)} />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <Users size={48} className="mx-auto mb-3 text-gray-300" />
                    <p>Nenhum lead encontrado com estes filtros.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Integrado */}
      {clinicId && (
        <NewLeadModal 
          isOpen={showNewLead} 
          onClose={() => setShowNewLead(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['leads'] })}
          clinicId={clinicId}
        />
      )}
    </div>
  );
}

// Componentes Auxiliares para limpar o código
function StatCard({ title, value, icon: Icon, color }: any) {
  const colors: any = {
    blue: "border-blue-500 text-blue-500",
    yellow: "border-yellow-500 text-yellow-500",
    purple: "border-purple-500 text-purple-500",
    green: "border-green-500 text-green-500",
  };
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow p-6 border-l-4 ${colors[color].split(' ')[0]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold mt-1 text-gray-900 dark:text-white">{value}</p>
        </div>
        <Icon size={40} className={`${colors[color].split(' ')[1]} opacity-20`} />
      </div>
    </div>
  );
}

function ActionButton({ icon: Icon, color, bg, onClick }: any) {
  return (
    <button onClick={onClick} className={`p-2 rounded-lg transition-colors ${color} ${bg} dark:hover:bg-gray-700`}>
      <Icon size={18} />
    </button>
  );
}
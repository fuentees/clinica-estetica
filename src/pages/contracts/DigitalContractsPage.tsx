import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { FileText, Plus, Send, CheckCircle, X, Clock, Download, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
// AQUI ESTÁ A CORREÇÃO DO CAMINHO:
import { NewContractModal } from '../../components/contracts/NewContractModal';

interface DigitalContract {
  id: string;
  patient_id: string;
  contract_type: string;
  title: string;
  status: 'pending' | 'sent' | 'signed' | 'cancelled' | 'expired';
  sent_at: string | null;
  created_at: string;
  patients?: {
    name: string;
  } | null;
}

export function DigitalContractsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showNewContract, setShowNewContract] = useState(false);
  const [clinicId, setClinicId] = useState<string | null>(null);
  
  const queryClient = useQueryClient();

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

  const { data: contracts, isLoading } = useQuery({
    queryKey: ['digital-contracts', statusFilter, clinicId],
    queryFn: async () => {
      if (!clinicId) return [];

      let query = supabase
        .from('digital_contracts')
        .select(`*, patients (name)`)
        .eq('clinicId', clinicId)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as DigitalContract[];
    },
    enabled: !!clinicId,
  });

  const sendContract = useMutation({
    mutationFn: async (contractId: string) => {
      const { error } = await supabase
        .from('digital_contracts')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', contractId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['digital-contracts'] });
      toast.success('Contrato marcado como enviado!');
    },
  });

  const stats = {
    total: contracts?.length || 0,
    pending: contracts?.filter((c) => c.status === 'pending').length || 0,
    sent: contracts?.filter((c) => c.status === 'sent').length || 0,
    signed: contracts?.filter((c) => c.status === 'signed').length || 0,
  };

  const statusConfig = {
    pending: { label: 'Pendente', color: 'bg-yellow-500', icon: Clock },
    sent: { label: 'Enviado', color: 'bg-blue-500', icon: Send },
    signed: { label: 'Assinado', color: 'bg-green-500', icon: CheckCircle },
    cancelled: { label: 'Cancelado', color: 'bg-red-500', icon: X },
    expired: { label: 'Expirado', color: 'bg-gray-500', icon: Clock },
  };

  if (isLoading && !contracts) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3 text-gray-800 dark:text-white">
            <FileText className="text-blue-600" size={36} />
            Contratos Digitais
          </h1>
          <p className="text-gray-600">Gerencie contratos e assinaturas eletrônicas</p>
        </div>
        <Button onClick={() => setShowNewContract(true)} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg">
          <Plus size={20} className="mr-2" /> Novo Contrato
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total" value={stats.total} icon={FileText} color="blue" />
        <StatCard title="Pendentes" value={stats.pending} icon={Clock} color="yellow" />
        <StatCard title="Enviados" value={stats.sent} icon={Send} color="blue" />
        <StatCard title="Assinados" value={stats.signed} icon={CheckCircle} color="green" />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {['all', 'pending', 'sent', 'signed', 'expired'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap text-sm font-medium ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                {status === 'all' ? 'Todos' : statusConfig[status as keyof typeof statusConfig]?.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Título</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Paciente</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Criado em</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {contracts && contracts.length > 0 ? (
                contracts.map((contract) => {
                  const Icon = statusConfig[contract.status]?.icon || FileText;
                  return (
                    <tr key={contract.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            <FileText size={18} />
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">{contract.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {contract.patients?.name || 'Paciente desconhecido'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-white ${statusConfig[contract.status]?.color}`}>
                          <Icon size={12} />
                          {statusConfig[contract.status]?.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {format(new Date(contract.created_at), "dd MMM, yyyy", { locale: ptBR })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {contract.status === 'pending' && (
                            <Button size="sm" onClick={() => sendContract.mutate(contract.id)} className="bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs">
                              <Send size={12} className="mr-1" /> Enviar
                            </Button>
                          )}
                          {contract.status === 'signed' && (
                            <Button size="sm" variant="outline" className="h-8 text-xs">
                              <Download size={12} className="mr-1" /> PDF
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <p>Nenhum contrato encontrado.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {clinicId && (
        <NewContractModal 
          isOpen={showNewContract} 
          onClose={() => setShowNewContract(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['digital-contracts'] })}
          clinicId={clinicId}
        />
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: any) {
  const colorClasses: any = {
    blue: "border-blue-500 text-blue-500",
    yellow: "border-yellow-500 text-yellow-500",
    green: "border-green-500 text-green-500",
  };
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-l-4 ${colorClasses[color].split(' ')[0]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-800 dark:text-white">{value}</p>
        </div>
        <Icon size={40} className={`${colorClasses[color].split(' ')[1]} opacity-20`} />
      </div>
    </div>
  );
}
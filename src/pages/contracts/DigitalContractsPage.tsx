import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { FileText, Plus, Send, CheckCircle, X, Clock, Download } from 'lucide-react';
import { Button } from '../../components/ui/button';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
    profiles?: { first_name: string; last_name: string };
  };
  contract_signatures?: Array<{
    id: string;
    signed_at: string;
    signer_type: string;
  }>;
}

export function DigitalContractsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showNewContract, setShowNewContract] = useState(false);
  const queryClient = useQueryClient();

  const { data: contracts, isLoading } = useQuery({
    queryKey: ['digital-contracts', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('digital_contracts')
        .select(`
          *,
          patients (name, profiles (first_name, last_name)),
          contract_signatures (id, signed_at, signer_type)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as DigitalContract[];
    },
  });

  const sendContract = useMutation({
    mutationFn: async (contractId: string) => {
      const { error } = await supabase
        .from('digital_contracts')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', contractId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['digital-contracts'] });
      toast.success('Contrato enviado!');
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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <FileText className="text-blue-600" size={36} />
            Contratos Digitais
          </h1>
          <p className="text-gray-600">Gerencie contratos e assinaturas eletrônicas</p>
        </div>
        <Button
          onClick={() => setShowNewContract(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus size={20} className="mr-2" />
          Novo Contrato
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Total</p>
              <p className="text-3xl font-bold">{stats.total}</p>
            </div>
            <FileText size={40} className="text-blue-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Pendentes</p>
              <p className="text-3xl font-bold">{stats.pending}</p>
            </div>
            <Clock size={40} className="text-yellow-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Enviados</p>
              <p className="text-3xl font-bold">{stats.sent}</p>
            </div>
            <Send size={40} className="text-blue-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Assinados</p>
              <p className="text-3xl font-bold">{stats.signed}</p>
            </div>
            <CheckCircle size={40} className="text-green-500 opacity-20" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg">
        <div className="p-6 border-b">
          <div className="flex gap-2">
            {['all', 'pending', 'sent', 'signed', 'expired'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? 'Todos' : statusConfig[status as keyof typeof statusConfig]?.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Título
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Paciente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Criado em
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    Carregando...
                  </td>
                </tr>
              ) : contracts && contracts.length > 0 ? (
                contracts.map((contract) => {
                  const Icon = statusConfig[contract.status]?.icon || FileText;
                  return (
                    <tr key={contract.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <FileText size={20} className="text-gray-400" />
                          <div className="font-medium text-gray-900">{contract.title}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {contract.patients?.profiles?.first_name}{' '}
                          {contract.patients?.profiles?.last_name || contract.patients?.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600 capitalize">
                          {contract.contract_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold text-white ${
                            statusConfig[contract.status]?.color
                          }`}
                        >
                          <Icon size={14} />
                          {statusConfig[contract.status]?.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {format(new Date(contract.created_at), "dd 'de' MMM, yyyy", {
                            locale: ptBR,
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          {contract.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => sendContract.mutate(contract.id)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Send size={14} className="mr-1" />
                              Enviar
                            </Button>
                          )}
                          {contract.status === 'signed' && (
                            <Button size="sm" variant="outline">
                              <Download size={14} className="mr-1" />
                              Baixar
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    Nenhum contrato encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

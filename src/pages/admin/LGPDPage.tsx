import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Shield, Download, Trash2, FileText, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface DeletionRequest {
  id: string;
  reason: string;
  status: string;
  created_at: string;
  processed_at: string | null;
  patients: {
    name: string;
    email: string;
  };
}

export function LGPDPage() {
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: deletionRequests, isLoading } = useQuery({
    queryKey: ['deletion-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('data_deletion_requests')
        .select(`
          *,
          patients (name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DeletionRequest[];
    },
  });

  const { data: consents } = useQuery({
    queryKey: ['lgpd-consents-summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lgpd_consents')
        .select('consent_type, accepted')
        .eq('accepted', true);

      if (error) throw error;

      const summary = data.reduce((acc: any, consent) => {
        acc[consent.consent_type] = (acc[consent.consent_type] || 0) + 1;
        return acc;
      }, {});

      return summary;
    },
  });

  const processDeletion = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from('data_deletion_requests')
        .update({
          status: 'processing',
          processed_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deletion-requests'] });
      toast.success('Solicitação em processamento!');
    },
    onError: () => {
      toast.error('Erro ao processar solicitação');
    },
  });

  const exportPatientData = async (patient_id: string) => {
    try {
      const { data: patient } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

      const { data: appointments } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', patientId);

      const exportData = {
        patient,
        appointments,
        exported_at: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `dados-paciente-${patientId}.json`;
      link.click();

      toast.success('Dados exportados com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar dados');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: any = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendente' },
      processing: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Processando' },
      completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Concluído' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejeitado' },
    };

    const badge = badges[status] || badges.pending;
    return (
      <span className={`px-3 py-1 rounded-full text-sm ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Carregando dados LGPD...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Shield size={32} className="text-blue-600" />
        <h1 className="text-3xl font-bold">Conformidade LGPD</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <FileText size={24} className="text-blue-500" />
            <h3 className="font-semibold">Consentimentos</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Dados pessoais:</span>
              <span className="font-semibold">{consents?.personal_data || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Marketing:</span>
              <span className="font-semibold">{consents?.marketing || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Compartilhamento:</span>
              <span className="font-semibold">{consents?.data_sharing || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <Clock size={24} className="text-yellow-500" />
            <h3 className="font-semibold">Solicitações Pendentes</h3>
          </div>
          <p className="text-4xl font-bold text-yellow-500">
            {deletionRequests?.filter(r => r.status === 'pending').length || 0}
          </p>
          <p className="text-sm text-gray-600 mt-2">Aguardando processamento</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle size={24} className="text-green-500" />
            <h3 className="font-semibold">Solicitações Concluídas</h3>
          </div>
          <p className="text-4xl font-bold text-green-500">
            {deletionRequests?.filter(r => r.status === 'completed').length || 0}
          </p>
          <p className="text-sm text-gray-600 mt-2">Últimos 30 dias</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Solicitações de Exclusão de Dados</h2>
        </div>
        <div className="divide-y">
          {deletionRequests?.map((request) => (
            <div key={request.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold">{request.patients?.name}</h3>
                    {getStatusBadge(request.status)}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{request.patients?.email}</p>
                  {request.reason && (
                    <div className="bg-gray-50 p-3 rounded-lg mb-3">
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold">Motivo:</span> {request.reason}
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-gray-500">
                    Solicitado em: {format(new Date(request.created_at), "dd/MM/yyyy 'às' HH:mm")}
                  </p>
                  {request.processed_at && (
                    <p className="text-xs text-gray-500">
                      Processado em: {format(new Date(request.processed_at), "dd/MM/yyyy 'às' HH:mm")}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {request.status === 'pending' && (
                    <>
                      <button
                        onClick={() => exportPatientData(request.patients?.name)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        title="Exportar dados"
                      >
                        <Download size={16} />
                        Exportar
                      </button>
                      <button
                        onClick={() => processDeletion.mutate(request.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        title="Processar exclusão"
                      >
                        <Trash2 size={16} />
                        Processar
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}

          {deletionRequests?.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              <Shield size={48} className="mx-auto mb-4 text-gray-400" />
              <p>Nenhuma solicitação de exclusão de dados</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-2">Sobre a LGPD</h3>
        <p className="text-sm text-blue-800 mb-4">
          A Lei Geral de Proteção de Dados (LGPD) garante aos titulares de dados o direito de:
        </p>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Confirmação da existência de tratamento</li>
          <li>Acesso aos dados</li>
          <li>Correção de dados incompletos, inexatos ou desatualizados</li>
          <li>Anonimização, bloqueio ou eliminação de dados desnecessários</li>
          <li>Portabilidade dos dados</li>
          <li>Informação sobre o compartilhamento de dados</li>
          <li>Revogação do consentimento</li>
        </ul>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Mail, Send, Calendar, Users, TrendingUp, Plus } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface Campaign {
  id: string;
  name: string;
  type: string;
  status: string;
  channel: string;
  subject: string;
  scheduled_for: string | null;
  sent_count: number;
  opened_count: number;
  clicked_count: number;
  created_at: string;
}

export function MarketingCampaignsPage() {
  const [showModal, setShowModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Campaign[];
    },
  });

  const createCampaign = useMutation({
    mutationFn: async (campaignData: any) => {
      const { data: user } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('marketing_campaigns')
        .insert({
          ...campaignData,
          created_by: user.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campanha criada com sucesso!');
      setShowModal(false);
    },
    onError: () => {
      toast.error('Erro ao criar campanha');
    },
  });

  const sendCampaign = useMutation({
    mutationFn: async (campaignId: string) => {
      const { error } = await supabase
        .from('marketing_campaigns')
        .update({
          status: 'sending',
          sent_at: new Date().toISOString(),
        })
        .eq('id', campaignId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campanha enviada!');
    },
    onError: () => {
      toast.error('Erro ao enviar campanha');
    },
  });

  const getStatusBadge = (status: string) => {
    const badges: any = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Rascunho' },
      scheduled: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Agendada' },
      sending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Enviando' },
      sent: { bg: 'bg-green-100', text: 'text-green-800', label: 'Enviada' },
    };

    const badge = badges[status] || badges.draft;
    return (
      <span className={`px-3 py-1 rounded-full text-sm ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const calculateOpenRate = (opened: number, sent: number) => {
    if (sent === 0) return '0';
    return ((opened / sent) * 100).toFixed(1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Carregando campanhas...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Campanhas de Marketing</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          Nova Campanha
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <Mail size={24} className="text-blue-500" />
            <span className="text-2xl font-bold">{campaigns?.length || 0}</span>
          </div>
          <p className="text-sm text-gray-600">Total de Campanhas</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <Send size={24} className="text-green-500" />
            <span className="text-2xl font-bold">
              {campaigns?.filter(c => c.status === 'sent').length || 0}
            </span>
          </div>
          <p className="text-sm text-gray-600">Campanhas Enviadas</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <Users size={24} className="text-purple-500" />
            <span className="text-2xl font-bold">
              {campaigns?.reduce((acc, c) => acc + c.sent_count, 0) || 0}
            </span>
          </div>
          <p className="text-sm text-gray-600">Total Enviado</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp size={24} className="text-orange-500" />
            <span className="text-2xl font-bold">
              {campaigns?.length > 0
                ? calculateOpenRate(
                    campaigns.reduce((acc, c) => acc + c.opened_count, 0),
                    campaigns.reduce((acc, c) => acc + c.sent_count, 0)
                  )
                : '0'}%
            </span>
          </div>
          <p className="text-sm text-gray-600">Taxa de Abertura</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Todas as Campanhas</h2>
        </div>
        <div className="divide-y">
          {campaigns?.map((campaign) => (
            <div key={campaign.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{campaign.name}</h3>
                    {getStatusBadge(campaign.status)}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{campaign.subject}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Mail size={14} />
                      {campaign.channel}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={14} />
                      {campaign.sent_count} enviados
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp size={14} />
                      {calculateOpenRate(campaign.opened_count, campaign.sent_count)}% abertura
                    </span>
                    {campaign.scheduled_for && (
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {format(new Date(campaign.scheduled_for), 'dd/MM/yyyy HH:mm')}
                      </span>
                    )}
                  </div>
                </div>
                {campaign.status === 'draft' && (
                  <button
                    onClick={() => sendCampaign.mutate(campaign.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Enviar Agora
                  </button>
                )}
              </div>
            </div>
          ))}

          {campaigns?.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              <Mail size={48} className="mx-auto mb-4 text-gray-400" />
              <p>Nenhuma campanha criada ainda</p>
              <button
                onClick={() => setShowModal(true)}
                className="mt-4 text-blue-600 hover:text-blue-700 font-semibold"
              >
                Criar primeira campanha →
              </button>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-2xl font-bold mb-4">Nova Campanha</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                createCampaign.mutate({
                  name: formData.get('name'),
                  type: formData.get('type'),
                  channel: formData.get('channel'),
                  subject: formData.get('subject'),
                  content: formData.get('content'),
                  status: 'draft',
                });
              }}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nome da Campanha</label>
                  <input
                    name="name"
                    type="text"
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Ex: Aniversariantes do Mês"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Tipo</label>
                    <select name="type" required className="w-full px-3 py-2 border rounded-lg">
                      <option value="birthday">Aniversário</option>
                      <option value="return">Retorno</option>
                      <option value="promotion">Promoção</option>
                      <option value="newsletter">Newsletter</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Canal</label>
                    <select name="channel" required className="w-full px-3 py-2 border rounded-lg">
                      <option value="email">Email</option>
                      <option value="sms">SMS</option>
                      <option value="whatsapp">WhatsApp</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Assunto</label>
                  <input
                    name="subject"
                    type="text"
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Assunto da mensagem"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Conteúdo</label>
                  <textarea
                    name="content"
                    required
                    rows={6}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Digite o conteúdo da campanha..."
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Criar Campanha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

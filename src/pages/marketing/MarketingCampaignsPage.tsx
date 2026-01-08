import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Mail, Send, Calendar, Users, TrendingUp, Plus, Loader2, X, Target, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
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
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['marketing-campaigns', profile?.clinic_id],
    enabled: !!profile?.clinic_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .eq('clinic_id', profile?.clinic_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Campaign[];
    },
  });

  const createCampaign = useMutation({
    mutationFn: async (campaignData: any) => {
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .insert({
          ...campaignData,
          clinic_id: profile?.clinic_id,
          created_by: profile?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] });
      toast.success('Campanha de marketing criada!');
      setShowModal(false);
    },
    onError: () => toast.error('Erro ao salvar campanha'),
  });

  const sendCampaign = useMutation({
    mutationFn: async (campaignId: string) => {
      const { error } = await supabase
        .from('marketing_campaigns')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', campaignId)
        .eq('clinic_id', profile?.clinic_id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] });
      toast.success('Disparos iniciados com sucesso!');
    },
  });

  const calculateOpenRate = (opened: number, sent: number) => {
    if (sent === 0) return '0';
    return ((opened / sent) * 100).toFixed(1);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-pink-600 w-10 h-10" /></div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <Target className="text-pink-600" size={32} />
            Central de <span className="text-purple-600">Marketing</span>
          </h1>
          <p className="text-gray-500 mt-1">Engaje seus pacientes com campanhas segmentadas e inteligentes.</p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-xl rounded-2xl h-12 px-6 transition-all hover:scale-105"
        >
          <Plus size={20} className="mr-2" /> Nova Campanha
        </Button>
      </div>

      {/* METRICAS DE PERFORMANCE */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Total Campanhas" value={campaigns?.length || 0} icon={<Mail />} color="blue" />
        <MetricCard title="Taxa de Entrega" value={campaigns?.filter(c => c.status === 'sent').length || 0} icon={<Send />} color="green" />
        <MetricCard title="Alcance Total" value={campaigns?.reduce((acc, c) => acc + c.sent_count, 0) || 0} icon={<Users />} color="purple" />
        <MetricCard 
          title="Média de Abertura" 
          value={`${campaigns?.length ? calculateOpenRate(campaigns.reduce((acc, c) => acc + c.opened_count, 0), campaigns.reduce((acc, c) => acc + c.sent_count, 0)) : 0}%`} 
          icon={<BarChart3 />} 
          color="pink" 
        />
      </div>

      {/* LISTA DE CAMPANHAS */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-50 dark:border-gray-700 font-bold text-gray-800 dark:text-white">
          Histórico de Atividade
        </div>
        <div className="divide-y divide-gray-50 dark:divide-gray-700">
          {campaigns?.map((campaign) => (
            <div key={campaign.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">{campaign.name}</h3>
                    <StatusBadge status={campaign.status} />
                  </div>
                  <p className="text-sm text-gray-500 font-medium">Assunto: {campaign.subject}</p>
                  <div className="flex flex-wrap items-center gap-4 pt-2">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase">
                      <Send size={14} className="text-purple-500"/> {campaign.channel}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase">
                      <Users size={14} className="text-blue-500"/> {campaign.sent_count} disparos
                    </span>
                    <span className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase">
                      <TrendingUp size={14} className="text-green-500"/> {calculateOpenRate(campaign.opened_count, campaign.sent_count)}% abr.
                    </span>
                    {campaign.scheduled_for && (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase">
                        <Calendar size={14} className="text-pink-500"/> {format(new Date(campaign.scheduled_for), 'dd/MM/yyyy HH:mm')}
                      </span>
                    )}
                  </div>
                </div>
                {campaign.status === 'draft' && (
                  <Button
                    onClick={() => sendCampaign.mutate(campaign.id)}
                    className="bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-lg shadow-green-100"
                  >
                    Ativar Agora
                  </Button>
                )}
              </div>
            </div>
          ))}

          {campaigns?.length === 0 && (
            <div className="p-20 text-center flex flex-col items-center gap-4">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                <Mail size={40} className="text-gray-200" />
              </div>
              <p className="text-gray-500 font-medium">Sua clínica ainda não realizou campanhas de marketing.</p>
              <Button variant="ghost" onClick={() => setShowModal(true)} className="text-pink-600 font-bold">
                Criar primeira campanha →
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE NOVA CAMPANHA */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center p-6 border-b border-gray-50 dark:border-gray-700">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Plus className="text-pink-600"/> Configurar Campanha
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X size={24} className="text-gray-400" />
              </button>
            </div>
            <form
              className="p-8 space-y-6"
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
                  sent_count: 0,
                  opened_count: 0,
                  clicked_count: 0
                });
              }}
            >
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Nome Interno</label>
                  <Input name="name" required placeholder="Ex: Promoção Dia das Mães 2024" className="rounded-xl h-12" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Objetivo</label>
                    <select name="type" required className="w-full h-12 px-4 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 focus:ring-2 focus:ring-pink-500 outline-none">
                      <option value="promotion">Promoção de Vendas</option>
                      <option value="birthday">Felicitação de Aniversário</option>
                      <option value="return">Resgate de Paciente Inativo</option>
                      <option value="newsletter">Informativo/Dicas</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Canal de Disparo</label>
                    <select name="channel" required className="w-full h-12 px-4 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 focus:ring-2 focus:ring-pink-500 outline-none">
                      <option value="email">E-mail Marketing</option>
                      <option value="whatsapp">WhatsApp Business</option>
                      <option value="sms">SMS Premium</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Assunto da Mensagem</label>
                  <Input name="subject" required placeholder="Aparecerá no topo da mensagem do paciente" className="rounded-xl h-12" />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Corpo do Texto</label>
                  <textarea
                    name="content"
                    required
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 dark:bg-gray-900 rounded-2xl focus:ring-2 focus:ring-pink-500 outline-none transition-all resize-none text-sm"
                    placeholder="Olá [Nome], temos um presente especial para você..."
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1 h-12 rounded-xl">Cancelar</Button>
                <Button type="submit" disabled={createCampaign.isPending} className="flex-1 h-12 rounded-xl bg-pink-600 text-white font-bold">
                  {createCampaign.isPending ? <Loader2 className="animate-spin" /> : 'Salvar como Rascunho'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ title, value, icon, color }: any) {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    green: "bg-green-50 text-green-600 border-green-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    pink: "bg-pink-50 text-pink-600 border-pink-100",
  };
  return (
    <div className={`bg-white dark:bg-gray-800 p-6 rounded-3xl border ${colors[color]} shadow-sm transition-transform hover:-translate-y-1`}>
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-xl ${colors[color]} bg-opacity-50`}>{icon}</div>
        <span className="text-2xl font-black text-gray-900 dark:text-white">{value}</span>
      </div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{title}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    draft: "bg-gray-100 text-gray-600",
    scheduled: "bg-blue-100 text-blue-600",
    sending: "bg-yellow-100 text-yellow-600",
    sent: "bg-green-100 text-green-600",
  };
  const labels: any = { draft: "Rascunho", scheduled: "Agendada", sending: "Em Processo", sent: "Enviada" };
  return <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${styles[status]}`}>{labels[status]}</span>;
}
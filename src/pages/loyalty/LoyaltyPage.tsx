import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Gift, Star, TrendingUp, Award, Plus, Sparkles, Loader2, X, Save, Info } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface LoyaltyReward {
  id: string;
  title: string;
  description: string;
  points_required: number;
  reward_type: string;
  reward_value: number;
  image_url: string | null;
  active: boolean;
  clinicId: string;
}

export function LoyaltyPage() {
  const [showNewReward, setShowNewReward] = useState(false);
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  const [newReward, setNewReward] = useState({
    title: '',
    description: '',
    points_required: 100,
    reward_type: 'service',
    reward_value: 0,
    active: true
  });

  const { data: rewards, isLoading: loadingRewards } = useQuery({
    queryKey: ['loyalty-rewards', profile?.clinicId],
    enabled: !!profile?.clinicId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loyalty_rewards')
        .select('*')
        .eq('clinicId', profile?.clinicId)
        .order('points_required');
      if (error) throw error;
      return data as LoyaltyReward[];
    },
  });

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['loyalty-stats', profile?.clinicId],
    enabled: !!profile?.clinicId,
    queryFn: async () => {
      const [pointsRes, redemptionsRes] = await Promise.all([
        supabase.from('loyalty_points').select('points, transaction_type, patient_id').eq('clinicId', profile?.clinicId),
        supabase.from('loyalty_redemptions').select('points_used, status').eq('clinicId', profile?.clinicId).eq('status', 'used')
      ]);
      const totalEarned = pointsRes.data?.filter((p) => p.transaction_type === 'earn').reduce((sum, p) => sum + p.points, 0) || 0;
      const totalRedeemed = redemptionsRes.data?.reduce((sum, r) => sum + r.points_used, 0) || 0;
      const uniquePatients = new Set(pointsRes.data?.map((p) => p.patient_id)).size;
      return { totalEarned, totalRedeemed, activeMembers: uniquePatients, redemptions: redemptionsRes.data?.length || 0 };
    },
  });

  const createRewardMutation = useMutation({
    mutationFn: async (reward: Partial<LoyaltyReward>) => {
      const { error } = await supabase.from('loyalty_rewards').insert({
        ...reward,
        clinicId: profile?.clinicId
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-rewards'] });
      toast.success('Recompensa criada com sucesso!');
      setShowNewReward(false);
      setNewReward({ title: '', description: '', points_required: 100, reward_type: 'service', reward_value: 0, active: true });
    },
  });

  if (loadingRewards || loadingStats) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-pink-600 w-10 h-10" /></div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <Star className="text-yellow-500" size={32} />
            Loyalty <span className="text-pink-600">Club</span>
          </h1>
          <p className="text-gray-500 mt-1 italic">Recompense seus pacientes transformando procedimentos em mimos.</p>
        </div>
        <Button
          onClick={() => setShowNewReward(true)}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-xl rounded-2xl h-12 px-6"
        >
          <Plus size={20} className="mr-2" /> Nova Recompensa
        </Button>
      </div>

      {/* CARDS DE STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Pontos Gerados" value={stats?.totalEarned.toLocaleString()} icon={<Star size={24} />} gradient="from-amber-400 to-orange-500" />
        <StatCard title="Pontos Resgatados" value={stats?.totalRedeemed.toLocaleString()} icon={<Gift size={24} />} gradient="from-purple-500 to-indigo-600" />
        <StatCard title="Membros" value={stats?.activeMembers.toString()} icon={<TrendingUp size={24} />} gradient="from-emerald-500 to-teal-600" />
        <StatCard title="Total Mimos" value={stats?.redemptions.toString()} icon={<Award size={24} />} gradient="from-pink-500 to-rose-600" />
      </div>

      {/* CATÁLOGO */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h2 className="text-2xl font-bold flex items-center gap-2 italic">
            <Sparkles className="text-purple-600" size={24} /> Catálogo de Experiências
          </h2>
          {/* USANDO O ÍCONE INFO AQUI PARA RESOLVER O AVISO */}
          <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 px-4 py-2 rounded-xl text-xs font-bold">
            <Info size={16} />
            <span>DICA: 1 PONTO = R$ 1,00 GASTO (PADRÃO DO SISTEMA)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {rewards?.map((reward) => (
            <div key={reward.id} className="group relative bg-gray-50 dark:bg-gray-900/50 rounded-3xl border-2 border-transparent hover:border-purple-400 transition-all overflow-hidden p-6">
              <div className="flex items-center justify-between mb-4">
                 <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-2xl"><Gift size={24}/></div>
                 <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${reward.active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                    {reward.active ? 'Ativa' : 'Inativa'}
                 </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{reward.title}</h3>
              <p className="text-gray-500 text-sm line-clamp-2 mb-6">{reward.description}</p>
              <div className="flex items-center gap-2">
                <Star className="text-yellow-500" size={20} />
                <span className="text-3xl font-black text-purple-600">{reward.points_required}</span>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Pontos necessários</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL DE NOVA RECOMPENSA */}
      {showNewReward && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center p-6 border-b border-gray-50 dark:border-gray-700">
              <h2 className="text-xl font-bold">Criar Recompensa</h2>
              <button onClick={() => setShowNewReward(false)} className="text-gray-400 hover:text-gray-600"><X/></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-bold">Título do Mimo</label>
                <Input value={newReward.title} onChange={e => setNewReward({...newReward, title: e.target.value})} placeholder="Ex: Limpeza de Pele Grátis"/>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold">Descrição</label>
                <textarea className="w-full rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-900 p-3 text-sm focus:ring-pink-500 outline-none" rows={2} value={newReward.description} onChange={e => setNewReward({...newReward, description: e.target.value})} placeholder="O que o cliente ganha?"/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold">Pontos Necessários</label>
                  <Input type="number" value={newReward.points_required} onChange={e => setNewReward({...newReward, points_required: Number(e.target.value)})}/>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold">Valor (R$)</label>
                  <Input type="number" value={newReward.reward_value} onChange={e => setNewReward({...newReward, reward_value: Number(e.target.value)})}/>
                </div>
              </div>
              <Button 
                onClick={() => createRewardMutation.mutate(newReward)} 
                disabled={createRewardMutation.isPending}
                className="w-full bg-pink-600 hover:bg-pink-700 text-white h-12 rounded-xl mt-4 shadow-lg shadow-pink-100"
              >
                {createRewardMutation.isPending ? <Loader2 className="animate-spin" /> : <Save className="mr-2" size={18} />}
                Salvar Recompensa
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, gradient }: any) {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-3xl shadow-xl p-6 text-white transform transition-transform hover:-translate-y-1`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1">{title}</p>
          <p className="text-4xl font-black">{value}</p>
        </div>
        <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md">{icon}</div>
      </div>
    </div>
  );
}
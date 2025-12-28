import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Gift, Star, TrendingUp, Award, Plus, Sparkles } from 'lucide-react';
import { Button } from '../../components/ui/button';
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
}

export function LoyaltyPage() {
  const [showNewReward, setShowNewReward] = useState(false);
  const queryClient = useQueryClient();

  const { data: rewards, isLoading } = useQuery({
    queryKey: ['loyalty-rewards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loyalty_rewards')
        .select('*')
        .order('points_required');

      if (error) throw error;
      return data as LoyaltyReward[];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['loyalty-stats'],
    queryFn: async () => {
      const { data: pointsData } = await supabase
        .from('loyalty_points')
        .select('points, transaction_type, patient_id');

      const { data: redemptionsData } = await supabase
        .from('loyalty_redemptions')
        .select('points_used, status')
        .eq('status', 'used');

      const totalEarned = pointsData
        ?.filter((p) => p.transaction_type === 'earn')
        .reduce((sum, p) => sum + p.points, 0) || 0;

      const totalRedeemed = redemptionsData?.reduce((sum, r) => sum + r.points_used, 0) || 0;

      const uniquePatients = new Set(pointsData?.map((p) => p.patient_id)).size;

      return {
        totalEarned,
        totalRedeemed,
        activeMembers: uniquePatients,
        redemptions: redemptionsData?.length || 0,
      };
    },
  });

  const createReward = useMutation({
    mutationFn: async (reward: Partial<LoyaltyReward>) => {
      const { error } = await supabase.from('loyalty_rewards').insert(reward);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-rewards'] });
      toast.success('Recompensa criada!');
      setShowNewReward(false);
    },
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Star className="text-yellow-500" size={36} />
            Programa de Fidelidade
          </h1>
          <p className="text-gray-600">Recompense seus clientes mais fiéis</p>
        </div>
        <Button
          onClick={() => setShowNewReward(true)}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          <Plus size={20} className="mr-2" />
          Nova Recompensa
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm mb-1">Pontos Distribuídos</p>
              <p className="text-4xl font-bold">{stats?.totalEarned.toLocaleString()}</p>
            </div>
            <Star size={48} className="opacity-30" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm mb-1">Pontos Resgatados</p>
              <p className="text-4xl font-bold">{stats?.totalRedeemed.toLocaleString()}</p>
            </div>
            <Gift size={48} className="opacity-30" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-teal-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm mb-1">Membros Ativos</p>
              <p className="text-4xl font-bold">{stats?.activeMembers}</p>
            </div>
            <TrendingUp size={48} className="opacity-30" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-pink-100 text-sm mb-1">Resgates Realizados</p>
              <p className="text-4xl font-bold">{stats?.redemptions}</p>
            </div>
            <Award size={48} className="opacity-30" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Sparkles className="text-purple-600" size={28} />
          Recompensas Disponíveis
        </h2>

        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Carregando recompensas...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rewards?.map((reward) => (
              <div
                key={reward.id}
                className="border-2 border-gray-200 rounded-xl p-6 hover:border-purple-500 hover:shadow-lg transition-all"
              >
                {reward.image_url ? (
                  <img
                    src={reward.image_url}
                    alt={reward.title}
                    className="w-full h-40 object-cover rounded-lg mb-4"
                  />
                ) : (
                  <div className="w-full h-40 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg mb-4 flex items-center justify-center">
                    <Gift size={64} className="text-white opacity-50" />
                  </div>
                )}

                <h3 className="text-xl font-bold mb-2">{reward.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{reward.description}</p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="text-yellow-500" size={20} />
                    <span className="text-2xl font-bold text-purple-600">
                      {reward.points_required}
                    </span>
                    <span className="text-gray-500 text-sm">pontos</span>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      reward.active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {reward.active ? 'Ativa' : 'Inativa'}
                  </span>
                </div>

                {reward.reward_type === 'discount' && (
                  <div className="mt-4 bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <p className="text-purple-900 text-sm font-semibold">
                      Desconto de R$ {reward.reward_value.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {rewards && rewards.length === 0 && (
          <div className="text-center py-12">
            <Gift size={64} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">Nenhuma recompensa criada ainda</p>
            <Button onClick={() => setShowNewReward(true)}>Criar primeira recompensa</Button>
          </div>
        )}
      </div>
    </div>
  );
}

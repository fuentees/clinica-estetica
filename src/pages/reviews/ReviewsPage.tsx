import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Star, MessageSquare, TrendingUp, Filter, Download } from 'lucide-react';
import { format } from 'date-fns';

interface Review {
  id: string;
  rating: number;
  comment: string;
  nps_score: number;
  would_recommend: boolean;
  response: string | null;
  created_at: string;
  patients: {
    name: string;
    avatar_url: string;
  };
  profiles: {
    first_name: string;
    last_name: string;
  };
}

export function ReviewsPage() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'responded'>('all');

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['reviews', filter],
    queryFn: async () => {
      let query = supabase
        .from('reviews')
        .select(`
          *,
          patients (name, avatar_url),
          profiles:professional_id (first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (filter === 'pending') {
        query = query.is('response', null);
      } else if (filter === 'responded') {
        query = query.not('response', 'is', null);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Review[];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['review-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('rating, nps_score, would_recommend');

      if (error) throw error;

      const avgRating = data.reduce((acc, r) => acc + r.rating, 0) / data.length;
      const avgNPS = data.reduce((acc, r) => acc + r.nps_score, 0) / data.length;
      const recommendRate = (data.filter(r => r.would_recommend).length / data.length) * 100;

      return {
        avgRating: avgRating.toFixed(1),
        avgNPS: avgNPS.toFixed(0),
        recommendRate: recommendRate.toFixed(0),
        totalReviews: data.length,
      };
    },
  });

  const exportReviews = () => {
    if (!reviews) return;

    const csv = [
      ['Data', 'Paciente', 'Profissional', 'Nota', 'NPS', 'Recomenda', 'Comentário', 'Resposta'].join(','),
      ...reviews.map(r => [
        format(new Date(r.created_at), 'dd/MM/yyyy'),
        r.patients?.name || 'N/A',
        `${r.profiles?.first_name} ${r.profiles?.last_name}`,
        r.rating,
        r.nps_score,
        r.would_recommend ? 'Sim' : 'Não',
        `"${r.comment?.replace(/"/g, '""') || ''}"`,
        `"${r.response?.replace(/"/g, '""') || ''}"`,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `avaliacoes-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Carregando avaliações...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Avaliações e Feedback</h1>
        <button
          onClick={exportReviews}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Download size={20} />
          Exportar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avaliação Média</p>
              <p className="text-3xl font-bold text-yellow-500">{stats?.avgRating || '0.0'}</p>
            </div>
            <Star size={40} className="text-yellow-500" fill="currentColor" />
          </div>
          <div className="flex items-center gap-1 mt-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={16}
                className={star <= Number(stats?.avgRating || 0) ? 'text-yellow-500' : 'text-gray-300'}
                fill={star <= Number(stats?.avgRating || 0) ? 'currentColor' : 'none'}
              />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">NPS Médio</p>
              <p className="text-3xl font-bold text-green-500">{stats?.avgNPS || '0'}</p>
            </div>
            <TrendingUp size={40} className="text-green-500" />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {Number(stats?.avgNPS || 0) >= 75 ? 'Excelente' : Number(stats?.avgNPS || 0) >= 50 ? 'Bom' : 'Precisa melhorar'}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Taxa de Recomendação</p>
              <p className="text-3xl font-bold text-blue-500">{stats?.recommendRate || '0'}%</p>
            </div>
            <MessageSquare size={40} className="text-blue-500" />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {stats?.totalReviews || 0} avaliações
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Avaliações</p>
              <p className="text-3xl font-bold text-purple-500">{stats?.totalReviews || 0}</p>
            </div>
            <Filter size={40} className="text-purple-500" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow mb-4">
        <div className="flex gap-2 p-4 border-b">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            Pendentes
          </button>
          <button
            onClick={() => setFilter('responded')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'responded' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            Respondidas
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {reviews?.map((review) => (
          <div key={review.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                  {review.patients?.name?.substring(0, 2).toUpperCase() || 'PA'}
                </div>
                <div>
                  <p className="font-semibold">{review.patients?.name || 'Paciente Anônimo'}</p>
                  <p className="text-sm text-gray-500">
                    Atendido por: {review.profiles?.first_name} {review.profiles?.last_name}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={18}
                      className={star <= review.rating ? 'text-yellow-500' : 'text-gray-300'}
                      fill={star <= review.rating ? 'currentColor' : 'none'}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  {format(new Date(review.created_at), 'dd/MM/yyyy')}
                </p>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center gap-4 mb-2">
                <div className="bg-blue-100 px-3 py-1 rounded-full text-sm">
                  <span className="font-semibold">NPS:</span> {review.nps_score}/10
                </div>
                {review.would_recommend && (
                  <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                    ✓ Recomenda
                  </div>
                )}
              </div>
              {review.comment && (
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                  {review.comment}
                </p>
              )}
            </div>

            {review.response ? (
              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                <p className="text-sm font-semibold text-blue-900 mb-2">Resposta da clínica:</p>
                <p className="text-gray-700">{review.response}</p>
              </div>
            ) : (
              <button className="text-blue-600 hover:text-blue-700 text-sm font-semibold">
                Responder avaliação →
              </button>
            )}
          </div>
        ))}

        {reviews?.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <MessageSquare size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Nenhuma avaliação encontrada</p>
          </div>
        )}
      </div>
    </div>
  );
}

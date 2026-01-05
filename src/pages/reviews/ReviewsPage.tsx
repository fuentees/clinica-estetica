import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Star, MessageSquare, TrendingUp, Filter, Download, User, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
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

      if (!data || data.length === 0) return null;

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
    link.download = `avaliacoes-estetica-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  if (isLoading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 bg-white dark:bg-gray-950">
      <Loader2 className="animate-spin text-pink-600" size={40}/>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Processando Feedbacks...</p>
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto p-6 space-y-8 animate-in fade-in duration-700 pb-20">
      
      {/* HEADER PREMIUM */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 gap-6">
        <div className="flex items-center gap-5">
            <div className="p-4 bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl text-white shadow-lg">
                <Star size={32} fill="white" />
            </div>
            <div>
                <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic">Experiência do <span className="text-pink-600">Paciente</span></h1>
                <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">Gestão de reputação e Net Promoter Score (NPS)</p>
            </div>
        </div>
        <button
          onClick={exportReviews}
          className="h-14 px-8 bg-gray-900 hover:bg-black text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl transition-all hover:scale-105 flex items-center gap-3"
        >
          <Download size={18} className="text-pink-500" /> Exportar Dados
        </button>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Avaliação Média" value={stats?.avgRating || '0.0'} subValue="Estrelas" color="text-amber-500" icon={Star} />
        <StatCard title="NPS Médio" value={stats?.avgNPS || '0'} subValue={Number(stats?.avgNPS || 0) >= 75 ? 'Excelente' : 'Bom'} color="text-emerald-500" icon={TrendingUp} />
        <StatCard title="Taxa de Indicação" value={`${stats?.recommendRate || '0'}%`} subValue="Fidelidade" color="text-blue-500" icon={MessageSquare} />
        <StatCard title="Volume Total" value={stats?.totalReviews || 0} subValue="Feedbacks" color="text-purple-500" icon={Filter} />
      </div>

      {/* FILTROS TIPO TAB */}
      <div className="bg-white dark:bg-gray-800 p-3 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 flex flex-wrap gap-2">
        <FilterTab active={filter === 'all'} label="Todas" onClick={() => setFilter('all')} count={stats?.totalReviews} />
        <FilterTab active={filter === 'pending'} label="Pendentes" onClick={() => setFilter('pending')} color="text-rose-500" />
        <FilterTab active={filter === 'responded'} label="Respondidas" onClick={() => setFilter('responded')} color="text-emerald-500" />
      </div>

      {/* FEED LIST */}
      <div className="space-y-6">
        {reviews?.map((review) => (
          <div key={review.id} className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 shadow-sm border border-gray-100 dark:border-gray-700 transition-all hover:shadow-xl group">
            <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-2xl flex items-center justify-center border border-gray-100 dark:border-gray-800 group-hover:rotate-3 transition-transform">
                  <User size={24} className="text-pink-500" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">{review.patients?.name || 'Paciente Anônimo'}</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Atendido por: {review.profiles?.first_name} {review.profiles?.last_name}</p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="flex items-center gap-1 mb-2 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-xl border border-amber-100 dark:border-amber-900/30">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} size={14} className={star <= review.rating ? 'text-amber-500' : 'text-gray-200'} fill={star <= review.rating ? 'currentColor' : 'none'} />
                  ))}
                </div>
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{format(new Date(review.created_at), 'dd MMMM yyyy')}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="md:col-span-1 space-y-3">
                    <div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-800">
                        <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Score NPS</p>
                        <p className="text-2xl font-black italic text-blue-600 tracking-tighter">{review.nps_score}/10</p>
                    </div>
                    {review.would_recommend && (
                        <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800 flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-emerald-500"/>
                            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Recomenda</span>
                        </div>
                    )}
                </div>

                <div className="md:col-span-3 space-y-4">
                    {review.comment && (
                        <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-[2rem] relative italic text-gray-600 dark:text-gray-400 font-medium shadow-inner">
                            <MessageSquare size={40} className="absolute -top-4 -right-4 text-gray-100 dark:text-gray-800 opacity-50" />
                            "{review.comment}"
                        </div>
                    )}

                    {review.response ? (
                        <div className="bg-pink-50 dark:bg-pink-900/10 p-6 rounded-[2rem] border-l-4 border-pink-500">
                            <p className="text-[10px] font-black text-pink-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <CheckCircle2 size={12}/> Resposta da clínica
                            </p>
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{review.response}</p>
                        </div>
                    ) : (
                        <button className="h-12 px-6 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:border-pink-500 hover:text-pink-500 transition-all">
                            Responder avaliação agora →
                        </button>
                    )}
                </div>
            </div>
          </div>
        ))}

        {reviews?.length === 0 && (
          <div className="py-32 text-center flex flex-col items-center bg-white dark:bg-gray-800 rounded-[3rem] border-2 border-dashed border-gray-100 dark:border-gray-700">
            <AlertCircle size={48} className="text-gray-200 mb-4" />
            <p className="text-gray-400 font-black uppercase text-xs tracking-widest italic">Nenhum feedback registrado no período</p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---
function StatCard({ title, value, subValue, color, icon: Icon }: any) {
    return (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 group hover:shadow-xl transition-all">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl ${color} group-hover:scale-110 transition-transform`}>
                    <Icon size={24} />
                </div>
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{title}</p>
            <h3 className={`text-4xl font-black italic tracking-tighter mt-1 ${color}`}>{value}</h3>
            <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest mt-1">{subValue}</p>
        </div>
    )
}

function FilterTab({ active, label, onClick, color = "text-gray-500" }: any) {
    return (
        <button 
            onClick={onClick}
            className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all
            ${active ? 'bg-gray-900 text-white shadow-xl scale-105' : `bg-transparent ${color} hover:bg-gray-50 dark:hover:bg-gray-900`}`}
        >
            {label}
        </button>
    )
}
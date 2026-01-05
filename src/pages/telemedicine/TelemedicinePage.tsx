import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Video, User, Calendar, Play, Square, Monitor, Loader2, Sparkles, Plus } from 'lucide-react';
import { Button } from '../../components/ui/button';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface TelemedicineSession {
  id: string;
  patient_id: string;
  professional_id: string;
  room_id: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  started_at: string | null;
  ended_at: string | null;
  duration_minutes: number | null;
  created_at: string;
  patients?: {
    name: string;
    profiles?: { first_name: string; last_name: string };
  };
  profiles?: {
    first_name: string;
    last_name: string;
  };
}

export function TelemedicinePage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const queryClient = useQueryClient();

  // --- BUSCA DE SESSÕES ---
  const { data: sessions, isLoading } = useQuery({
    queryKey: ['telemedicine-sessions', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('telemedicine_sessions')
        .select(`
          *,
          patients (name, profiles (first_name, last_name)),
          profiles:professional_id (first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as TelemedicineSession[];
    },
  });

  // --- MUTATION PARA INICIAR SESSÃO ---
  const startSession = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from('telemedicine_sessions')
        .update({
          status: 'active',
          started_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telemedicine-sessions'] });
      toast.success('Sessão de telemedicina iniciada!');
    },
  });

  const stats = {
    total: sessions?.length || 0,
    active: sessions?.filter((s) => s.status === 'active').length || 0,
    scheduled: sessions?.filter((s) => s.status === 'scheduled').length || 0,
    completed: sessions?.filter((s) => s.status === 'completed').length || 0,
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700">
      
      {/* HEADER PREMIUM */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 gap-6">
        <div className="flex items-center gap-5">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-3xl text-blue-600 shadow-inner">
                <Video size={32} />
            </div>
            <div>
                <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic">Centro de <span className="text-blue-600">Telemedicina</span></h1>
                <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">Consultas e diagnósticos remotos via vídeo conferência</p>
            </div>
        </div>
        <Button className="h-14 px-8 bg-gray-900 hover:bg-black text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl transition-all hover:scale-105 flex items-center gap-3">
          <Plus size={18} className="text-blue-400" /> Agendar Nova Sessão
        </Button>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-[2rem] shadow-lg p-8 text-white relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-blue-100 text-[10px] font-black uppercase tracking-widest mb-1">Fluxo Total</p>
            <p className="text-4xl font-black italic tracking-tighter">{stats.total}</p>
          </div>
          <Monitor size={80} className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform" />
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2rem] shadow-lg p-8 text-white relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-emerald-100 text-[10px] font-black uppercase tracking-widest mb-1">Em Atendimento</p>
            <p className="text-4xl font-black italic tracking-tighter">{stats.active}</p>
          </div>
          <Play size={80} className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform" />
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-[2rem] shadow-lg p-8 text-white relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-purple-100 text-[10px] font-black uppercase tracking-widest mb-1">Agendadas</p>
            <p className="text-4xl font-black italic tracking-tighter">{stats.scheduled}</p>
          </div>
          <Calendar size={80} className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform" />
        </div>

        <div className="bg-gradient-to-br from-gray-600 to-gray-800 rounded-[2rem] shadow-lg p-8 text-white relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-gray-100 text-[10px] font-black uppercase tracking-widest mb-1">Finalizadas</p>
            <p className="text-4xl font-black italic tracking-tighter">{stats.completed}</p>
          </div>
          <Square size={80} className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform" />
        </div>
      </div>

      {/* LISTAGEM DE SESSÕES */}
      <div className="bg-white dark:bg-gray-800 rounded-[3rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="px-10 py-8 border-b border-gray-50 dark:border-gray-700 flex justify-between items-center bg-gray-50/30 dark:bg-gray-900">
           <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">Fila de Atendimento</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Sincronização em tempo real com salas virtuais</p>
           </div>
           <div className="flex gap-2">
              <button onClick={() => setStatusFilter('all')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === 'all' ? 'bg-gray-900 text-white' : 'bg-white text-gray-400 border'}`}>Todas</button>
              <button onClick={() => setStatusFilter('scheduled')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === 'scheduled' ? 'bg-blue-600 text-white' : 'bg-white text-gray-400 border'}`}>Agendadas</button>
           </div>
        </div>

        <div className="p-8">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
               <Loader2 className="animate-spin text-blue-600" size={40} />
               <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">Conectando ao Servidor de Vídeo...</p>
            </div>
          ) : sessions && sessions.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="group flex flex-col md:flex-row md:items-center justify-between p-6 bg-white dark:bg-gray-900 border-2 border-gray-50 dark:border-gray-800 rounded-[2rem] transition-all hover:border-blue-100 dark:hover:border-blue-900 hover:shadow-xl"
                >
                  <div className="flex items-center gap-6">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-3 shadow-inner ${session.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-400'}`}>
                       <User size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">
                        {session.patients?.profiles?.first_name}{' '}
                        {session.patients?.profiles?.last_name || session.patients?.name}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Sparkles size={12} className="text-blue-500" /> Profissional: Dr(a). {session.profiles?.first_name} {session.profiles?.last_name}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-6 md:mt-0">
                    <div className="text-right mr-4">
                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Criada em</p>
                        <p className="text-xs font-bold text-gray-500">{format(new Date(session.created_at), 'dd/MM/yyyy HH:mm')}</p>
                    </div>

                    <span
                      className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border-2 ${
                        session.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100 animate-pulse'
                          : session.status === 'scheduled'
                          ? 'bg-blue-50 text-blue-700 border-blue-100'
                          : 'bg-gray-50 text-gray-500 border-gray-100'
                      }`}
                    >
                      {session.status === 'active' ? 'Em Atendimento' : session.status === 'scheduled' ? 'Agendada' : 'Concluída'}
                    </span>

                    {session.status === 'scheduled' && (
                      <Button
                        size="sm"
                        onClick={() => startSession.mutate(session.id)}
                        className="h-11 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-lg shadow-emerald-100"
                      >
                        <Play size={14} fill="white" /> Iniciar Agora
                      </Button>
                    )}
                    
                    {session.status === 'active' && (
                       <Button size="sm" className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-lg shadow-blue-100">
                          <Monitor size={14}/> Abrir Sala
                       </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-32 text-center flex flex-col items-center">
                <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-full text-gray-200 mb-6">
                    <Video size={48} />
                </div>
                <p className="text-gray-400 font-black uppercase text-xs tracking-widest italic">Nenhuma sessão agendada no período</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
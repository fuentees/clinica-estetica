import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Video, Clock, User, Calendar, Play, Square, Monitor } from 'lucide-react';
import { Button } from '../../components/ui/button';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
      toast.success('Sessão iniciada!');
    },
  });

  const stats = {
    total: sessions?.length || 0,
    active: sessions?.filter((s) => s.status === 'active').length || 0,
    scheduled: sessions?.filter((s) => s.status === 'scheduled').length || 0,
    completed: sessions?.filter((s) => s.status === 'completed').length || 0,
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Video className="text-blue-600" size={36} />
            Telemedicina
          </h1>
          <p className="text-gray-600">Consultas médicas por vídeo</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Video size={20} className="mr-2" />
          Nova Sessão
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm mb-1">Total</p>
              <p className="text-4xl font-bold">{stats.total}</p>
            </div>
            <Monitor size={48} className="opacity-30" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm mb-1">Em Atendimento</p>
              <p className="text-4xl font-bold">{stats.active}</p>
            </div>
            <Play size={48} className="opacity-30" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm mb-1">Agendadas</p>
              <p className="text-4xl font-bold">{stats.scheduled}</p>
            </div>
            <Calendar size={48} className="opacity-30" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-100 text-sm mb-1">Concluídas</p>
              <p className="text-4xl font-bold">{stats.completed}</p>
            </div>
            <Square size={48} className="opacity-30" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Sessões de Telemedicina</h2>
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Carregando sessões...</div>
        ) : sessions && sessions.length > 0 ? (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">
                      {session.patients?.profiles?.first_name}{' '}
                      {session.patients?.profiles?.last_name || session.patients?.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      Dr(a). {session.profiles?.first_name} {session.profiles?.last_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${
                        session.status === 'active'
                          ? 'bg-green-500'
                          : session.status === 'scheduled'
                          ? 'bg-blue-500'
                          : 'bg-gray-500'
                      }`}
                    >
                      {session.status === 'active'
                        ? 'Em Atendimento'
                        : session.status === 'scheduled'
                        ? 'Agendada'
                        : 'Concluída'}
                    </span>
                    {session.status === 'scheduled' && (
                      <Button
                        size="sm"
                        onClick={() => startSession.mutate(session.id)}
                        className="ml-2 bg-green-600 hover:bg-green-700"
                      >
                        <Play size={14} />
                        Iniciar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">Nenhuma sessão encontrada</div>
        )}
      </div>
    </div>
  );
}

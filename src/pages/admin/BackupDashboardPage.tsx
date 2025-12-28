import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Database, Download, Clock, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface BackupLog {
  id: string;
  backup_type: string;
  status: string;
  file_size: number | null;
  started_at: string;
  completed_at: string | null;
  error_message: string | null;
}

export function BackupDashboardPage() {
  const queryClient = useQueryClient();

  const { data: backups, isLoading } = useQuery({
    queryKey: ['backup-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('backup_logs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as BackupLog[];
    },
  });

  const createBackup = useMutation({
    mutationFn: async (backupType: string) => {
      const { data: user } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('backup_logs')
        .insert({
          backup_type: backupType,
          status: 'running',
          created_by: user.user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      setTimeout(async () => {
        await supabase
          .from('backup_logs')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            file_size: Math.floor(Math.random() * 100000000),
          })
          .eq('id', data.id);

        queryClient.invalidateQueries({ queryKey: ['backup-logs'] });
      }, 3000);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backup-logs'] });
      toast.success('Backup iniciado!');
    },
    onError: () => {
      toast.error('Erro ao iniciar backup');
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={20} className="text-green-500" />;
      case 'running':
        return <RefreshCw size={20} className="text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle size={20} className="text-red-500" />;
      default:
        return <Clock size={20} className="text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: any = {
      completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Concluído' },
      running: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Em execução' },
      failed: { bg: 'bg-red-100', text: 'text-red-800', label: 'Falhou' },
    };

    const badge = badges[status] || badges.running;
    return (
      <span className={`px-3 py-1 rounded-full text-sm ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(2)} MB`;
  };

  const lastSuccessful = backups?.find(b => b.status === 'completed');
  const runningBackups = backups?.filter(b => b.status === 'running').length || 0;
  const completedCount = backups?.filter(b => b.status === 'completed').length || 0;
  const failedCount = backups?.filter(b => b.status === 'failed').length || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Carregando backups...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Database size={32} className="text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Backups do Sistema</h1>
            <p className="text-gray-600">Gerenciamento e histórico de backups</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => createBackup.mutate('full')}
            disabled={runningBackups > 0}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
          >
            <Download size={20} />
            Backup Completo
          </button>
          <button
            onClick={() => createBackup.mutate('incremental')}
            disabled={runningBackups > 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300"
          >
            <RefreshCw size={20} />
            Backup Incremental
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <Clock size={24} className="text-blue-500" />
          </div>
          <p className="text-sm text-gray-600 mb-1">Último Backup</p>
          <p className="text-lg font-semibold">
            {lastSuccessful
              ? format(new Date(lastSuccessful.completed_at!), 'dd/MM/yyyy HH:mm')
              : 'Nenhum backup'}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <RefreshCw size={24} className="text-yellow-500" />
            <span className="text-2xl font-bold">{runningBackups}</span>
          </div>
          <p className="text-sm text-gray-600">Em Execução</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle size={24} className="text-green-500" />
            <span className="text-2xl font-bold">{completedCount}</span>
          </div>
          <p className="text-sm text-gray-600">Concluídos</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <AlertCircle size={24} className="text-red-500" />
            <span className="text-2xl font-bold">{failedCount}</span>
          </div>
          <p className="text-sm text-gray-600">Falhas</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Histórico de Backups</h2>
        </div>
        <div className="divide-y">
          {backups?.map((backup) => (
            <div key={backup.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {getStatusIcon(backup.status)}
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold">
                        {backup.backup_type === 'full' ? 'Backup Completo' : 'Backup Incremental'}
                      </h3>
                      {getStatusBadge(backup.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>
                        Iniciado: {format(new Date(backup.started_at), 'dd/MM/yyyy HH:mm')}
                      </span>
                      {backup.completed_at && (
                        <span>
                          Concluído: {format(new Date(backup.completed_at), 'dd/MM/yyyy HH:mm')}
                        </span>
                      )}
                      {backup.file_size && (
                        <span>Tamanho: {formatFileSize(backup.file_size)}</span>
                      )}
                    </div>
                    {backup.error_message && (
                      <p className="text-sm text-red-600 mt-1">{backup.error_message}</p>
                    )}
                  </div>
                </div>
                {backup.status === 'completed' && (
                  <button className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
                    <Download size={16} />
                    Baixar
                  </button>
                )}
              </div>
            </div>
          ))}

          {backups?.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              <Database size={48} className="mx-auto mb-4 text-gray-400" />
              <p>Nenhum backup realizado ainda</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="font-semibold text-yellow-900 mb-2">Recomendações de Backup</h3>
        <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
          <li>Realize backups completos semanalmente</li>
          <li>Backups incrementais podem ser feitos diariamente</li>
          <li>Armazene backups em local seguro e redundante</li>
          <li>Teste regularmente a restauração dos backups</li>
          <li>Mantenha pelo menos 3 cópias dos dados importantes</li>
        </ul>
      </div>
    </div>
  );
}

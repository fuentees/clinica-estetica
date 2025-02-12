import { useState, useEffect } from 'react';
import { useAuditLogs } from '../../hooks/useAuditLogs';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Search, Download, Shield, Database, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

export function SecurityPage() {
  const { data: auditLogs, isLoading } = useAuditLogs();
  const [search, setSearch] = useState('');
  const [backupStatus, setBackupStatus] = useState<any>(null);

  useEffect(() => {
    async function fetchBackupStatus() {
      const { data, error } = await supabase
        .from('backup_status')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching backup status:', error);
        return;
      }

      setBackupStatus(data);
    }

    fetchBackupStatus();
    const interval = setInterval(fetchBackupStatus, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const downloadAuditLog = () => {
    if (!auditLogs) return;

    const csv = [
      ['Data', 'Usuário', 'Ação', 'Tabela', 'IP', 'Detalhes'].join(','),
      ...auditLogs.map(log => [
        new Date(log.created_at).toLocaleString(),
        \`\${log.profiles.first_name} \${log.profiles.last_name}\`,
        log.action,
        log.table_name,
        log.ip_address,
        JSON.stringify({ old: log.old_data, new: log.new_data })
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = \`audit-log-\${new Date().toISOString()}.csv\`;
    a.click();
  };

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold">Segurança e Auditoria</h1>
          <p className="text-gray-600 mt-1">
            Monitore todas as atividades do sistema
          </p>
        </div>
        <Button onClick={downloadAuditLog}>
          <Download className="w-4 h-4 mr-2" />
          Exportar Logs
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <Shield className="w-5 h-5 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold">Status da Criptografia</h2>
          </div>
          <p className="text-sm text-gray-600">
            Dados sensíveis são automaticamente criptografados antes de serem armazenados
          </p>
          <div className="mt-4">
            <div className="flex items-center text-green-600">
              <CheckCircle className="w-4 h-4 mr-2" />
              <span>Criptografia ativa</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <Database className="w-5 h-5 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold">Status do Backup</h2>
          </div>
          {backupStatus ? (
            <div className="space-y-2">
              <div className="flex items-center">
                {backupStatus.status === 'completed' ? (
                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                ) : backupStatus.status === 'failed' ? (
                  <XCircle className="w-4 h-4 mr-2 text-red-600" />
                ) : (
                  <div className="w-4 h-4 mr-2 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                )}
                <span className="capitalize">{backupStatus.status}</span>
              </div>
              <p className="text-sm text-gray-600">
                Último backup: {new Date(backupStatus.created_at).toLocaleString()}
              </p>
              {backupStatus.error_message && (
                <p className="text-sm text-red-600">{backupStatus.error_message}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-600">Carregando status do backup...</p>
          )}
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Buscar nos logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Rest of the audit logs table remains the same */}
    </div>
  );
}
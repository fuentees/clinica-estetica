import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { toast } from 'react-hot-toast';

export function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPayments();
  }, []);

  async function fetchPayments() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payments')
        .select(`
          id,
          amount,
          status,
          payment_method,
          due_date,
          paid_at,
          appointments (
             patients ( profiles (first_name, last_name) ),
             treatments ( name )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar pagamentos.");
    } finally {
      setLoading(false);
    }
  }

  const filtered = payments.filter(p => {
      const patientName = p.appointments?.patients?.profiles?.first_name || '';
      return patientName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="animate-spin text-pink-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Histórico de Recebimentos</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          {/* CORREÇÃO: Adicionada tipagem do evento */}
          <Input 
            placeholder="Buscar por paciente..." 
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 font-medium border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4">Paciente</th>
                  <th className="px-6 py-4">Procedimento</th>
                  <th className="px-6 py-4">Valor</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Data Pagto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-6 py-4 font-medium text-gray-800 dark:text-white">
                        {item.appointments?.patients?.profiles?.first_name || 'Desconhecido'} {item.appointments?.patients?.profiles?.last_name}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                        {item.appointments?.treatments?.name || 'Consulta'}
                    </td>
                    <td className="px-6 py-4 font-bold text-green-600">
                        {Number(item.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold capitalize ${item.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {item.status === 'paid' ? 'Pago' : item.status}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                        {item.paid_at ? format(new Date(item.paid_at), "dd/MM/yyyy", { locale: ptBR }) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
              <div className="p-10 text-center text-gray-500">Nenhum pagamento encontrado.</div>
          )}
      </div>
    </div>
  );
}
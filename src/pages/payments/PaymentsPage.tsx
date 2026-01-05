import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Search, Loader2, DollarSign, Calendar, User, Receipt, Filter } from 'lucide-react';
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
      toast.error("Erro ao carregar histórico financeiro.");
    } finally {
      setLoading(false);
    }
  }

  const filtered = payments.filter(p => {
      const patientName = p.appointments?.patients?.profiles?.first_name || '';
      const lastName = p.appointments?.patients?.profiles?.last_name || '';
      const fullName = `${patientName} ${lastName}`.toLowerCase();
      return fullName.includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-white dark:bg-gray-950">
        <Loader2 className="animate-spin text-pink-600" size={40} />
        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em]">Sincronizando Recebimentos...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto p-6 space-y-8 animate-in fade-in duration-700">
      
      {/* HEADER PREMIUM */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 gap-6">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-3xl text-emerald-600">
            <DollarSign size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic">Histórico de <span className="text-pink-600">Recebimentos</span></h1>
            <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">Gestão de entradas e conciliação financeira</p>
          </div>
        </div>
      </div>

      {/* BARRA DE FERRAMENTAS */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-xl group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-pink-500 transition-colors" size={20} />
          <Input 
            placeholder="Buscar por nome do paciente..." 
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="h-12 pl-12 pr-6 rounded-xl bg-gray-50 dark:bg-gray-900 border-0 text-sm font-bold outline-none focus:ring-2 focus:ring-pink-500/20 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 bg-gray-50 dark:bg-gray-900 px-4 py-2 rounded-full border border-gray-100 dark:border-gray-700">
           <Filter size={14} className="text-pink-500" />
           <span>{filtered.length}</span> Transações Encontradas
        </div>
      </div>

      {/* TABELA PREMIUM */}
      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-gray-50/50 dark:bg-gray-900/50 text-gray-400 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Paciente</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Procedimento</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Valor</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest">Status</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-right">Data Pagto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {filtered.map((item) => (
                  <tr key={item.id} className="group hover:bg-pink-50/30 dark:hover:bg-gray-900/40 transition-all cursor-default">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-400 group-hover:text-pink-500 transition-colors">
                          <User size={16} />
                        </div>
                        <span className="font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">
                          {item.appointments?.patients?.profiles?.first_name || 'Desconhecido'} {item.appointments?.patients?.profiles?.last_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 font-bold text-xs uppercase">
                        <Receipt size={14} className="text-gray-300" />
                        {item.appointments?.treatments?.name || 'Consulta'}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="font-black text-emerald-600 dark:text-emerald-400 text-base italic tracking-tighter">
                        {Number(item.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border-2 ${
                          item.status === 'paid' 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800' 
                          : 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:border-amber-800'
                        }`}>
                            {item.status === 'paid' ? 'Liquidado' : 'Pendente'}
                        </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2 text-gray-400 font-bold text-xs">
                        <Calendar size={14} />
                        {item.paid_at ? format(new Date(item.paid_at), "dd/MM/yyyy", { locale: ptBR }) : '--/--/----'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filtered.length === 0 && (
              <div className="p-20 text-center flex flex-col items-center gap-4">
                 <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-full text-gray-200">
                    <DollarSign size={48} />
                 </div>
                 <p className="text-gray-400 font-black uppercase text-xs tracking-widest">Nenhuma transação localizada</p>
              </div>
          )}
      </div>
    </div>
  );
}
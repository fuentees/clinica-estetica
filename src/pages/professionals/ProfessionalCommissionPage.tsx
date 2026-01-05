import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  Loader2, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// --- TIPAGEM ---
type CommissionItem = {
  id: string;
  date: string;
  patient_name: string;
  procedure: string;
  value: number; 
  commission_value: number; 
};

export default function ProfessionalCommissionPage() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  
  // Estado para o mês selecionado (YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  
  const [items, setItems] = useState<CommissionItem[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalCommission: 0,
    rate: 0
  });

  useEffect(() => {
    if (id) {
      fetchCommissionData(id, selectedMonth);
    }
  }, [id, selectedMonth]);

  async function fetchCommissionData(profId: string, monthIso: string) {
    setLoading(true);
    try {
      // 1. Buscar a taxa de comissão do profissional no perfil
      const { data: profData, error: profError } = await supabase
        .from('profiles')
        .select('commission_rate')
        .eq('id', profId)
        .single();

      if (profError) throw profError;
      const rate = profData?.commission_rate || 0;

      // 2. Definir intervalo de datas do mês selecionado
      const [year, month] = monthIso.split('-');
      const startDate = `${year}-${month}-01`;
      const endDate = new Date(Number(year), Number(month), 0).toISOString().split('T')[0];

      // 3. Buscar agendamentos concluídos neste mês com nomes de pacientes e serviços
      const { data: appts, error: apptError } = await supabase
        .from('appointments')
        .select(`
          id, 
          start_time, 
          status,
          price,
          patient:patient_id (name),
          treatment:treatment_id (name)
        `)
        .eq('professional_id', profId)
        .eq('status', 'concluido')
        .gte('start_time', `${startDate}T00:00:00`)
        .lte('start_time', `${endDate}T23:59:59`)
        .order('start_time', { ascending: false });

      if (apptError) throw apptError;

      // 4. Calcular totais e mapear itens
      let totalRev = 0;
      
      const mappedItems: CommissionItem[] = (appts || []).map((t: any) => {
        // Usa o preço real do agendamento ou fallback de R$ 0 se não preenchido
        const procedureValue = t.price || 0; 
        const commValue = procedureValue * (rate / 100);
        totalRev += procedureValue;

        return {
          id: t.id,
          date: t.start_time,
          patient_name: t.patient?.name || 'Paciente',
          procedure: t.treatment?.name || 'Procedimento',
          value: procedureValue,
          commission_value: commValue
        };
      });

      setItems(mappedItems);
      setStats({
        totalRevenue: totalRev,
        totalCommission: totalRev * (rate / 100),
        rate: rate
      });

    } catch (error) {
      console.error("Erro ao carregar comissões:", error);
      toast.error("Erro ao carregar dados financeiros.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-pink-600"/></div>;

  return (
    <div className="space-y-6 p-4 sm:p-6 animate-in fade-in duration-500">
      
      {/* CABEÇALHO E FILTRO */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <DollarSign className="text-pink-600" /> Gestão de Comissões
        </h2>
        
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
            <Calendar size={18} className="text-gray-500" />
            <input 
                type="month" 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-700 dark:text-gray-200 outline-none"
            />
        </div>
      </div>

      {/* CARDS DE RESUMO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Taxa */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Taxa Contratada</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.rate}%</p>
        </div>

        {/* Faturamento Total (Base) */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Produção Total</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
            <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                <TrendingUp size={14} className="text-green-500"/> {items.length} atendimentos concluídos
            </div>
        </div>

        {/* A PAGAR (Comissão) */}
        <div className="bg-green-50 dark:bg-green-900/20 p-5 rounded-xl border border-green-100 dark:border-green-800 shadow-sm">
            <p className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wider">Comissão a Pagar</p>
            <p className="text-3xl font-bold text-green-700 dark:text-green-400 mt-1">
                {stats.totalCommission.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
            <div className="flex items-center gap-1 text-xs text-green-600/70 mt-2">
                <CheckCircle2 size={14} /> Cálculo automático do período
            </div>
        </div>
      </div>

      {/* TABELA DETALHADA */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="font-bold text-gray-900 dark:text-white">Extrato Detalhado</h3>
        </div>
        
        {items.length === 0 ? (
            <div className="p-10 text-center text-gray-500 flex flex-col items-center">
                <AlertCircle size={40} className="text-gray-300 mb-2"/>
                <p>Nenhum atendimento concluído neste mês.</p>
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-3">Data</th>
                            <th className="px-6 py-3">Paciente</th>
                            <th className="px-6 py-3">Serviço</th>
                            <th className="px-6 py-3 text-right">Valor Base</th>
                            <th className="px-6 py-3 text-right text-green-600">Comissão</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {items.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="px-6 py-4">{new Date(item.date).toLocaleDateString('pt-BR')}</td>
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{item.patient_name}</td>
                                <td className="px-6 py-4">{item.procedure}</td>
                                <td className="px-6 py-4 text-right">
                                    {item.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </td>
                                <td className="px-6 py-4 text-right font-bold text-green-600">
                                    {item.commission_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
      </div>
    </div>
  );
}
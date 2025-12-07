import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase"; // CORRIGIDO: 2 NÍVEIS
import { toast } from "react-hot-toast";
import { 
    DollarSign, Filter, Loader2, Calendar, FileText
} from "lucide-react";
// CAMINHOS CORRIGIDOS PARA 2 NÍVEIS
import { Input } from "../../components/ui/input"; 
import { Button } from "../../components/ui/button"; 
import { format, startOfMonth, endOfMonth } from "date-fns";

interface CommissionEntry {
    appointment_id: string;
    date: string;
    time: string;
    patient_name: string;
    procedure_name: string;
    commission_rate: number;
    price: number;
    commission_value: number;
}

export function ProfessionalCommissionPage() {
    const { id: professionalId } = useParams();
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState<CommissionEntry[]>([]);
    const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
    const [totalPayable, setTotalPayable] = useState(0);

    useEffect(() => {
        if (professionalId) {
            generateReport();
        }
    }, [professionalId, startDate, endDate]);

    // --- FUNÇÃO PRINCIPAL DE GERAÇÃO DE RELATÓRIO INDIVIDUAL ---
    async function generateReport() {
        setLoading(true);
        setReportData([]);
        setTotalPayable(0);

        if (!professionalId) {
            setLoading(false);
            return;
        }

        if (new Date(startDate) > new Date(endDate)) {
            toast.error("A data inicial não pode ser maior que a final.");
            setLoading(false);
            return;
        }

        try {
            // 1. Query de Agendamentos Concluídos para ESTE profissional
            const { data: appointments, error } = await supabase
                .from('appointments')
                .select(`
                    id, 
                    start_time, 
                    status,
                    patients (name),
                    treatments (name, price),
                    profiles (commission_rate)
                `)
                .eq('status', 'finished') // Apenas agendamentos CONCLUÍDOS
                .eq('professional_id', professionalId) // Filtra pelo ID da URL
                .gte('start_time', startDate)
                .lte('start_time', endDate + ' 23:59:59');

            if (error) throw error;

            // 2. Processamento e Cálculo
            let calculatedTotal = 0;
            const processedData: CommissionEntry[] = (appointments || [])
                .map((appt: any) => {
                    const commissionRate = appt.profiles?.commission_rate || 0;
                    const price = appt.treatments?.price || 0;
                    const commissionValue = (price * (commissionRate / 100));
                    
                    calculatedTotal += commissionValue;

                    return {
                        appointment_id: appt.id,
                        date: format(new Date(appt.start_time), 'dd/MM/yyyy'),
                        time: format(new Date(appt.start_time), 'HH:mm'),
                        patient_name: appt.patients?.name || 'N/A',
                        procedure_name: appt.treatments?.name || 'N/A',
                        commission_rate: commissionRate,
                        price: price,
                        commission_value: commissionValue,
                    };
                });
            
            setReportData(processedData);
            setTotalPayable(calculatedTotal);

        } catch (error) {
            console.error("Erro ao gerar relatório:", error);
            toast.error("Falha ao buscar dados para o repasse.");
        } finally {
            setLoading(false);
        }
    }

    const formatCurrency = (value: number) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };
    
    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                    <DollarSign size={20} className="text-pink-600"/> Repasse no Período
                </h3>

                {/* FILTROS DE DATA */}
                <div className="flex flex-wrap items-center gap-4 border-b pb-4 mb-4 border-gray-100 dark:border-gray-700">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2"><Calendar size={16}/> De:</label>
                    <Input 
                        type="date" 
                        value={startDate} 
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)} 
                        className="w-40 bg-gray-50 dark:bg-gray-900" 
                    />
                    
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Até:</label>
                    <Input 
                        type="date" 
                        value={endDate} 
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)} 
                        className="w-40 bg-gray-50 dark:bg-gray-900" 
                    />
                    
                    <Button onClick={generateReport} disabled={loading} className="bg-pink-600 hover:bg-pink-700 shadow-md">
                        {loading ? <Loader2 className="animate-spin size-4" /> : <Filter size={16} />}
                    </Button>
                </div>

                {/* KPI DE RESUMO */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                        <span className="text-xs font-semibold text-gray-500 uppercase block">Comissão Acumulada</span>
                        <span className="text-3xl font-extrabold text-pink-600 mt-1">
                            {formatCurrency(totalPayable)}
                        </span>
                    </div>
                     <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                        <span className="text-xs font-semibold text-gray-500 uppercase block">Sessões Concluídas</span>
                        <span className="text-3xl font-extrabold text-green-600 mt-1">
                            {reportData.length}
                        </span>
                    </div>
                </div>
            </div>

            {/* DETALHES DA TABELA */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-x-auto">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><FileText size={18} className="text-blue-600"/> Detalhe por Atendimento</h2>
                
                {loading && <div className="text-center p-10"><Loader2 className="animate-spin text-pink-600 size-6"/></div>}

                {!loading && reportData.length === 0 && (
                    <div className="text-center p-10 text-gray-500 dark:text-gray-400">
                        Nenhum atendimento concluído encontrado no período selecionado.
                    </div>
                )}

                {!loading && reportData.length > 0 && (
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paciente</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Procedimento</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% Comissão</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider text-pink-600">Valor Repasse</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {reportData.map((item) => (
                                <tr key={item.appointment_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{item.date} {item.time}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.patient_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.procedure_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-800 dark:text-gray-200">{item.commission_rate}%</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-pink-600">{formatCurrency(item.commission_value)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
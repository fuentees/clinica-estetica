import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { toast } from "react-hot-toast";
import { 
    DollarSign, Filter, Stethoscope, Clock, Calendar, FileText, Loader2, ArrowLeft
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { format, startOfMonth, endOfMonth } from "date-fns";

// Interface para o dado final (Agendamentos com detalhes de comissão)
interface CommissionEntry {
    appointment_id: string;
    date: string;
    time: string;
    patient_name: string;
    procedure_name: string;
    professional_name: string;
    commission_rate: number;
    price: number;
    commission_value: number;
    professional_id: string;
}

export function CommissionReportPage() {
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState<CommissionEntry[]>([]);
    const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
    const [totalPayable, setTotalPayable] = useState(0);

    useEffect(() => {
        generateReport();
    }, [startDate, endDate]);

    // --- FUNÇÃO PRINCIPAL DE GERAÇÃO DE RELATÓRIO ---
    async function generateReport() {
        setLoading(true);
        setReportData([]);
        setTotalPayable(0);

        // 1. Validar Período
        if (new Date(startDate) > new Date(endDate)) {
            toast.error("A data inicial não pode ser maior que a final.");
            setLoading(false);
            return;
        }

        try {
            // 2. Query de Agendamentos Concluídos (JOIN com Profiles e Treatments)
            const { data: appointments, error } = await supabase
                .from('appointments')
                .select(`
                    id, 
                    start_time, 
                    status,
                    patients (name),
                    treatments (name, price),
                    profiles (first_name, last_name, commission_rate)
                `)
                .eq('status', 'finished') // Apenas agendamentos CONCLUÍDOS geram comissão
                .gte('start_time', startDate)
                .lte('start_time', endDate + ' 23:59:59');

            if (error) throw error;

            // 3. Processamento e Cálculo da Comissão
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
                        professional_name: `${appt.profiles?.first_name} ${appt.profiles?.last_name || ''}`,
                        commission_rate: commissionRate,
                        price: price,
                        commission_value: commissionValue,
                        professional_id: appt.profiles?.id || '',
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

    // Agrupamento por Profissional para o resumo
    const summary = reportData.reduce((acc, item) => {
        if (!acc[item.professional_id]) {
            acc[item.professional_id] = {
                name: item.professional_name,
                total: 0,
                appointments: 0,
            };
        }
        acc[item.professional_id].total += item.commission_value;
        acc[item.professional_id].appointments += 1;
        return acc;
    }, {} as { [key: string]: { name: string, total: number, appointments: number } });

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <DollarSign className="text-pink-600 size-6" /> Relatório de Repasse de Comissões
            </h1>
            <p className="text-sm text-gray-500">
                Calcule o valor de comissão a ser pago aos profissionais com base nos agendamentos **concluídos**.
            </p>

            {/* FILTROS E AÇÕES */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
                <div className="flex items-center gap-4">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2"><Calendar size={16}/> De:</label>
                    <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-40 bg-gray-50 dark:bg-gray-900" />
                    
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Até:</label>
                    <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-40 bg-gray-50 dark:bg-gray-900" />
                    
                    <Button onClick={generateReport} disabled={loading} className="bg-pink-600 hover:bg-pink-700 shadow-md">
                        {loading ? <Loader2 className="animate-spin size-4" /> : <Filter size={16} />}
                    </Button>
                </div>
            </div>

            {/* RESUMO DE REPASSE POR PROFISSIONAL */}
            <h2 className="text-xl font-bold text-gray-900 dark:text-white pt-4 flex items-center gap-2">
                <Stethoscope size={20} className="text-green-600"/> Resumo do Período
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.values(summary).map((profSummary, index) => (
                    <div key={index} className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{profSummary.name}</p>
                        <p className="text-xs text-gray-500 uppercase font-semibold mt-1">Total a Pagar ({profSummary.appointments} Sessões)</p>
                        <p className="text-3xl font-extrabold text-pink-600 mt-2">
                            {formatCurrency(profSummary.total)}
                        </p>
                    </div>
                ))}
                
                <div className="bg-slate-900 text-white p-5 rounded-xl shadow-md flex flex-col justify-center">
                    <p className="text-sm uppercase font-semibold opacity-80">Total Geral de Repasse</p>
                    <p className="text-3xl font-extrabold mt-1">
                        {formatCurrency(totalPayable)}
                    </p>
                </div>
            </div>

            {/* DETALHES DA TABELA */}
            {reportData.length > 0 && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-x-auto">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><FileText size={18} className="text-blue-600"/> Detalhe por Atendimento</h2>
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profissional</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Procedimento</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Serviço</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% Comissão</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider text-pink-600">Valor Repasse</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {reportData.map((item) => (
                                <tr key={item.appointment_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{item.date} {item.time}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.professional_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.procedure_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-800 dark:text-gray-200">{formatCurrency(item.price)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-800 dark:text-gray-200">{item.commission_rate}%</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-pink-600">{formatCurrency(item.commission_value)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// Certifique-se de adicionar a rota para este componente no seu App.tsx:
// <Route path="/financeiro/commission-report" element={<CommissionReportPage />} />
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { toast } from "react-hot-toast";
import { 
    DollarSign, Filter, Loader2, Calendar, FileText, CheckCircle2
} from "lucide-react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { format, startOfMonth, endOfMonth } from "date-fns";

interface AppointmentToPay {
    id: string;
    commission_value: number;
}

interface CommissionEntry {
    appointment_id: string;
    date: string;
    time: string;
    patient_name: string;
    procedure_name: string;
    commission_rate: number;
    price: number;
    commission_value: number;
    commission_paid: boolean; // Adicionamos este campo
}

export function ProfessionalCommissionPage() {
    const { id: professionalId } = useParams();
    const [loading, setLoading] = useState(false);
    const [isPaying, setIsPaying] = useState(false);
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

        if (!professionalId || new Date(startDate) > new Date(endDate)) {
            setLoading(false);
            return;
        }

        try {
            // 1. Query de Agendamentos Concluídos para ESTE profissional (APENAS NÃO PAGOS)
            const { data: appointments, error } = await supabase
                .from('appointments')
                .select(`
                    id, 
                    start_time, 
                    status,
                    commission_paid,
                    patients (name),
                    treatments (name, price),
                    profiles (commission_rate)
                `)
                .eq('status', 'finished') // Apenas agendamentos CONCLUÍDOS
                .eq('commission_paid', false) // APENAS COMISSÕES PENDENTES
                .eq('professional_id', professionalId)
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
                        commission_paid: appt.commission_paid,
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
    
    // --- FUNÇÃO PREMIUM: REGISTRO DE PAGAMENTO (PAYOUT) ---
    async function handlePayoutRegistration() {
        if (totalPayable <= 0) {
            toast.error("Não há valor a ser pago.");
            return;
        }
        
        const appointmentsToUpdate: AppointmentToPay[] = reportData.map(r => ({
            id: r.appointment_id,
            commission_value: r.commission_value
        }));
        
        const appointmentIds = appointmentsToUpdate.map(a => a.id);
        const totalAmount = totalPayable;
        const professionalName = reportData[0]?.patient_name || "Profissional"; // Usando o nome do relatório

        setIsPaying(true);

        try {
            // 1. Inserir a Transação de Despesa (EXPENSE) no Fluxo de Caixa
            const { error: cashFlowError } = await supabase
                .from('cash_flow')
                .insert({
                    type: 'EXPENSE',
                    description: `Pagamento de comissão - ${professionalName}`,
                    amount: totalAmount,
                    related_entity_id: professionalId,
                    transaction_date: new Date().toISOString()
                });

            if (cashFlowError) throw cashFlowError;

            // 2. Marcar todos os Agendamentos da lista como commission_paid = TRUE
            const { error: updateError } = await supabase
                .from('appointments')
                .update({ commission_paid: true })
                .in('id', appointmentIds);

            if (updateError) throw updateError;

            toast.success(`Pagamento de ${formatCurrency(totalAmount)} registrado e concluído!`);
            generateReport(); // Recarregar para mostrar lista vazia (já pago)

        } catch (error) {
            console.error("Erro ao registrar pagamento:", error);
            toast.error("Erro ao processar o pagamento e atualizar o status.");
        } finally {
            setIsPaying(false);
        }
    }


    // --- UTILS E RENDERIZAÇÃO ---
    const formatCurrency = (value: number) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };
    
    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                
                {/* FILTROS DE DATA */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4 mb-4 border-gray-100 dark:border-gray-700">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Calendar size={20} className="text-pink-600"/> Período de Repasse
                    </h3>
                    <div className="flex gap-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">De:</label>
                        <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-36 bg-gray-50 dark:bg-gray-900 text-sm" />
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Até:</label>
                        <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-36 bg-gray-50 dark:bg-gray-900 text-sm" />
                        <Button onClick={generateReport} disabled={loading} className="bg-gray-200 hover:bg-gray-300 text-gray-700 shadow-sm p-2">
                            <Filter size={16} />
                        </Button>
                    </div>
                </div>

                {/* KPI DE RESUMO E BOTÃO PAYOUT */}
                <div className="flex justify-between items-center gap-6">
                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl flex-1">
                        <span className="text-sm font-semibold text-gray-500 uppercase block">Comissão Pendente (a pagar)</span>
                        <span className="text-4xl font-extrabold text-pink-600 mt-1">
                            {formatCurrency(totalPayable)}
                        </span>
                    </div>
                     <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl">
                        <span className="text-sm font-semibold text-gray-500 uppercase block">Sessões a Pagar</span>
                        <span className="text-4xl font-extrabold text-green-600 mt-1">
                            {reportData.length}
                        </span>
                    </div>
                    
                    <Button 
                        onClick={handlePayoutRegistration} 
                        disabled={totalPayable <= 0 || isPaying} 
                        className="h-full px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg shadow-green-300/50"
                    >
                        {isPaying ? <Loader2 className="animate-spin mr-2"/> : <CheckCircle2 className="mr-2"/>} 
                        {isPaying ? 'Processando...' : 'Registrar Payout'}
                    </Button>
                </div>
            </div>

            {/* DETALHES DA TABELA */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-x-auto">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><FileText size={18} className="text-blue-600"/> Atendimentos Pendentes de Repasse</h2>
                
                {loading && <div className="text-center p-10"><Loader2 className="animate-spin text-pink-600 size-6"/></div>}

                {!loading && reportData.length === 0 && (
                    <div className="p-8 text-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-gray-500">
                         {totalPayable === 0 ? "Nenhum repasse pendente para o período." : "Aguardando dados..."}
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
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { toast } from "react-hot-toast";
import { 
    DollarSign, Filter, Calendar, FileText, Loader2, TrendingUp
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { format, startOfMonth, endOfMonth } from "date-fns";

// Interface atualizada para o novo Schema
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
    const [clinicId, setClinicId] = useState<string | null>(null);

    // 1. Identificar a clínica ao carregar a página
    useEffect(() => {
        async function getClinic() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.from('profiles').select('clinicId').eq('id', user.id).single();
                if (data?.clinicId) {
                    setClinicId(data.clinicId);
                }
            }
        }
        getClinic();
    }, []);

    // 2. Gerar relatório sempre que o clinicId estiver disponível
    useEffect(() => {
        if (clinicId) generateReport();
    }, [clinicId]); // Removi startDate/endDate daqui para evitar loops, o botão Filtrar cuida disso

    async function generateReport() {
        if (!clinicId) return;
        
        setLoading(true);
        setReportData([]);
        setTotalPayable(0);

        if (new Date(startDate) > new Date(endDate)) {
            toast.error("Data inicial maior que a final.");
            setLoading(false);
            return;
        }

        try {
            const { data: appointments, error } = await supabase
                .from('appointments')
                .select(`
                    id, 
                    startAt, 
                    status,
                    patient:patientId ( name ),
                    service:serviceId ( name, price ),
                    professional:professionalId ( firstName, lastName, commissionRate )
                `)
                .eq('clinicId', clinicId)
                .eq('status', 'completed')
                .gte('startAt', startDate + 'T00:00:00')
                .lte('startAt', endDate + 'T23:59:59');

            if (error) throw error;

            let calculatedTotal = 0;
            const processedData: CommissionEntry[] = (appointments || []).map((appt: any) => {
                const prof = Array.isArray(appt.professional) ? appt.professional[0] : appt.professional;
                const serv = Array.isArray(appt.service) ? appt.service[0] : appt.service;
                const pat = Array.isArray(appt.patient) ? appt.patient[0] : appt.patient;

                const commissionRate = prof?.commissionRate || 0;
                const price = serv?.price || 0;
                const commissionValue = (price * (commissionRate / 100));
                
                calculatedTotal += commissionValue;
                const dateObj = new Date(appt.startAt);

                return {
                    appointment_id: appt.id,
                    date: format(dateObj, 'dd/MM/yyyy'),
                    time: format(dateObj, 'HH:mm'),
                    patient_name: pat?.name || 'N/A',
                    procedure_name: serv?.name || 'N/A',
                    professional_name: `${prof?.firstName || ''} ${prof?.lastName || ''}`.trim() || 'Profissional',
                    commission_rate: commissionRate,
                    price: price,
                    commission_value: commissionValue,
                    professional_id: prof?.id || 'N/A',
                };
            });
            
            setReportData(processedData);
            setTotalPayable(calculatedTotal);

        } catch (error: any) {
            console.error("Erro Report:", error);
            toast.error("Erro ao gerar relatório financeiro.");
        } finally {
            setLoading(false);
        }
    }

    const formatCurrency = (value: number) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const summary = reportData.reduce((acc, item) => {
        if (!acc[item.professional_id]) {
            acc[item.professional_id] = { name: item.professional_name, total: 0, appointments: 0 };
        }
        acc[item.professional_id].total += item.commission_value;
        acc[item.professional_id].appointments += 1;
        return acc;
    }, {} as { [key: string]: { name: string, total: number, appointments: number } });

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
                        <DollarSign className="text-pink-600 size-8" /> Repasse de Comissões
                    </h1>
                    <p className="text-gray-500 mt-1">Gestão de pagamentos para profissionais parceiros.</p>
                </div>
                
                {/* FILTROS - CORRIGIDO O ERRO DE TIPO NO BUTTON SIZE */}
                <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2 px-3 border-r dark:border-gray-700">
                        <Calendar size={16} className="text-gray-400"/>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="text-sm bg-transparent outline-none dark:text-white" />
                    </div>
                    <div className="flex items-center gap-2 px-3">
                        <span className="text-xs font-bold text-gray-400 uppercase">Até</span>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="text-sm bg-transparent outline-none dark:text-white" />
                    </div>
                    <Button 
                        onClick={generateReport} 
                        disabled={loading} 
                        size="sm" // Corrigido de "icon" para "sm" conforme seu componente pede
                        className="bg-pink-600 hover:bg-pink-700 rounded-xl px-4"
                    >
                        {loading ? <Loader2 className="animate-spin size-4" /> : <Filter size={18} />}
                    </Button>
                </div>
            </div>

            {/* RESUMO CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.values(summary).map((prof, idx) => (
                        <div key={idx} className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 group hover:border-pink-200 transition-all">
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">{prof.name}</p>
                            <div className="flex items-baseline gap-1 mt-2">
                                <span className="text-2xl font-black text-gray-800 dark:text-white">{formatCurrency(prof.total)}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                <TrendingUp size={12} className="text-green-500"/> {prof.appointments} atendimentos concluídos
                            </p>
                        </div>
                    ))}
                </div>
                
                <div className="bg-gray-900 dark:bg-pink-900/20 p-6 rounded-3xl shadow-xl flex flex-col justify-center relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
                    <p className="text-xs font-bold uppercase text-white/60 tracking-widest relative z-10">Total a Repassar</p>
                    <p className="text-3xl font-black text-white mt-1 relative z-10">{formatCurrency(totalPayable)}</p>
                </div>
            </div>

            {/* TABELA DETALHADA */}
            {reportData.length > 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-50 dark:border-gray-700 flex items-center gap-2">
                        <FileText size={18} className="text-blue-500"/>
                        <h2 className="font-bold text-gray-800 dark:text-white">Detalhamento dos Atendimentos</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
                            <thead className="bg-gray-50/50 dark:bg-gray-900/50 text-gray-500 text-[10px] uppercase font-bold">
                                <tr>
                                    <th className="px-6 py-4 text-left">Data/Hora</th>
                                    <th className="px-6 py-4 text-left">Profissional</th>
                                    <th className="px-6 py-4 text-left">Procedimento</th>
                                    <th className="px-6 py-4 text-right">Valor Serv.</th>
                                    <th className="px-6 py-4 text-right">Comissão</th>
                                    <th className="px-6 py-4 text-right text-pink-600">Repasse</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                                {reportData.map((item) => (
                                    <tr key={item.appointment_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-700 dark:text-gray-200">{item.date} <span className="text-gray-400 font-normal">{item.time}</span></td>
                                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 font-bold">{item.professional_name}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{item.procedure_name}</td>
                                        <td className="px-6 py-4 text-sm text-right text-gray-600">{formatCurrency(item.price)}</td>
                                        <td className="px-6 py-4 text-sm text-right text-gray-400">{item.commission_rate}%</td>
                                        <td className="px-6 py-4 text-sm text-right font-black text-pink-600">{formatCurrency(item.commission_value)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                !loading && (
                    <div className="bg-white dark:bg-gray-800 p-20 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700 text-center">
                        <DollarSign size={48} className="mx-auto text-gray-200 mb-4"/>
                        <p className="text-gray-400 font-medium">Nenhum repasse encontrado para este período.</p>
                    </div>
                )
            )}
        </div>
    );
}
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase"; 
import { toast } from "react-hot-toast";
import { 
    Calendar, Clock, Shield, Plus, X, AlertTriangle, Loader2 
} from "lucide-react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { format, parseISO, isPast } from "date-fns";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// --- TIPAGEM E SCHEMA ---
interface Exception {
    id: string;
    start_date: string;
    end_date: string;
    start_time: string | null;
    end_time: string | null;
    reason: string;
    is_full_day: boolean;
}

const exceptionSchema = z.object({
    start_date: z.string().min(1, "Data de início é obrigatória"),
    end_date: z.string().min(1, "Data de fim é obrigatória"),
    reason: z.string().min(3, "O motivo é obrigatório"),
    is_full_day: z.boolean().default(true),
    start_time: z.string().optional(),
    end_time: z.string().optional(),
}).refine(data => data.start_date <= data.end_date, {
    message: "A data de início não pode ser após a data de fim.",
    path: ["end_date"],
});

type ExceptionFormData = z.infer<typeof exceptionSchema>;


export function ProfessionalAvailabilityPage() {
    const { id: professionalId } = useParams();
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [exceptions, setExceptions] = useState<Exception[]>([]);
    
    // --- LÓGICA DO FORMULÁRIO ---
    const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<ExceptionFormData>({
        resolver: zodResolver(exceptionSchema),
        defaultValues: {
            is_full_day: true,
            start_date: format(new Date(), 'yyyy-MM-dd'),
            end_date: format(new Date(), 'yyyy-MM-dd'),
        }
    });
    
    const watchIsFullDay = watch('is_full_day');

    useEffect(() => {
        if (professionalId) {
            fetchExceptions();
        }
    }, [professionalId]);


    // --- 1. FUNÇÕES DE PERSISTÊNCIA ---
    async function fetchExceptions() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('professional_availability_exceptions')
                .select('*')
                .eq('professional_id', professionalId)
                .order('start_date', { ascending: true });
            
            if (error) throw error;
            setExceptions(data || []);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao carregar exceções.");
        } finally {
            setLoading(false);
        }
    }

    async function onSubmit(data: ExceptionFormData) {
        setIsSaving(true);
        
        // Ajustar dados se não for dia inteiro
        const dataToSave = {
            ...data,
            professional_id: professionalId,
            start_time: data.is_full_day ? null : data.start_time,
            end_time: data.is_full_day ? null : data.end_time,
        }
        
        try {
            const { error } = await supabase
                .from('professional_availability_exceptions')
                .insert(dataToSave);

            if (error) throw error;
            
            toast.success("Exceção de agenda adicionada!");
            reset({ 
                start_date: format(new Date(), 'yyyy-MM-dd'),
                end_date: format(new Date(), 'yyyy-MM-dd'),
                is_full_day: true,
                reason: ''
            }); 
            fetchExceptions();

        } catch (error) {
            console.error(error);
            toast.error("Falha ao salvar exceção.");
        } finally {
            setIsSaving(false);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Tem certeza que deseja remover este bloqueio?")) return;

        try {
            const { error } = await supabase
                .from('professional_availability_exceptions')
                .delete()
                .eq('id', id);

            if (error) throw error;
            
            toast.success("Bloqueio removido.");
            fetchExceptions();
        } catch (error) {
            console.error(error);
            toast.error("Falha ao remover bloqueio.");
        }
    }

    // --- 2. COMPONENTES E RENDERIZAÇÃO ---

    const formatRange = (ex: Exception) => {
        const start = format(parseISO(ex.start_date), 'dd/MM/yyyy');
        const end = format(parseISO(ex.end_date), 'dd/MM/yyyy');

        let timeStr = '';
        if (!ex.is_full_day && ex.start_time && ex.end_time) {
            timeStr = ` (${ex.start_time.slice(0, 5)}h até ${ex.end_time.slice(0, 5)}h)`;
        }

        if (start === end) {
            return `Dia: ${start}${timeStr}`;
        }
        return `Período: ${start} a ${end}${timeStr}`;
    };

    if (loading) {
        return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-pink-600 w-8 h-8" /></div>;
    }

    return (
        <div className="space-y-6">
            
            {/* INSTRUÇÃO GERAL */}
            <div className="p-4 bg-blue-50 text-blue-800 border border-blue-200 rounded-xl text-sm flex items-start gap-3">
                <AlertTriangle size={20} className="mt-1"/>
                <p>
                    Esta seção gerencia **bloqueios** na agenda. Uma exceção criada aqui anulará o horário padrão do profissional (inclusive agendamentos online) no período especificado.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* COLUNA ESQUERDA: FORMULÁRIO DE INSERÇÃO */}
                <div className="lg:col-span-1">
                    <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 space-y-4 sticky top-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2"><Plus size={18} className="text-pink-600"/> Adicionar Novo Bloqueio</h3>

                        {/* TIPO DE BLOQUEIO */}
                        <div>
                            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 font-semibold mb-2">
                                <input 
                                    type="checkbox" 
                                    {...register("is_full_day")} 
                                    className="w-4 h-4 text-pink-600 rounded" 
                                    checked={watchIsFullDay}
                                />
                                Bloquear Dia Inteiro
                            </label>
                        </div>
                        
                        {/* DATAS */}
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Início</label>
                                <Input type="date" {...register("start_date")} className="bg-gray-50 dark:bg-gray-900" />
                                {errors.start_date && <span className="text-xs text-red-500">{errors.start_date.message}</span>}
                            </div>
                            <div><label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Fim</label>
                                <Input type="date" {...register("end_date")} className="bg-gray-50 dark:bg-gray-900" />
                                {errors.end_date && <span className="text-xs text-red-500">{errors.end_date.message}</span>}
                            </div>
                        </div>

                        {/* HORÁRIOS (SE NÃO FOR DIA INTEIRO) */}
                        {!watchIsFullDay && (
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Hora Início</label>
                                    <Input type="time" {...register("start_time")} className="bg-gray-50 dark:bg-gray-900" />
                                </div>
                                <div><label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Hora Fim</label>
                                    <Input type="time" {...register("end_time")} className="bg-gray-50 dark:bg-gray-900" />
                                </div>
                            </div>
                        )}
                        
                        {/* MOTIVO */}
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Motivo do Bloqueio</label>
                            <Input placeholder="Ex: Férias, Atestado, Treinamento" {...register("reason")} className="bg-gray-50 dark:bg-gray-900" />
                            {errors.reason && <span className="text-xs text-red-500">{errors.reason.message}</span>}
                        </div>

                        <Button type="submit" disabled={isSaving} className="w-full h-10 bg-pink-600 hover:bg-pink-700 shadow-md">
                            {isSaving ? <Loader2 className="animate-spin mr-2" /> : <Calendar size={18} className="mr-2"/>}
                            Bloquear Agenda
                        </Button>
                    </form>
                </div>


                {/* COLUNA DIREITA: LISTA DE EXCEÇÕES ATIVAS */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2"><Shield size={18} className="text-red-600"/> Bloqueios Ativos / Futuros</h3>

                    {exceptions.length === 0 && (
                        <div className="p-8 text-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-gray-500">
                            Nenhum período de exceção agendado. O profissional segue o horário padrão.
                        </div>
                    )}
                    
                    {exceptions
                        .filter(ex => !isPast(parseISO(ex.end_date)))
                        .map((ex) => (
                        <div key={ex.id} className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-gray-800 dark:text-white truncate">{ex.reason}</p>
                                <p className={`text-xs mt-1 ${ex.is_full_day ? 'text-red-600' : 'text-orange-600'}`}>
                                    {ex.is_full_day ? "Dia(s) Inteiro(s) Bloqueado(s)" : "Bloqueio Parcial"}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">{formatRange(ex)}</p>
                            </div>
                            
                            <Button 
                                onClick={() => handleDelete(ex.id)} 
                                variant="ghost" 
                                className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 ml-4"
                            >
                                <X size={16} />
                            </Button>
                        </div>
                    ))}

                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 pt-6"><Clock size={18} className="text-gray-500"/> Histórico (Bloqueios Encerrados)</h3>
                    {exceptions
                        .filter(ex => isPast(parseISO(ex.end_date)))
                        .slice(0, 5) 
                        .map((ex) => (
                        <div key={ex.id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-500">
                            <span>{ex.reason}</span>
                            <span>{formatRange(ex)}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
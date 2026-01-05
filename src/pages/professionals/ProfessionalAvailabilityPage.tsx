import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "../../lib/supabase";
import { toast } from "react-hot-toast";
import {
  Calendar, Loader2, Info, CalendarOff, Trash2, CheckCircle2, Plus,
} from "lucide-react"; 
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";

// --- TIPAGEM E SCHEMA ---
const exceptionSchema = z.object({
  start_date: z.string().min(1, "Data de início é obrigatória."),
  end_date: z.string().min(1, "Data de fim é obrigatória."),
  is_full_day: z.boolean().default(true),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  reason: z.string().optional(),
}).refine(data => {
    // Validação de intervalo de tempo se não for dia inteiro
    if (!data.is_full_day) {
        return !!data.start_time && !!data.end_time;
    }
    return true;
}, {
    message: "O horário de início e fim são obrigatórios para exceções parciais.",
    path: ["start_time"],
});

type ExceptionFormData = z.infer<typeof exceptionSchema>;

interface Exception {
    id: string;
    start_date: string;
    end_date: string;
    start_time: string | null;
    end_time: string | null;
    is_full_day: boolean;
    reason: string | null;
    created_at: string;
}

// --- COMPONENTE PRINCIPAL ---
export function ProfessionalAvailabilityPage() {
    const { id: professionalId } = useParams<{ id: string }>();
    const [loading, setLoading] = useState(false);
    const [exceptions, setExceptions] = useState<Exception[]>([]);
    
    // Configuração do formulário para adicionar nova exceção
    const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<ExceptionFormData>({
        resolver: zodResolver(exceptionSchema),
        defaultValues: {
            is_full_day: true,
            start_date: new Date().toISOString().split('T')[0],
            end_date: new Date().toISOString().split('T')[0],
            start_time: '09:00',
            end_time: '18:00',
        }
    });

    const isFullDay = watch("is_full_day");

    // --- LÓGICA DE CARREGAMENTO ---
    const fetchExceptions = async () => {
        if (!professionalId) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('professional_availability_exceptions')
                .select('*')
                .eq('professional_id', professionalId)
                .gte('end_date', new Date().toISOString().split('T')[0]) // Filtra apenas futuras/atuais
                .order('start_date', { ascending: true });

            if (error) throw error;
            setExceptions(data || []);

        } catch (error) {
            console.error("Erro ao carregar exceções:", error);
            toast.error("Falha ao carregar agenda de exceções.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExceptions();
    }, [professionalId]);

    // --- LÓGICA DE SUBMISSÃO ---
    const onSubmit = async (data: ExceptionFormData) => {
        setLoading(true);
        
        try {
            const dataToSave = {
                professional_id: professionalId,
                ...data,
                // Limpa os campos de hora se for dia inteiro
                start_time: data.is_full_day ? null : data.start_time,
                end_time: data.is_full_day ? null : data.end_time,
            };

            const { error } = await supabase
                .from('professional_availability_exceptions')
                .insert(dataToSave);

            if (error) throw error;
            
            toast.success("Exceção de agenda adicionada!");
            reset({
                start_date: new Date().toISOString().split('T')[0],
                end_date: new Date().toISOString().split('T')[0],
                reason: '',
                is_full_day: true,
                start_time: '09:00',
                end_time: '18:00',
            });
            fetchExceptions();

        } catch (error) {
            console.error("Erro ao adicionar exceção:", error);
            toast.error("Não foi possível salvar a exceção.");
        } finally {
            setLoading(false);
        }
    };

    // --- LÓGICA DE EXCLUSÃO ---
    const handleDelete = async (exceptionId: string) => {
        const ok = confirm("Tem certeza que deseja remover esta exceção de agenda?");
        if (!ok) return;

        try {
            const { error } = await supabase
                .from('professional_availability_exceptions')
                .delete()
                .eq('id', exceptionId);

            if (error) throw error;

            toast.success("Bloqueio removido.");
            fetchExceptions();
        } catch (error) {
            console.error("Erro ao excluir:", error);
            toast.error("Falha ao remover bloqueio.");
        }
    };

    // Helper para formatar data
    const formatDate = (dateString: string) => {
        return new Date(dateString + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    }

    return (
        <div className="space-y-8">
            {/* INFORMAÇÃO BÁSICA */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl flex items-start gap-3">
                <Info size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800 dark:text-blue-300">
                    Aqui você gerencia as **exceções** à regra de trabalho padrão. O horário padrão e dias úteis são definidos na aba **Cadastro**.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* COLUNA ESQUERDA: ADICIONAR EXCEÇÃO */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 sticky top-6">
                        <h2 className="text-lg font-bold text-pink-600 flex items-center gap-2 mb-4">
                            <Plus size={20} /> Nova Exceção
                        </h2>
                        
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            {/* Datas */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Início</label>
                                    <Input type="date" {...register("start_date")} />
                                    {errors.start_date && <span className="text-xs text-red-500">{errors.start_date.message}</span>}
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Fim</label>
                                    <Input type="date" {...register("end_date")} />
                                    {errors.end_date && <span className="text-xs text-red-500">{errors.end_date.message}</span>}
                                </div>
                            </div>
                            
                            {/* Dia Inteiro Checkbox */}
                            <div className="flex items-center space-x-2 pt-2">
                                <input type="checkbox" {...register("is_full_day")} id="fullDay" className="w-4 h-4 text-pink-600 rounded border-gray-300 focus:ring-pink-500" />
                                <label htmlFor="fullDay" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Bloquear Dia Inteiro
                                </label>
                            </div>

                            {/* Horários (Apenas se não for dia inteiro) */}
                            {!isFullDay && (
                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Hora Início</label>
                                        <Input type="time" {...register("start_time")} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Hora Fim</label>
                                        <Input type="time" {...register("end_time")} />
                                    </div>
                                    {errors.start_time && <span className="text-xs text-red-500 col-span-2">{errors.start_time.message}</span>}
                                </div>
                            )}

                            {/* Motivo */}
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Motivo (Opcional)</label>
                                <textarea {...register("reason")} rows={2} className="w-full p-2.5 border rounded-lg bg-gray-50 dark:bg-gray-900 dark:border-gray-600 resize-none text-sm outline-none focus:ring-2 focus:ring-pink-500"></textarea>
                            </div>

                            <Button type="submit" disabled={loading} className="w-full bg-pink-600 hover:bg-pink-700 text-white">
                                {loading ? <Loader2 className="animate-spin mr-2"/> : <CheckCircle2 className="mr-2" size={18}/>}
                                Adicionar Exceção
                            </Button>
                        </form>
                    </div>
                </div>

                {/* COLUNA DIREITA: LISTA DE EXCEÇÕES ATIVAS */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2 mb-4">
                        <CalendarOff size={20} className="text-red-500"/> Próximas Indisponibilidades ({exceptions.length})
                    </h2>
                    
                    {loading && <div className="flex justify-center p-10"><Loader2 className="animate-spin text-pink-600" /></div>}

                    {!loading && exceptions.length === 0 && (
                        <div className="p-10 text-center bg-gray-50 dark:bg-gray-900 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-gray-500">
                            <CalendarOff size={32} className="mx-auto mb-2"/>
                            <p>Nenhuma indisponibilidade futura registrada.</p>
                        </div>
                    )}

                    {!loading && exceptions.length > 0 && (
                        <div className="space-y-3">
                            {exceptions.map((exc) => (
                                <div key={exc.id} className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-all hover:shadow-md">
                                    <div className="flex items-center gap-4">
                                        <Calendar size={24} className="text-pink-600" />
                                        <div>
                                            {/* Detalhe do período */}
                                            <p className="font-bold text-gray-800 dark:text-white">
                                                {formatDate(exc.start_date)} {exc.start_date !== exc.end_date && ` - ${formatDate(exc.end_date)}`}
                                            </p>
                                            
                                            {/* Detalhe do horário */}
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {exc.is_full_day 
                                                    ? <span className="text-red-500 font-medium">Dia Inteiro de Folga</span>
                                                    : `Horário: ${exc.start_time?.slice(0, 5) || '00:00'} até ${exc.end_time?.slice(0, 5) || '00:00'}`
                                                }
                                            </p>
                                            
                                            {/* Motivo */}
                                            {exc.reason && (
                                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 italic">
                                                    Motivo: {exc.reason}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <Button 
                                        variant="ghost" 
                                        onClick={() => handleDelete(exc.id)} 
                                        className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 ml-4 p-2 h-auto"
                                        title="Excluir Exceção"
                                    >
                                        <Trash2 size={18} />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
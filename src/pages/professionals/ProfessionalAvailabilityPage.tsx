import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "../../lib/supabase";
import { toast } from "react-hot-toast";
import {
  Calendar, Loader2, Info, CalendarOff, Trash2, CheckCircle2, Plus, Clock, AlertCircle
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
    message: "Horários são obrigatórios para folgas parciais.",
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
                .gte('end_date', new Date().toISOString().split('T')[0]) 
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
                start_time: data.is_full_day ? null : data.start_time,
                end_time: data.is_full_day ? null : data.end_time,
            };

            const { error } = await supabase
                .from('professional_availability_exceptions')
                .insert(dataToSave);

            if (error) throw error;
            
            toast.success("Bloqueio de agenda adicionado!");
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
            toast.error("Não foi possível salvar.");
        } finally {
            setLoading(false);
        }
    };

    // --- LÓGICA DE EXCLUSÃO ---
    const handleDelete = async (exceptionId: string) => {
        if (!confirm("Remover este bloqueio de agenda?")) return;

        try {
            const { error } = await supabase
                .from('professional_availability_exceptions')
                .delete()
                .eq('id', exceptionId);

            if (error) throw error;
            toast.success("Bloqueio removido.");
            fetchExceptions();
        } catch (error) {
            toast.error("Erro ao excluir.");
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    return (
        <div className="max-w-[1400px] mx-auto space-y-8">
            
            {/* INFORMAÇÃO BÁSICA */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl flex items-start gap-3 shadow-sm">
                <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                    <h3 className="text-sm font-bold text-blue-800 dark:text-blue-300">Gerenciamento de Exceções e Folgas</h3>
                    <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                        Configure dias em que o profissional <strong>não atenderá</strong> (feriados, folgas, atestados) ou horários específicos indisponíveis. Isso bloqueia automaticamente a agenda.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* === COLUNA ESQUERDA: FORMULÁRIO (4/12) === */}
                <div className="lg:col-span-4">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 sticky top-6">
                        <div className="mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Plus className="text-pink-600" size={20} /> Novo Bloqueio
                            </h2>
                            <p className="text-xs text-gray-500 mt-1">Defina o período de indisponibilidade.</p>
                        </div>
                        
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            {/* Datas */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Início</label>
                                    <div className="relative">
                                        <Input type="date" {...register("start_date")} className="bg-gray-50 dark:bg-gray-900" />
                                    </div>
                                    {errors.start_date && <span className="text-xs text-red-500 mt-1 block">{errors.start_date.message}</span>}
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Fim</label>
                                    <div className="relative">
                                        <Input type="date" {...register("end_date")} className="bg-gray-50 dark:bg-gray-900" />
                                    </div>
                                    {errors.end_date && <span className="text-xs text-red-500 mt-1 block">{errors.end_date.message}</span>}
                                </div>
                            </div>
                            
                            {/* Switch Dia Inteiro */}
                            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 flex items-center justify-between cursor-pointer" onClick={() => document.getElementById('fullDayCheck')?.click()}>
                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 cursor-pointer flex items-center gap-2">
                                    <CalendarOff size={16} /> Bloquear Dia Inteiro
                                </label>
                                <input 
                                    type="checkbox" 
                                    id="fullDayCheck"
                                    {...register("is_full_day")} 
                                    className="w-5 h-5 text-pink-600 rounded border-gray-300 focus:ring-pink-500 cursor-pointer" 
                                />
                            </div>

                            {/* Horários (Condicional) */}
                            <div className={`overflow-hidden transition-all duration-300 ${!isFullDay ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                                <div className="grid grid-cols-2 gap-4 pt-1">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block flex items-center gap-1"><Clock size={12}/> Hora Início</label>
                                        <Input type="time" {...register("start_time")} className="bg-gray-50 dark:bg-gray-900" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block flex items-center gap-1"><Clock size={12}/> Hora Fim</label>
                                        <Input type="time" {...register("end_time")} className="bg-gray-50 dark:bg-gray-900" />
                                    </div>
                                </div>
                                {errors.start_time && <span className="text-xs text-red-500 mt-1 block">{errors.start_time.message}</span>}
                            </div>

                            {/* Motivo */}
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Motivo (Opcional)</label>
                                <textarea 
                                    {...register("reason")} 
                                    rows={3} 
                                    placeholder="Ex: Consulta médica, Férias, Resolver problemas pessoais..."
                                    className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-gray-900 dark:border-gray-700 resize-none text-sm outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                                ></textarea>
                            </div>

                            <Button 
                                type="submit" 
                                disabled={loading} 
                                className="w-full h-11 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white shadow-lg shadow-pink-200 dark:shadow-none transition-all"
                            >
                                {loading ? <Loader2 className="animate-spin mr-2"/> : <CheckCircle2 className="mr-2" size={18}/>}
                                Confirmar Bloqueio
                            </Button>
                        </form>
                    </div>
                </div>

                {/* === COLUNA DIREITA: LISTA (8/12) === */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <CalendarOff size={20} className="text-gray-400"/> 
                            Bloqueios Futuros
                            <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full text-xs font-extrabold">{exceptions.length}</span>
                        </h2>
                    </div>
                    
                    {loading && exceptions.length === 0 && (
                        <div className="flex justify-center p-12 bg-white dark:bg-gray-800 rounded-2xl">
                            <Loader2 className="animate-spin text-pink-600" size={32} />
                        </div>
                    )}

                    {!loading && exceptions.length === 0 && (
                        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 text-center">
                            <div className="w-16 h-16 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle2 size={32} className="text-green-500"/>
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Agenda Disponível</h3>
                            <p className="text-sm text-gray-500 max-w-xs mt-2">Não há bloqueios ou exceções cadastradas para o futuro. A agenda seguirá os horários padrão.</p>
                        </div>
                    )}

                    {!loading && exceptions.length > 0 && (
                        <div className="grid gap-4">
                            {exceptions.map((exc) => {
                                // Define cor baseada no tipo (Dia todo = Vermelho / Parcial = Laranja)
                                const isFull = exc.is_full_day;
                                const borderColor = isFull ? 'border-l-rose-500' : 'border-l-orange-400';
                                const iconColor = isFull ? 'text-rose-500' : 'text-orange-500';
                                const bgColor = isFull ? 'bg-rose-50 dark:bg-rose-900/10' : 'bg-orange-50 dark:bg-orange-900/10';

                                return (
                                    <div key={exc.id} className={`relative flex flex-col sm:flex-row sm:items-center justify-between bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 border-l-[6px] ${borderColor} hover:shadow-md transition-all group`}>
                                        
                                        <div className="flex items-start gap-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${bgColor}`}>
                                                {isFull ? <CalendarOff size={24} className={iconColor} /> : <Clock size={24} className={iconColor} />}
                                            </div>
                                            
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${bgColor} ${iconColor}`}>
                                                        {isFull ? 'Dia Inteiro' : 'Parcial'}
                                                    </span>
                                                    {exc.reason && (
                                                        <span className="text-xs text-gray-400 flex items-center gap-1 truncate max-w-[200px]">
                                                            • {exc.reason}
                                                        </span>
                                                    )}
                                                </div>

                                                <h4 className="text-lg font-bold text-gray-800 dark:text-white">
                                                    {formatDate(exc.start_date)} 
                                                    {exc.start_date !== exc.end_date && <span className="text-gray-400 mx-2">até</span>}
                                                    {exc.start_date !== exc.end_date && formatDate(exc.end_date)}
                                                </h4>

                                                {!isFull && (
                                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                                                        <Clock size={14}/> Indisponível das <span className="text-gray-800 dark:text-white font-bold">{exc.start_time?.slice(0, 5)}</span> às <span className="text-gray-800 dark:text-white font-bold">{exc.end_time?.slice(0, 5)}</span>
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-4 sm:mt-0 sm:ml-4 flex justify-end">
                                            <Button 
                                                variant="ghost" 
                                                onClick={() => handleDelete(exc.id)} 
                                                className="text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                            >
                                                <Trash2 size={18} /> <span className="sm:hidden ml-2">Excluir</span>
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
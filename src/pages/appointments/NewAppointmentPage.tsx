import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { 
    CalendarCheck, User, Clock, Stethoscope, ArrowLeft, Loader2, Calendar
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { toast } from "react-hot-toast";

// Interface para o dado que vamos buscar do Supabase
interface Professional {
    id: string;
    first_name: string;
    last_name?: string;
    agenda_color?: string;
}

export function NewAppointmentPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [professionals, setProfessionals] = useState<Professional[]>([]);
    
    // Estado para o formulário (simplificado)
    const [selectedProfessional, setSelectedProfessional] = useState<string | null>(null);

    useEffect(() => {
        fetchActiveProfessionals();
    }, []);

    // FUNÇÃO CRÍTICA: Busca apenas profissionais ATIVOS e de atendimento.
    async function fetchActiveProfessionals() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("profiles")
                .select("id, first_name, last_name, agenda_color")
                // Filtra explicitamente por quem está ATIVO e quem é de ATENDIMENTO
                .eq("is_active", true) 
                .in("role", ["profissional", "esteticista", "doutor"]) 
                .order("first_name");

            if (error) throw error;
            
            setProfessionals(data || []);
            // Define o primeiro como padrão, se houver
            if (data && data.length > 0) {
                setSelectedProfessional(data[0].id);
            }

        } catch (error) {
            console.error("Erro ao carregar profissionais para agendamento:", error);
            toast.error("Erro ao carregar lista de profissionais.");
        } finally {
            setLoading(false);
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProfessional) {
            toast.error("Selecione um profissional.");
            return;
        }
        
        // Lógica de agendamento real viria aqui
        toast.success(`Agendamento simulado para ${selectedProfessional}!`);
        // navigate('/agenda');
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="animate-spin text-pink-600 size-8" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto p-6">
            
            {/* Cabeçalho */}
            <div className="flex items-center gap-4 mb-8">
                <Button variant="ghost" onClick={() => navigate("/agenda")} className="bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700">
                    <ArrowLeft size={20} />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <CalendarCheck className="text-pink-600"/> Novo Agendamento
                    </h1>
                    <p className="text-sm text-gray-500">Preencha os dados da consulta e horário.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 space-y-6">
                
                {/* SELEÇÃO DO PROFISSIONAL (O PONTO QUE FALTAVA) */}
                <div>
                    <label htmlFor="professional" className="text-xs font-bold text-gray-500 uppercase mb-2 block flex items-center gap-1">
                        <Stethoscope size={14}/> Profissional
                    </label>
                    <div className="relative">
                        <select 
                            id="professional"
                            value={selectedProfessional || ""}
                            onChange={(e) => setSelectedProfessional(e.target.value)}
                            className="w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-900 dark:border-gray-600 outline-none focus:ring-2 focus:ring-pink-500 transition-all text-base appearance-none"
                            required
                        >
                            {professionals.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.first_name} {p.last_name}
                                </option>
                            ))}
                        </select>
                        <Calendar size={20} className="absolute right-3 top-3 text-gray-400 pointer-events-none"/>
                    </div>
                    {professionals.length === 0 && (
                        <p className="text-sm text-red-500 mt-2">Nenhum profissional ativo encontrado para agendamento.</p>
                    )}
                </div>

                {/* OUTROS CAMPOS NECESSÁRIOS (SIMULAÇÃO) */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-2 block flex items-center gap-1">
                            <User size={14}/> Paciente
                        </label>
                        <input type="text" placeholder="Buscar paciente..." className="w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-900 dark:border-gray-600" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-2 block flex items-center gap-1">
                            <Clock size={14}/> Data e Hora
                        </label>
                        <input type="datetime-local" className="w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-900 dark:border-gray-600" />
                    </div>
                </div>

                <Button type="submit" className="w-full h-12 bg-pink-600 hover:bg-pink-700 text-white font-bold shadow-lg shadow-pink-300 dark:shadow-none transition-all">
                    Criar Agendamento
                </Button>
            </form>
        </div>
    );
}
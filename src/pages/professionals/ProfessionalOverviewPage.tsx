import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Loader2, DollarSign, Briefcase, Target, RefreshCw, ChevronRight } from 'lucide-react';
import { Button } from '../../components/ui/button';
import ProfessionalFutureAgendaWidget from './ProfessionalFutureAgendaWidget'; 

export default function ProfessionalOverviewPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(true);
    const [profName, setProfName] = useState(""); // Apenas o nome para o título
    
    // Estados para os cards (Simulados ou Reais)
    const [stats, setStats] = useState({
        pending: 0,
        procedures: 0,
        rate: 0
    });

    useEffect(() => {
        if (id) fetchData(id);
    }, [id]);

    async function fetchData(profId: string) {
        setLoading(true);
        try {
            // 1. Busca APENAS o nome e taxa do profissional para o cabeçalho
            const { data: prof, error } = await supabase
                .from('professionals')
                .select('name, commission_rate')
                .eq('id', profId)
                .single();

            if (error) throw error;
            
            setProfName(prof?.name || "Profissional");
            
            // 2. Busca totais (Exemplo simplificado para não travar)
            // Aqui você pode melhorar a query financeira depois
            setStats({
                pending: 1250.00, // Valor simulado para teste visual
                procedures: 12,   // Valor simulado
                rate: prof?.commission_rate || 0
            });

        } catch (error) {
            console.error("Erro no Dashboard:", error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-pink-600" /></div>;

    return (
        <div className="space-y-8 p-4">
            {/* TÍTULO DO DASHBOARD */}
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Olá, {profName.split(' ')[0]} 👋
            </h2>
            
            {/* CARDS DE RESUMO */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between">
                        <span className="text-xs font-bold text-gray-400 uppercase">A Receber</span>
                        <DollarSign className="text-green-500" size={20}/>
                    </div>
                    <p className="text-2xl font-bold mt-2">R$ {stats.pending.toFixed(2)}</p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between">
                        <span className="text-xs font-bold text-gray-400 uppercase">Procedimentos (Mês)</span>
                        <Briefcase className="text-blue-500" size={20}/>
                    </div>
                    <p className="text-2xl font-bold mt-2">{stats.procedures}</p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between">
                        <span className="text-xs font-bold text-gray-400 uppercase">Comissão Base</span>
                        <Target className="text-pink-500" size={20}/>
                    </div>
                    <p className="text-2xl font-bold mt-2">{stats.rate}%</p>
                </div>
            </div>

            {/* AGENDA FUTURA (WIDGET) */}
            <div className="mt-6">
                 <ProfessionalFutureAgendaWidget professionalId={id || ''} /> 
            </div>

            {/* BOTÃO PARA DISPONIBILIDADE */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-300">Precisa ajustar seus horários?</span>
                <Button variant="outline" onClick={() => navigate('availability')} className="text-xs">
                    Ver Disponibilidade <ChevronRight size={14} />
                </Button>
            </div>
        </div>
    );
}
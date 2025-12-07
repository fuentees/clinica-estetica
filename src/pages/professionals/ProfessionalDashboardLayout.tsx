import { ArrowLeft, User, Calendar, DollarSign, Loader2 } from "lucide-react";
import { Link, Outlet, useParams, useLocation, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button"; // <--- VERIFIQUE O CAMINHO
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase"; // <--- VERIFIQUE O CAMINHO
import { toast } from "react-hot-toast";

// Definição dos links das abas
const tabs = [
    { name: 'Cadastro', path: 'details', icon: User },
    { name: 'Disponibilidade', path: 'availability', icon: Calendar },
    { name: 'Comissão', path: 'commission', icon: DollarSign },
];

interface ProfileData {
    first_name: string;
    last_name: string;
}

export function ProfessionalDashboardLayout() { // <--- A EXPORTAÇÃO ESTÁ CORRETA?
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);

    // Calcula o prefixo da URL atual (ex: /professionals/ID)
    const basePath = `/professionals/${id}`;
    
    // Verifica qual aba está ativa
    const isActive = (path: string) => location.pathname === `${basePath}/${path}` || 
                                     (path === 'details' && location.pathname === basePath);

    // 1. CARREGAR DADOS DO PROFISSIONAL
    useEffect(() => {
        async function fetchProfile() {
            if (!id) return;
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('first_name, last_name')
                    .eq('id', id)
                    .single();

                if (error) throw error;
                setProfile(data);
            } catch (error) {
                console.error("Erro ao carregar nome do profissional:", error);
                toast.error("Falha ao carregar perfil.");
                navigate('/professionals'); // Redireciona se o perfil não for encontrado
            } finally {
                setLoading(false);
            }
        }
        fetchProfile();
    }, [id, navigate]);

    if (loading) {
        return <div className="flex justify-center p-10 h-screen items-start mt-20"><Loader2 className="animate-spin text-pink-600 w-10 h-10" /></div>;
    }

    const professionalName = profile ? `${profile.first_name} ${profile.last_name || ''}` : "Profissional";

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            
            {/* CABEÇALHO */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => navigate('/professionals')} className="bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700">
                    <ArrowLeft size={20} />
                </Button>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Perfil de: **{professionalName}**
                </h1>
            </div>

            {/* ABAS DE NAVEGAÇÃO */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8">
                    {tabs.map((tab) => (
                        <Link
                            key={tab.name}
                            // GARANTE O CAMINHO ABSOLUTO CORRETO
                            to={tab.path === 'details' ? basePath : `${basePath}/${tab.path}`}
                            className={`
                                whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2
                                ${isActive(tab.path)
                                    ? 'border-pink-600 text-pink-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }
                            `}
                        >
                            <tab.icon size={16} />
                            {tab.name}
                        </Link>
                    ))}
                </nav>
            </div>

            {/* CONTEÚDO DA ABA (ROTAS FILHAS) */}
            <div className="pt-4">
                <Outlet />
            </div>
        </div>
    );
}
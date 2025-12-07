import { ArrowLeft, User, Calendar, DollarSign } from "lucide-react";
import { Link, Outlet, useParams, useLocation, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";

// Definição dos links das abas
const tabs = [
    { name: 'Cadastro', path: 'details', icon: User },
    { name: 'Disponibilidade', path: 'availability', icon: Calendar },
    { name: 'Comissão', path: 'commission', icon: DollarSign },
];

// Este componente precisa ser aninhado na rota principal do App.tsx
export function ProfessionalDashboardLayout() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    
    // Calcula o prefixo da URL atual (ex: /professionals/ID)
    const basePath = `/professionals/${id}`;
    
    // Verifica qual aba está ativa
    const isActive = (path: string) => location.pathname === `${basePath}/${path}` || 
                                     (path === 'details' && location.pathname === basePath);

    // 

    // Simulação do carregamento do nome do profissional (em um sistema real, você buscaria isso aqui)
    const professionalName = "Nome do Profissional"; 

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => navigate('/professionals')} className="bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700">
                    <ArrowLeft size={20} />
                </Button>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Perfil de: {professionalName}
                </h1>
            </div>

            {/* ABAS DE NAVEGAÇÃO */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8">
                    {tabs.map((tab) => (
                        <Link
                            key={tab.name}
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

// Crie os arquivos placeholders:
// ProfessionalAvailabilityPage.tsx
// ProfessionalCommissionPage.tsx
// ProfessionalDetailsPage.tsx (Será o formulário de cadastro que você já tem)
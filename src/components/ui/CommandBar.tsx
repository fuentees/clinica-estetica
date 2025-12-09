import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, 
  User, 
  Calendar, 
  CreditCard, 
  ArrowRight, 
  X,
  LayoutDashboard,
  Users
} from "lucide-react";

export function CommandBar() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  // Atalho de Teclado (Ctrl + K ou Cmd + K)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  if (!isOpen) return null;

  // Lista de Ações e Navegação
  const actions = [
    { label: "Dashboard", icon: <LayoutDashboard size={18} />, route: "/dashboard", type: "Página" },
    { label: "Agenda", icon: <Calendar size={18} />, route: "/appointments", type: "Página" },
    { label: "Novo Agendamento", icon: <Calendar size={18} />, route: "/appointments/new", type: "Ação" },
    { label: "Pacientes", icon: <Users size={18} />, route: "/patients", type: "Página" },
    { label: "Novo Paciente", icon: <User size={18} />, route: "/patients/new", type: "Ação" },
    { label: "Financeiro", icon: <CreditCard size={18} />, route: "/payments", type: "Página" },
  ];

  // Filtra com base no que o usuário digita
  const filteredActions = actions.filter(action => 
    action.label.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (route: string) => {
    navigate(route);
    setIsOpen(false);
    setQuery("");
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh] px-4">
      
      {/* Backdrop (Fundo Escuro e Desfocado) */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={() => setIsOpen(false)}
      ></div>

      {/* Janela da Command Bar */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl shadow-purple-500/20 border border-gray-200 dark:border-gray-700 overflow-hidden transform transition-all scale-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Campo de Busca */}
        <div className="flex items-center px-4 py-4 border-b border-gray-100 dark:border-gray-800">
          <Search className="text-gray-400 w-6 h-6 mr-3" />
          <input 
            autoFocus
            type="text" 
            placeholder="Digite um comando ou busque..." 
            className="flex-1 bg-transparent text-lg text-gray-800 dark:text-white placeholder-gray-400 outline-none h-8"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="hidden sm:flex gap-1">
            <span className="text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-1 rounded">ESC</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="ml-3 sm:hidden text-gray-400">
            <X size={20}/>
          </button>
        </div>

        {/* Lista de Resultados */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filteredActions.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
                <p>Nenhum resultado encontrado para "{query}"</p>
            </div>
          ) : (
            <div className="space-y-1">
                {/* Cabeçalho da Seção */}
                <p className="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Acesso Rápido</p>
                
                {filteredActions.map((action, index) => (
                    <button
                        key={index}
                        onClick={() => handleSelect(action.route)}
                        className="w-full flex items-center justify-between px-3 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group text-left"
                    >
                        <div className="flex items-center gap-3 text-gray-700 dark:text-gray-200">
                            <div className={`p-2 rounded-lg ${action.type === 'Ação' ? 'bg-pink-100 text-pink-600 dark:bg-pink-900/30' : 'bg-gray-100 text-gray-600 dark:bg-gray-800'}`}>
                                {action.icon}
                            </div>
                            <span className="font-medium">{action.label}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-700">
                                {action.type}
                            </span>
                            <ArrowRight size={16} className="text-gray-300 group-hover:text-pink-500 transition-colors opacity-0 group-hover:opacity-100" />
                        </div>
                    </button>
                ))}
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-xs text-gray-400">
            <span>Dica: Use as setas para navegar</span>
            <div className="flex gap-2">
                <span>Clinica OS <span className="text-pink-500 font-bold">Ultra</span></span>
            </div>
        </div>

      </div>
    </div>
  );
}
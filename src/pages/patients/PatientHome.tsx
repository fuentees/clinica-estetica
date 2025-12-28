import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar, Clock, FileText, User } from 'lucide-react';
import { Link } from 'react-router-dom'; // Agora estamos usando o Link!

export default function PatientHome() {
  const { user, signOut } = useAuth();

  // Função segura para pegar o nome do user_metadata do Supabase
  const getDisplayName = () => {
    if (!user) return 'Paciente';
    
    // Tenta pegar dos metadados (Padrão Supabase)
    const meta = user.user_metadata;
    if (meta && meta.first_name) {
      return `${meta.first_name} ${meta.last_name || ''}`.trim();
    }

    // Fallback para email caso não tenha nome
    return user.email?.split('@')[0] || 'Paciente';
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Cabeçalho de Boas-Vindas */}
      <div className="bg-gradient-to-r from-red-600 to-red-800 rounded-2xl p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">
          Olá, {getDisplayName()}!
        </h1>
        <p className="opacity-90">Bem-vindo ao seu portal exclusivo de estética e saúde.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Card: Meus Agendamentos */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
          <div className="bg-red-50 dark:bg-red-900/20 w-12 h-12 rounded-full flex items-center justify-center text-red-600 mb-4">
            <Calendar size={24} />
          </div>
          <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-2">Meus Agendamentos</h3>
          <p className="text-gray-500 text-sm mb-4">Consulte seus horários e próximas sessões.</p>
          {/* Link corrigido */}
          <Link to="/portal/appointments" className="text-red-600 font-medium text-sm cursor-pointer hover:underline">
            Ver agenda &rarr;
          </Link>
        </div>

        {/* Card: Histórico / Tratamentos */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
          <div className="bg-blue-50 dark:bg-blue-900/20 w-12 h-12 rounded-full flex items-center justify-center text-blue-600 mb-4">
            <FileText size={24} />
          </div>
          <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-2">Meus Tratamentos</h3>
          <p className="text-gray-500 text-sm mb-4">Acesse seu histórico e recomendações.</p>
          {/* Link corrigido */}
          <Link to="/portal/history" className="text-blue-600 font-medium text-sm cursor-pointer hover:underline">
            Acessar histórico &rarr;
          </Link>
        </div>

        {/* Card: Perfil */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
          <div className="bg-gray-50 dark:bg-gray-700 w-12 h-12 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 mb-4">
            <User size={24} />
          </div>
          <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-2">Meu Perfil</h3>
          <p className="text-gray-500 text-sm mb-4">Atualize seus dados cadastrais.</p>
          <button onClick={signOut} className="text-gray-500 font-medium text-sm hover:text-red-600 transition-colors">
            Sair da conta
          </button>
        </div>
      </div>

      {/* Área de Próxima Consulta (Exemplo) */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <Clock size={20} className="text-red-600" />
          Próxima Consulta
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div>
             <p className="text-gray-500 text-sm">Você não possui agendamentos futuros no momento.</p>
           </div>
           {/* Botão de ação (Exemplo: Link para WhatsApp ou Agendamento) */}
           <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
             Agendar Nova Consulta
           </Button>
        </div>
      </div>
    </div>
  );
}

// Componente de botão local para manter o estilo
function Button({ className, variant = 'default', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'outline' }) {
  const base = "px-4 py-2 rounded-lg font-medium transition-colors text-sm";
  const variants = {
    default: "bg-red-600 text-white hover:bg-red-700",
    outline: "border border-gray-300 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800"
  };
  return <button className={`${base} ${variants[variant]} ${className || ''}`} {...props} />;
}
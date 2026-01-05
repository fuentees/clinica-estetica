import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar, Clock, FileText, User, ChevronRight, LogOut, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PatientHome() {
  const { user, signOut } = useAuth();

  // Função segura para pegar o nome do user_metadata do Supabase
  const getDisplayName = () => {
    if (!user) return 'Paciente';
    const meta = user.user_metadata;
    if (meta && meta.first_name) {
      return `${meta.first_name} ${meta.last_name || ''}`.trim();
    }
    return user.email?.split('@')[0] || 'Paciente';
  };

  return (
    <div className="max-w-[1200px] mx-auto p-6 space-y-10 animate-in fade-in duration-700">
      
      {/* CABEÇALHO DE BOAS-VINDAS PREMIUM */}
      <div className="relative overflow-hidden bg-gradient-to-br from-rose-600 via-rose-700 to-rose-900 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-rose-200 dark:shadow-none">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Sparkles size={160} />
        </div>
        <div className="relative z-10">
          <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
            Acesso Exclusivo
          </span>
          <h1 className="text-4xl font-black tracking-tighter italic mb-2">
            Olá, {getDisplayName()}!
          </h1>
          <p className="text-rose-100 font-medium max-w-md">
            Seu portal dedicado para acompanhar tratamentos, agendamentos e sua evolução estética.
          </p>
        </div>
      </div>

      {/* GRID DE NAVEGAÇÃO RÁPIDA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Card: Meus Agendamentos */}
        <div className="group bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:border-rose-100 transition-all duration-500">
          <div className="bg-rose-50 dark:bg-rose-900/20 w-14 h-14 rounded-2xl flex items-center justify-center text-rose-600 mb-6 group-hover:scale-110 transition-transform">
            <Calendar size={28} />
          </div>
          <h3 className="font-black text-xl text-gray-900 dark:text-white mb-2 uppercase tracking-tighter italic">Sessões</h3>
          <p className="text-gray-400 text-sm font-medium mb-6 leading-relaxed">
            Consulte seus horários agendados e histórico de visitas.
          </p>
          <Link to="/portal/appointments" className="flex items-center gap-2 text-rose-600 font-black text-xs uppercase tracking-widest group-hover:gap-4 transition-all">
            Ver agenda <ChevronRight size={14} />
          </Link>
        </div>

        {/* Card: Histórico / Tratamentos */}
        <div className="group bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:border-blue-100 transition-all duration-500">
          <div className="bg-blue-50 dark:bg-blue-900/20 w-14 h-14 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform">
            <FileText size={28} />
          </div>
          <h3 className="font-black text-xl text-gray-900 dark:text-white mb-2 uppercase tracking-tighter italic">Protocolos</h3>
          <p className="text-gray-400 text-sm font-medium mb-6 leading-relaxed">
            Acesse as recomendações da sua especialista e receitas.
          </p>
          <Link to="/portal/history" className="flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-widest group-hover:gap-4 transition-all">
            Acessar Prontuário <ChevronRight size={14} />
          </Link>
        </div>

        {/* Card: Perfil & Sair */}
        <div className="group bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-500">
          <div className="bg-gray-50 dark:bg-gray-700 w-14 h-14 rounded-2xl flex items-center justify-center text-gray-500 dark:text-gray-300 mb-6 group-hover:scale-110 transition-transform">
            <User size={28} />
          </div>
          <h3 className="font-black text-xl text-gray-900 dark:text-white mb-2 uppercase tracking-tighter italic">Dados</h3>
          <p className="text-gray-400 text-sm font-medium mb-6 leading-relaxed">
            Mantenha seus dados e contatos sempre atualizados.
          </p>
          <button 
            onClick={signOut} 
            className="flex items-center gap-2 text-gray-400 hover:text-rose-600 font-black text-xs uppercase tracking-widest transition-colors"
          >
            <LogOut size={14} /> Sair da conta
          </button>
        </div>
      </div>

      {/* ÁREA DE PRÓXIMA CONSULTA */}
      <div className="space-y-6">
        <h2 className="text-sm font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-3 ml-2">
          <Clock size={16} className="text-rose-600" />
          Status do Agendamento
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
           <div className="flex items-center gap-6">
              <div className="w-12 h-12 bg-gray-50 dark:bg-gray-900 rounded-2xl flex items-center justify-center text-gray-300">
                <Calendar size={24}/>
              </div>
              <div>
                <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">Atenção</p>
                <p className="text-gray-400 text-xs font-medium">Você não possui agendamentos confirmados para os próximos dias.</p>
              </div>
           </div>
           
           <Button variant="outline" className="h-12 px-8 border-rose-200 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 font-black uppercase text-[10px] tracking-widest rounded-xl">
             Agendar Nova Avaliação
           </Button>
        </div>
      </div>
    </div>
  );
}

// Componente de botão interno revisado
function Button({ className, variant = 'default', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'outline' }) {
  const base = "px-6 py-2 rounded-xl font-black transition-all text-xs tracking-widest shadow-sm active:scale-95";
  const variants = {
    default: "bg-rose-600 text-white hover:bg-rose-700",
    outline: "border-2 border-gray-100 bg-transparent hover:border-rose-200 transition-colors"
  };
  return <button className={`${base} ${variants[variant]} ${className || ''}`} {...props} />;
}
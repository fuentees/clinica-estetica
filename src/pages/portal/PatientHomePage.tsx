import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { 
  CalendarPlus, UserCog, Clock, MapPin, 
  Wallet, MessageCircle, Sparkles
} from "lucide-react";

export function PatientHomePage() {
  const navigate = useNavigate();
  const [patientName, setPatientName] = useState("Visitante");
  const [nextAppt, setNextAppt] = useState<any>(null);

  // --- CONFIGURAÇÕES DE LINKS (SUBSTITUA PELOS SEUS REAIS) ---
  const WHATSAPP_NUMBER = "5511999999999"; // Coloque o número da clínica aqui
  const WHATSAPP_MSG = encodeURIComponent("Olá! Estou no Portal do Paciente e gostaria de agendar um horário.");
  const GOOGLE_MAPS_LINK = "https://www.google.com/maps/search/?api=1&query=VILAGI+Estética+Avançada"; // Link de busca inteligente

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('patients')
          .select('name, id')
          .eq('email', user.email)
          .single();
        
        if (profile) {
            setPatientName(profile.name.split(' ')[0]);
            
            const { data: appt } = await supabase
                .from('appointments')
                .select('start_time')
                .eq('patient_id', profile.id)
                .gte('start_time', new Date().toISOString())
                .order('start_time', { ascending: true })
                .limit(1)
                .single();
            
            if (appt) setNextAppt(appt);
        }
      }
    }
    loadData();
  }, []);

  const handleOpenWhatsapp = () => {
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MSG}`, '_blank');
  };

  return (
    <div className="space-y-8 pb-10">
      
      {/* SAUDAÇÃO */}
      <div className="flex justify-between items-end">
        <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Bem-vindo(a) de volta,</p>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white italic tracking-tighter uppercase">
                {patientName}
            </h1>
        </div>
        <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/20 rounded-full flex items-center justify-center text-pink-600 animate-pulse">
            <Sparkles size={20} />
        </div>
      </div>

      {/* CARD DESTAQUE */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 to-purple-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative bg-white dark:bg-gray-800 rounded-[2rem] p-8 border border-gray-100 dark:border-gray-700 shadow-xl">
            {nextAppt ? (
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-[10px] font-black uppercase tracking-widest mb-2 inline-block">
                            Confirmado
                        </span>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white italic uppercase tracking-tighter">
                            Próxima Sessão
                        </h3>
                        <p className="text-sm font-bold text-gray-500 mt-1 flex items-center gap-2">
                            <Clock size={16} className="text-pink-500"/> 
                            {new Date(nextAppt.start_time).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })} 
                            às {new Date(nextAppt.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                    <button onClick={() => navigate('/portal/agendamentos')} className="w-full md:w-auto h-12 px-6 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold uppercase text-xs tracking-widest hover:scale-105 transition-transform shadow-lg">
                        Ver Detalhes
                    </button>
                </div>
            ) : (
                <div className="text-center py-4">
                    <h3 className="text-xl font-black text-gray-900 dark:text-white italic uppercase tracking-tighter mb-2">
                        Hora de se cuidar?
                    </h3>
                    <p className="text-xs text-gray-500 font-medium mb-6 max-w-xs mx-auto">
                        Você não tem agendamentos futuros. Que tal reservar um horário agora mesmo?
                    </p>
                    {/* ✅ BOTÃO CORRIGIDO: ABRE O WHATSAPP */}
                    <button 
                        onClick={handleOpenWhatsapp} 
                        className="w-full md:w-auto h-14 px-8 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-2xl font-black uppercase text-sm tracking-widest hover:scale-105 transition-transform shadow-xl shadow-pink-500/30 flex items-center justify-center gap-2 mx-auto"
                    >
                        <CalendarPlus size={20} /> Agendar Agora
                    </button>
                </div>
            )}
        </div>
      </div>

      {/* GRID DE AÇÕES */}
      <div>
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4 ml-2">Acesso Rápido</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              
              <button onClick={() => navigate('/portal/perfil')} className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-lg hover:border-pink-200 transition-all group text-left">
                  <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
                      <UserCog size={24} />
                  </div>
                  <span className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Atualizar</span>
                  <span className="text-sm font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">Meus Dados</span>
              </button>

              <button onClick={() => navigate('/portal/financeiro')} className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-lg hover:border-pink-200 transition-all group text-left">
                  <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-110 transition-transform">
                      <Wallet size={24} />
                  </div>
                  <span className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Faturas</span>
                  <span className="text-sm font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">Financeiro</span>
              </button>

              {/* ✅ LINK DO MAPA CORRIGIDO */}
              <a 
                href={GOOGLE_MAPS_LINK} 
                target="_blank" 
                rel="noreferrer"
                className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-lg hover:border-pink-200 transition-all group text-left block"
              >
                  <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center text-purple-600 mb-4 group-hover:scale-110 transition-transform">
                      <MapPin size={24} />
                  </div>
                  <span className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Navegar</span>
                  <span className="text-sm font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">Como Chegar</span>
              </a>

              {/* ✅ LINK DO WHATSAPP CORRIGIDO */}
              <a 
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Olá, preciso de ajuda com o Portal do Paciente.")}`} 
                target="_blank" 
                rel="noreferrer"
                className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-lg hover:border-pink-200 transition-all group text-left block"
              >
                  <div className="w-12 h-12 bg-pink-50 dark:bg-pink-900/20 rounded-2xl flex items-center justify-center text-pink-600 mb-4 group-hover:scale-110 transition-transform">
                      <MessageCircle size={24} />
                  </div>
                  <span className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Ajuda</span>
                  <span className="text-sm font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">WhatsApp</span>
              </a>

          </div>
      </div>
    </div>
  );
}
import { useAuth } from '../../contexts/AuthContext';
import { Clock, MapPin, Phone, Calendar } from 'lucide-react';
import { BeforeAfter } from '../../components/BeforeAfter'; // <--- Importe aqui

export default function PatientHome() {
  const { profile } = useAuth();

  // Dados fictícios
  const proximaConsulta = {
    data: '15 Out',
    hora: '14:30',
    procedimento: 'Botox (Retorno)',
    doutor: 'Dr. Victor Fuentes'
  };

  return (
    <div className="p-6 space-y-8 pb-24">
      {/* Cabeçalho */}
      <header className="flex justify-between items-center pt-2">
        <div>
          <p className="text-gray-500 text-sm">Olá, bem-vindo(a)</p>
          <h1 className="text-2xl font-bold text-gray-800">
            {profile?.full_name?.split(' ')[0] || 'Paciente'}
          </h1>
        </div>
        <div className="h-12 w-12 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 font-bold text-xl border-2 border-pink-200">
          {profile?.full_name?.charAt(0) || 'P'}
        </div>
      </header>

      {/* --- NOVO: Seção de Resultados (Onde brilha o componente) --- */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 bg-pink-100 rounded-lg text-pink-600">
            <Calendar size={20} />
          </div>
          <h2 className="font-bold text-gray-800 text-lg">Seu Último Resultado</h2>
        </div>
        
        {/* Aqui usamos o componente novo */}
        <BeforeAfter 
          // Usando fotos de exemplo da internet (depois virão do banco)
          beforeImage="https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?q=80&w=800&auto=format&fit=crop"
          afterImage="https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=800&auto=format&fit=crop"
          labelBefore="Início do Tratamento"
          labelAfter="Hoje"
        />
        <p className="text-xs text-center text-gray-400 mt-2">Arraste a barra para comparar</p>
      </section>

      {/* Card de Próxima Consulta */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white shadow-xl shadow-gray-200">
        <div className="flex justify-between items-start mb-6">
          <div>
            <span className="bg-pink-500 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide">Próxima Visita</span>
            <h3 className="text-xl font-bold mt-3">{proximaConsulta.procedimento}</h3>
            <p className="text-gray-400 text-sm">{proximaConsulta.doutor}</p>
          </div>
          <div className="text-center bg-white/10 backdrop-blur-md rounded-xl p-3 min-w-[70px] border border-white/10">
            <p className="font-bold text-xl">{proximaConsulta.data}</p>
            <p className="text-xs text-gray-300">{proximaConsulta.hora}</p>
          </div>
        </div>
        
        <div className="flex gap-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 text-xs text-gray-300">
                <Clock size={14} /> Chegue 10min antes
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-300">
                <MapPin size={14} /> Sala 04
            </div>
        </div>
      </div>

      {/* Acesso Rápido */}
      <div>
        <h2 className="font-bold text-gray-800 mb-4 text-lg">Precisa de ajuda?</h2>
        <button 
          onClick={() => window.open('https://wa.me/5511999999999', '_blank')} 
          className="w-full p-4 bg-green-50 border border-green-100 rounded-xl shadow-sm flex items-center justify-center gap-3 hover:bg-green-100 transition active:scale-95"
        >
          <div className="h-8 w-8 bg-green-500 text-white rounded-full flex items-center justify-center">
            <Phone size={18} />
          </div>
          <span className="font-semibold text-green-800">Falar no WhatsApp da Clínica</span>
        </button>
      </div>
    </div>
  );
}
import { useState } from 'react';
import { Calendar, Clock, User, Mail, Phone, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export function PublicBookingPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    date: '',
    time: ''
  });

  const services = [
    'Limpeza de Pele',
    'Hidratação Facial',
    'Peeling',
    'Botox',
    'Preenchimento',
    'Drenagem Linfática',
    'Massagem Modeladora'
  ];

  const availableTimes = [
    '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulação de salvamento no banco de dados
      console.log('Dados do Agendamento:', formData);
      
      // Aqui você conectaria com o Supabase:
      // await supabase.from('appointments').insert([formData])

      await new Promise(resolve => setTimeout(resolve, 1500)); // Delay para UX
      toast.success('Solicitação de agendamento enviada com sucesso!');
      
      // Limpa o formulário após o sucesso
      setFormData({
        name: '',
        email: '',
        phone: '',
        service: '',
        date: '',
        time: ''
      });
    } catch (error) {
      toast.error('Erro ao processar agendamento. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-500">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Agende seu Atendimento
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Escolha o melhor horário para sua consulta e cuidaremos do resto
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nome */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <User className="w-4 h-4 mr-2 text-blue-500" />
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  disabled={isSubmitting}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white outline-none transition-all"
                  placeholder="Ex: Maria Oliveira"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <Mail className="w-4 h-4 mr-2 text-blue-500" />
                  E-mail *
                </label>
                <input
                  type="email"
                  required
                  disabled={isSubmitting}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white outline-none transition-all"
                  placeholder="seu@email.com"
                />
              </div>

              {/* Telefone */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <Phone className="w-4 h-4 mr-2 text-blue-500" />
                  Telefone (WhatsApp) *
                </label>
                <input
                  type="tel"
                  required
                  disabled={isSubmitting}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white outline-none transition-all"
                  placeholder="(00) 00000-0000"
                />
              </div>

              {/* Serviço */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Serviço Desejado *
                </label>
                <select
                  required
                  disabled={isSubmitting}
                  value={formData.service}
                  onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="">Selecione um procedimento</option>
                  {services.map((service) => (
                    <option key={service} value={service}>
                      {service}
                    </option>
                  ))}
                </select>
              </div>

              {/* Data */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                  Data da Consulta *
                </label>
                <input
                  type="date"
                  required
                  disabled={isSubmitting}
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white outline-none transition-all"
                />
              </div>

              {/* Horário */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <Clock className="w-4 h-4 mr-2 text-blue-500" />
                  Horário Disponível *
                </label>
                <select
                  required
                  disabled={isSubmitting}
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="">Escolha um horário</option>
                  {availableTimes.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-blue-700 transition-all focus:ring-4 focus:ring-blue-300 shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Confirmar Agendamento
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 pt-8 border-t dark:border-gray-700">
            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
              <p>Você receberá uma confirmação instantânea por e-mail.</p>
              <p className="mt-2">
                Suporte: <span className="font-bold text-blue-600 dark:text-blue-400">(00) 00000-0000</span>
              </p>
            </div>
          </div>
        </div>

        {/* BENEFÍCIOS */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 text-center border border-gray-100 dark:border-gray-700 hover:scale-105 transition-transform duration-300">
            <div className="bg-blue-100 dark:bg-blue-900 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">
              Agendamento Fácil
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Escolha o melhor horário para sua rotina em poucos cliques.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 text-center border border-gray-100 dark:border-gray-700 hover:scale-105 transition-transform duration-300">
            <div className="bg-green-100 dark:bg-green-900 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
              <Clock className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">
              Confirmação Rápida
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Receba os dados do seu agendamento no seu e-mail pessoal.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 text-center border border-gray-100 dark:border-gray-700 hover:scale-105 transition-transform duration-300">
            <div className="bg-purple-100 dark:bg-purple-900 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
              <User className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">
              Equipe Especializada
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Atendimento exclusivo com os melhores profissionais da área.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PublicBookingPage;
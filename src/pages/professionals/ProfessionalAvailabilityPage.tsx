import { AlertCircle, Clock, Calendar, Shield } from "lucide-react";

export function ProfessionalAvailabilityPage() {
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4"><Calendar size={20}/> Gerenciamento de Disponibilidade</h3>
            
            <div className="p-4 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-lg text-sm flex items-start gap-3">
                <AlertCircle size={20} className="mt-1"/>
                <p>
                    Esta seção será usada para gerenciar horários de **exceção** (férias, atestados ou bloqueios específicos) que anulam o horário padrão definido na aba 'Cadastro'.
                </p>
            </div>

            <div className="mt-6 space-y-4">
                <div className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50 dark:bg-gray-900">
                    <Clock size={16} className="text-pink-600"/>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Horário Padrão Ativo:</span>
                    <span className="text-pink-600">09:00h às 18:00h (Seg - Sex)</span>
                </div>
                
                <h4 className="text-md font-bold text-gray-700 dark:text-gray-300 pt-4">Exceções Agendadas</h4>
                
                <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-xl text-gray-500">
                    Nenhuma exceção de horário registrada para este profissional.
                </div>
            </div>
        </div>
    );
}
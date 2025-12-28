import React from "react";
import { DollarSign, AlertCircle } from "lucide-react";

export function PatientFinancialPage() {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 shadow-sm text-center">
      <div className="bg-green-100 p-4 rounded-full mb-4">
        <DollarSign size={48} className="text-green-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Módulo Financeiro</h2>
      <p className="text-gray-500 max-w-md">
        Aqui você poderá gerenciar orçamentos, registrar pagamentos, parcelas e gerar recibos para este paciente.
      </p>
      <div className="mt-6 p-4 bg-yellow-50 text-yellow-800 text-sm rounded-lg flex items-center gap-2 border border-yellow-200">
        <AlertCircle size={16} />
        <span>Em desenvolvimento: Controle de Pacotes e Sessões.</span>
      </div>
    </div>
  );
}
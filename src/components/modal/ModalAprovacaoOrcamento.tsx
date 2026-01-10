import { useState } from 'react';
import { X, CheckCircle2, CreditCard } from 'lucide-react';
import { Button } from "../../components/ui/button";

interface ModalAprovarOrcamentoProps {
  budget: {
    id: string;
    total: number;
    items: any[];
  };
  onClose: () => void;
  onConfirm: (paymentData: PaymentData) => void;
  isLoading: boolean;
}

export interface PaymentData {
  method: string;
  installments: number;
  paidNow: boolean;
  notes: string;
}

export default function ModalDeAprovacaoOrcamento({ budget, onClose, onConfirm, isLoading }: ModalAprovarOrcamentoProps) {
  const [method, setMethod] = useState('pix');
  const [installments, setInstallments] = useState(1);
  const [paidNow, setPaidNow] = useState(true);
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    onConfirm({ method, installments, paidNow, notes });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* HEADER */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-emerald-50/50 dark:bg-emerald-900/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <h3 className="font-black text-lg text-gray-900 dark:text-white uppercase tracking-tight">Aprovar Proposta</h3>
              <p className="text-xs font-medium text-emerald-600">Transformar em Venda</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-6 overflow-y-auto">
          
          {/* Valor Total */}
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Valor Final a Receber</p>
            <p className="text-3xl font-black text-gray-900 dark:text-white">
              {budget.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>

          {/* Forma de Pagamento */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
              <CreditCard size={14}/> Forma de Pagamento
            </label>
            <div className="grid grid-cols-2 gap-3">
              {['pix', 'credit_card', 'debit_card', 'cash'].map((m) => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`p-3 rounded-xl text-xs font-bold uppercase tracking-wide border transition-all ${
                    method === m 
                    ? 'bg-gray-900 text-white border-gray-900 shadow-lg' 
                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {m === 'credit_card' ? 'Crédito' : m === 'debit_card' ? 'Débito' : m === 'cash' ? 'Dinheiro' : 'Pix'}
                </button>
              ))}
            </div>
          </div>

          {/* Parcelamento (Só aparece se for crédito) */}
          {method === 'credit_card' && (
            <div className="space-y-3 animate-in slide-in-from-top-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Parcelamento</label>
              <select 
                value={installments}
                onChange={(e) => setInstallments(Number(e.target.value))}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
              >
                {[1,2,3,4,5,6,10,12].map(i => (
                  <option key={i} value={i}>{i}x de {(budget.total / i).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</option>
                ))}
              </select>
            </div>
          )}

          {/* Status do Pagamento */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <input 
              type="checkbox" 
              id="paidNow"
              checked={paidNow}
              onChange={(e) => setPaidNow(e.target.checked)}
              className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
            />
            <label htmlFor="paidNow" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
              Pagamento realizado agora?
            </label>
          </div>

          {/* Notas Opcionais (Agora usando setNotes!) */}
          <div className="space-y-2">
             <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Observações (Opcional)</label>
             <input 
                type="text" 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                placeholder="Ex: Cliente pediu nota fiscal..."
             />
          </div>

        </div>

        {/* FOOTER */}
        <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 flex gap-3">
          <Button onClick={onClose} variant="ghost" className="flex-1 h-12 rounded-xl font-bold uppercase text-xs">
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading}
            className="flex-[2] h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg shadow-emerald-200"
          >
            {isLoading ? 'Processando...' : 'Confirmar Venda'}
          </Button>
        </div>
      </div>
    </div>
  );
}
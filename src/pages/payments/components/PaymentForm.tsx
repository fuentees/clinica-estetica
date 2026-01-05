import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, DollarSign, CreditCard, Landmark, Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { useCreatePayment } from '../../../hooks/usePayment';
import { toast } from 'react-hot-toast';

// --- SCHEMA (Mantido snake_case para compatibilidade com o banco) ---
const paymentSchema = z.object({
  amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  payment_method: z.enum(['credit_card', 'debit_card', 'pix', 'cash']),
  appointment_id: z.string().min(1, 'Consulta é obrigatória'),
  installments: z.number().min(1).max(12).optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

interface PaymentFormProps {
  onClose: () => void;
  appointmentId?: string;
}

export function PaymentForm({ onClose, appointmentId }: PaymentFormProps) {
  const createPayment = useCreatePayment();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: 0,
      payment_method: 'credit_card',
      installments: 1,
      appointment_id: appointmentId || '',
    },
  });

  const paymentMethod = watch('payment_method');

  const onSubmit = async (data: PaymentFormValues) => {
    try {
      // --- CORREÇÃO DO ERRO 2345: MAPEAMENTO PARA O HOOK ---
      await createPayment.mutateAsync({
        amount: data.amount,
        paymentMethod: data.payment_method, // Mapeia payment_method para paymentMethod
        appointmentId: data.appointment_id, // Mapeia appointment_id para appointmentId
        // Se o seu hook aceitar installments, adicione-o aqui também:
        // installments: data.installments 
      });
      
      toast.success('Recebimento registrado com sucesso!');
      onClose();
    } catch (error) {
      console.error('Error creating payment:', error);
      toast.error('Falha ao processar o registro financeiro.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 dark:border-gray-700 animate-in zoom-in-95 duration-300">
        
        <div className="flex justify-between items-center p-8 border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-xl">
              <DollarSign size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">Lançar Pagamento</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fluxo de Caixa Direto</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-gray-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block">Valor do Recebimento (R$)</label>
            <Input
              type="number"
              step="0.01"
              placeholder="0,00"
              className="h-14 pl-4 text-2xl font-black italic tracking-tighter text-emerald-600 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-emerald-500"
              {...register('amount', { valueAsNumber: true })}
            />
            {errors.amount && <p className="text-[10px] text-rose-500 font-bold uppercase mt-1 ml-1">{errors.amount.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block">Forma de Pagamento</label>
            <select
              {...register('payment_method')}
              className="w-full h-12 pl-4 pr-10 bg-gray-50 dark:bg-gray-900 border-0 rounded-xl font-bold text-sm focus:ring-2 focus:ring-pink-500 outline-none appearance-none"
            >
              <option value="credit_card">💳 Cartão de Crédito</option>
              <option value="debit_card">💳 Cartão de Débito</option>
              <option value="pix">💎 PIX</option>
              <option value="cash">💵 Dinheiro (Espécie)</option>
            </select>
          </div>

          {paymentMethod === 'credit_card' && (
            <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block">Número de Parcelas</label>
              <select
                {...register('installments', { valueAsNumber: true })}
                className="w-full h-12 pl-4 pr-10 bg-gray-50 dark:bg-gray-900 border-0 rounded-xl font-bold text-sm focus:ring-2 focus:ring-pink-500 outline-none appearance-none"
              >
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}x</option>
                ))}
              </select>
            </div>
          )}

          {!appointmentId && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block">ID do Atendimento</label>
              <Input
                placeholder="Vincular ao atendimento..."
                className="h-12 bg-gray-50 border-0 rounded-xl font-medium text-xs"
                {...register('appointment_id')}
              />
              {errors.appointment_id && <p className="text-[10px] text-rose-500 font-bold uppercase mt-1 ml-1">{errors.appointment_id.message}</p>}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-14 rounded-2xl font-bold uppercase text-[10px] tracking-widest border-gray-100">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-[2] h-14 bg-gray-900 hover:bg-black text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl transition-all">
              {isSubmitting ? <Loader2 className="animate-spin" /> : <>Confirmar Recebimento</>}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
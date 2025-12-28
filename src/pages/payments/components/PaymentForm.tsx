import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { useCreatePayment } from '../../../hooks/usePayment';
import { toast } from 'react-hot-toast';

const paymentSchema = z.object({
  amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  payment_method: z.enum(['credit_card', 'debit_card', 'pix', 'cash']),
  appointment_id: z.string().min(1, 'Consulta é obrigatória'),
  installments: z.number().min(1).max(12).optional(),
});

interface PaymentFormProps {
  onClose: () => void;
}

export function PaymentForm({ onClose }: PaymentFormProps) {
  const createPayment = useCreatePayment();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      payment_method: 'credit_card',
      installments: 1,
    },
  });

  const paymentMethod = watch('payment_method');

  const onSubmit = async (data: any) => {
    try {
      await createPayment.mutateAsync(data);
      toast.success('Pagamento registrado com sucesso!');
      onClose();
    } catch (error) {
      console.error('Error creating payment:', error);
      toast.error('Erro ao registrar pagamento');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Novo Pagamento</h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Valor</label>
            <Input
              type="number"
              step="0.01"
              {...register('amount', { valueAsNumber: true })}
              error={errors.amount?.message}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Método de Pagamento</label>
            <select
              {...register('payment_method')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            >
              <option value="credit_card">Cartão de Crédito</option>
              <option value="debit_card">Cartão de Débito</option>
              <option value="pix">PIX</option>
              <option value="cash">Dinheiro</option>
            </select>
          </div>

          {paymentMethod === 'credit_card' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Parcelas</label>
              <select
                {...register('installments', { valueAsNumber: true })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              >
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}x
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end space-x-4 mt-6">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
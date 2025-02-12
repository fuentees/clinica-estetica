import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { supabase } from '../../../lib/supabase';
import { toast } from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import type { InventoryItem } from '../../../types/inventory';

const consumptionSchema = z.object({
  inventory_id: z.string(),
  quantity: z.number().min(1, 'Quantidade deve ser maior que 0'),
  appointment_id: z.string().optional(),
  notes: z.string().optional(),
});

interface ConsumptionFormProps {
  item: InventoryItem;
  onClose: () => void;
}

export function ConsumptionForm({ item, onClose }: ConsumptionFormProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(consumptionSchema),
    defaultValues: {
      inventory_id: item.id,
    },
  });

  const onSubmit = async (data: any) => {
    try {
      const { error: consumptionError } = await supabase
        .from('product_consumption')
        .insert({
          ...data,
          quantity: Number(data.quantity),
        });

      if (consumptionError) throw consumptionError;

      const { error: updateError } = await supabase
        .from('inventory')
        .update({ quantity: item.quantity - Number(data.quantity) })
        .eq('id', item.id);

      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Consumo registrado com sucesso!');
      onClose();
    } catch (error) {
      console.error('Error recording consumption:', error);
      toast.error('Erro ao registrar consumo');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Registrar Consumo</h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Produto</label>
            <p className="mt-1 text-gray-900">{item.name}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Quantidade (Disponível: {item.quantity})
            </label>
            <Input
              type="number"
              min="1"
              max={item.quantity}
              {...register('quantity', { valueAsNumber: true })}
              error={errors.quantity?.message}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Observações</label>
            <textarea
              {...register('notes')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Registrar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
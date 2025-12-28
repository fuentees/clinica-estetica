import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { X } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { supabase } from '../../../lib/supabase';
import { toast } from 'react-hot-toast';
import type { InventoryFormData } from '../../../types/inventory';
import { useQueryClient } from '@tanstack/react-query';

const inventorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  quantity: z.number().min(0, 'Quantidade deve ser maior ou igual a 0'),
  minimum_quantity: z.number().min(0, 'Quantidade mínima deve ser maior ou igual a 0'),
  unit_price: z.number().min(0, 'Preço deve ser maior ou igual a 0'),
});

interface InventoryFormProps {
  itemId?: string | null;
  onClose: () => void;
}

export function InventoryForm({ itemId, onClose }: InventoryFormProps) {
  const queryClient = useQueryClient();
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InventoryFormData>({
    resolver: zodResolver(inventorySchema),
  });

  useEffect(() => {
    if (itemId) {
      supabase
        .from('inventory')
        .select('*')
        .eq('id', itemId)
        .single()
        .then(({ data, error }) => {
          if (!error && data) {
            reset(data);
          }
        });
    }
  }, [itemId, reset]);

  const onSubmit = async (data: InventoryFormData) => {
    try {
      if (itemId) {
        const { error } = await supabase
          .from('inventory')
          .update(data)
          .eq('id', itemId);

        if (error) throw error;
        toast.success('Produto atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('inventory')
          .insert(data);

        if (error) throw error;
        toast.success('Produto cadastrado com sucesso!');
      }

      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      onClose();
    } catch (error) {
      console.error('Error saving inventory item:', error);
      toast.error('Erro ao salvar produto');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">
            {itemId ? 'Editar Produto' : 'Novo Produto'}
          </h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nome</label>
            <Input {...register('name')} error={errors.name?.message} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Descrição</label>
            <textarea
              {...register('description')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Quantidade</label>
              <Input
                type="number"
                {...register('quantity', { valueAsNumber: true })}
                error={errors.quantity?.message}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Quantidade Mínima</label>
              <Input
                type="number"
                {...register('minimum_quantity', { valueAsNumber: true })}
                error={errors.minimum_quantity?.message}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Preço Unitário</label>
            <Input
              type="number"
              step="0.01"
              {...register('unit_price', { valueAsNumber: true })}
              error={errors.unit_price?.message}
            />
          </div>

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
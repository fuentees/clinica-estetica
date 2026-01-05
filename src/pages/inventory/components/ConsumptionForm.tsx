import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2, MinusCircle, AlertCircle } from 'lucide-react';
// Ajuste dos caminhos de importação para a nova estrutura de pastas
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { supabase } from '../../../lib/supabase';
import { toast } from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

// Interface do item conforme o banco
interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  clinicId: string;
}

// Schema com nomes consistentes
const consumptionSchema = z.object({
  inventoryId: z.string(),
  quantity: z.number().min(1, 'Quantidade deve ser maior que 0'),
  notes: z.string().optional(),
});

type ConsumptionFormData = z.infer<typeof consumptionSchema>;

interface ConsumptionFormProps {
  item: InventoryItem;
  onClose: () => void;
}

export function ConsumptionForm({ item, onClose }: ConsumptionFormProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ConsumptionFormData>({
    resolver: zodResolver(consumptionSchema),
    defaultValues: {
      inventoryId: item.id,
      quantity: 1,
      notes: '',
    },
  });

  const onSubmit = async (data: ConsumptionFormData) => {
    if (data.quantity > item.quantity) {
      toast.error('Quantidade superior ao estoque disponível!');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Registra o Consumo
      const { error: consumptionError } = await supabase
        .from('product_consumption')
        .insert({
          inventoryId: item.id,
          clinicId: item.clinicId,
          quantity: Number(data.quantity),
          notes: data.notes,
          createdAt: new Date().toISOString(),
        });

      if (consumptionError) throw consumptionError;

      // 2. Atualiza o estoque
      const { error: updateError } = await supabase
        .from('inventory')
        .update({ quantity: item.quantity - Number(data.quantity) })
        .eq('id', item.id);

      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Baixa de estoque realizada!');
      onClose();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Erro ao registrar consumo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 dark:border-gray-700">
        
        <div className="flex justify-between items-center p-6 border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-pink-100 dark:bg-pink-900/30 text-pink-600 rounded-xl">
              <MinusCircle size={20} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Registrar Saída</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/30">
            <label className="block text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">
              Insumo Selecionado
            </label>
            <p className="text-lg font-bold text-blue-900 dark:text-blue-100">{item.name}</p>
            <div className="mt-2 flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
               <span className="font-medium">Estoque atual:</span>
               <span className="bg-white dark:bg-blue-800 px-2 py-0.5 rounded-lg shadow-sm font-bold">{item.quantity} un</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
              Quantidade Utilizada
            </label>
            <Input
              type="number"
              min="1"
              max={item.quantity}
              {...register('quantity', { valueAsNumber: true })}
              className="h-12 text-lg font-bold rounded-xl focus:ring-pink-500 border-gray-200"
            />
            {errors.quantity && (
              <p className="text-red-500 text-xs font-medium flex items-center gap-1">
                <AlertCircle size={12}/> {errors.quantity.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Observações / Motivo</label>
            <textarea
              {...register('notes')}
              placeholder="Ex: Utilizado no procedimento de Maria Silva..."
              className="w-full rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-900 focus:border-pink-500 focus:ring-pink-500 transition-all p-3 text-sm min-h-[100px] resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="flex-1 h-12 rounded-xl text-gray-500"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="flex-1 h-12 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold shadow-lg shadow-pink-100 dark:shadow-none transition-transform hover:scale-[1.02]"
            >
              {isSubmitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
              Confirmar Baixa
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
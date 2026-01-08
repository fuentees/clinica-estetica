import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2, MinusCircle, AlertCircle } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { supabase } from '../../../lib/supabase';
import { toast } from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  clinic_id: string;
}

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
      // 1. Registra o Log de Consumo
      const { error: consumptionError } = await supabase
        .from('product_consumption')
        .insert({
          inventoryId: item.id,
          clinic_id: item.clinicId,
          quantity: Number(data.quantity),
          notes: data.notes,
          createdAt: new Date().toISOString(),
        });

      if (consumptionError) throw consumptionError;

      // 2. Atualiza o estoque mestre (Com trava de segurança clinicId)
      const { error: updateError } = await supabase
        .from('inventory')
        .update({ quantity: item.quantity - Number(data.quantity) })
        .eq('id', item.id)
        .eq('clinic_id', item.clinicId);

      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Baixa de estoque realizada com sucesso!');
      onClose();
    } catch (error: any) {
      console.error('Erro ao registrar baixa:', error);
      toast.error('Erro ao processar a saída do material.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 dark:border-gray-700">
        
        <div className="flex justify-between items-center p-6 border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-pink-100 dark:bg-pink-900/30 text-pink-600 rounded-xl">
              <MinusCircle size={20} />
            </div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">Registrar Saída</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
          <div className="p-5 bg-blue-50 dark:bg-blue-900/20 rounded-[1.5rem] border border-blue-100 dark:border-blue-800/30">
            <label className="block text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">
              Insumo Selecionado
            </label>
            <p className="text-lg font-black text-blue-900 dark:text-blue-100 uppercase italic tracking-tighter">{item.name}</p>
            <div className="mt-2 flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300 font-bold uppercase tracking-widest">
               <span>Disponível:</span>
               <span className="bg-white dark:bg-blue-800 px-2 py-0.5 rounded-lg shadow-sm">{item.quantity} un</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest ml-1">
              Quantidade Utilizada
            </label>
            <Input
              type="number"
              min="1"
              max={item.quantity}
              {...register('quantity', { valueAsNumber: true })}
              className="h-14 text-2xl font-black rounded-2xl focus:ring-pink-500 border-gray-100 bg-gray-50/50 dark:bg-gray-900 italic"
            />
            {errors.quantity && (
              <p className="text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                <AlertCircle size={12}/> {errors.quantity.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest ml-1">Justificativa / Procedimento</label>
            <textarea
              {...register('notes')}
              placeholder="Descreva o uso deste material..."
              className="w-full rounded-2xl border-gray-100 dark:border-gray-700 dark:bg-gray-900 focus:border-pink-500 focus:ring-pink-500 transition-all p-4 text-sm font-medium min-h-[100px] resize-none shadow-inner"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={onClose}
              className="flex-1 h-14 rounded-2xl text-gray-400 font-black uppercase text-[10px] tracking-widest"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="flex-1 h-14 rounded-2xl bg-gray-900 hover:bg-black text-white font-black uppercase text-[10px] tracking-[0.2em] shadow-xl transition-all hover:scale-105 active:scale-95"
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
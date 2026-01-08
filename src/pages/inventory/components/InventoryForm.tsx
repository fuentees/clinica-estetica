import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { X, Save, Loader2, Package } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { supabase } from '../../../lib/supabase';
import { toast } from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../contexts/AuthContext';

const inventorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  quantity: z.number().min(0, 'Quantidade deve ser maior ou igual a 0'),
  minimum_quantity: z.number().min(0, 'Mínimo deve ser maior ou igual a 0'),
  unit_price: z.number().min(0, 'Preço deve ser maior ou igual a 0'),
});

type InventoryFormData = z.infer<typeof inventorySchema>;

interface InventoryFormProps {
  itemId?: string | null;
  onClose: () => void;
}

export function InventoryForm({ itemId, onClose }: InventoryFormProps) {
  const queryClient = useQueryClient();
  const { profile } = useAuth(); // Pega a clínica do usuário logado
  const [loadingData, setLoadingData] = useState(false);
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InventoryFormData>({
    resolver: zodResolver(inventorySchema),
    defaultValues: {
      quantity: 0,
      minimum_quantity: 5,
      unit_price: 0
    }
  });

  // Carregar dados se for edição
  useEffect(() => {
    if (itemId && profile?.clinic_id) {
      setLoadingData(true);
      supabase
        .from('inventory')
        .select('*')
        .eq('id', itemId)
        .eq('clinic_id', profile.clinic_id) // Segurança SaaS
        .single()
        .then(({ data, error }) => {
          if (!error && data) {
            reset({
              name: data.name,
              description: data.description || '',
              quantity: data.quantity,
              minimum_quantity: data.minimum_quantity,
              unit_price: data.unit_price,
            });
          }
          setLoadingData(false);
        });
    }
  }, [itemId, reset, profile?.clinic_id]);

  const onSubmit = async (data: InventoryFormData) => {
    if (!profile?.clinic_id) {
      toast.error('Clínica não identificada');
      return;
    }

    try {
      const payload = {
        ...data,
        clinic_id: profile.clinic_id // Vincula obrigatoriamente à clínica
      };

      if (itemId) {
        const { error } = await supabase
          .from('inventory')
          .update(payload)
          .eq('id', itemId)
          .eq('clinic_id', profile.clinic_id); // Segurança extra

        if (error) throw error;
        toast.success('Estoque atualizado!');
      } else {
        const { error } = await supabase
          .from('inventory')
          .insert(payload);

        if (error) throw error;
        toast.success('Produto cadastrado com sucesso!');
      }

      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      onClose();
    } catch (error: any) {
      console.error('Error saving inventory:', error);
      toast.error('Erro ao salvar produto');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 dark:border-gray-700">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-50 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-pink-50 dark:bg-pink-900/30 text-pink-600 rounded-xl">
               <Package size={20} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {itemId ? 'Editar Insumo' : 'Novo Insumo'}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loadingData ? (
          <div className="p-20 flex justify-center">
            <Loader2 className="animate-spin text-pink-600" size={32} />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-5">
            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Nome do Produto</label>
              <Input 
                {...register('name')} 
                placeholder="Ex: Botox 100u"
                className="rounded-xl focus:ring-pink-500" 
              />
              {errors.name && <p className="text-red-500 text-[10px] font-bold uppercase">{errors.name.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Descrição</label>
              <textarea
                {...register('description')}
                placeholder="Marca, lote ou fornecedor..."
                className="w-full rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-900 focus:border-pink-500 focus:ring-pink-500 transition-all p-3 text-sm min-h-[80px] resize-none"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Qtd. Atual</label>
                <Input
                  type="number"
                  {...register('quantity', { valueAsNumber: true })}
                  className="rounded-xl focus:ring-pink-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Mínimo</label>
                <Input
                  type="number"
                  {...register('minimum_quantity', { valueAsNumber: true })}
                  className="rounded-xl focus:ring-pink-500 border-orange-100 bg-orange-50/20"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Preço Unitário (Custo)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
                <Input
                  type="number"
                  step="0.01"
                  {...register('unit_price', { valueAsNumber: true })}
                  className="pl-10 rounded-xl focus:ring-pink-500 border-green-100 bg-green-50/20 font-bold"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="flex-1 h-12 rounded-xl"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="flex-1 h-12 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold shadow-lg shadow-pink-100"
              >
                {isSubmitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save size={18} className="mr-2" />}
                {itemId ? 'Salvar' : 'Cadastrar'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
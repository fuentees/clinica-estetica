import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { toast } from 'react-hot-toast';
import { Loader2, ArrowLeft } from 'lucide-react';

// Schema de Validação
const treatmentSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 letras"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "O preço não pode ser negativo"),
  duration_minutes: z.coerce.number().min(5, "A duração mínima é 5 minutos"),
});

type TreatmentFormData = z.infer<typeof treatmentSchema>;

export function TreatmentFormPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<TreatmentFormData>({
    resolver: zodResolver(treatmentSchema),
    defaultValues: {
      price: 0,
      duration_minutes: 30
    }
  });

  const onSubmit = async (data: TreatmentFormData) => {
    setIsSubmitting(true);
    try {
      // Converte minutos para formato que o banco entende (interval)
      const durationInterval = `${data.duration_minutes} minutes`;

      const { error } = await supabase
        .from('treatments')
        .insert({
          name: data.name,
          description: data.description,
          price: data.price,
          duration: durationInterval,
        });

      if (error) throw error;

      toast.success('Serviço cadastrado com sucesso!');
      navigate('/treatments');

    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate('/treatments')}>
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Novo Serviço</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        
        {/* Nome */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome do Procedimento</label>
          <Input 
            {...register('name')} 
            placeholder="Ex: Limpeza de Pele Profunda" 
            error={errors.name?.message}
          />
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição (Opcional)</label>
          <textarea 
            {...register('description')}
            className="w-full rounded-md border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            rows={3}
            placeholder="Detalhes sobre o procedimento..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Preço */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preço (R$)</label>
            <Input 
              type="number" 
              step="0.01"
              {...register('price')} 
              error={errors.price?.message}
            />
          </div>

          {/* Duração */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duração (Minutos)</label>
            <Input 
              type="number" 
              {...register('duration_minutes')} 
              error={errors.duration_minutes?.message}
            />
            <p className="text-xs text-gray-500 mt-1">Ex: 60 para 1 hora</p>
          </div>
        </div>

        {/* Botões */}
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSubmitting} className="bg-pink-600 hover:bg-pink-700 text-white w-full md:w-auto">
            {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : null}
            Salvar Serviço
          </Button>
        </div>

      </form>
    </div>
  );
}
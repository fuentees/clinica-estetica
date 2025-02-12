import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { supabase } from '../../../lib/supabase';
import { toast } from 'react-hot-toast';

const progressSchema = z.object({
  treatment_id: z.string(),
  progress_notes: z.string().min(1, 'Observações são obrigatórias'),
  measurements: z.string().optional(),
  side_effects: z.string().optional(),
  recommendations: z.string().optional(),
  next_session_notes: z.string().optional(),
});

interface ProgressFormProps {
  treatmentId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ProgressForm({ treatmentId, onClose, onSuccess }: ProgressFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(progressSchema),
    defaultValues: {
      treatment_id: treatmentId,
    },
  });

  const onSubmit = async (data: any) => {
    try {
      const { error } = await supabase
        .from('treatment_progress')
        .insert({
          ...data,
          recorded_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success('Progresso registrado com sucesso!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error recording progress:', error);
      toast.error('Erro ao registrar progresso');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Registrar Evolução do Tratamento</h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Observações do Progresso
            </label>
            <textarea
              {...register('progress_notes')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              rows={4}
              placeholder="Descreva a evolução observada..."
            />
            {errors.progress_notes && (
              <p className="mt-1 text-sm text-red-600">{errors.progress_notes.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Medições (se aplicável)
            </label>
            <Input
              {...register('measurements')}
              placeholder="Ex: Circunferência, volume, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Efeitos Colaterais
            </label>
            <textarea
              {...register('side_effects')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              rows={2}
              placeholder="Registre quaisquer efeitos colaterais observados..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Recomendações
            </label>
            <textarea
              {...register('recommendations')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              rows={2}
              placeholder="Instruções e cuidados para o paciente..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Observações para Próxima Sessão
            </label>
            <textarea
              {...register('next_session_notes')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              rows={2}
              placeholder="Notas para a próxima sessão..."
            />
          </div>

          <div className="flex justify-end space-x-4">
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
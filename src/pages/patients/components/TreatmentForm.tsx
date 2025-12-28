import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { supabase } from '../../../lib/supabase';
import { toast } from 'react-hot-toast';
import { ConsentForm } from './ConsentForm';

const treatmentFormSchema = z.object({
  patient_id: z.string(),
  treatment_id: z.string(),
  professional_notes: z.string().optional(),
  skin_type: z.string(),
  current_medications: z.string().optional(),
  treatment_area: z.string(),
  treatment_plan: z.string(),
  observations: z.string().optional(),
});

type TreatmentFormData = z.infer<typeof treatmentFormSchema>;

interface TreatmentFormProps {
  patientId: string;
  treatmentId: string;
  onClose: () => void;
}

export function TreatmentForm({ patientId, treatmentId, onClose }: TreatmentFormProps) {
  const [showConsentForm, setShowConsentForm] = useState(false);
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<TreatmentFormData>({
    resolver: zodResolver(treatmentFormSchema),
    defaultValues: {
      patient_id: patientId,
      treatment_id: treatmentId,
    },
  });

  const onSubmit = async (data: TreatmentFormData) => {
    try {
      const { error } = await supabase
        .from('treatment_forms')
        .insert(data);

      if (error) throw error;

      setShowConsentForm(true);
    } catch (error) {
      console.error('Error saving treatment form:', error);
      toast.error('Erro ao salvar ficha de tratamento');
    }
  };

  if (showConsentForm) {
    return (
      <ConsentForm
        patientId={patientId}
        treatmentId={treatmentId}
        onClose={onClose}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Ficha de Tratamento</h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Tipo de Pele
            </label>
            <select
              {...register('skin_type')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            >
              <option value="">Selecione...</option>
              <option value="normal">Normal</option>
              <option value="dry">Seca</option>
              <option value="oily">Oleosa</option>
              <option value="combination">Mista</option>
              <option value="sensitive">Sensível</option>
            </select>
            {errors.skin_type && (
              <p className="mt-1 text-sm text-red-600">{errors.skin_type.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Medicamentos em Uso
            </label>
            <Input {...register('current_medications')} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Área do Tratamento
            </label>
            <Input {...register('treatment_area')} error={errors.treatment_area?.message} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Plano de Tratamento
            </label>
            <textarea
              {...register('treatment_plan')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              rows={4}
            />
            {errors.treatment_plan && (
              <p className="mt-1 text-sm text-red-600">{errors.treatment_plan.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Observações do Profissional
            </label>
            <textarea
              {...register('professional_notes')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Próximo'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
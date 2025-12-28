import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../../components/ui/button';
import { supabase } from '../../../lib/supabase';
import { toast } from 'react-hot-toast';
import SignaturePad from 'react-signature-canvas';

const consentFormSchema = z.object({
  patient_id: z.string(),
  treatment_id: z.string(),
  consent_text: z.string(),
  signature: z.string().min(1, 'Assinatura é obrigatória'),
  signed_at: z.date(),
});

type ConsentFormData = z.infer<typeof consentFormSchema>;

interface ConsentFormProps {
  patientId: string;
  treatmentId: string;
  onClose: () => void;
}

export function ConsentForm({ patientId, treatmentId, onClose }: ConsentFormProps) {
  const [signaturePad, setSignaturePad] = useState<SignaturePad | null>(null);
  
  const { handleSubmit, formState: { errors, isSubmitting } } = useForm<ConsentFormData>({
    resolver: zodResolver(consentFormSchema),
    defaultValues: {
      patient_id: patientId,
      treatment_id: treatmentId,
      signed_at: new Date(),
    },
  });

  const onSubmit = async (data: ConsentFormData) => {
    try {
      if (!signaturePad) return;

      const signatureData = signaturePad.toDataURL();
      
      const { error } = await supabase
        .from('consent_forms')
        .insert({
          ...data,
          signature: signatureData,
        });

      if (error) throw error;

      toast.success('Termo de consentimento assinado com sucesso!');
      onClose();
    } catch (error) {
      console.error('Error saving consent form:', error);
      toast.error('Erro ao salvar termo de consentimento');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Termo de Consentimento</h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="prose max-w-none">
            <h3>Termo de Consentimento para Procedimento Estético</h3>
            
            <p>Eu, abaixo assinado, autorizo a realização do procedimento estético conforme explicado 
            e descrito durante a consulta. Declaro que:</p>
            
            <ol>
              <li>Fui informado(a) sobre os benefícios, riscos e possíveis complicações do procedimento</li>
              <li>Tive a oportunidade de fazer perguntas e todas foram respondidas satisfatoriamente</li>
              <li>Entendo que os resultados podem variar de pessoa para pessoa</li>
              <li>Comprometo-me a seguir todas as orientações pré e pós-procedimento</li>
            </ol>
          </div>

          <div className="border rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assinatura Digital
            </label>
            <div className="border rounded-lg bg-white">
              <SignaturePad
                ref={(ref) => setSignaturePad(ref)}
                canvasProps={{
                  className: 'w-full h-40',
                }}
              />
            </div>
            {errors.signature && (
              <p className="mt-1 text-sm text-red-600">{errors.signature.message}</p>
            )}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="mt-2"
              onClick={() => signaturePad?.clear()}
            >
              Limpar
            </Button>
          </div>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Assinar e Confirmar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
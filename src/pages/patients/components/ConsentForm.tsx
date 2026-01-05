import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Eraser, ShieldCheck, Loader2 } from 'lucide-react'; // Ajustado de lucide-center para lucide-react
import { Button } from '../../../components/ui/button';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import SignaturePad from 'react-signature-canvas';

const consentFormSchema = z.object({
  patient_id: z.string(),
  treatment_id: z.string(),
  consent_text: z.string(),
  signature: z.string().min(1, 'A assinatura é obrigatória'),
});

type ConsentFormData = z.infer<typeof consentFormSchema>;

interface ConsentFormProps {
  patientId: string;
  treatmentId: string;
  onClose: () => void;
}

export function ConsentForm({ patientId, treatmentId, onClose }: ConsentFormProps) {
  const { profile } = useAuth();
  const sigPad = useRef<SignaturePad | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { handleSubmit, setValue, formState: { errors } } = useForm<ConsentFormData>({
    resolver: zodResolver(consentFormSchema),
    defaultValues: {
      patient_id: patientId,
      treatment_id: treatmentId,
      consent_text: `Eu, abaixo assinado, autorizo a realização do procedimento estético conforme explicado e descrito durante a consulta. Declaro que: 1. Fui informado(a) sobre os benefícios, riscos e possíveis complicações. 2. Tive a oportunidade de fazer perguntas. 3. Entendo que os resultados podem variar. 4. Comprometo-me a seguir as orientações pré e pós-procedimento.`,
    },
  });

  const onSubmit = async (data: ConsentFormData) => {
    if (!sigPad.current || sigPad.current.isEmpty()) {
      toast.error('Por favor, o paciente deve assinar no campo indicado.');
      return;
    }

    if (!profile?.clinicId) {
      toast.error('Clínica não identificada.');
      return;
    }

    setIsSaving(true);
    try {
      const signatureData = sigPad.current.getTrimmedCanvas().toDataURL('image/png');
      
      const { error } = await supabase
        .from('consent_forms')
        .insert({
          patientId: data.patient_id,
          treatmentId: data.treatment_id,
          clinicId: profile.clinicId,
          consentText: data.consent_text,
          signature: signatureData,
          signedAt: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success('Termo assinado e arquivado com sucesso!');
      onClose();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Erro ao salvar termo de consentimento.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-100 dark:border-gray-700">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-xl">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-none">Termo de Consentimento</h2>
              <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-semibold">Validação Jurídica Digital</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
          {/* Corpo do Termo */}
          <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 max-h-60 overflow-y-auto custom-scrollbar leading-relaxed text-gray-700 dark:text-gray-300 italic text-sm">
            <h3 className="font-bold text-gray-900 dark:text-white not-italic mb-4 text-base">Autorização para Procedimento Estético</h3>
            <p>Eu, abaixo assinado, autorizo voluntariamente a realização do procedimento estético proposto, declarando que:</p>
            <ul className="list-disc pl-5 mt-4 space-y-2">
              <li>Fui amplamente informado(a) sobre a natureza do tratamento, seus benefícios esperados, riscos inerentes e possíveis complicações.</li>
              <li>Tive a oportunidade de sanar todas as minhas dúvidas durante a consulta de avaliação.</li>
              <li>Compreendo que a medicina estética não é uma ciência exata e que os resultados biológicos podem variar individualmente.</li>
              <li>Declaro não ter omitido informações sobre meu histórico de saúde, alergias ou uso de medicamentos.</li>
              <li>Comprometo-me a seguir rigorosamente as orientações de pós-procedimento fornecidas pelo profissional.</li>
            </ul>
          </div>

          {/* Área de Assinatura */}
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                Assinatura do Paciente (na tela)
              </label>
              <button
                type="button"
                onClick={() => sigPad.current?.clear()}
                className="text-[10px] font-bold text-pink-600 hover:text-pink-700 flex items-center gap-1 uppercase transition-colors"
              >
                <Eraser size={12} /> Limpar campo
              </button>
            </div>
            
            <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-900 p-2 overflow-hidden h-44 shadow-inner">
              <SignaturePad
                ref={(ref) => { sigPad.current = ref; }}
                canvasProps={{
                  className: 'w-full h-full cursor-crosshair',
                }}
                onEnd={() => setValue('signature', 'signed')}
              />
            </div>
            {errors.signature && (
              <p className="text-red-500 text-[10px] font-bold uppercase ml-2 italic tracking-tighter">
                {errors.signature.message}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-12 rounded-xl">
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSaving}
              className="flex-[2] h-12 rounded-xl bg-gray-900 hover:bg-black text-white font-bold shadow-lg transition-all hover:scale-[1.02] active:scale-95"
            >
              {isSaving ? (
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
              ) : (
                <ShieldCheck className="mr-2 h-4 w-4 text-emerald-400" />
              )}
              {isSaving ? 'Processando...' : 'Finalizar e Assinar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
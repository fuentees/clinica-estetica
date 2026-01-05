import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { supabase } from '../../../lib/supabase';
import { toast } from 'react-hot-toast';
import { ConsentForm } from './ConsentForm';
import { useAuth } from '../../../contexts/AuthContext';
import { X, ClipboardEdit, Sparkles, Pill, MapPin, Loader2, ArrowRight } from 'lucide-react';

const treatmentFormSchema = z.object({
  patient_id: z.string(),
  treatment_id: z.string(),
  professional_notes: z.string().optional(),
  skin_type: z.string().min(1, 'Selecione o biotipo cutâneo'),
  current_medications: z.string().optional(),
  treatment_area: z.string().min(1, 'Informe a área de aplicação'),
  treatment_plan: z.string().min(1, 'Descreva o plano de tratamento'),
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
  const { profile } = useAuth();
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<TreatmentFormData>({
    resolver: zodResolver(treatmentFormSchema),
    defaultValues: {
      patient_id: patientId,
      treatment_id: treatmentId,
    },
  });

  const onSubmit = async (data: TreatmentFormData) => {
    if (!profile?.clinicId) {
      toast.error('Clínica não identificada');
      return;
    }

    try {
      const { error } = await supabase
        .from('treatment_forms')
        .insert({
          ...data,
          clinicId: profile.clinicId,
          professionalId: profile.id,
          createdAt: new Date().toISOString()
        });

      if (error) throw error;

      toast.success('Ficha técnica registrada!');
      setShowConsentForm(true);
    } catch (error: any) {
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-100 dark:border-gray-700">
        
        {/* Header */}
        <div className="flex justify-between items-center p-8 border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-pink-100 dark:bg-pink-900/30 text-pink-600 rounded-2xl">
              <ClipboardEdit size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">Ficha de Procedimento</h2>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Detalhamento Técnico da Sessão</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-400">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tipo de Pele */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Sparkles size={14} className="text-pink-500"/> Biotipo Cutâneo
              </label>
              <select
                {...register('skin_type')}
                className="w-full h-12 px-4 rounded-xl border-2 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:border-pink-500 outline-none transition-all text-sm font-bold"
              >
                <option value="">Selecione...</option>
                <option value="normal">Pele Normal</option>
                <option value="dry">Pele Seca</option>
                <option value="oily">Pele Oleosa</option>
                <option value="combination">Pele Mista</option>
                <option value="sensitive">Pele Sensível / Reativa</option>
              </select>
              {errors.skin_type && (
                <p className="text-red-500 text-[10px] font-bold uppercase px-2">{errors.skin_type.message}</p>
              )}
            </div>

            {/* Área */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <MapPin size={14} className="text-pink-500"/> Área da Aplicação
              </label>
              <Input 
                {...register('treatment_area')} 
                placeholder="Ex: Terço Superior / Glúteos"
                className="h-12 rounded-xl border-2 bg-gray-50 font-bold" 
              />
              {errors.treatment_area && (
                <p className="text-red-500 text-[10px] font-bold uppercase px-2">{errors.treatment_area.message}</p>
              )}
            </div>
          </div>

          {/* Medicamentos */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Pill size={14} className="text-pink-500"/> Medicamentos Recentes / Em uso
            </label>
            <Input 
              {...register('current_medications')} 
              placeholder="Aspirina, Roacutan, Anticoagulantes..."
              className="h-12 rounded-xl border-2 bg-gray-50"
            />
          </div>

          {/* Plano de Tratamento */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Plano de Tratamento & Parâmetros</label>
            <textarea
              {...register('treatment_plan')}
              className="w-full p-4 rounded-2xl border-2 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:border-pink-500 outline-none transition-all text-sm min-h-[120px] resize-none font-medium"
              placeholder="Ex: Toxina Botulínica 50U, técnica de retroinjeção, profundidade 4mm..."
            />
            {errors.treatment_plan && (
              <p className="text-red-500 text-[10px] font-bold uppercase px-2">{errors.treatment_plan.message}</p>
            )}
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Notas Clínicas Adicionais</label>
            <textarea
              {...register('professional_notes')}
              className="w-full p-4 rounded-2xl border-2 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:border-pink-500 outline-none transition-all text-sm min-h-[80px] resize-none font-medium"
              placeholder="Reações imediatas, edema, eritema ou orientações específicas passadas..."
            />
          </div>

          {/* Ações */}
          <div className="flex gap-4 pt-4 border-t border-gray-50 dark:border-gray-700">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-14 rounded-2xl font-bold">
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="flex-[2] h-14 rounded-2xl bg-gray-900 hover:bg-black text-white font-black uppercase tracking-widest shadow-xl transition-all hover:scale-[1.02]"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin mr-2" />
              ) : (
                <>Próximo: Termo de Assinatura <ArrowRight size={18} className="ml-2 text-pink-500" /></>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2, Save, ClipboardList } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { supabase } from '../../../lib/supabase';
import { toast } from 'react-hot-toast';

// --- SCHEMA DE VALIDAÇÃO ---
const progressSchema = z.object({
  treatment_id: z.string(),
  progress_notes: z.string().min(1, 'Observações são obrigatórias para o prontuário'),
  measurements: z.string().optional(),
  side_effects: z.string().optional(),
  recommendations: z.string().optional(),
  next_session_notes: z.string().optional(),
});

type ProgressFormData = z.infer<typeof progressSchema>;

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
  } = useForm<ProgressFormData>({
    resolver: zodResolver(progressSchema),
    defaultValues: {
      treatment_id: treatmentId,
    },
  });

  const onSubmit = async (data: ProgressFormData) => {
    try {
      const { error } = await supabase
        .from('treatment_progress')
        .insert({
          ...data,
          recorded_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success('Evolução registrada com sucesso!');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error recording progress:', error);
      toast.error('Erro ao registrar evolução clínica');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-100 dark:border-gray-700 animate-in zoom-in-95 duration-300">
        
        {/* HEADER DO MODAL */}
        <div className="flex justify-between items-center p-8 border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-xl text-pink-600">
              <ClipboardList size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-tighter italic">Registrar Evolução</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Acompanhamento técnico do paciente</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-rose-50 hover:text-rose-500 rounded-xl transition-all text-gray-400"
          >
            <X size={20} />
          </button>
        </div>

        {/* FORMULÁRIO */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
              Observações Clínicas do Progresso *
            </label>
            <textarea
              {...register('progress_notes')}
              className="w-full p-4 rounded-2xl border-0 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-pink-500 outline-none transition-all shadow-inner font-medium text-sm min-h-[120px] resize-none"
              placeholder="Descreva detalhadamente a evolução observada nesta sessão..."
            />
            {errors.progress_notes && (
              <p className="text-[10px] font-bold text-rose-500 uppercase ml-1">{errors.progress_notes.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                Medições & Bioimpedância
              </label>
              <Input
                {...register('measurements')}
                className="h-12 rounded-xl bg-gray-50 dark:bg-gray-900 border-0 focus:ring-2 focus:ring-pink-500 font-bold"
                placeholder="Ex: Peso, Medidas, Dobras..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                Efeitos Colaterais / Intercorrências
              </label>
              <Input
                {...register('side_effects')}
                className="h-12 rounded-xl bg-gray-50 dark:bg-gray-900 border-0 focus:ring-2 focus:ring-pink-500 font-bold text-rose-600"
                placeholder="Ex: Vermelhidão, Edema..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
              Recomendações Pós-Procedimento (Home Care)
            </label>
            <textarea
              {...register('recommendations')}
              className="w-full p-4 rounded-2xl border-0 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-pink-500 outline-none transition-all shadow-inner font-medium text-sm h-24 resize-none"
              placeholder="Instruções e cuidados que o paciente deve seguir em casa..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
              Planejamento para Próxima Sessão
            </label>
            <textarea
              {...register('next_session_notes')}
              className="w-full p-4 rounded-2xl border-0 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-pink-500 outline-none transition-all shadow-inner font-medium text-sm h-24 resize-none"
              placeholder="Notas e materiais necessários para o próximo encontro..."
            />
          </div>

          {/* AÇÕES */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-50 dark:border-gray-700">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="h-12 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest border-gray-200"
            >
              Descartar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="h-12 px-8 bg-gray-900 hover:bg-black text-white rounded-xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save size={16} className="text-pink-500" />
              )}
              {isSubmitting ? 'Salvando...' : 'Salvar Evolução'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/button';
// Removido Input importado errado, usando HTML nativo estilizado abaixo
import { toast } from 'react-hot-toast';
import { Loader2, ArrowLeft, Sparkles, Clock, DollarSign, FileText, Tag } from 'lucide-react';

// --- SCHEMA DE VALIDAÇÃO ---
const treatmentSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 letras"),
  category: z.string().min(1, "A categoria é obrigatória"),
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
      duration_minutes: 30,
      category: "Facial"
    }
  });

  const onSubmit = async (data: TreatmentFormData) => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: profile } = await supabase
        .from('profiles')
        .select('clinic_id:clinic_id')
        .eq('id', user.id)
        .single();

      if (!profile?.clinic_id) throw new Error("Clínica não identificada");

      const { error } = await supabase
        .from('services') 
        .insert({
          clinic_id: profile.clinic_id,
          name: data.name,
          category: data.category,
          description: data.description,
          price: data.price,
          duration: data.duration_minutes,
          is_active: true
        });

      if (error) throw error;

      toast.success('Procedimento catalogado com sucesso!');
      navigate('/services');

    } catch (error: any) {
      console.error('Erro ao salvar serviço:', error);
      toast.error('Erro ao salvar: ' + (error.message || 'Falha na conexão'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto animate-in fade-in duration-700">
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/services')}
          className="h-12 w-12 rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 p-0 hover:bg-gray-50"
        >
          <ArrowLeft size={22} className="text-gray-600 dark:text-gray-300" />
        </Button>
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic flex items-center gap-3">
            Novo <span className="text-pink-600">Serviço</span>
            <Sparkles size={20} className="text-pink-400 animate-pulse" />
          </h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Configuração de Protocolo e Precificação</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-600 to-purple-600"></div>
        
        {/* Linha 1: Nome e Categoria */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Sparkles size={14} className="text-pink-500" /> Nome do Procedimento
                </label>
                <input 
                    {...register('name')} 
                    className="w-full h-12 px-4 rounded-xl bg-gray-50 dark:bg-gray-900 border-0 outline-none focus:ring-2 focus:ring-pink-500 font-bold text-gray-900 dark:text-white"
                    placeholder="Ex: Botox Full Face" 
                />
                {errors.name && <p className="text-rose-500 text-[10px] font-bold uppercase ml-1">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Tag size={14} className="text-purple-500" /> Categoria
                </label>
                <select 
                    {...register('category')}
                    className="w-full h-12 px-4 rounded-xl bg-gray-50 dark:bg-gray-900 border-0 focus:ring-2 focus:ring-pink-500 font-bold outline-none text-sm text-gray-900 dark:text-white"
                >
                    <option value="Facial">Facial</option>
                    <option value="Corporal">Corporal</option>
                    <option value="Toxina">Toxina</option>
                    <option value="Preenchedor">Preenchedor</option>
                    <option value="Bioestimulador">Bioestimulador</option>
                    <option value="Tecnologia">Tecnologia</option>
                    <option value="Capilar">Capilar</option>
                    <option value="Outros">Outros</option>
                </select>
                {errors.category && <p className="text-rose-500 text-[10px] font-bold uppercase ml-1">{errors.category.message}</p>}
            </div>
        </div>

        {/* Descrição */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
            <FileText size={14} /> Detalhamento do Serviço
          </label>
          <textarea 
            {...register('description')}
            className="w-full rounded-2xl border-0 bg-gray-50 dark:bg-gray-900 p-4 text-sm font-medium focus:ring-2 focus:ring-pink-500 outline-none min-h-[100px] resize-none shadow-inner text-gray-900 dark:text-white"
            placeholder="Descreva o que está incluso, técnica utilizada ou benefícios..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Preço */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
              <DollarSign size={14} className="text-emerald-500" /> Valor de Venda (R$)
            </label>
            <input 
              type="number" 
              step="0.01"
              {...register('price')} 
              className="w-full h-12 px-4 rounded-xl bg-gray-50 dark:bg-gray-900 border-0 focus:ring-2 focus:ring-pink-500 font-black italic text-emerald-600 outline-none"
            />
            {errors.price && <p className="text-rose-500 text-[10px] font-bold uppercase ml-1">{errors.price.message}</p>}
          </div>

          {/* Duração */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
              <Clock size={14} className="text-blue-500" /> Tempo em Cabine (Min)
            </label>
            <input 
              type="number" 
              {...register('duration_minutes')} 
              className="w-full h-12 px-4 rounded-xl bg-gray-50 dark:bg-gray-900 border-0 focus:ring-2 focus:ring-pink-500 font-black italic text-blue-600 outline-none"
            />
            {errors.duration_minutes && <p className="text-rose-500 text-[10px] font-bold uppercase ml-1">{errors.duration_minutes.message}</p>}
          </div>
        </div>

        {/* Botão de Ação */}
        <div className="pt-6 border-t border-gray-50 dark:border-gray-700">
          <Button 
            type="submit" 
            disabled={isSubmitting} 
            className="h-14 bg-gray-900 hover:bg-black text-white w-full rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin text-pink-500" size={20} />
            ) : (
              <Sparkles size={18} className="text-pink-500" />
            )}
            {isSubmitting ? 'Registrando...' : 'Concluir Cadastro'}
          </Button>
        </div>

      </form>
    </div>
  );
}
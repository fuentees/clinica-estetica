import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Save, Loader2, Truck, Phone, Mail, User } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { supabase } from '../../../lib/supabase';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

const supplierSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(1, 'Telefone é obrigatório'),
  contact_person: z.string().optional(),
  notes: z.string().optional(),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

interface SupplierFormProps {
  onClose: () => void;
}

export function SupplierForm({ onClose }: SupplierFormProps) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
  });

  const onSubmit = async (data: SupplierFormData) => {
    if (!profile?.clinic_id) {
      toast.error('Clínica não identificada');
      return;
    }

    try {
      // Inserção com vínculo obrigatório à clínica
      const { error } = await supabase.from('suppliers').insert({
        ...data,
        clinic_id: profile.clinic_id
      });

      if (error) throw error;
      
      toast.success('Fornecedor cadastrado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      onClose();
    } catch (error: any) {
      console.error('Error saving supplier:', error);
      toast.error('Erro ao cadastrar fornecedor');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 dark:border-gray-700">
        
        {/* Cabeçalho */}
        <div className="flex justify-between items-center p-6 border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl">
              <Truck size={20} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Novo Fornecedor</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-5">
          {/* Nome */}
          <div className="space-y-1">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
               Empresa
            </label>
            <Input 
              {...register('name')} 
              placeholder="Ex: Distribuidora Med Estética"
              className="rounded-xl h-11 focus:ring-pink-500 transition-all"
            />
            {errors.name && <p className="text-red-500 text-[10px] font-bold uppercase">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email */}
            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                 <Mail size={14} className="text-pink-500"/> Email
              </label>
              <Input 
                {...register('email')} 
                placeholder="vendas@fornecedor.com"
                className="rounded-xl h-11 focus:ring-pink-500" 
              />
              {errors.email && <p className="text-red-500 text-[10px] font-bold uppercase">{errors.email.message}</p>}
            </div>

            {/* Telefone */}
            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                 <Phone size={14} className="text-pink-500"/> Telefone
              </label>
              <Input 
                {...register('phone')} 
                placeholder="(00) 00000-0000"
                className="rounded-xl h-11 focus:ring-pink-500" 
              />
              {errors.phone && <p className="text-red-500 text-[10px] font-bold uppercase">{errors.phone.message}</p>}
            </div>
          </div>

          {/* Contato */}
          <div className="space-y-1">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
               <User size={14} className="text-pink-500"/> Pessoa de Contato
            </label>
            <Input 
              {...register('contact_person')} 
              placeholder="Ex: João Vendedor"
              className="rounded-xl h-11 focus:ring-pink-500"
            />
          </div>

          {/* Notas */}
          <div className="space-y-1">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Observações Internas</label>
            <textarea
              {...register('notes')}
              placeholder="Condições de pagamento, prazos de entrega..."
              className="mt-1 block w-full rounded-2xl border-gray-200 dark:border-gray-700 dark:bg-gray-900 shadow-sm focus:border-pink-500 focus:ring-pink-500 transition-all p-3 text-sm min-h-[100px] resize-none"
              rows={3}
            />
          </div>

          {/* Ações */}
          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="flex-1 h-12 rounded-xl text-gray-500"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="flex-1 h-12 rounded-xl bg-gray-900 hover:bg-black text-white font-bold shadow-lg transition-transform hover:scale-[1.02]"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
              ) : (
                <Save size={18} className="mr-2" />
              )}
              Salvar Fornecedor
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
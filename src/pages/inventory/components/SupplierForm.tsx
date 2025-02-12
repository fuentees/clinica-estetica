import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { supabase } from '../../../lib/supabase';
import { toast } from 'react-hot-toast';

const supplierSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(1, 'Telefone é obrigatório'),
  contact_person: z.string().optional(),
  notes: z.string().optional(),
});

interface SupplierFormProps {
  onClose: () => void;
}

export function SupplierForm({ onClose }: SupplierFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(supplierSchema),
  });

  const onSubmit = async (data: any) => {
    try {
      const { error } = await supabase.from('suppliers').insert(data);
      if (error) throw error;
      toast.success('Fornecedor cadastrado com sucesso!');
      onClose();
    } catch (error) {
      console.error('Error saving supplier:', error);
      toast.error('Erro ao cadastrar fornecedor');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Novo Fornecedor</h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nome</label>
            <Input {...register('name')} error={errors.name?.message} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <Input {...register('email')} error={errors.email?.message} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Telefone</label>
            <Input {...register('phone')} error={errors.phone?.message} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Pessoa de Contato</label>
            <Input {...register('contact_person')} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Observações</label>
            <textarea
              {...register('notes')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-4 mt-6">
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
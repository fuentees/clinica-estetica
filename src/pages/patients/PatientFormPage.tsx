import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { supabase } from '../../lib/supabase';
import type { PatientFormData } from '../../types/patient';
import { toast } from 'react-hot-toast';

const patientSchema = z.object({
  first_name: z.string().min(1, 'Nome é obrigatório'),
  last_name: z.string().min(1, 'Sobrenome é obrigatório'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(1, 'Telefone é obrigatório'),
  cpf: z.string().min(11, 'CPF inválido'),
  date_of_birth: z.string().min(1, 'Data de nascimento é obrigatória'),
  address: z.string().optional(),
  medical_history: z.string().optional(),
  allergies: z.string().optional(),
});

export function PatientFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
  });

  const onSubmit = async (data: PatientFormData) => {
    try {
      if (isEditing) {
        const { error } = await supabase
          .from('patients')
          .update({
            cpf: data.cpf,
            date_of_birth: data.date_of_birth,
            address: data.address,
            medical_history: data.medical_history,
            allergies: data.allergies,
          })
          .eq('id', id);

        if (error) throw error;
      } else {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .insert({
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            phone: data.phone,
            role: 'patient',
          })
          .select()
          .single();

        if (profileError) throw profileError;

        const { error: patientError } = await supabase
          .from('patients')
          .insert({
            profile_id: profile.id,
            cpf: data.cpf,
            date_of_birth: data.date_of_birth,
            address: data.address,
            medical_history: data.medical_history,
            allergies: data.allergies,
          });

        if (patientError) throw patientError;
      }

      toast.success(isEditing ? 'Paciente atualizado!' : 'Paciente cadastrado!');
      navigate('/patients');
    } catch (error) {
      console.error('Error saving patient:', error);
      toast.error('Erro ao salvar paciente');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">
        {isEditing ? 'Editar Paciente' : 'Novo Paciente'}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nome</label>
            <Input {...register('first_name')} error={errors.first_name?.message} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Sobrenome</label>
            <Input {...register('last_name')} error={errors.last_name?.message} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <Input type="email" {...register('email')} error={errors.email?.message} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Telefone</label>
            <Input {...register('phone')} error={errors.phone?.message} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">CPF</label>
            <Input {...register('cpf')} error={errors.cpf?.message} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Data de Nascimento</label>
            <Input type="date" {...register('date_of_birth')} error={errors.date_of_birth?.message} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Endereço</label>
          <Input {...register('address')} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Histórico Médico</label>
          <textarea
            {...register('medical_history')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            rows={4}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Alergias</label>
          <textarea
            {...register('allergies')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            rows={2}
          />
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/patients')}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </form>
    </div>
  );
}
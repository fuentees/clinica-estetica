import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { supabase } from "../../lib/supabase";
import type { PatientFormData } from "../../types/patient";
import { toast } from "react-hot-toast";
import { PatientGallery } from '../../components/patients/PatientGallery';
import { Loader2 } from "lucide-react";

// Schema de validação
const patientSchema = z.object({
  first_name: z.string().min(1, "Nome é obrigatório"),
  last_name: z.string().min(1, "Sobrenome é obrigatório"),
  email: z.string().email("Email inválido").optional().or(z.literal('')),
  phone: z.string().min(1, "Telefone é obrigatório"),
  cpf: z.string().min(11, "CPF inválido"),
  date_of_birth: z.string().min(1, "Data de nascimento é obrigatória"),
  address: z.string().optional(),
  medical_history: z.string().optional(),
  allergies: z.string().optional(),
});

export function PatientFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
  });

  // 1. Carregar dados se estiver editando
  useEffect(() => {
    if (isEditing && id) {
      fetchPatientData();
    }
  }, [id, isEditing]);

  async function fetchPatientData() {
    try {
      setIsLoadingData(true);
      // Busca paciente e dados do perfil conectado
      const { data, error } = await supabase
        .from('patients')
        .select(`
          *,
          profiles:profile_id (
            first_name,
            last_name,
            email,
            phone
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        // Preenche o formulário com os dados do banco
        setProfileId(data.profile_id); // Guarda o ID do perfil para update
        
        // Dados do Perfil
        if (data.profiles) {
            // @ts-ignore
            setValue('first_name', data.profiles.first_name);
            // @ts-ignore
            setValue('last_name', data.profiles.last_name);
            // @ts-ignore
            setValue('email', data.profiles.email || '');
            // @ts-ignore
            setValue('phone', data.profiles.phone || '');
        }

        // Dados do Paciente
        setValue('cpf', data.cpf);
        setValue('date_of_birth', data.date_of_birth);
        setValue('address', data.address || '');
        setValue('medical_history', data.medical_history || '');
        setValue('allergies', data.allergies || '');
      }
    } catch (error) {
      console.error('Erro ao buscar paciente:', error);
      toast.error('Erro ao carregar dados do paciente.');
    } finally {
      setIsLoadingData(false);
    }
  }

  const onSubmit = async (data: PatientFormData) => {
    try {
      if (isEditing) {
        // --- ATUALIZAÇÃO ---
        
        // 1. Atualiza dados pessoais (Profiles)
        if (profileId) {
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    first_name: data.first_name,
                    last_name: data.last_name,
                    email: data.email,
                    phone: data.phone,
                })
                .eq('id', profileId);
            if (profileError) throw profileError;
        }

        // 2. Atualiza dados médicos (Patients)
        const { error: patientError } = await supabase
          .from("patients")
          .update({
            cpf: data.cpf,
            date_of_birth: data.date_of_birth,
            address: data.address,
            medical_history: data.medical_history,
            allergies: data.allergies,
          })
          .eq("id", id);

        if (patientError) throw patientError;

      } else {
        // --- CRIAÇÃO (Novo Paciente) ---

        // 1. Cria um novo Perfil para o paciente
        const { data: newProfile, error: profileError } = await supabase
          .from("profiles")
          .insert({
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            phone: data.phone,
            role: "patient",
          })
          .select()
          .single();

        if (profileError) throw profileError;

        // 2. Cria o registro médico vinculado ao perfil
        const { error: patientError } = await supabase
          .from("patients")
          .insert({
            profile_id: newProfile.id,
            cpf: data.cpf,
            date_of_birth: data.date_of_birth,
            address: data.address,
            medical_history: data.medical_history,
            allergies: data.allergies,
          });

        if (patientError) throw patientError;
      }

      toast.success(isEditing ? "Paciente atualizado!" : "Paciente cadastrado!");
      
      // Se for novo, volta pra lista. Se for edição, fica na página para ver fotos.
      if (!isEditing) {
          navigate("/patients");
      }
      
    } catch (error: any) {
      console.error("Erro ao salvar paciente:", error);
      toast.error(`Erro: ${error.message || 'Falha ao salvar'}`);
    }
  };

  if (isLoadingData) {
      return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-pink-600" /></div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 pb-20">
      
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            {isEditing ? "Editar Paciente" : "Novo Paciente"}
        </h1>
        {isEditing && (
            <span className="bg-pink-100 text-pink-800 text-xs px-3 py-1 rounded-full font-medium">
                Modo Edição
            </span>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        
        {/* Seção 1: Dados Pessoais */}
        <div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4 border-b pb-2">Dados Pessoais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome</label>
                <Input {...register("first_name")} error={errors.first_name?.message} />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Sobrenome</label>
                <Input {...register("last_name")} error={errors.last_name?.message} />
            </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                <Input type="email" {...register("email")} error={errors.email?.message} />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Telefone</label>
                <Input {...register("phone")} error={errors.phone?.message} />
            </div>
            </div>
        </div>

        {/* Seção 2: Dados Médicos */}
        <div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4 border-b pb-2 mt-6">Ficha Médica</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">CPF</label>
                <Input {...register("cpf")} error={errors.cpf?.message} />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Data de Nascimento</label>
                <Input type="date" {...register("date_of_birth")} error={errors.date_of_birth?.message} />
            </div>
            </div>

            <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Endereço</label>
                <Input {...register("address")} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Histórico Médico</label>
                    <textarea
                    {...register("medical_history")}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-300 focus:ring focus:ring-pink-200 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2"
                    rows={4}
                    placeholder="Doenças pré-existentes, cirurgias..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Alergias</label>
                    <textarea
                    {...register("allergies")}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-300 focus:ring focus:ring-pink-200 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2"
                    rows={4}
                    placeholder="Medicamentos, alimentos, látex..."
                    />
                </div>
            </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex justify-end space-x-4 pt-4 border-t dark:border-gray-700">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate("/patients")}
          >
            Voltar
          </Button>
          <Button type="submit" disabled={isSubmitting} className="bg-pink-600 hover:bg-pink-700 text-white">
            {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : null}
            {isSubmitting ? "Salvando..." : "Salvar Ficha"}
          </Button>
        </div>
      </form>

      {/* --- GALERIA DE FOTOS (Só aparece ao editar) --- */}
      {isEditing && id && (
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Galeria de Resultados (Antes e Depois)</h2>
            <PatientGallery patientId={id} />
        </div>
      )}

    </div>
  );
}
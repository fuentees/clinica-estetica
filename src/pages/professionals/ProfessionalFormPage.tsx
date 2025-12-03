import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { supabase } from "../../lib/supabase";
import { toast } from "react-hot-toast";
import { Loader2, ArrowLeft } from "lucide-react";

// Lista de Formações (Visível para o usuário)
const FORMACAO_OPTIONS = [
  'Médico (Dermatologista)',
  'Biomédico (Esteta)',
  'Fisioterapeuta Dermato-Funcional',
  'Enfermeiro Esteta',
  'Esteticista',
  'Recepcionista', 
  'Outro / Staff'
] as const;

// Funções de ACESSO (Permissões de segurança no sistema)
const ACCESS_ROLES = ['admin', 'recepcionista', 'medico'] as const;
type AccessRole = typeof ACCESS_ROLES[number];

const professionalSchema = z.object({
  first_name: z.string().min(1, "Nome é obrigatório"),
  last_name: z.string().min(1, "Sobrenome é obrigatório"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  
  // CORREÇÃO CRÍTICA: 'formacao' agora é um ENUM (menu suspenso)
  formacao: z.enum(FORMACAO_OPTIONS, {
    required_error: "A especialidade é obrigatória",
  }),

  // A role de permissão de acesso
  role: z.enum(ACCESS_ROLES, {
    required_error: "A permissão de acesso é obrigatória",
  }),
});

type ProfessionalFormData = z.infer<typeof professionalSchema>;

export function ProfessionalFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProfessionalFormData>({
    resolver: zodResolver(professionalSchema),
  });

  // Carregar dados na edição
  useEffect(() => {
    if (isEditing && id) {
      fetchProfessionalData();
    }
  }, [id, isEditing]);

  async function fetchProfessionalData() {
    try {
      setIsLoadingData(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      if (data) {
        setValue('first_name', data.first_name);
        setValue('last_name', data.last_name);
        setValue('email', data.email);
        setValue('phone', data.phone || '');
        // Ajuste para carregar o valor de volta no enum
        // Garante que o valor salvo (string) é mapeado de volta para o enum
        setValue('formacao', data.formacao as ProfessionalFormData['formacao']); 
        setValue('role', data.role as AccessRole);
      }
    } catch (error) {
      console.error('Erro ao buscar profissional:', error);
      toast.error('Erro ao carregar dados do profissional.');
    } finally {
      setIsLoadingData(false);
    }
  }

  const onSubmit = async (data: ProfessionalFormData) => {
    try {
      if (isEditing) {
        // --- EDIÇÃO ---
        const { error } = await supabase
          .from("profiles")
          .update({
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            phone: data.phone,
            role: data.role,
            formacao: data.formacao, 
          })
          .eq("id", id);

        if (error) throw error;
        toast.success("Profissional atualizado!");

      } else {
        // --- CRIAÇÃO ---
        const { error } = await supabase
          .from("profiles")
          .insert({
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            phone: data.phone,
            role: data.role,
            formacao: data.formacao,
          });

        if (error) throw error;
        toast.success("Profissional cadastrado!");
      }

      navigate("/professionals");
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      toast.error(`Erro ao salvar: ${error.message || error}`);
    }
  };

  if (isLoadingData) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-pink-600" /></div>;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8 pb-20">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate('/professionals')}>
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            {isEditing ? "Editar Profissional" : "Novo Profissional"}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        
        {/* Nome */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome</label>
            <Input {...register("first_name")} error={errors.first_name?.message} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Sobrenome</label>
            <Input {...register("last_name")} error={errors.last_name?.message} />
          </div>
        </div>

        {/* Formação (Menu Suspenso) */}
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Formação / Especialidade</label>
            <select
                {...register('formacao')}
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none"
            >
                {/* Placeholder/Opção Padrão */}
                <option value="">Selecione a especialidade...</option>
                {FORMACAO_OPTIONS.map(option => (
                    <option key={option} value={option}>{option}</option>
                ))}
            </select>
            {/* O Zod vai reclamar se o value for "" e o usuário tentar salvar */}
            {errors.formacao && <span className="text-xs text-red-500">{errors.formacao.message}</span>}
        </div>


        {/* Contato */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
            <Input type="email" {...register("email")} error={errors.email?.message} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Telefone</label>
            <Input {...register("phone")} error={errors.phone?.message} />
          </div>
        </div>

        {/* Função / Permissão */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Permissão de Acesso (Role)</label>
          <select 
            {...register('role')}
            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none"
          >
            <option value="">Selecione a permissão...</option>
            <option value="medico">Profissional de Saúde (Médico/Esteta)</option>
            <option value="recepcionista">Recepcionista / Staff</option>
            <option value="admin">Administrador (Acesso Total)</option>
          </select>
          {errors.role && <span className="text-xs text-red-500">{errors.role.message}</span>}
        </div>

        <div className="flex justify-end space-x-4 pt-4 border-t dark:border-gray-700">
          <Button type="button" variant="secondary" onClick={() => navigate('/professionals')}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting} className="bg-pink-600 hover:bg-pink-700 text-white">
            {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : null} Salvar
          </Button>
        </div>
      </form>
    </div>
  );
}